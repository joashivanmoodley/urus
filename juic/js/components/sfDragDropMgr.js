//! include /ui/juic/js/core/component.js

/**
 * Generalized drag and drop manager that makes drag and drop possible. This was
 * meant as a replacement for the YUI implementation.
 * 
 * ---- Usage ----
 * 
 * 1. DO NOT INSTANTIATE!!! SFDragDropMgr is a singleton that is directly
 * accessible. When you include this file, it will automagically be available to
 * you.
 * 
 * 2. In your component, on the "drag handle" html element, render the
 * onmousedown event to use a fireCode call. In the associated method make call
 * to SFDragDropMgr.handleMouseDown(event, handler, options).
 * 
 * 3. The handler that you pass in (most likely the same component calling the
 * handleMouseDown) will need a "handleDragEvent" method. Any drag events that
 * occur will be sent to here.
 * 
 * ---- Drag Events ----
 * 
 * 1. "dragStart" - This event happens after the drag has approached the
 * threshold and is ready to begin (at least 1 second of mouse down time, or 3
 * pixel drag)
 * 
 * 2. "drag" - This event happens any time the mouse moves after the dragStart
 * 
 * 3. "dragEnd" - This happens on "mouseup" after the dragStart
 * 
 * 4. "dragOver" - This happens when you drag the mouse over a region defined by
 * a drop target. Note that this will only be called once, if there are
 * overlapping drag targets a list of all drop targets are passed.
 * 
 * 5. "dragOut" - This happens when you drag the mouse out of a region defined
 * by a drop target. Note that this will only be called once (and guaranteed
 * AFTER the 'dragOver' of any drop target), if there are overlapping drag
 * targets a list of all drop targets are passed.
 * 
 * ---- Limitations ----
 * 
 * 1. More attention required on user selection, especially in IE. When a user
 * clicks and drags on the page, the browser tries to select text, which can
 * really cause problems with the display.
 * 
 * Ways to prevent user selection:
 * <li>In IE you can use unselectable="on"
 * <li>In IE you can render onselectstart="return false;"
 * <li>In FireFox you can use the CSS style "-moz-user-select: none;"
 * 
 * 2. Usage of the SFOverlayMgr to display a proxy element causes a significant
 * delay between mouse down and drag in IE (around 1 second). Instead use a
 * singleton absolutely positioned div that will get updated by your component
 * when the drag starts. This is much faster and is the same way that YUI does
 * it.
 */

