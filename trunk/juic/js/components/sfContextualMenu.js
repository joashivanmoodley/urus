//! include /ui/juic/js/components/sfList.js
//! include /ui/juic/js/components/sfPositionManager.js
/**
 * This object creates a Contextual Menu (a drop down menu attached to a link or/and image anchor)
 * Please visit: http://ui/awong/bento/snippets_contextual_menu.html for more information
 * @param menuType: Type of Menu Icon  (optional)
 * @param menuLabel: Label of the anchor (optional)
 * At least one of the variables above should be declared.
 *
 * Event Handling: This menu will fire the event "positionFixed" when the menu is displayed.
 */

function SFContextualMenu(menuLabel, menuType , autoHide, focusId, clickShow) {
    assert(menuLabel || menuType, "Anchor Label or menu type should be declared.");
    this.register();
    this._label = menuLabel;
    this._anchorType = menuType;
    this._links = [];
    // If there is an anchor image then attach the menu to the anchor (most of the cases), if not attach the menu to the
    // label
    this._menu = new SFList();
    this._autoHide = autoHide ? autoHide : false;
    this._clickShow = clickShow ? clickShow : false;
    if (focusId) this._focusId = focusId;
    // This variable is used to prevent the duplicate menu creating
    this._isShown=false;
}

SFContextualMenu.prototype = (function() {
    return set(new Component(), {
        // Adds an item to the menu
        addMenuItem: function(menuItem) {
            if(this._autoHide){
                menuItem.addEventListener("mouseout", this);
                menuItem.addEventListener("mouseover", this);
            }
            this._links.push(menuItem);
            this._menu.add(menuItem);
        },
        // removes the item from the list menu
        removeMenuItem: function() {
            // TODO remove the event listeners
            this._menu.remove(menuItem);
        },
        // sets the state of the item to enabled or disabled
        setEnabled: function(menuItem, bool) {
            assert(menuItem.setEnabled, "Function setEnable does not exist for the object " + menuItem.id);
            menuItem.setEnabled(bool);
        },
        // sets the label of the contextual menu
        setLabel: function(label) {
            this._label = label;
            if($("label_" + this.id)){
                $("label_" + this.id).innerHTML = label
            }
        },
        // sets the type of the contextual menu anchor
        setAnchorType: function(type) {
            this._anchorType = type;
        },
        setMenuFocusPoint: function(point) {
          assert((point === "label" || point === "anchor"), "Only anchor and label are accepted");
          this._focusId = point + "_" + this.id;
        },
        // returns the type of the anchor
        _getAnchorType: function() {
            switch (this._anchorType) {
                case "arrowDown":
                    this._anchorType = "menu_arrow_blue_border";
                    break;
                case "gear":
                    this._anchorType = "menu_gear_arrow";
                    break;
            }
            return this._anchorType;
        },
        // hides the contextual menu
        hide : function() {
            this._isShown=false;
            this.selectedIndex = -1;
            var self = this;
            YAHOO.util.Event.removeListener(window.document, "click", self._hideCallbackFn);
            SFPositionManager.removeEventListener("positionFixed",self);
            this._positionInfo = null;
            this._menu.dispatch("hide");
            clearTimeout(this.hideTimeout);
            delete this.hideTimeout;
        },
        // callback function called to hide the contextual menu
        _hideCallbackFn : function(evt, obj) {
            try {
                if(obj && obj._isClickOutsideOfMenu(evt, obj) ) {
                	obj._clearTimeOuts();
                	obj.hide();
                }
            } catch(e) {};
        },
        _clearTimeOuts : function(){
        	if(this.hideTimeout) {
	        	clearTimeout(this.hideTimeout);
	            delete this.hideTimeout;
        	}
        	if(this._tid) {
	            clearTimeout(this._tid);
	            delete this._tid;
        	}
        },
        _hideTimer:function(isShow) {
            if (isShow) {
                var self = this;
                this._clearTimeOuts();
                this.hideTimeout = setTimeout(function() {
                    self.hide()
                }, 1000);
            }
            else
            {
                clearTimeout(this.hideTimeout);
                delete this.hideTimeout;
            }
        },
        // function called to show the contextual menu
        _openSelector: function(openMenuOnClick) {
            if(this._isShown){
                return;
            }
            this._isShown=true;
            this._clearTimeOuts();
            var self = this;
            var openDelay = 200;
            if(openMenuOnClick) {
                openDelay = 0;
            }
            this._tid = setTimeout(function() {
                SFPositionManager.addEventListener("positionFixed",self);
                SFPositionManager.show(self._menu, (self._focusId ? self._focusId : self._label ? "label_" + self.id : "anchor_" + self.id));
                setTimeout(function() {
                    YAHOO.util.Event.addListener(window.document, 'click', self._hideCallbackFn, self);
                }, 500);
            }, openDelay);
            return false;
        },
        _stopShowingSelector: function() {
            this._hideTimer(true)
        },
        renderHtml: function(h) {
            h.push("<span id=\"" , this.id , "\" style=\"white-space: nowrap;\">");
            if (this._label) {
                h.push("<a id=\"label_" , this.id , "\" href=\"javascript:void(0)\" title=\"" + Util.escapeHTML(this._label) + "\" ");
                if(!this._clickShow) {
                    h.push("onmouseover=\"" + this.fireCode("_openSelector") + "\" ");
                }
                if(this._autoHide){ h.push("onmouseout=\"" + this.fireCode("_stopShowingSelector") + "\" "); }
                h.push("onclick=\"" + this.fireCode("_openSelector", true) + "return false;\">" +
                       Util.escapeHTML(this._label) + "</a>");
            }
            h.push("<a id=\"anchor_" + this.id + "\" class=\"" + this._getAnchorType() + "\" ");
            if(!this._clickShow) {
                h.push("onmouseover=\"" + this.fireCode("_openSelector") + "\" ");
            }
            if(this._autoHide){ h.push("onmouseout=\"" + this.fireCode("_stopShowingSelector") + "\" "); }
            h.push("onclick=\"" + this.fireCode("_openSelector", true) + "; return false;\">&nbsp;</a></span>");
        },
        handleEvent: function(evt) {
          switch (evt.type) {
            case "mouseout":
                this._hideTimer(true);
                break;
            case "mouseover":
                this._hideTimer(false);
                break;
            case "positionFixed":
                if (this._isMatchingOverlay(evt)) {
                    this._positionInfo = evt.positionInfo;
			  	    this.dispatchEvent(evt);
			    }
                break;
            default:
		  }
        },
        cleanup: function() {
            for (var idx = 0,len = this._links.length; idx < len; idx++) {
                this._links[idx].cleanup();
            }
            this.unregister();
        },
        _isMatchingOverlay: function(evt) {
            var menu = $(evt.positionInfo.overlay.overlayId);
            if(menu) {
                var menuChildren = menu.childNodes;
                for(var index=0; index<menuChildren.length;index++) {
                    if(menuChildren[index].id === this._menu.id) {
                        return true;
                    }
                }
            }
            return false;
        },
        _isClickOutsideOfMenu: function(nativeEvent, menuObject) {
            if(nativeEvent && menuObject) {
                if(menuObject._positionInfo && menuObject._positionInfo.overlay) {
                    var topMin = menuObject._positionInfo.overlay.top;
                    var topMax = topMin + menuObject._positionInfo.overlay.height;
                    var leftMin = menuObject._positionInfo.overlay.left;
                    var leftMax = leftMin + menuObject._positionInfo.overlay.width;
                    if((topMin <= nativeEvent.y && nativeEvent.y <= topMax) &&
                       (leftMin <= nativeEvent.x && nativeEvent.x <= leftMax)) {
                        return false;
                    }
                }
            }
            return true;
        }

    });
})();
