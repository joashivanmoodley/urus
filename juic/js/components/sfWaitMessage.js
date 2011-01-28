//! include /ui/juic/js/core/component.js

/**
 * Simple wait message component that displays a spinning arrow wait icon
 * and a message to the right. It is not positioned. It is meant to be just
 * dropped in somewhere. This is built to display only one message at a time.
 * It will not display anything if the $(this.id) element exists. This is to
 * avoid overlapping DOM id's.
 * @param msg
 */
function SFWaitMessage(msg) {
    this.register();
    this.setMessage(msg);
}

SFWaitMessage.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            if (this._message !== "") {
                h.push("<div id=\"",this.id,"\">",
                       this._getMessageContents(),
                       "</div>");
            }
        },
        _getMessageContents : function() {
             return "<img src=\""+IMAGES['/ui/uicore/img/icon_saving.gif']+"\" alt=\"\" style=\"float:left;margin-right:.25em;\"/>" +
                    "<div style=\"margin-left:18px;margin-top:-2px;color:#666;font-size:.9em;font-weight:bold;\">" + this._message + "</div>" +
                    "<div class=\"clear_all\">&#160;</div>"
        },
        setMessage : function(msg) {
            this._message = (msg != "undefined") ? msg : "";
        },
        /**
         * Helper method to display the message. This uses DOM calls and appends the child
         * to a destination container. You can use either render or show to display the message.
         * Note that render() will blow out any HTML that's in the container
         * @param id
         * @param msg
         * @param bAppend if true will append the child, if false will insert it before the first child.
         */
        show : function(id, msg, bAppend) {
            if (!$(this.id)) {
                var msgContainer = document.createElement("div");
                msgContainer.setAttribute("id", this.id);
                this.setMessage(msg);
                msgContainer.innerHTML = this._getMessageContents();
                var parentContainer = $(id);
                if (bAppend) {
                    parentContainer.appendChild(msgContainer);
                } else {
                    var firstChild = parentContainer.firstChild;
                    if (firstChild) {
                        parentContainer.insertBefore(msgContainer, firstChild);
                    } else {
                        parentContainer.appendChild(msgContainer);
                    }
                }
            }
        },
        /**
         * This will remove all the HTML of the component. Have to use DOM scripting
         * here because if there are other elements in the parent node, we
         * don't want them removed with an innerHTML = "" and we don't want the component's
         * container to remain.
         */
        clear : function() {
            var msgElem = $(this.id);
            if (msgElem) {
                var prnt = msgElem.parentNode || msgElem.parentElement;
                prnt.removeChild(msgElem);
            }
        }
    });
})();