if (typeof SFDragDropMgr == "undefined") {
    window.SFDragDropMgr = ( function() {
        var CLICK_TIME_THRESHOLD = 1000;
        var CLICK_DRAG_THRESHOLD = 3;
        var SHIM_PADDING = 1;

        /**
         * Private function
         * 
         * Retrieve the mouse coordinates (with respect to the page) from the
         * Event object.
         * 
         * @param event {Event} The mouse event to retrieve the mouse
         *            coordinates
         * @return {Point} The point object (using YUI for now)
         */
        function getPagePoint(event) {
            var xy = YAHOO.util.Event.getXY(event || window.event);
            return new YAHOO.util.Point(xy[0], xy[1]);
        }

        /**
         * Private function
         * 
         * Determine if the given points are far enough apart to meet the drag
         * threshold.
         * 
         * @param from {Point} The origin point
         * @param to {Point} The point the mouse is currently at
         */
        function checkDragThreshold(from, to) {
            return Math.abs(from.x - to.x) > CLICK_DRAG_THRESHOLD || Math.abs(from.y - to.y) > CLICK_DRAG_THRESHOLD;
        }

        return set(new EventTarget(), {
            /**
             * Initializes the drag drop manager.
             */
            init : function() {
                this._dropTargets = [];
                this._overTargets = [];
            },

            /**
             * Starts listening for the drag events, call this method in the
             * "onmousedown" event which comes from your drag handle DOM
             * element. Pass in a handler which will be called on any drag event
             * (must have a 'handleDragEvent' method).
             * 
             * @param event {Event} The mouse down event
             * @param handler {Object} The handler to be called on any drag
             *            event
             * @param options {Object} Contains options {useShim: boolean,
             *            shimCursor: String, refreshCache: boolean}
             */
            handleMouseDown : function(event, handler, options) {
                assert(handler && handler.handleDragEvent,
                        'SFDragDropMgr: dragListener is required, and must have a handleDragEvent method');

                if (!this._activeDrag) {
                    event = event || window.event;
                    assert(event, 'SFDragDropMgr: The origin mouse event is required');

                    this._currentPoint = getPagePoint(event);
                    this._activeDrag = {
                        handler :handler,
                        options :options,
                        point :this._currentPoint
                    };

                    if (options && options.refreshCache != false) {
                        this.refreshCache(options && options.refreshDOM);
                    }

                    if (options.clickTimeThreshold === 0) {
                        this._overThreshold = true;
                        this._dragToCurrentPoint();
                    } else {
                        this._overThreshold = false;
                        this._thresholdTimeoutId = setTimeout( function() {
                            SFDragDropMgr._thresholdTimeoutId = null;
                            SFDragDropMgr._overThreshold = true;
                            SFDragDropMgr._dragToCurrentPoint();
                        }, options.clickTimeThreshold || CLICK_TIME_THRESHOLD);
                    }

                    YAHOO.util.Event.addListener(document, 'mouseup', this._onMouseUp, this, true);
                    YAHOO.util.Event.addListener(document, 'mousemove', this._onMouseMove, this, true);
                }
            },

            /**
             * Make a particular DOM element draggable. Use this method after
             * the DOM is available. If the DOM element is deleted, the listener
             * will be deleted as well, which means if you rerender the DOM you
             * must call this method again.
             * 
             * This method will attach a listener to the 'mousedown' event to
             * the DOM element, which will internally call the handleMouseDown
             * method and handle all of the drag events for you.
             * 
             * It is recommended that if you want to make a component draggable
             * to directly use the 'handleMouseDown' and handle the drag events
             * yourself.
             * 
             * @param id {String} The id of the DOM element you want to make
             *            draggable.
             * @param options {Object} Optional parameters include {handleId:
             *            String} in addition to all options supported by the
             *            handleMouseDown method call.
             */
            makeDraggable : function(id, options) {
                var handler = {
                    options :options,
                    id :id,
                    handleDragEvent : function(event) {
                        switch (event.type) {
                        case 'drag':
                            var obj = $(this.id);
                            obj.style.left = (this.originPosition.left - event.origin.x + event.point.x) + 'px';
                            obj.style.top = (this.originPosition.top - event.origin.y + event.point.y) + 'px';
                            break;
                        }
                    },
                    onMouseDown : function(event) {
                        var obj = $(this.id);
                        if (obj) {
                            this.originXY = YAHOO.util.Dom.getXY(this.id);
                            this.originPosition = {
                                left :parseInt(YAHOO.util.Dom.getStyle(obj, 'left')),
                                top :parseInt(YAHOO.util.Dom.getStyle(obj, 'top'))
                            };
                            SFDragDropMgr.handleMouseDown(event, this, options);
                        }
                    }
                };
                var handleId = (options && options.handleId) || id;
                YAHOO.util.Event.addListener($(handleId), 'mousedown', handler.onMouseDown, handler, true);
            },

            /**
             * Add a drop target to be managed by the SFDragDropMgr. When a drag
             * begins, the drag handlers will be notified when the mouse moves
             * over or out of the regions which are defined by the DOM element
             * with the provided id.
             * 
             * @param id {String} The id of the DOM element
             * @param properties {Object} An extra object that will be sent to
             *            the drag handler when the mouse hovers over this drop
             *            target. This can be any object.
             */
            addDropTarget : function(id, properties) {
                this._dropTargets.push( {
                    id :id,
                    properties :properties
                });
            },

            /**
             * Remove the drop target with the specified id.
             * 
             * @param id {String} The id of the drop target to remove.
             */
            removeDropTarget : function(id) {
                for ( var idx = 0, len = this._dropTargets.length; idx < len; idx++) {
                    var dropTarget = this._dropTargets[idx];
                    if (dropTarget.id == id) {
                        this._dropTargets.splice(idx, 1);
                        break;
                    }
                }
            },

            /**
             * This is an important method which must be called whenever there
             * is an event which occurs after the drag has started which changes
             * the position of the drop target regions in relation to the page.
             * 
             * For example - if while dragging you are changing position of DOM
             * elements in the tree, or scrolling some div (i.e. auto scrolling
             * when dragging outside the visible area) you must refresh the
             * cache.
             * 
             * Otherwise - if you do not refresh the cache, the drop target
             * regions will not update, making the application think you're
             * hovering over the wrong drop region.
             */
            refreshCache : function(refreshDOM) {
                if (refreshDOM) {
                    this._cache = null;
                } else {
                    this._forceUpdate = true;
                }
            },

            /**
             * Private method to check if the cache is up to date, and if not
             * update it.
             */
            _checkCache : function() {
                if (this._forceUpdate || !this._cache) {
                    this._forceUpdate = false;
                    this._updateCache();
                }
            },

            /**
             * Update the cache to include the DOM element references and the
             * regions defined by those dom elements.
             */
            _updateCache : function() {
                this._cache = this._cache || {};
                for ( var idx = 0, len = this._dropTargets.length; idx < len; idx++) {
                    var target = this._dropTargets[idx];
                    var old = this._cache[target.id];
                    var el = (old && old.el) || $(target.id);
                    if (el) {
                        this._cache[target.id] = {
                            region :YAHOO.util.Dom.getRegion(el),
                            el :el
                        };
                    } else {
                        delete this._cache[target.id];
                    }
                }
            },

            /**
             * Handle all drag events that occur when dragging the object to the
             * "current point" (could be the original position in the case of a
             * 'dragStart' or the current mouse point in the case of a normal
             * 'drag')
             */
            _dragToCurrentPoint : function() {
                this._checkCache();

                var options = this._activeDrag.options;
                var handler = this._activeDrag.handler;
                var origin = this._activeDrag.point;

                /* If the drag hasn't started yet, this is a 'dragStart' event. */
                if (!this._dragging) {
                    if (options && options.useShim) {
                        this._showShim();
                        if (options.shimCursor) {
                            this._shim.style.cursor = options.shimCursor;
                        } else {
                            this._shim.style.cursor = '';
                        }
                    }
                    handler.handleDragEvent( {
                        type :'dragStart',
                        origin :origin
                    });
                }
                this._dragging = true;

                var overList = [];
                var newOverList = [];
                var newOutList = [];

                /* Loop through the drop targets to check hovering. */
                for ( var idx = 0, len = this._dropTargets.length; idx < len; idx++) {
                    var dropTarget = this._dropTargets[idx];
                    var cache = this._cache[dropTarget.id];

                    /* It's possible that the cache has been removed. */
                    /* Or the region is false because it isn't visible. */
                    if (cache && cache.region) {
                        var region = cache.region;
                        var alreadyOver = this._overTargets.contains(dropTarget.id);
                        var over = region && region.contains(this._currentPoint);
                        var copy = {
                            id :dropTarget.id,
                            properties :dropTarget.properties,
                            region :region
                        };

                        if (over && !alreadyOver) {
                            newOverList.push(copy);
                            this._overTargets.push(dropTarget.id);
                        } else if (!over && alreadyOver) {
                            newOutList.push(copy);
                            this._overTargets.remove(dropTarget.id);
                        }

                        if (over) {
                            overList.push(copy);
                        }
                    }
                }

                /* In any case we give the 'drag' event'. */
                handler.handleDragEvent( {
                    type :'drag',
                    origin :origin,
                    lastPoint :this._lastPoint,
                    point :this._currentPoint,
                    dropTargets :overList
                });

                /* If there is a new drop target we hovered over. */
                if (newOverList.length > 0) {
                    var dropTarget = newOverList[0];
                    handler.handleDragEvent( {
                        type :'dragOver',
                        origin :origin,
                        lastPoint :this._lastPoint,
                        point :this._currentPoint,
                        dropTargets :overList,
                        id :dropTarget.id,
                        properties :dropTarget.properties,
                        region :dropTarget.region
                    });
                }

                /* If there is a new drop target we hovered out of. */
                if (newOutList.length > 0) {
                    var dropTarget = newOutList[0];
                    handler.handleDragEvent( {
                        type :'dragOut',
                        origin :origin,
                        lastPoint :this._lastPoint,
                        point :this._currentPoint,
                        dropTargets :overList,
                        id :dropTarget.id,
                        properties :dropTarget.properties,
                        region :dropTarget.region
                    });
                }
            },

            /**
             * This method is called by the 'mousemove' event attached to either
             * the shim or the document.
             * 
             * Interally uses the _dragToCurrentPoint to handle the drag events.
             */
            _onMouseMove : function(event) {
                var time = new Date().getTime();
                if (Util.browserInfo.ie && !event.button) {
                    this._onMouseUp(event);
                } else {
                    YAHOO.util.Event.stopPropagation(event);
                    this._lastPoint = this._currentPoint;
                    this._currentPoint = getPagePoint(event);

                    if (this._overThreshold || checkDragThreshold(this._currentPoint, this._activeDrag.point)) {
                        if (!this._overThreshold) {
                            clearTimeout(this._thresholdTimeoutId);
                            this._thresholdTimeoutId = null;
                            this._overThreshold = true;
                        }
                        this._dragToCurrentPoint();
                    }
                }
            },

            /**
             * This method is called by the 'mouseup' event attached to either
             * the shim or the document.
             * 
             * This will send the dragEnd drag event to the handler if the
             * threshold has been met.
             * 
             * @param event {Event} The mouse event being processed
             */
            _onMouseUp : function(event) {
                /*
                 * If we dont stop the event in the shim, then it will bubble to
                 * the document and call the method twice.
                 */
                YAHOO.util.Event.stopPropagation(event);

                if (this._shimActive) {
                    this._hideShim();
                }

                if (this._thresholdTimeoutId != null) {
                    clearTimeout(this._thresholdTimeoutId);
                    this._thresholdTimeoutId = null;
                } else {
                    var handler = this._activeDrag.handler;
                    var origin = this._activeDrag.point;
                    handler.handleDragEvent( {
                        type :'dragEnd',
                        origin :origin,
                        point :this._currentPoint,
                        dropTargets :this._overTargets
                    });
                    this.dispatch('dragDrop', {
                        dragHandler :handler,
                        dropTargets :this._overTargets
                    });
                }

                YAHOO.util.Event.removeListener(document, 'mouseup', this._onMouseUp);
                YAHOO.util.Event.removeListener(document, 'mousemove', this._onMouseMove);
                this._activeDrag = null;
                this._dragging = false;
                this._overTargets = [];
            },

            /**
             * Show the shim.
             */
            _showShim : function() {
                if (!this._shim) {
                    this._createShim();
                }
                this._shimActive = true;
                this._sizeShim();
                this._shim.style.display = '';
            },

            /**
             * Hide the shim.
             */
            _hideShim : function() {
                if (this._shim) {
                    this._shim.style.display = 'none';
                }
            },

            /**
             * Size the shim to match size of page.
             */
            _sizeShim : function() {
                if (this._shimActive) {
                    this._shim.style.height = (YAHOO.util.Dom.getDocumentHeight() - SHIM_PADDING) + 'px';
                    this._shim.style.width = (YAHOO.util.Dom.getDocumentWidth() - SHIM_PADDING) + 'px';
                    this._shim.style.top = '0';
                    this._shim.style.left = '0';
                }
            },

            /**
             * Create a shim to go under the hovering lines so that all mouse
             * events come through the shim and not through the body of the
             * page.
             */
            _createShim : function() {
                if (!this._shim) {
                    this._shim = document.createElement('div');
                    if (document.body.firstChild) {
                        document.body.insertBefore(this._shim, document.body.firstChild);
                    } else {
                        document.body.appendChild(this._shim);
                    }
                    this._shim.style.display = 'none';
                    this._shim.style.backgroundColor = 'red';
                    this._shim.style.position = 'absolute';
                    this._shim.style.zIndex = '100001';
                    this._shim.style.cursor = 'move';
                    this._shim.unselectable = 'on';
                    this._shim.onselectstart = function() {
                        return false;
                    }
                    YAHOO.util.Dom.setStyle(this._shim, 'opacity', '0');
                    YAHOO.util.Event.on(this._shim, 'mouseup', this._onMouseUp, this, true);
                    YAHOO.util.Event.on(this._shim, 'mousemove', this._onMouseMove, this, true);
                    YAHOO.util.Event.on(window, 'scroll', this._sizeShim, this, true);
                }
            }
        });
    })();

    /* Called inline with the JS include, will init the singleton. */
    SFDragDropMgr.init();
}

