//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfOverlayMgr.js
//! include /ui/juic/js/components/sfPositionManager.js
//! include /ui/uicore/css/components/sfIIC.css

/**
 *
 * @param component
 */
if (typeof SFInfoInContext == "undefined") {
    //hide implementation from global namespace
    window.SFInfoInContext = (function() {
        function _bubble(component, config) {
            this.register();
            if (component)
                this.setComponent(component);
            
            this._closeButtonEnabled = true;
            if (config) {
                if (config.closeButtonEnabled != undefined && config.closeButtonEnabled != null) {
                    this._closeButtonEnabled = config.closeButtonEnabled; 
                }
            }
        }

        _bubble.prototype = (function() {
            return set(new Component(), {
                renderHtml : function(h) {
                    h.push("<div id=\"", this.id, "\" class=\"lg_caret_left\"><table style=\"width:auto\"><tr><td>");
                    h.push("<span id=\"" + this.id + "_caret\" class=\"beige_caret\">&nbsp;</span>" +
                           "<div class=\"round beige_dlg\"><span class=\"ct\"><span class=\"cl\">&nbsp;</span></span>" +
                           "<div class=\"bd\"><div class=\"content\" style=\"padding:.5em;\">");
                    this._component.renderHtml(h);                    
                    h.push("</div></div><span class=\"cb\"><span class=\"cl\">&nbsp;</span></span></div>");
                    if (this._closeButtonEnabled) {
                        h.push("<button class=\"container-close\" onclick=\"", this.fireCode("_popBubble"), "\">&nbsp;</button>");
                    }
                    h.push("</td></tr></table></div>");
                },
                setComponent : function(component) {
                    this._component = component;
                },
                handleEvent : function(event) {
                    var bubble = $(event.positionInfo.overlay.overlayId);
                    if (event.type == "positionFixed" && bubble && bubble.lastChild === $(this.id)) {
                        this._positionCaret(event);
                    }
                },
                _hideBubble : function() {
                    this.dispatch("hide");
                },
                _popBubble : function() {
                    this._hideBubble();
                    this.dispatch("popBubble");
                },
                /**
                 * Private
                 *
                 * This private method does further positioning of the component after
                 * position manager does its positioning to position the caret
                 * and set the final position of bubble.
                 *
                 * Expects the following structure passed along with the even
                 *
                 {
                 positionInfo : {
                 fixPoint : {
                 origin : {
                 originId : this.originObj.id,
                 vertical:this.fixPoint.origin.vertical,
                 horizontal:this.fixPoint.origin.horizontal
                 },
                 menu   : {
                 vertical:this.fixPoint.menu.vertical,
                 horizontal:this.fixPoint.menu.horizontal
                 }
                 },
                 overlay : {
                 overlayId : menuOptions.overlayId,
                 left      : newPosition.left,
                 top       : newPosition.top,
                 width     : menuOptions.componentWidth,
                 height    : menuOptions.componentHeight
                 }
                 }
                 }
                 *
                 * @param event
                 */
                _positionCaret : function(event) {
                    var pInfo = event.positionInfo;

                    //get references to overlay and the bubble
                    var overlay = $(pInfo.overlay.overlayId);
                    var bubble = overlay.lastChild;
                    //First set the caret
                    bubble.className = (pInfo.fixPoint.menu.horizontal == "left") ? "lg_caret_left" : "lg_caret_right";

                    //Now, we have to figure out the vertical midpoint of the trigger container.
                    var midPt = parseInt($(pInfo.fixPoint.origin.originId).offsetHeight / 2);

                    //Set vertical position of bubble
                    var offsetVertical = (pInfo.fixPoint.menu.vertical == "bottom") ? 40 + midPt : -40 - midPt;
                    var newTop = pInfo.overlay.top + offsetVertical;
                    var newLeft = (pInfo.fixPoint.menu.horizontal == "right") ? pInfo.overlay.left - $(pInfo.fixPoint.origin.originId).offsetWidth : pInfo.overlay.left;


                    SFOverlayMgr.repositionComponent(pInfo.overlay.overlayId,
                    {
                        left : newLeft,
                        top : newTop
                    });
                    //Now position the caret

                    //get a reference to the caret
                    var caret = $(bubble.id + "_caret");
                    //Now we have to get the Y-value of the midpoint
                    var yPos = (pInfo.fixPoint.menu.vertical == "top") ? pInfo.overlay.top - midPt : pInfo.overlay.top + pInfo.overlay.height + midPt;
                    //Now that we have the yPos, we can figure out the caret vertical offset
                    //by using newTop +- yPos
                    var caretOffset = yPos - newTop;
                    caret.style.top = caretOffset + "px";
                },
                unregister : function() {
                    delete this._events;
                    delete Component._registry[this.id];
                }
            })
        })();
        return set(new EventTarget(), {
            init : function() {
                this.fixPoint = {
                    origin : {vertical:"bottom" , horizontal:"right"},
                    menu : {vertical:"top" , horizontal:"left"}
                }
            },
            /**
             * Only show the bubble if and only if this._iicBubble is null.
             * We only want one bubble up at a time
             */
            show : function(component, originId, config) {
                this.fixPoint = {
                    origin : {vertical:"bottom" , horizontal:"right"},
                    menu : {vertical:"top" , horizontal:"left"}
                }
                if (!this._iicBubble) {
                    this._iicBubble = new _bubble(component, config);
                    SFPositionManager.addEventListener("positionFixed", this._iicBubble);
                    SFPositionManager.addEventListener("positionFixed", this);
                    this._iicBubble.addEventListener("popBubble", this);
                } else {
                    this.hide();
                    this._iicBubble.setComponent(component);
                }
                SFPositionManager.show(this._iicBubble, originId, this.fixPoint);
            },
			moveTo : function(movePos, originId) {
				SFPositionManager.moveTo(this._iicBubble.id, movePos, originId);
			},
            hide : function() {
                if (this._iicBubble) {
                    this._iicBubble._hideBubble();
                }
            },
            handleEvent : function(event) {
                switch (event.type) {
                    case "popBubble":
                        this._iicBubble.unregister();
                        delete this._iicBubble;
                        this.dispatch("hide");
                        break;
                    case "positionFixed":
                        this.dispatchEvent(event);
                        break;
                }
            }
        });
    })();
    SFInfoInContext.init();
}

