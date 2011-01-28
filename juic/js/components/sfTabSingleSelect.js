//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfAbstractSingleSelect.js
//! include /ui/juic/js/components/sfDefaultListModel.js
//! include /ui/juic/js/components/sfDragDropMgr.js
//! include /ui/uicore/css/components/sfTabSingleSelect.css

/**
 * A model based tab component which renders just the tabs. Upon updating the
 * model the view will change if the tabs have been rendered.
 * 
 * ----------------------------------------------------------------------------
 * DISPATCHED EVENTS : Events you can listen to
 * 
 * <li>tabContentsChanged: {newIndex: int, tabItem: any} text/content change
 * <li>tabChanged: {newIndex: int, tabItem: any} Selected tab changed
 * <li>tabAdded: {newIndex: int, tabItem: any} Tab was added
 * <li>tabRemoved: {index0: int, index1: int} Tabs are removed
 * <li>tabMoved: {index0: int, index1: int} One tab is moved
 * <li>action: {actionCommand: String, actionData: any} Any action
 * 
 * ----------------------------------------------------------------------------
 * ACTION COMMANDS : Types of actions being dispatched
 * 
 * <li>removeTab: {actionData: index} Happens when you click the close link
 * 
 * ----------------------------------------------------------------------------
 * HANDLED EVENTS : Events being handled by this object
 * 
 * <li>action: Originates from child tab components
 * <li>contentsChanged: Originates from the single select model
 * <li>intervalAdded: Originates from the single select model
 * <li>intervalRemoved: Originates from the single select model
 * 
 * ----------------------------------------------------------------------------
 * CONSTRUCTOR OPTIONS : Optional parameters passed in on constructor
 * 
 * <li>customLinkSection: {Component} Custom component displayed after tabs
 * <li>closeableTabs: {boolean} Show close (x) button?
 * <li>draggableTabs: {boolean}
 * 
 * @param modelOrArray {SFDefaultSingleSelectModel | Object[]} Can accept either
 *            a single select model or an array of items to be passed into the
 *            SFDefaultSingleSelectModel constructor
 * @param options {json} See constructor options
 */
function SFTabSingleSelect(modelOrArray, options) {
    this.register();
    this._init(modelOrArray, options);
}

