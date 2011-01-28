//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfTabSingleSelect.js

/**
 * This component introduces a simple tabbed layout metaphor. It is a runtime
 * compound component in that it houses instances of several JUIC components,
 * but is not architecturally a compound object. The idea is to provide the most
 * simple path for developers to introduce an XI-style tabbed metaphor in their
 * pages.
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
 * <li>containerHeightChanged: {containerHeight: int}
 * <li>tabContentRendered: {index: int}
 * 
 * ----------------------------------------------------------------------------
 * ACTION COMMANDS : Types of actions being dispatched
 * 
 * <li>removeTab: {actionData: index} Happens when you click the close link
 * <li>changeTab: {actionData: index} Selected tab changed
 * 
 * Note: removeTab action does not actually remove the tab. You must listen for
 * this event and remove the tab. This is because you may want to show a
 * confirmation message.
 * 
 * ----------------------------------------------------------------------------
 * HANDLED EVENTS : Events being handled by this object
 * 
 * <li>tabChanged: {SFTabSingleSelect} Changes currently selected tab
 * <li>tabAdded: {SFTabSingleSelect} Adds a new tab
 * <li>tabRemoved: {SFTabSingleSelect} Removes a tab
 * <li>tabMoved: {SFTabSingleSelect} Moves a tab
 * 
 * ----------------------------------------------------------------------------
 * CONSTRUCTOR OPTIONS : Optional parameters passed in on constructor
 * 
 * <li>customLinkSection: {Component} Custom component displayed after tabs
 * <li>closeableTabs: {boolean} Show close (x) button?
 * <li>draggableTabs: {boolean}
 * <li>boxHeight: {int} Height of tab box
 * 
 * @param options {json} See constructor options
 */
function SFTabBoxLayout(options) {
    this.register();
    this._init(options);
}

