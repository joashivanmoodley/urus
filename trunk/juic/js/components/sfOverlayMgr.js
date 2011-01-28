//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/SFResizer.js

/**
 * Generalized overlay manager that can handle the display of various components in a
 * modal or non-modal way.
 *
 * Usage:
 * 1. DO NOT INSTANTIATE!!! SFOverlayMgr is a singleton that is directly accessible. When you
 * include this file, it will automagically be available to you.
 *
 * 2. To show an overlay, call SFOverlayMgr.showOverlay(componentReference, isModal). See method
 * description for parameter implementation
 */

if (typeof SFOverlayMgr == "undefined") {
    //hide implementation from global namespace
    window.SFOverlayMgr = (function() {
        var _overlayCount = 0;

        /**
         * Private function
         *
         * Very important method that returns a reference to the container that holds
         * a dialog. This is the overlay DOM object itself. The method works by getting
         * a DOM reference to a dialog box or the displayed object. Then the method walks
         * up the DOM tree until it finds an element that has a className of "sfoverlaycontainer."
         * When it finds this container, it returns it to the calling function to be used for
         * further processing.
         *
         * @param dialogId - Id of the dialog within the overlay container. Need it
         * to step up the DOM tree until we come to a container with class sfoverlaycontainer
         */
        function _getOverlay(componentId) {
            var tgt = $(componentId);
            assert(tgt, "Target not found")
            if (tgt.className == "sfoverlaycontainer") return tgt;
            var prnt = tgt.parentNode;
            var tags = [];
            tags.push(prnt.tagName + " | ");
            while (prnt.className && (prnt.className != "sfoverlaycontainer")) {
                tags.push(prnt.tagName + " | ");
                prnt = prnt.parentNode;
            }
            return prnt;
        }


        /**
         * Centers an element relative to the viewport
         * @param ovrId  Id of element
         */
        function _centerComponent(ovrId) {
            var ovr = $(ovrId);
            if (ovr) {
                var chld = ovr.lastChild;
                var w = chld.offsetWidth;
                var h = chld.offsetHeight;
                var l = parseInt((_getViewportWidth() - w) / 2 + _getScrollLeft());
                var t = parseInt((_getViewportHeight() - h) / 2 + _getScrollTop());
                chld.style.position = "absolute";
                chld.style.left = l + "px";
                chld.style.top = t + "px";
                _setShimDim();
            }
        }

        /**
         * Re-calculate the shim height after resizing
         * @param shimId id of shim
         */
        function _setShimDim() {
            // Shim should take the height of the greater value of the scrollheight between the body or documentElement.
            $("sfOverlayMgr_shim").style.height = _getViewportHeight() + "px";
        }

        /**
         * Explicitly positions an element on the page
         * @param ovrId  element id
         * @param positionOpts  may extend in the future currently takes {left: xxx, top: yyy} where
         *                      xxx and yyy are integers
         */
        function _positionComponent(ovrId, positionOpts) {
            var _iframe = $(ovrId + "_overlay_iframe");
            if (_iframe) {
                _iframe.style.left = positionOpts.left + "px";
                _iframe.style.top = positionOpts.top + "px";
            }
            var ovr = $(ovrId);
            var chld = ovr.lastChild;
            chld.style.position = "absolute";
            //Have to do this for IE
            chld.style.zIndex = "100000";
            chld.style.left = positionOpts.left + "px";
            chld.style.top = positionOpts.top + "px";
        }

        function _getComponentDims(ovrId, bIsModal) {
            var ovr = $(ovrId);
            var chld = ovr.lastChild;
            return {
                overlayId : ovrId,
                componentWidth : chld.offsetWidth,
                componentHeight : chld.offsetHeight,
                isModal : bIsModal
            }
        }

        //Next two methods get the viewport dimensions
        function _getViewportHeight() {
            var vpHeight = 0;
            vpHeight = self.innerHeight || (root.clientHeight);
            return vpHeight;
        }

        function _getViewportWidth() {
            var vpWidth = 0;
            vpWidth = self.innerWidth || (root.clientWidth);
            return vpWidth;
        }

        //Next two methods get the scroll dimensions
        function _getScrollTop() {
            var scrollTop = 0;
            scrollTop = root.scrollTop;
            return scrollTop;
        }

        function _getScrollLeft() {
            var scrollLeft = 0;
            scrollLeft = root.scrollLeft;
            return scrollLeft;
        }

        var _overlays = [];
        // dev outside to min the number of if conditions
        var root = window.document.compatMode == 'BackCompat' ? window.document.body : window.document.documentElement;

        return set(new Component(), {

            init : function() {
                this.register();
                this._resizer = new SFResizer();
            },

            /**
             * Private
             *
             * Creates an empty container at the bottom of a page that will
             * contain the overlays. Also initializes the moveable shim that
             * acts as a modal overlay to prevent clicks on components below
             * the current overlay.
             */
            _createBaseContainer : function() {
                var body = document.body;
                //Create the base container, and store the reference as local property
                this._baseContainer = document.createElement("div");
                this._baseContainer.setAttribute("id", "sfOverlayMgr");
                var baseContainer = body.appendChild(this._baseContainer);
                //baseContainer.style.zIndex = "10000";
            },
            /**
             * Private
             *
             * Event handler for the overlay manager. handleEvent excutes based upon
             * the "hide" event. At which point it calls removeRemove, which destroys
             * the overlay that holds the dialog or display component, essentially
             * de-rendering the component.
             *
             * @param evt - Passed from event
             */
            _createShim  : function() {
                this._shim = document.createElement("div");
                this._shim.setAttribute("id", "sfOverlayMgr_shim");
                this._resizer.registerSizingContainers("sfOverlayMgr_shim");
                //Create the iframe
                this._iframe = document.createElement("iframe");
                this._iframe.id = "overlay_iframe";
                set(this._iframe.style, {
                    position: "absolute",
                    border : "0",
                    left : "0px",
                    top : "0px",
                    //The following is for IE
                    width: "100%",
                    height: "100%",
                    opacity : "0",
                    filter : "alpha(opacity=0)"
                });
                this._iframe.src = "/ui/uicore/img/_old.gif";
                set(this._shim.style, {
                    position:"absolute",
                    border : "0",
                    left: "0px",
                    top: "0px",
                    width: "100%",
                    display:"none"
                });
                //this._baseContainer.appendChild(this._iframe);
                this._shim.appendChild(this._iframe);
                var shimBody = this._baseContainer.appendChild(this._shim);
                //Setting src is necessary for IE, which does not respond
                //to direct CSS background in contentWindow.document.body
                //But, you also cannot put filter CSS in the doc write line.
                //That must be set in a separate style property manipulation.
                set(shimBody.style, {
                    background: "#333",
                    filter: "alpha(opacity=30)",
                    opacity: "0.30"
                })
            },
            handleEvent : function(evt) {
                if (evt.type == "hide") {
                    this.removeOverlay(evt.target.id)
                }
            },
            /**
             * Private function
             *
             * Moves the shim to the DOM position just before the first "modal"
             * dialog box that is found.
             */
            _moveShim : function() {
                var i = _overlays.length - 1;
                var overlayIsModal = false
                //this._shim.style.display = "none";
                while (i >= 0) {
                    if (_overlays[i].isModal) {
                        this._baseContainer.insertBefore(this._shim, $(_overlays[i].overlayId));
                        overlayIsModal = true;
                        break;
                    }
                    i--;
                }
                if (overlayIsModal)
                    this._shim.style.display = "";
                else
                    this._shim.style.display = "none";
                return false;
            },
            /**
             * Public
             *
             * Semantically, an "overlay" is actually an overlay container plus its
             * child dialog box.
             *
             * @param component - component reference
             * @param bIsModal -
             */
            showOverlay : function(component, bIsModal, positionOpts) {
                if (!this._baseContainer) this._createBaseContainer();
                if (!this._shim) this._createShim();
                component.addEventListener("hide", this);
                var ovrId = this.id + "_" + (_overlayCount);
                var overlay = document.createElement("div");
                overlay.setAttribute("class", "sfoverlaycontainer");
                overlay.setAttribute("id", ovrId);
                _overlays.push({
                    overlayId : ovrId,
                    isModal : bIsModal
                });
                overlay.style.visibility = "hidden";
                this._bIsModal = bIsModal;
                if (bIsModal) {
                    this._resizer.addEventListener("resizeEvt", {
                        handleEvent : function(evt) {
                            _centerComponent(ovrId);
                        }
                    })
                    this._shim.style.display = "";
                    this._iframe.style.zIndex = "10000";
                    this._shim.style.zIndex = "10000";
                    this._baseContainer.appendChild(this._shim);
                    this._baseContainer.appendChild(overlay);
                    overlay.style.zIndex = "10000";
                    overlay.style.position = "absolute";
                    overlay.style.left = "0px";
                    overlay.style.top = "0px";
                    component.render(ovrId);
                    _centerComponent(ovrId);
                    overlay.firstChild.style.zIndex = "10000";
                } else {
                    // check if the scroll bar is available
                    var isVerticalScrollbar = root.scrollHeight > root.clientHeight;
                    // if there is no scrollbar hide the overflow so it will not render th scrollbar if the height inc due to the floating overlay
                    if (!isVerticalScrollbar) {
                        window.document.body.style.overflow = "hidden"
                    }
                    var _iframe = document.createElement("iframe");
                    _iframe.id = this.id + "_" + (_overlayCount) + "_overlay_iframe";
                    _iframe.src = "/ui/uicore/img/_old.gif";
                    set(_iframe.style, {
                        border : "0",
                        position:"absolute",
                        zIndex: "10000",
                        opacity : "0",
                        filter : "alpha(opacity=0)"
                    });

                    this._baseContainer.appendChild(overlay);


                    component.render(ovrId);

                    var chld = overlay.firstChild;
                    overlay.insertBefore(_iframe, chld);
                    (positionOpts) ? _positionComponent(ovrId, positionOpts) : _centerComponent(ovrId);
                    set(_iframe.style, {
                        width: chld.offsetWidth + "px",
                        height: chld.offsetHeight + "px"
                    });
                    if (!isVerticalScrollbar) {
                        window.document.body.style.overflow = ""
                    }
                }
                _overlayCount++;
                overlay.style.visibility = "";
                this.dispatch("overlayRendered", _getComponentDims(ovrId, bIsModal));
                // set the overflow back to the default, in case the page gets scrollbar by some other action.
            },
            repositionComponent : function(ovrId, positionOpts) {
                _positionComponent(ovrId, positionOpts);
            },
            centerComponent : function(componentId) {
                var overlay = _getOverlay(componentId);
                _centerComponent(overlay);
            },
            /**
             * Public
             *
             * Mostly used internally, but there will be cases where a user has a few dialog
             * boxes up, and they close the parent dialog which spawned the others. At that point,
             * it is the responsibility of the parent to close all children, so the parent component
             * will use removeOverlay to close all children
             *
             * @param componentId
             */
            removeOverlay : function(componentId) {
                var overlayObj = _getOverlay(componentId);
                var overlayComp = Component._registry[componentId];
                if (overlayComp) overlayComp.removeEventListener("hide", this);
                var overlay = $(overlayObj.id);
                overlay.innerHTML = "";
                this._baseContainer.removeChild(overlay);
                for (var i = 0,len = _overlays.length; i < len; i++) {
                    if (_overlays[i].overlayId == overlayObj.id) {
                        _overlays.splice(i, 1);
                        break;
                    }
                }
                this._moveShim(this);
            }
        });
    })();
    SFOverlayMgr.init();
}