SFTabSingleSelect.prototype = ( function() {
    /** Scratch pad for rendering tabs. */
    var SCRATCH_PAD = document.createElement('ul');

    /** A singleton pointer div. */
    var POINTER_DIV = null;

    /**
     * This is a private function that will show a pointer (down arrow) at the
     * given location.
     * 
     * @param x {int} The x position
     * @param y {int} The y position
     */
    function showPointer(x, y) {
        if (!POINTER_DIV) {
            POINTER_DIV = document.createElement('div');
            if (document.body.firstChild) {
                document.body.insertBefore(POINTER_DIV, document.body.firstChild);
            } else {
                document.body.appendChild(POINTER_DIV);
            }
            POINTER_DIV.onselectstart = function() {
                return false;
            }
            POINTER_DIV.unselectable = 'on';
            POINTER_DIV.className = 'tab_pointer';
            POINTER_DIV.style.position = 'absolute';
            POINTER_DIV.style.zIndex = '100000';
        } else {
            POINTER_DIV.style.display = '';
        }
        POINTER_DIV.style.left = x + 'px';
        POINTER_DIV.style.top = y + 'px';
    }

    /**
     * This is a private function that will hide the pointer div.
     */
    function hidePointer() {
        if (POINTER_DIV) {
            POINTER_DIV.style.display = 'none';
        }
    }

    /**
     * Private function which will return the title text given any item object.
     * 
     * @param item {any} Any typed item object
     * @return {String} The title text for this item
     */
    function getTabTitle(item) {
        return item ? typeof item.title == 'string' ? item.title : item.toString() : '';
    }

    /**
     * Private util function, takes an array of x positions or coordinates, and
     * the actual mouse x position and returns the index of the xPosition in the
     * array that is closest to the actual mouse position.
     * 
     * @param xPositions {int[]} Array of x-positions to search (must be in
     *            sorted order!)
     * @param xVal {int} The value we are looking for
     * @return {int} The closest index in the array
     */
    function getClosestPosition(xPositions, xVal) {
        var minDistance = Number.POSITIVE_INFINITY, minIndex, tooFar = false;
        for ( var idx = 0, len = xPositions.length; idx < len && !tooFar; idx++) {
            var distance = xVal - xPositions[idx];
            var abs = Math.abs(distance);
            if (abs < minDistance) {
                minDistance = abs;
                minIndex = idx;
            }
            tooFar = distance < 0;
        }
        return minIndex;
    }

    /**
     * Private util function, returns the true width of an html element
     * including any margins.
     * 
     * @param el {HTMLElement} The html element.
     * @return {int} The true width of the given element including margins
     */
    function getTrueWidth(el) {
        var getStyle = YAHOO.util.Dom.getStyle;
        return el.offsetWidth + parseInt(getStyle(el, 'margin-left')) + parseInt(getStyle(el, 'margin-right'));
    }

    /**
     * Private util function, returns all the x-coordinates of the children of
     * the given element.
     * 
     * @param el {HTMLElement} The html element.
     * @return {int[]} The x positions of each child
     */
    function getChildXPositions(el) {
        var xVal = YAHOO.util.Dom.getX(el);
        var xPositions = [ xVal ];
        for ( var idx = 0, len = el.childNodes.length; idx < len; idx++) {
            xVal += getTrueWidth(el.childNodes[idx]);
            xPositions.push(xVal);
        }
        return xPositions;
    }

    /**
     * This is a private class used to display the tabs inside the unordered
     * list. This extends from SFAbstractDragProxy - but will disable drag and
     * drop unless you pass in config with draggable = true.
     * 
     * Dispatches: type = "action" where actionCommand is one of the following
     * <li>select: When the user clicks the tab
     * <li>close: When the user clicks the close button
     * <li>move: When the user drags this tab to a different location
     * 
     * @param config {json} Must pass in the following config
     *            <li>title {String} The title string of the tab
     *            <li>closeable {boolean} If the tab can close
     *            <li>selected {boolean} If the tab is selected
     *            <li>index {int} The current index of the tab
     *            <li>draggable {boolean} If this tab is draggable
     */
    function Tab(config) {
        this.register();
        this._init(config);
    }

    Tab.prototype = set(new SFAbstractDragProxy(), {
        _init : function(config) {
            this._title = config.title;
            this._closeable = config.closeable;
            this._selected = config.selected;
            this._index = config.index;
            this._draggable = config.draggable;
            this._autoScroller = config.autoScroller;
            this._enabled = config.enabled;

            if (this._autoScroller) {
                this._autoScroller.addEventListener('autoScroll', this);
            }

            /* Set the options for the drag proxy. */
            this.setDragOptions( {
                dragDisabled :!config.draggable,
                horizontalOnly :true,
                animateDrop :true,
                autoScroller :this._autoScroller,
                dragClassName :'tab_panel'
            });
        },

        /**
         * Cleanup any event listeners.
         */
        cleanup : function() {
            if (this._autoScroller) {
                this._autoScroller.removeEventListener('autoScroll', this);
            }
        },

        /**
         * Render the normal tab html.
         * 
         * @param html {String[]} The html array
         */
        renderHtml : function(html) {
            var text = escapeHTML(this._title);
            html.push('<li id="', this.id, '" class="', this._getTabClassName(), '"><a');
            if (this._draggable) {
                html.push(' onmousedown="', this.fireCode('handleMouseDown'), '"');
                html.push(' onselectstart="return false;" unselectable="on"')
            }
            html.push(' href="javascript:void(0);" onclick="', this.fireCode('_onClick'), '" title="', text, '">');
            html.push(text, '</a><span class="close-x" onclick="', this.fireCode('_onCloseX'), '"></span></li>');
        },

        /**
         * Called by super class before the proxy's drag event.
         * 
         * @param event {DragEvent} The drag event.
         */
        beforeDragEvent : function(event) {
            switch (event.type) {
            case 'autoScroll':
                this._refreshCache();
                break;
            case 'dragStart': {
                /* On drag start refresh the cache, DOM may have changed. */
                this._refreshCache();
                break;
            }
            case 'drag':
                /* On drag find index of closest position, and show pointer. */
                this._dropIndex = getClosestPosition(this._xPositions, event.point.x);
                showPointer(this._xPositions[this._dropIndex], this._yPosition);
                break;
            case 'dragEnd':
                /* On drag end, hide the pointer, and if required perform move. */
                hidePointer();
                if (this._dropIndex > this._index || this._dropIndex < this._index) {
                    var index1 = this._dropIndex;
                    if (this._dropIndex > this._index) {
                        index1--;
                    }
                    this.dispatch('action', {
                        actionCommand :'move',
                        index0 :this._index,
                        index1 :index1
                    });
                }
                break;
            }
        },

        /**
         * Called by super class to render the HTML of the proxy div.
         * 
         * @param html {String[]} The html array
         */
        renderProxyHtml : function(html) {
            html.push('<ul class="tab_list"><li class="',
                    this._getTabClassName(),
                    '"><a',
                    ' href="javascript:void(0);">',
                    escapeHTML(this._title),
                    '</a><span class="close-x"></span></li></ul>');
        },

        /**
         * Refresh the cache will use the DOM to determine the xPositions of
         * each tab, the yPosition of arrow, and the drag region including all
         * current tabs.
         */
        _refreshCache : function() {
            /**
             * This will probably be temporary because retrieving the parent
             * node crosses the knowledge barrier. This is put here instead of
             * the parent SFTabSingleSelect for performance reasons.
             */
            var ul = $(this.id).parentNode;
            this._xPositions = getChildXPositions(ul);
            var dragRegion = YAHOO.util.Dom.getRegion(ul);
            var lastChild = ul.lastChild;
            dragRegion.right = YAHOO.util.Dom.getX(lastChild);
            if (lastChild.className == 'noStyles') {
                /* If last child is the customLink li, we will remove this. */
                this._xPositions.splice(this._xPositions.length - 1, 1);
            } else {
                dragRegion.right += getTrueWidth(lastChild);
            }
            this.setDragRegion(dragRegion);
            this._yPosition = YAHOO.util.Dom.getY(ul)
        },

        /**
         * Get the class name for the given tab index.
         * 
         * @param index {int} The index of the tab
         * @return {String} The style class name
         */
        _getTabClassName : function() {
            var classes = [];
            if (this._closeable) {
                classes.push('closeable');
            }
            if (this._selected) {
                classes.push('selected');
            }
            if (this._draggable) {
                classes.push('draggable');
            }
            return classes.join(' ');
        },

        /**
         * Called by the SFTabSingleSelect to dynamically create the DOM of a
         * tab and then insert it into the unordered list (ul) tag.
         * 
         * @return {HTMLElement} newly created DOM for this tab.
         */
        createDOM : function() {
            var html = [];
            this.renderHtml(html);
            SCRATCH_PAD.innerHTML = html.join('');
            return SCRATCH_PAD.firstChild;
        },

        setEnabled : function(enabled) {
            this._enabled = enabled;
            this.setDragDisabled(!this._draggable || !this._enabled);
        },

        setIndex : function(index) {
            this._index = index;
        },

        setSelected : function(selected) {
            this._selected = selected;
            this._updateClassName();
        },

        setCloseable : function(closeable) {
            this._closeable = closeable;
            this._updateClassName();
        },

        setDraggable : function(draggable) {
            this._draggable = draggable;
            this.setDragDisabled(!this._draggable || !this._enabled);
        },

        setTitle : function(title) {
            this._title = title;
            var el = $(this.id);
            if (el) {
                var text = escapeHTML(title);
                el.title = text;
                el.innerHTML = text;
            }
        },

        _onClick : function() {
            if (!this._selected && this._enabled) {
                this.dispatch('action', {
                    actionCommand :'select',
                    index :this._index
                });
            }
        },

        _onCloseX : function(event) {
            if (this._closeable && this._enabled) {
                YAHOO.util.Event.stopPropagation(event || window.event);
                this.dispatch('action', {
                    actionCommand :'close',
                    index :this._index
                });
            }
        },

        _updateClassName : function() {
            var el = $(this.id);
            if (el) {
                el.className = this._getTabClassName();
            }
        }
    });

    return set(new SFAbstractSingleSelect(), {
        _init : function(modelOrArray, options) {
            /*
             * The call to SFAbstractSingleSelect's _init() method is to ensure
             * that the model for the single select is properly instantiated,
             * and all inherited methods have access to this._model. As the
             * parent class, SFAbstractSingleSelect provides the instantiation
             * of the model and adds the appropriate listeners. By invoking the
             * call, we don't have to override the _init() in the child class.
             */
            SFAbstractSingleSelect.prototype._init.call(this, modelOrArray);
            this._customLinkSection = options && options.customLinkSection;
            this._closeableTabs = options && options.closeableTabs;
            this._draggableTabs = options && options.draggableTabs;
            this._enabled = options && options.enabled != null ? options.enabled : true;

            /* Create the tab child components. */
            this._tabs = [];
            for ( var idx = 0, len = this._model.size(); idx < len; idx++) {
                this._tabs.push(this._createTab(idx));
            }
        },

        handleEvent : function(event) {
            switch (event.type) {
            /* action event comes from child tab components. */
            case 'action':
                switch (event.actionCommand) {
                case 'select':
                    this.changeTab(event.index);
                    break;
                case 'close':
                    this.dispatch('action', {
                        actionCommand :'removeTab',
                        actionData :event.index
                    });
                    break;
                case 'move':
                    this.moveTab(event.index0, event.index1);
                    break;
                }
                break;
            /* These events come from the model. */
            case 'contentsChanged':
                this._contentsChanged(event.index0, event.index1);
                break;
            case 'intervalAdded':
                this._intervalAdded(event.index0, event.index1);
                break;
            case 'intervalRemoved':
                this._intervalRemoved(event.index0, event.index1);
                break;
            }
        },

        /**
         * Rendering of the tab_list unordered list.
         * 
         * @param html {String[]} The html array
         */
        renderHtml : function(html) {
            html.push('<ul id="', this.id, '" class="tab_list">');
            for ( var idx = 0, len = this._tabs.length; idx < len; idx++) {
                this._tabs[idx].renderHtml(html);
            }
            if (this._customLinkSection && this._customLinkSection.renderHtml) {
                html.push('<li id="', this.id, 'custom" class="noStyles">');
                this._customLinkSection.renderHtml(html);
                html.push('</li>');
            }
            html.push('</ul>');
        },

        /**
         * Invokes "setSelectedIndex," which is a thin wrapper around calling
         * the model's setSelectedIndex method. This will set the selected index
         * on the model, which will in turn dispatch a "contentsChanged" event.
         * The actual switching of the active tab will not occur until the model
         * dispatches the event.
         * 
         * @param index {int} The index of the tab to change to
         */
        changeTab : function(index) {
            this.setSelectedIndex(index);
        },

        /**
         * Changes the title of the tab indicated by index. If the items in the
         * array are JSON with a string type title, then the title will be
         * updated. Otherwise the item will be replaced with the incoming title
         * string object directly.
         * 
         * @param index {int} The index of the tab to change
         * @param title {String} The title to set
         */
        changeTabTitle : function(index, title) {
            var item = this._model.get(index);
            if (typeof item.title == 'string') {
                item.title = title;
            } else {
                item = title;
            }
            this._model.set(index, item);
        },

        /**
         * This is a thin wrapper around SFAbstractSingleSelect's addOption
         * method.
         * 
         * @param item {any} The items toString() method is used to generate the
         *            title, optionally the item may be a JSON object with a
         *            string type title attribute.
         */
        add : function(item) {
            this.addOption(item);
        },

        /**
         * This is a thin wrapper for the base class method
         * removeOptionAt(index). Passing an index will remove the tab at that
         * index. If no index is supplied, the last tab is removed.
         * 
         * @param index {int} The index of the tab to remove
         */
        remove : function(index) {
            this.removeOptionAt(index);
        },

        /**
         * Drop a tab from index0 to index1.
         * 
         * @param index0 {int} The index of the tab before it moves.
         * @param index1 {int} The index of the tab after it moves.
         */
        moveTab : function(index0, index1) {
            if (index0 != index1) {
                var selected = this._model.getSelectedIndex() == index0;
                this._moving = true;
                var item = this._model.removeItemAt(index0)[0];
                if (index1 == this._model.size()) {
                    this._model.add(item);
                } else {
                    this._model.insertItemAt(index1, item);
                }
                this._moving = false;
                if (selected) {
                    this._model.setSelectedIndex(index1);
                }
                this.dispatch('tabMoved', {
                    index0 :index0,
                    index1 :index1
                });
            }
        },

        /**
         * Set if this single select is enabled.
         * 
         * @param enabled {boolean} Set to true if enabled
         */
        setEnabled : function(enabled) {
            this._enabled = enabled;
            for ( var idx = 0, len = this._tabs.length; idx < len; idx++) {
                this._tabs[idx].setEnabled(enabled);
            }
        },

        /**
         * Get the current height of the tab list.
         * 
         * @return {int} The integer height of the dom
         */
        getHeight : function() {
            var el = $(this.id);
            if (el) {
                return el.offsetHeight;
            }
            return null;
        },

        /**
         * Create a single tab component with config and add event listeners.
         * 
         * @param {int} The index of the tab
         */
        _createTab : function(index) {
            var selected = this._model.getSelectedIndex() == index;
            var tab = new Tab( {
                title :getTabTitle(this._model.get(index)),
                index :index,
                closeable :this._closeableTabs,
                selected :selected,
                draggable :this._draggableTabs,
                enabled :this._enabled
            });
            if (selected) {
                this._selectedTab = tab;
            }
            tab.addEventListener('action', this);
            return tab;
        },

        /**
         * Called when the model dispatches the contentsChanged event. This will
         * change the titles of tabs within the range - or change the selected
         * index if index0 < 0 or index1 < 0.
         * 
         * @param index0 {int} The start index of the range being modified (-1
         *            if a selection change)
         * @param index1 {int} The end index of the range being modified (-1 if
         *            a selection change)
         */
        _contentsChanged : function(index0, index1) {
            if (index0 >= 0 && index1 >= index0) {
                for ( var idx = index0, len = this._model.size(); idx <= len; idx++) {
                    this._tabs[idx].setTitle(getTabTitle(this._model.get(idx)));
                }
                this.dispatch('tabContentChanged', {
                    index0 :index0,
                    index1 :index1
                });
            } else {
                /* negative means selection changed. */
                this._selectionChanged();
            }
        },

        /**
         * Happens when the tab selection changes.
         */
        _selectionChanged : function() {
            if (!this._moving) {
                var old = this._selectedTab;
                if (this._selectedTab) {
                    this._selectedTab.setSelected(false);
                }
                var selectedIndex = this._model.getSelectedIndex();
                this._selectedTab = this._tabs[selectedIndex];
                this._selectedTab.setSelected(true);
                this.dispatch('tabChanged', {
                    newIndex :selectedIndex,
                    tabItem :this._model.get(selectedIndex)
                });
            }
        },

        /**
         * Called when the model dispatches the intervalAdded event. This will
         * update the tabs from the starting index and add any additional tabs
         * as needd.
         * 
         * @param index0 {int} The starting index of the first added tab
         * @param index1 {int} The ending index of the last added tab
         */
        _intervalAdded : function(index0, index1) {
            if (index0 >= 0 && index1 >= index0) {
                /* Create tab components. */
                for ( var idx = index0; idx <= index1; idx++) {
                    var tab = null;
                    if (this._moving) {
                        tab = this._deletedTabs[idx - index0];
                        tab.setIndex(idx);
                    } else {
                        tab = this._createTab(idx);
                    }
                    this._tabs.splice(idx, 0, tab);
                }

                /* Insert dom. */
                var ul = $(this.id);
                if (ul) {
                    var insertBefore = ul.childNodes[index0];
                    for ( var idx = index0; idx <= index1; idx++) {
                        var li = this._moving ? this._deletedDom[idx - index0] : this._tabs[idx].createDOM();
                        if (insertBefore) {
                            ul.insertBefore(li, insertBefore);
                        } else {
                            ul.appendChild(li);
                        }
                    }
                }

                if (this._moving) {
                    this._deletedTabs = null;
                    this._deletedDom = null;
                }

                /* Update index references. */
                for ( var idx = index1 + 1, len = this._model.size(); idx < len; idx++) {
                    this._tabs[idx].setIndex(idx);
                }

                /*
                 * If there used to be only 1 tab and the tabs are closeable,
                 * that means after adding some tabs the tabs should change to
                 * be closeable true.
                 */
                if (this._tabs.length - index1 + index0 == 1 && this._closeableTabs) {
                    for ( var idx = 0, len = this._tabs.length; idx < len; idx++) {
                        this._tabs[idx].setCloseable(true);
                    }
                }

                if (!this._moving) {
                    /* Dispatch tab added events. */
                    for ( var idx = index0; idx <= index1; idx++) {
                        this.dispatch('tabAdded', {
                            newIndex :idx,
                            tabItem :this._model.get(idx)
                        });
                    }
                }
            }
        },

        /**
         * This is called when the model dispatches the intervalRemoved event.
         * This will update the tabs from the starting index and remove any
         * remaining tabs at the end no longer being used.
         * 
         * @param index0 {int} The starting index of the tabs being removed
         * @param index1 {int} The ending index of the tabs being removed
         */
        _intervalRemoved : function(index0, index1) {
            if (index0 >= 0 && index1 >= index0) {
                var ul = $(this.id);

                var removeCount = index1 - index0 + 1;

                /* Remove from the internal array */
                var deletedTabs = this._tabs.splice(index0, removeCount);

                if (this._moving) {
                    this._deletedTabs = deletedTabs;
                    this._deletedDom = [];
                } else {
                    /* Cleanup removed components. */
                    for ( var idx = 0; idx < removeCount; idx++) {
                        deletedTabs[idx].cleanup();
                    }
                }

                /* Delete the DOM. */
                if (ul) {
                    for ( var idx = 0; idx < removeCount; idx++) {
                        var li = ul.childNodes[index0];
                        if (this._moving) {
                            this._deletedDom.push(li);
                        }
                        ul.removeChild(li);
                    }
                }

                /* Update index references. */
                for ( var idx = index0, len = this._model.size(); idx < len; idx++) {
                    this._tabs[idx].setIndex(idx);
                }

                if (this._tabs.length == 1) {
                    this._tabs[0].setCloseable(false);
                }

                if (!this._moving) {
                    /* Dispatch tabRemoved event. */
                    this.dispatch('tabRemoved', {
                        index0 :index0,
                        index1 :index1
                    });
                }
            }
        },

        /**
         * Protected method overridden from SFAbstractSingleSelect to update the
         * model to add event listeners.
         */
        _updateModel : function() {
            this._model.addEventListener("contentsChanged", this);
            this._model.addEventListener("intervalAdded", this);
            this._model.addEventListener("intervalRemoved", this);
        },

        /**
         * Cleanup the model to remove any event listeners.
         */
        cleanup : function() {
            for ( var idx = 0, len = this._tabs.length; idx < len; idx++) {
                this._tabs[idx].cleanup();
            }
            this._model.removeEventListener("contentsChanged", this);
            this._model.removeEventListener("intervalAdded", this);
            this._model.removeEventListener("intervalRemoved", this);
            this.unregister();
        }
    });
})();