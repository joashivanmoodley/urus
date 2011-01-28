//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/JUICCommon.js
//! include /ui/uicore/css/components/sfdialog.css
/**
 * Generic Dialog for displaying an XI-style modal dialog.
 * Without innerWidth and -Height params, will default to a content
 * space of 740 X 540
 *
 * @param contentComponent  The JUIC component you want to display in the body of the dialog
 * @param buttonDefs        This is an array of JSON objects with the following structure
[
    {
        label : "Ok",
        eventName : "okEvent",
        btnType : "active"
    },
    {
        label : "Cancel",
        eventName : "hide",
        btnType : "active"
    }
]
 * @param dialogTitle       Title displayed at the top of the dialog
 * @param innerWidth        Width of the content area
 * @param innerHeight       Height of the content area
 *
 * The reason for setting the innerWidth and innerHeight is that this is a
 * more important spacial consideration than the box heightx and width, as
 * you will be placing other JUIC components in the dialog. You don't want
 * to play a guessing game with the heights.
 *
 */
function SFDialog(dialogTitle       /* string */,
                  contentComponent  /* JUIC Component */,
                  buttonDefs        /* array of JSON objects */,
                  innerWidth        /* integer */,
                  innerHeight       /* integer */) {
    this.register();

    assert(typeof contentComponent != "undefined","[SFDialog] : Content component required")
    this.setComponent(contentComponent);

    if (typeof dialogTitle != "undefined") this.setDialogTitle(dialogTitle);

    assert(buttonDefs && typeof buttonDefs == 'object', "[SFDialog] : You must provide and array of button definitions");

    
    //valids if width or height are passed int that they are a number.
    assert(!innerWidth || typeof innerWidth == 'number', "[SFDialog] : innerWidth parameter must be a number.");
    assert(!innerHeight || typeof innerHeight == 'number', "[SFDialog] : innerHeight parameter must be a number.");
    
    this._innerWidth = innerWidth||740;
    this._innerHeight = innerHeight||540;
    this._preventClose = false;

    this._buttons = [];
    this._setButtons(buttonDefs);
}

