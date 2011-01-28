//! include /ui/juic/js/components/sfOverlayMgr.js
//! include /ui/uicore/css/components/sfLoading.css

//NOTE : You will need component.js as well, though overlay manager does include it.


/**
 * New loading indicator component. Instead of all the infrastructure that we had with the original,
 * all that is needed now is a component that spits out HTML.
 *
 * Usage:
 *     To show:
 *
 *     var loading = new SFLoading();
 *     SFOverlayMgr.showOverlay(loading, true);
 *
 *     To hide:
 *
 *     loadng.hide();
 *
 * To do: The Loading... text must be localized
 */
function SFLoading(initMsg,hexColor) {
    this.register();
    this._hexColor = (hexColor) ? hexColor : "#FFF";
    //if there's a different message you want to use, then
    //set the message to initMsg, otherwise just use the COMMON_loading message
    this.setMsg((initMsg) ? initMsg : jsSFMessages.COMMON_loading);
}

SFLoading.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<div id=\"" + this.id + "\" style=\"width:200px;height:40px;padding-top:4px;\" class=\"sfloadingIcon\">")
            h.push("<div style=\"color:" + this._hexColor + ";margin-top:6px;font:1.6em bold Trebuchet,Arial\">" + escapeHTML(this._msg) + "</div>");
            h.push("</div>");
        },
        setMsg : function(msg) {
            this._msg = msg;
        },
        //Call this from your calling application to hide this component and its associated overlay.
        hide : function() {
            this.dispatch("hide");
        }
    });
})();