SFTabBoxLayout.prototype = ( function() {
    /** Scratch pad for rendering tabs. */
    var SCRATCH_PAD = document.createElement('ul');

    /**
     * Render a tab component safely.
     * 
     * @param html {String[]} The html array
     * @param component {Component} The component (if not a component will
     *            render the toString)
     */
    function renderTabComponent(html, component) {
        if (component) {
            if (component.renderHtml) {
                component.renderHtml(html);
            } else {
                html.push(escapeHTML(component.toString()));
            }
        }
        return html;
    }

    return set(new Component(), {
        _init : function(options) {
            this._tabList = new SFTabSingleSelect( [], options);
            this._tabList.addEventListener('action', this);
            this._tabList.addEventListener('tabContentsChanged', this);
            this._tabList.addEventListener('tabChanged', this);
            this._tabList.addEventListener('tabAdded', this);
            this._tabList.addEventListener('tabRemoved', this);
            this._tabList.addEventListener('tabMoved', this);
            this._model = this._tabList.getModel();

            if (options && options.boxHeight) {
                this._containerHeight = options.boxHeight;
            }
        },

        handleEvent : function(event) {
            switch (event.type) {
            case 'tabChanged':
                this._tabChanged(event.newIndex, event.tabItem);
                break;
            case 'tabAdded':
                this._tabAdded(event.newIndex, event.tabItem);
                break;
            case 'tabRemoved':
                this._tabRemoved(event.index0, event.index1);
                break;
            case 'tabMoved':
                this._tabMoved(event.index0, event.index1);
                break;
            }
            /* All actions from the SFTabSingleSelect are redispatched. */
            this.dispatchEvent(event);
        },

        renderHtml : function(html) {
            html.push('<div id="', this.id, '"><div class="tab_panel">');
            this._tabList.renderHtml(html);
            html.push('<div id="', this.id, 'container" class="tabbox"');
            if (this._containerHeight) {
                html.push(' style="height: ', this._containerHeight + 'px"');
            }
            html.push('>');
            for ( var idx = 0, len = this._model.size(); idx < len; idx++) {
                this._renderTab(html, idx);
            }
            html.push('</div></div></div>');
        },

        /**
         * Add a tab to the tab box layout.
         * 
         * @param title {String} The title text of the tab
         * @param component {Component} The component to display
         */
        addTab : function(title, component) {
            this._model.add( {
                title :title,
                tabComponent :component
            });
        },

        /**
         * @return {int} The number of tabs.
         */
        getTabCount : function() {
            return this._model.size();
        },

        /**
         * Remove a tab given the component.
         * 
         * @param component {Component} The component to remove
         * @return {boolean} If the component was found and removed
         */
        removeTab : function(component) {
            for ( var idx = 0, len = this._model.size; idx < len; idx++) {
                var item = this._model.get(idx);
                if (item === component) {
                    this.removeTabByIndex(idx);
                    return true;
                }
            }
            return false;
        },

        /**
         * Remove a tab by its index.
         * 
         * @param index {int} The index of the tab
         */
        removeTabByIndex : function(index) {
            this._model.removeItemAt(index);
        },

        /**
         * Change the selected tab.
         * 
         * @param index {int} The index of the tab to change to
         */
        focusTab : function(index) {
            this.changeTab(index);
        },

        /**
         * Change the selected tab.
         * 
         * @param activeIndex {int} The index of the tab to change to
         */
        changeTab : function(activeIndex) {
            this._model.setSelectedIndex(activeIndex);
        },

        /**
         * Set the height of the tabbox container.
         * 
         * @param height {int} The height of the container to set
         */
        setContainerHeight : function(height) {
            this._containerHeight = height;
            var el = $(this.id + 'container');
            if (el) {
                el.style.height = this._containerHeight + 'px';
                el.style.overflowY = 'auto';
                this.dispatch("containerHeightChanged", {
                    containerHeight :this._containerHeight
                });
            }
        },

        /**
         * Retrieve the container height.
         * 
         * @return {int} The height of the container
         */
        getContainerHeight : function() {
            if (!isNaN(this._containerHeight)) {
                var el = $(this.id + 'container');
                return el.offsetHeight;
            }

            return this._containerHeight;
        },

        /**
         * Set the height of the entire layout. This will set the container
         * height internally.
         * 
         * @param height {int} The height of the layout
         */
        setHeight : function(height) {
            this._height = height;
            if ($(this.id)) {
                this.setContainerHeight(Math.max(height - this._tabList.getHeight(), 0));
            }
        },

        /**
         * @return {int} The height of the entire layout
         */
        getHeight : function() {
            if (this._height) {
                return this._height;
            }
            var el = $(this.id);
            if (el) {
                return el.offsetHeight;
            }
        },

        /**
         * Set if the tabs should be disabled.
         * 
         * @param enabled {boolean}
         */
        setEnabled : function(enabled) {
            this._tabList.setEnabled(enabled);
            YAHOO.util.Dom.setStyle('opacity', enabled ? 1 : .5);
            el.disabled = !enabled;
        },

        /**
         * Retrieve the tab object at the index.
         * 
         * @param index {int} The index of the tab object you want
         * @return {title: String, tabComponent: Component}
         */
        getTabObjectByIndex : function(index) {
            return this._model.get(index);
        },

        /**
         * Get the currently selected tab object.
         * 
         * @return {title: String, tabComponent: Component}
         */
        getCurrentTabObject : function() {
            return this._model.get(this._model.getSelectedIndex());
        },

        /**
         * Set the content of one tab to the given component.
         * 
         * @param index {int} The index of the tab
         * @param component {Componet} The component to set the content to
         */
        setTabContent : function(index, component) {
            var item = this._model.get(index);
            item.tabComponent = component;
            this._model.set(index, item);
            var container = $(this.id + 'container');
            if (container) {
                var html = [];
                component.renderHtml(html);
                container.childNodes[index].innerHTML = html.join('');
            }
            this.dispatch("tabContentRendered", {
                index :index
            });
        },

        /**
         * Set the tab title text.
         * 
         * @param index {int} The index of the tab
         * @param title {String} The title text of the tab
         */
        setTabText : function(index, title) {
            var item = this._model.get(index);
            item.title = title;
            this._model.set(index, item);
        },

        /**
         * @return {int} The currently selected tab index
         */
        getCurrentTabIndex : function() {
            return this._model.getSelectedIndex();
        },

        _renderTab : function(html, index) {
            this._selectedIndex = this._model.getSelectedIndex();
            var tabClass = index == this._selectedIndex ? '' : 'hide';
            html.push('<div class="', tabClass, '">');
            renderTabComponent(html, this._model.get(index).tabComponent);
            html.push('</div>');
            return html;
        },

        _createTabDOM : function(index) {
            var html = this._renderTab( [], index);
            SCRATCH_PAD.innerHTML = html.join('');
            return SCRATCH_PAD.firstChild;
        },

        _updateTabDOM : function(index) {
            var container = $(this.id + 'container');
            if (container) {
                var el = container.childNodes[index];
                var html = renderTabComponent( [], this._model.get(index).tabComponent);
                el.innerHTML = html.join('');
            }
        },

        _tabChanged : function(itemIndex, item) {
            var container = $(this.id + 'container');
            if (container) {
                if (this._selectedIndex >= 0) {
                    var el = container.childNodes[this._selectedIndex];
                    if (el) {
                        el.className = 'hide';
                    }
                }
                this._selectedIndex = this._model.getSelectedIndex();
                var el = container.childNodes[this._selectedIndex];
                if (el) {
                    el.className = '';
                }
            }
            this.dispatch("action", {
                actionCommand :"changeTab",
                actionData :itemIndex,
                canceled :false
            });
        },

        _tabAdded : function(itemIndex, item) {
            var container = $(this.id + 'container');
            if (container) {
                var dom = this._createTabDOM(itemIndex);
                var insertBefore = container.childNodes[itemIndex];
                if (insertBefore) {
                    container.insertBefore(dom, insertBefore);
                } else {
                    container.appendChild(dom);
                }
            }
        },

        _tabRemoved : function(index0, index1) {
            var container = $(this.id + 'container');
            if (container) {
                var childNodes = container.childNodes;
                for ( var idx = 0, len = index1 - index0 + 1; idx < len; idx++) {
                    container.removeChild(childNodes[index0]);
                }
            }
        },

        _tabMoved : function(index0, index1) {
            var container = $(this.id + 'container');
            if (container) {
                if (this._selectedIndex == index0) {
                    this._selectedIndex = index1;
                } else if (this._selectedIndex > index0 && this._selectedIndex <= index1) {
                    this._selectedIndex--;
                }
                var el = container.childNodes[index0];
                container.removeChild(el);
                var insertBefore = container.childNodes[index1];
                if (insertBefore) {
                    container.insertBefore(el, insertBefore);
                } else {
                    container.appendChild(el);
                }
            }
        }
    });
})();