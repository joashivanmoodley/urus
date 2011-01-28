
/**
 * Very simple link component to display a no-frills anchor tag that dispatches an action. Unlike other components
 * that implement a setActionCommand, rendering actionCommand optional, actionCommand in this case is required because
 * we're assuming you want to take action on click.
 *
 * Note that there is no mouseover or mouseout. We'll let the CSS deal with it.
 * @param label
 * @param actionCommand
 * @param actionData
 */
function SFSimpleLink(label, actionCommand, actionData) {
    this.register();
    assert(label, "[SFSimpleLink] You must provide a label");
    assert(actionCommand, "[SFSimpleLink] This component requires an actionCommand");
    this.setLabel(label);
    this.setEnabled(true);
    this._actionCommand = actionCommand;
    this._actionData = actionData;
}

SFSimpleLink.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<span id=\"", this.id, "\">");
	    this._renderLinkContent(h);
	    h.push("</span>");
        },
        _renderLinkContent : function(h) {
           if(this._enabled) {
                h.push("<a id=\"" , this.id , "_link\" href=\"javascript:void(0);\" class=\"link\"");
                h.push(" onclick=\"", this.fireCode("_click"), ";return false;\"");
                h.push(">", escapeHTML(this._label), "</a>");
           }else{
                h.push("<span class=\"disabledLink\">", escapeHTML(this._label), "</span>");
           }
        },
        _click : function() {
            if (this._enabled) {
                this.dispatch("action", {
                    actionCommand : this._actionCommand,
                    actionData : this._actionData
                });
            }
        },
        setEnabled : function(enabled) {
            if (this._enabled != enabled) {
                this._enabled = enabled;
                var linkSpan = $(this.id);
                if (linkSpan) {
                    //refresh the rendering here
                    var h = [];
        	    this._renderLinkContent(h);
                    $(this.id).innerHTML = h.join("");
                }
            }
        },
        getEnabled : function() {
            return this._enabled;
        },
        setLabel : function(label) {
            this._label = label;
            var link = $(this.id + "_link");
            if (link) {
                link.innerHTML = label;
            }
        },
        getLabel : function() {
            return this._label;
        }
    });
})();