/**
 * The SFDragDropHandle will allow any component to render a drag handle as a
 * child, to make the entire component draggable.
 * 
 * The result is just a simple drag moving the DOM element with the specified
 * drag Id to match the dragging action.
 * 
 * The drag handle is a simple wrapper component, so you can make the drag
 * handle anything. For example you could pass in a child component to render a
 * simple drag dot icon.
 * 
 * @param child {String|Component} The child component to render the handle, if
 *            string then just render the string (escaped)
 * @param dragId {String} The id of the parent element which will be dragged
 *            along with the handle
 * @param options {Object} Some options attributes include {useShim: boolean}
 */
function SFDragDropHandle(child, dragId, options) {
    this.register();
    this._init(child, dragId, options);
}

SFDragDropHandle.prototype = ( function() {
    var DEFAULT_USE_SHIM = false;

    function getPosition(val) {
        return val ? parseInt(val) : 0;
    }

    function getDomXY(el) {
        return {
            x :getPosition(el.style.left),
            y :getPosition(el.style.top)
        };
    }

    return set(new Component(), {
        /**
         * Initialize the drag drop handle.
         * 
         * @param child {String|Component} The child component to render the
         *            handle, if string then just render the string (escaped)
         * @param dragId {String} The id of the parent element which will be
         *            dragged along with the handle
         * @param options {Object} Some options attributes include {useShim:
         *            boolean}
         */
        _init : function(child, dragId, options) {
            this._child = child;
            this._dragId = dragId;
            this._useShim = (options && options.useShim != null) ? options.useShim : DEFAULT_USE_SHIM;
        },

        /**
         * Render a wrapper span, and call renderHtml of the child component.
         * 
         * @param html {String[]} The html
         */
        renderHtml : function(html) {
            html.push('<span id="', this.id, '" style="-moz-user-select: none; cursor: move;"');
            html.push(' onmousedown="', this.fireCode('_onMouseDown'));
            html.push('" unselectable="on" onselectstart="return false;">');
            if (typeof this._child == 'string') {
                html.push(escapeHTML(this._child));
            } else {
                this._child.renderHtml(html);
            }
            html.push('</span>');
        },

        /**
         * Handles any incoming drag event.
         * 
         * @param event {DragEvent} The drag event to handle.
         */
        handleDragEvent : function(event) {
            switch (event.type) {
            case 'drag':
                var dragEl = $(this._dragId);
                dragEl.style.left = (this._originDomXY.x - event.origin.x + event.point.x) + 'px';
                dragEl.style.top = (this._originDomXY.y - event.origin.y + event.point.y) + 'px';
                break;
            }

            /* Just in case if a listener is interested in these events. */
            this.dispatch('dragEvent', {
                event :event
            });
        },

        /**
         * When you mouse down on the handle. Calls the SFDragDropMgr.
         * 
         * @param event {Event} The mouse event.
         */
        _onMouseDown : function(event) {
            this._originDomXY = getDomXY($(this._dragId));
            SFDragDropMgr.handleMouseDown(event, this, {
                useShim :this._useShim,
                shimCursor :'move'
            });
        },

        /**
         * Set the drag id parent to drag along with the handle.
         * 
         * @param dragId {String} The id of the dom element
         */
        setDragId : function(dragId) {
            this._dragId = dragId;
        }
    });
})();

