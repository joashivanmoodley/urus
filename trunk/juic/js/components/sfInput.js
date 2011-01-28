/**
 * Simple and straight-forward form input field. If you want something more sophisticated, then use
 * SFTextField
 * @param value
 * @param fieldName
 * @param config
 */
function SFInput(fieldName, value, config) {
    this.register();
    this._enabled = true;
    if (typeof config != "undefined") {
        this._config = config;
        if (this._config.width) this._width = this._config.width;
        if (this._config.maxLength) this._maxLength = this._config.maxLength;
        if (this._config.captureKeypress) this._captureKeypress = this._config.captureKeypress;
    }

    this._fieldName = (typeof fieldName != "undefined") ? fieldName : this.id;
    
    if (typeof value != "undefined")
        this.setValue(value);
    else
        this.setValue("");
}

SFInput.prototype = (function() {
    return set(new Component(), {
    	setEnabled : function(state){
            this._enabled = state;

            var input = $(this.id);
            if (input)  $(this.id).disabled = !state;
		},
        renderHtml : function(h) {
		    var event;
            h.push("<input ");
            if (!this._enabled) h.push(' disabled="true" ');
            h.push("type=\"text\"  id=\"" , this.id , "\" name=\"", this._fieldName, "\" value=\"", escapeHTML(this.getValue()) ,"\" "
                    ,"onchange=\"", this.fireCode("_change"),"\" "
                    ,"onfocus=\"", this.fireCode("_focus") , "\" "
                    ,"onblur=\"", this.fireCode("_blur") , "\"");
            if (this._width) {
                h.push(" style=\"width:", this._width, "px;\"");
            }
            if (this._maxLength) {
                h.push(" maxlength=\"", this._maxLength,"\"");
            }
            if (this._captureKeypress) {
                h.push(" onkeypress=\"", this.fireCode("_keypress", event),"\" ");
            }
            h.push(" />");
        },
        _change: function() {
            this.setValue($(this.id).value);
        },
        _focus : function() {
            this.dispatch("action", {actionCommand : "focus"});
        },
        _blur : function() {
            this.dispatch("action", {actionCommand : "blur"});
        },
        _keypress : function(DOMEvent) {
            var keyCode = DOMEvent.which || window.event.keyCode;
            this.dispatch("action", {actionCommand : "keypress", actionData : keyCode})
            this._change();
        },
        getName : function() {
            if (this._fieldName) return this._fieldName;
        },
        setValue : function(value) {
            var oldValue = this._value;
            this._value = (value) ? value : "";
            var fld = $(this.id);
            if (fld) fld.value = escapeHTML(this._value);
            this.dispatch("change", {
                "fieldName" : this._fieldName,
                "oldValue" : oldValue,
                "newValue" : this._value
            });
        },
        getValue : function() {
            return this._value;
        }
    });
})();
