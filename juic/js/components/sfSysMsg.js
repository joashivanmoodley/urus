//! include /ui/juic/js/core/component.js
//! include /ui/static/css/components/sfSysMsg.css

/**
 *
 * This simple component will display system message as specified in:
 * http://ui/awong/bento/snippets_sysmsg.html. You simply have to pass in the type of message
 * (see param list), The system message, and the detail text at instantiation.
 * You can also change the message type and text at any time by using setValue.
 *
 * @param msgType Possible values : error, info, confirm, alert.
 * Refer to: http://ui/awong/bento/snippets_sysmsg.html
 *
 * @param sysMsg This is the system message that will be in bold
 * @param detailMsg This is the detail message
 */
function SFSysMsg(msgType,  /* string Possible values : error, info, confirm, alert. */
                  sysMsg,   /* string */
                  detailMsg /* string */) {
    this.register();
    this.setMessage(msgType, sysMsg, detailMsg);
}

SFSysMsg.prototype = (function() {
    var _msgTypes = {};
    _msgTypes["error"] = "error";
    _msgTypes["info"] = "info";
    _msgTypes["confirm"] = "confirm";
    _msgTypes["alert"] = "alert";

    return set(new Component(), {
        setMessage : function(msgType, sysMsg, detailMsg) {
            assert(_msgTypes[msgType],"[SFSysMsg] Invalid message type. Please pass either: error, info, confirm, or alert");
            assert(sysMsg,"At a minimum, you need to supply the system (bolded) message.");
            this._msgType = _msgTypes[msgType];
            this._sysMsg = sysMsg;
            this._detailMsg = (detailMsg) ? detailMsg : "";
            //Need to check if message box is already rendered.
            //If so, then set the contents.
            var msgBox = $(this.id + "_msg");
            if (msgBox && typeof msgBox != "undefined") {
                this.setMessageType(this._msgType);
                this.setSystemMessage(this._sysMsg);
                this.setDetailMessage(this._detailMsg);
            }
        },
        setMessageType : function(msgType) {
            this._msgType = _msgTypes[msgType];
            var msgBox = $(this.id + "_msg");
            if (msgBox && typeof msgBox != "undefined")
                msgBox.className = "round sysmsg " + this._msgType;
        },
        setSystemMessage : function(systemMsg) {
            this._sysMsg = systemMsg;
            var sysMsg = $(this.id + "_sysMsg");
            if (sysMsg && typeof sysMsg != "undefined")
                sysMsg.innerHTML = systemMsg;
        },
        setDetailMessage : function(detailMsg) {
            this._detailMsg = detailMsg;
            var dtlMsg = $(this.id + "_detailMsg");
            if (dtlMsg && typeof dtlMsg != "undefined")
                dtlMsg.innerHTML = detailMsg;
        },
        getMessageType : function() {
            return this._msgType;
        },
        getSystemMessage : function() {
            return this._sysMsg;
        },
        getDetailMessage : function() {
            return this._detailMsg;
        },
        renderHtml : function(h) {
        h.push( "<div id=\"" + this.id + "_msg\" class=\"round sysmsg " + this._msgType + "\">" +
                "<span class=\"cnrt\"><span class=\"cnrl\">&nbsp;</span></span><dl><dd class=\"img\">&nbsp;</dd>" +
                "<dd class=\"msg\"><strong><span id=\"" + this.id + "_sysMsg\">" + this._sysMsg + "</span></strong>" +
                "<div id=\"" + this.id + "_detailMsg\">" + this._detailMsg + "</div></dd></dl>" +
                "<span class=\"cnrb\"><span class=\"cnrl\">&nbsp;</span></span></div>");
        }
    });
})();