/**
 * Inherit from SFAbstractDragProxy if you want to use the default proxy
 * implementation.
 * 
 * ----------------------------------------------------------------------------
 * ABSTRACT METHODS : That you must implement to function properly
 * 
 * <li>renderProxyHTML : called to render custom HTML for the proxy DIV when
 * the dragging starts
 * 
 * ----------------------------------------------------------------------------
 * HOOK METHODS : To customize your drag logic
 * 
 * <li>beforeDragEvent : called before handling of any drag logic (If this
 * method returns true then no drag processing will happen)
 * <li>afterDragEvent : called after handling of all drag logic
 * 
 * IMPORTANT NOTE: ------ In order for the drag to work properly, you should
 * implement the beforeDragEvent and look for the 'dragEnd' type. Then move your
 * DOM to the proper ending location. Otherwise, your drop event will not do
 * anything.
 * 
 * ----------------------------------------------------------------------------
 * OVERRIDEABLE METHODS: If you require special DOM handling:
 * 
 * <li>getDragEl : Creates the drag element (default uses a singleton DIV that
 * is reused over and over)
 * <li>getEl : Returns the dom element being dragged (default uses $(this.id))
 * <li>showDragEl : Makes the drag element visible (default sets drag el
 * display: 'block' and makes the main element visibility: 'hidden')
 * <li>hideDragEl : Makes the drag element invisible (default sets drag el
 * display: 'none' and makes the main element visibility: 'visible')
 * 
 * ----------------------------------------------------------------------------
 * DRAG OPTIONS: call setDragOptions on constructor
 * 
 * <li>dragOptions: Optional parameters to pass to the SFDragDropMgr when
 * handling the mouseDown event
 * <li>dragRegion: Restricts the drag element to dragging only within the
 * specified region (region may any of: top, left, bottom, right)
 * <li>dragClassName: An optional style class name to append to the drag proxy
 * <li>verticalOnly: Restrict dragging along the y axis only
 * <li>horizontalOnly: Restrict dragging along the x axis only
 * <li>autoScroller: An auto scroller that will be used to update when you are
 * dragging beyond scroll boundaries (see SFAutoScroller)
 * <li>animateDrop: Do you want the mouse up event to involve animating the
 * proxy DIV to the end location?
 * <li>dragDisabled: Do you want to disable drag and drop?
 */