SFDialog.prototype = (function() {
    return set(new Component(), {
        renderHtml : function(h) {
            h.push("<div class=\"sfDlg\" id=\"" + this.id + "\" style=\"position:relative;\">");
            h.push("<div id=\"" + this.id + "_underlay\" style=\"width:" + this._innerWidth + "px;height:" + (this._innerHeight + 70) + "px;\" class=\"underLay\"></div>");
            h.push("<div class=\"sfDlgCntr\" style=\"width:" + this._innerWidth + "px;\">");
            h.push("<div class=\"hdr\"><div class=\"hdrText\" id=\"",this.id,"_dialogTitle\">" + escapeHTML(this._dialogTitle) + "</div></div>");
            h.push("<div id=\"" + this.id + "_body\" class=\"body\" style=\"height:" + this._innerHeight + "px;\"><div id=\"" + this.id + "_innerBody\" class=\"innerBdy\">");
            if (this._contentComponent) this._contentComponent.renderHtml(h);
            h.push("</div></div>");
            h.push("<div class=\"ftr\"><div class=\"button_row\"><div class=\"right\" id=\"dialog_btns"+this.id+"\">");
            //Render the buttons
            if (this._buttons) {
                for (var idx=0,len=this._buttons.length;idx<len;++idx) {
                    this._buttons[idx].renderHtml(h);
                }
            }
            h.push("</div></div></div>");
            h.push("<span id=\"dlg_close_x\" onclick=\"" + this.fireCode("_cancel") + "\" class=\"close-x\"></span>");
            h.push("</div></div>");
        },
        cleanup : function(){
            for ( var _buttonIndex = 0, _buttonLength = this._buttons.length; _buttonIndex < _buttonLength; _buttonIndex++) {
                this._buttons[_buttonIndex].unregister();
            }
            this.unregister()
        },
        setNewButtons: function(buttonDefs) {
            this._buttons.length = 0;
            this._setButtons(buttonDefs);
            if ($("dialog_btns"+this.id)) {
                var html = [];
                if (this._buttons) {
                    for (var idx=0,len=this._buttons.length;idx<len;++idx) {
                        this._buttons[idx].renderHtml(html);
                    }
                }
                $("dialog_btns"+this.id).innerHTML = html.join("");
            }
        },
        _setButtons : function(buttonDefs) {
            this._buttonDefs = buttonDefs;
            var btns = this._buttonDefs;
            for (var idx=0,len=btns.length;idx<len;++idx) {
                var btnDef = btns[idx];
                var btn = new SFCommandButton(btnDef.label,btnDef.active, btnDef.enabled);
                btn.setActionCommand(btnDef.eventName);
                btn.addEventListener('action', this);
                this._buttons.push(btn);
            }
        },
        setDialogTitle : function(dialogTitle) {
            this._dialogTitle = dialogTitle;
            var titleDiv = $(this.id + "_dialogTitle");
            if (titleDiv) {
                titleDiv.innerHTML = escapeHTML(dialogTitle);
            }
        },
        setInnerHeight : function(height) {
            var body = $(this.id + "_body");
            this._innerHeight = height;
            if (typeof body != "undefined") {
                $(this.id + "_underlay").style.height = (height + 70) + "px";
                body.style.height = height + "px";
            }
        },
        getInnerHeight : function() {
        	var body = $(this.id + "_body");
            if (typeof body != "undefined") {
                return body.offsetHeight;
            }
            return -1;
        },
        setComponent : function(component) {
            this._contentComponent = component;
            if ($(this.id + "_body")) component.render(this.id + "_innerBody");
        },
        _cancel : function() {
            this.close();
        },
        handleEvent : function(evt) {
          if (evt.type == 'action') {
            if (evt.actionCommand == "hide") {
            	var self = this;
                setTimeout(function(){ self.close()},0)
            }
            this.dispatchEvent(evt);
          }
        },
        //The following are convenience methods. If a button has a disable function
        //(which it probably should), then disable the button.
        disableButtons : function() {
            for (var idx=0,len=this._buttons.length;idx<len;++idx) {
                if (this._buttons[idx].isEnabled())
                    this._buttons[idx].setEnabled(false);
            }
        },
        enableButtons : function() {
            for (var idx=0,len=this._buttons.length;idx<len;++idx) {
                if (!this._buttons[idx].isEnabled())
                    this._buttons[idx].setEnabled(true);
            }
        },
        //Disable a single button
        disableButton : function(buttonIndex) {
            this._buttons[buttonIndex].setEnabled(false);
            this.dispatch("buttonsDisabled");
        },
        //Enable a single button
        enableButton : function(buttonIndex) {
            this._buttons[buttonIndex].setEnabled(true);
            this.dispatch("buttonsEnabled");
        },
        isButtonEnabled : function(buttonIndex) {
          return (buttonIndex >= 0 && buttonIndex < this._buttons.length) ? this._buttons[buttonIndex].isEnabled() : false;
        },
        //Set a button's label
        setButtonLabel : function(buttonIndex, label) {
            this._buttons[buttonIndex].setLabel(label)
        },
        //Set a button's action command
        setButtonActionCommand : function(buttonIndex, actionCommand) {
            this._buttons[buttonIndex].setActionCommand(actionCommand);
        },
        setButtonVisible : function(buttonIndex, visible) {
            this._buttons[buttonIndex].setVisible(visible);
        },
        //Set to prevent closure of the dialog
        setPreventCloseState : function(prevent) {
            this._preventClose = prevent;
        },
        getPreventCloseState : function() {
            return this._preventClose;
        },
        //Can be called externally to dynamically close the dialog without
        //pressing a button.
        close : function() {
            if (!this._preventClose) {
                this.dispatch("action", { actionCommand : "hide" });
                this.dispatch("hide");
            } else {
                this.dispatch("action", {actionCommand : "hideRequest"});
            }
        }
    });
})();