//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/common.js
//! include /ui/uicore/css/components/sfTableHeader.css

/**
 * XI-style Collapsible Table Header Component
 *
 * @param portletLabel      Label of the portlet
 * @param component         Component that will go into the content area
 * @param height            (optional) If you add a height, portlet will scroll
 * @param actionItemLeft    (optional)
 * @param actionItemRight
 */
function SFTableHeader(isCollapsible,   /*boolean*/
                       portletLabel,    /*string*/
                       component,       /*component*/
                       actionItems,     /* JSON object */
                       height           /*integer*/) {
    this.register();
    this._isCollapsible = isCollapsible;
    this._portletLabel = portletLabel;
    this._component = component;
    if (actionItems) this._actionItems = actionItems;
    this._open = true;
    if (height) this._contentHeight = height + "px";
}

SFTableHeader.prototype = (function() {
    return set(new Component(),{
        renderHtml : function(h) {
            h.push("<div id=\"portlet_" + this.id + "\" class=\"sfCollapse\">");
            h.push("<div class=\"topBar\">");
            if (this._isCollapsible)
                h.push("<div id=\"portlet_tbIcon_" + this.id + "\" class=\"topBar_icon_open\" onclick=\"" + this.fireCode("_expand") + "\"></div>");
            h.push("<div class=\"topBar_content\">");
            h.push("<span id=\"portlet_label_" + this.id + "\" class=\"topBar_label\"");
            if (this._isCollapsible)
                h.push("onclick=\"" + this.fireCode("_expand") + "\"");
            h.push(">" + escapeHTML(this._portletLabel) + "</span>");
            h.push("<span class=\"topBar_left\">&#160;</span>");
            if (this._actionItems && this._actionItems.actionItemLeft) {
                h.push("<span class=\"topBar_left\">");
                this._actionItems.actionItemLeft.renderHtml(h);
                h.push("</span>");
            }
            if (this._actionItems && this._actionItems.actionItemRight) {
                h.push("<span class=\"topBar_right\">");
                this._actionItems.actionItemRight.renderHtml(h);
                h.push("</span>");
            }
            h.push("</div>");
            h.push("<div class=\"clr\"></div>");
            h.push("</div>");
            if (this._contentHeight) {
                var hStr = " style=\"height:" + this._contentHeight + ";overflow:auto;\"";
            }
            h.push("<div id=\"portlet_content_" + this.id + "\" class=\"content\"" + hStr + ">");
            if (this._component) {
                this._component.renderHtml(h);
            }
            h.push("</div>");
            h.push("</div>");
        },
        setLabel : function(label) {
            this._portletLabel = label
            $("portlet_label_" + this.id).innerHTML = escapeHTML(this._portletLabel);
        },
        setComponent : function(component) {
            //Unregister the old component in the portlet
            if (this._component) {
                this._component.unregister();
            }
            this._component = component;
            this._component.render("portlet_content_" + this.id);
        },
        _expand : function() {
            var content = $("portlet_content_" + this.id);
            var icon = $("portlet_tbIcon_" + this.id);
            content.style.display = (this._open) ? "none" : "";
            icon.className = (this._open) ? "topBar_icon_close" : "topBar_icon_open";
            this._open = !this._open;
            this.dispatch("expandEvent",{openState: (this._open) ? "open" : "close"});
        }
    });
})();