function SFAbstractDragProxy() {
    assert(this.constructor !== SFAbstractDragProxy,
            "[SFAbstractDragProxy] No implementation available for SFAbstractDragProxy. You must subclass it.");
}

SFAbstractDragProxy.prototype = ( function() {
    var DRAG_EL = null;

    /**
     * Private function that will return a singleton DIV element that will be
     * created and placed into the DOM for displaying a drag proxy.
     * 
     * @return {HTMLElement} The singleton drag element
     */
    function getDragEl() {
        if (!DRAG_EL) {
            DRAG_EL = document.createElement('div');
            if (document.body.firstChild) {
                document.body.insertBefore(DRAG_EL, document.body.firstChild);
            } else {
                document.body.appendChild(DRAG_EL);
            }
            DRAG_EL.onselectstart = function() {
                return false;
            }
            DRAG_EL.unselectable = 'on';
            DRAG_EL.style.display = 'none';
            DRAG_EL.style.position = 'absolute';
            DRAG_EL.style.zIndex = '100000';
        }
        return DRAG_EL;
    }

    /**
     * Private util function that applys a drag region to a drag event by
     * changing the point that was passed in if it requires the drag el to move
     * beyond the borders.
     * 
     * @param point {Point} The mouse point
     * @param dragEl {HTMLElement} The drag DOM element
     * @param region {Region} The region (may contain top, left, bottom, right}
     */
    function applyDragRegion(point, dragEl, region) {
        if (region) {
            var dimension = {
                width :dragEl.offsetWidth,
                height :dragEl.offsetHieght
            };
            if (region.right != null) {
                var right = point.x + dimension.width;
                if (right > region.right) {
                    point.x -= right - region.right;
                }
            }
            if (region.bottom != null) {
                var bottom = point.y + dimension.height;
                if (bottom > region.bottom) {
                    point.y -= bottom - region.bottom;
                }
            }
            if (region.left != null) {
                point.x = Math.max(point.x, region.left);
            }
            if (region.top != null) {
                point.y = Math.max(point.y, region.top);
            }
        }
    }

    return set(new Component(), {
        /**
         * Call this on the constructor of your child class to set any options
         * (if required).
         * 
         * @param options {json} option map {dragOptions: json, dragRegion:
         *            Region, dragClassName: String, verticalOnly: boolean,
         *            horizontalOnly: boolean, autoScroller: SFAutoScroller,
         *            animateDrop: boolean, dragDisabled: boolean}
         */
        setDragOptions : function(options) {
            this._dragOptions = options && options.dragOptions || {
                useShim :true,
                shimCursor :'move'
            };
            this._dragRegion = options && options.dragRegion;
            this._dragClassName = options && options.dragClassName;
            this._verticalOnly = options && options.verticalOnly;
            this._horizontalOnly = options && options.horizontalOnly && !options.verticalOnly;
            this._autoScroller = options && options.autoScroller;
            this._animateDrop = options && options.animateDrop;
            this._dragDisabled = options && options.dragDisabled;
        },

        /**
         * You must override this method to provide the HTML for the proxy.
         * 
         * @param html {String[]} The html array
         */
        renderProxyHtml : function(html) {
            assert(false, '[SFAbstractDragProxy] Child must implement renderProxyHtml');
        },

        /**
         * Override this to add any custom logic before the drag event.
         * 
         * @param event {DragEvent} The drag event
         */
        beforeDragEvent : function(event) {
        },

        /**
         * Override this to add any custom logic after the drag event.
         * 
         * @param event {DragEvent} The drag event
         */
        afterDragEvent : function(event) {
        },

        /**
         * This method handles all drag events. Do not override this one.
         * 
         * @param event {DragEvent} The drag event
         */
        handleDragEvent : function(event) {
            if (!this.beforeDragEvent(event)) {
                switch (event.type) {
                case 'dragStart':
                    this._updateDragEl();
                    break;
                case 'drag':
                    this._positionDragEl(event.origin, event.point);
                    if (this._autoScroller) {
                        this._autoScroller.autoScroll(YAHOO.util.Dom.getRegion(this.getDragEl()));
                    }
                    break;
                case 'dragEnd':
                    if (this._animateDrop) {
                        this._animateDragEl();
                    } else {
                        this.hideDragEl();
                    }
                    break;
                }
                this.afterDragEvent(event);
            }
        },

        /**
         * Call this method when the mouseDown event comes on the draggable
         * object.
         * 
         * @param event {Event} The window event
         */
        handleMouseDown : function(event) {
            if (!this._dragDisabled) {
                event = event || window.event;
                SFDragDropMgr.handleMouseDown(event, this, this._dragOptions);
                YAHOO.util.Event.preventDefault(event);
            }
        },

        /**
         * This method will be used to get or create the drag dom element. You
         * may override this if you want to customize how you create the drag
         * element. By default this will reuse a singleton div that is attached
         * to the beginning of the html document.
         */
        getDragEl : function() {
            return getDragEl();
        },

        /**
         * This will return the current DOM element. You may override this, but
         * by default it will resolve the DOM element by using this.id
         */
        getEl : function() {
            return $(this.id);
        },

        /**
         * This will be called when the drag proxy element should be shown. By
         * default this will set the display of the drag el to "" and the
         * visibility of the main element to "hidden"
         */
        showDragEl : function() {
            this.getEl().style.visibility = 'hidden';
            this.getDragEl().style.display = '';
        },

        /**
         * This will be called when the drag proxy element should be hidden. By
         * default this will set the display of the drag el to "none" and the
         * visibility of the main element to "visible"
         */
        hideDragEl : function() {
            this.getEl().style.visibility = 'visible';
            this.getDragEl().style.display = 'none';
        },

        /**
         * Set the drag region dynamically.
         * 
         * @param region {Region} : May contain top, left, bottom, right
         */
        setDragRegion : function(dragRegion) {
            this._dragRegion = dragRegion;
        },

        /**
         * Call this if you want to dynamically enable/disable drag and drop.
         * 
         * @param dragDisabled {boolean} If the drag is disabled
         */
        setDragDisabled : function(dragDisabled) {
            this._dragDisabled = dragDisabled;
        },

        /**
         * Called on dragStart to update the drag el and position it properly.
         */
        _updateDragEl : function() {
            var el = this.getEl();
            var xy = YAHOO.util.Dom.getXY(el);
            this._originPosition = {
                x :xy[0],
                y :xy[1]
            };
            var html = [];
            this.renderProxyHtml(html);

            var dragEl = this.getDragEl();
            dragEl.className = 'sfDragProxy' + (this._dragClassName ? ' ' + this._dragClassName : '');
            dragEl.style.top = this._originPosition.y + 'px';
            dragEl.style.left = this._originPosition.x + 'px';
            dragEl.innerHTML = html.join('');
            this.showDragEl();
        },

        /**
         * Called on drag to position the drag element according to the current
         * mouse position.
         */
        _positionDragEl : function(origin, point) {
            var dragEl = this.getDragEl();
            var point = {
                x :this._originPosition.x - origin.x + point.x,
                y :this._originPosition.y - origin.y + point.y
            };
            applyDragRegion(point, dragEl, this._dragRegion);
            if (!this._verticalOnly) {
                dragEl.style.left = point.x + 'px';
            }
            if (!this._horizontalOnly) {
                dragEl.style.top = point.y + 'px';
            }
        },

        /**
         * Called on dragEnd to animate the drag element to the position of the
         * main element and then hide the drag element.
         */
        _animateDragEl : function() {
            var el = this.getEl();
            var dragEl = this.getDragEl();
            var me = this;
            var animation = new YAHOO.util.Motion(dragEl, {
                points : {
                    to :YAHOO.util.Dom.getXY(el)
                }
            }, 0.3, YAHOO.util.Easing.easeOut);
            animation.onComplete.subscribe( function() {
                me.hideDragEl();
            });
            animation.animate();
        }
    });
})();