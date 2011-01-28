//! include /ui/uicore/js/Util.js
/**
 * Renders a text area
 *
 * @param value - value for the text area
 * @param config
 *         css - CSS for the wrapping div
 * @return
 */
function SFTextArea(value, config) {
    this.register();
    this._config = config;
    if (this._config) {
        this._css = this._config.css;

        if (this._config.rows) this._rows = this._config.rows;
        if (this._config.cols) this._cols = this._config.cols;
        this._maxLength = this._config.maxLength;
    }
    this.setValue(value);
}

SFTextArea.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
            this._value = value;
            var input = $(this.id + '_txtArea');
            if (input) {
                input.value = this._value;
            }
        },
        showErrorMessage: function (JSONarray) {
            var fieldObj = $(this.id);
            var elem = "";
            if ($(this.id + "_error")) {
                elem = $(this.id + "_error");
                elem.innerHTML = "";
            } else {
                elem = document.createElement('SPAN');
                elem.setAttribute("id", this.id + "_error");
                elem.style.color = "red";
            }
            for (var index = 0,len = JSONarray.length; index < len; index++) {
                elem.innerHTML += JSONarray[index].msg + "<br />";
            }

            if (fieldObj.nextSibling) fieldObj.insertBefore(elem, fieldObj.nextSibling);
            else fieldObj.appendChild(elem);
        },
        hideErrorMessage: function() {
            // If error fixed remove the error span
            var errorSpan = $(this.id + "_error");
            if (errorSpan) errorSpan.parentNode.removeChild(errorSpan);
        },
        reRender: function() {
            var h = [];
            this._renderTextArea(h);
            $(this.id).innerHTML = h.join("");
        },
        renderHtml: function(h) {
            h.push('<span id="' + this.id + '"');
            if (this._css) {
                h.push(' class="' + this._css + '"');
            }
            h.push('>');
            this._renderTextArea(h);
            h.push('</span>');
        },

        clear : function() {
            this._value = '';
            if ($(this.id + '_txtArea'))  $(this.id + '_txtArea').value = this._value;
        },

        focus : function() {
            if ($(this.id + '_txtArea'))  $(this.id + '_txtArea').focus();
        },

        setEnabled : function(bool) {
          if ($(this.id + 'textArea')) {
            $(this.id + 'textArea').disabled = !bool;
          }
        },
        
        setStyle : function(css) {
            this._css = css;
            $(this.id).className = css;
        },

        _renderTextArea: function(h) {
            h.push('<textarea id="' + this.id + '_txtArea" ',
                    'onblur="', this.fireCode('_blur'), '"',
                    'onfocus="', this.fireCode('_focus'), '"',
                    'onchange="', this.fireCode('_change'), '"');

            if (this._maxLength) {
                h.push(' onKeyDown="', this.fireCode('_cutMaxLength'), '"');
            }
            if (this._rows)
                h.push(' rows="', this._rows, '"');

            if (this._cols)
                h.push(' cols="', this._cols, '"');

            h.push('>');
            if (this._value) {
                h.push(Util.escapeHTML(this._value));
            }
            h.push('</textarea>');
        },
        getValue: function() {
            return this._value;
        },
        _cutMaxLength: function() {
            var This = this;
            setTimeout(function() {
                var textAreaValue = This.getValue();
                if (textAreaValue.length >= This._maxLength) {
                    This.setValue(textAreaValue.substring(0, This._maxLength));
                }
            }, 0);
            //            alert(this.getValue().length +"\n" + this._maxLenght)
            //            if( this.getValue().length > this._maxLenght)
        },
        _blur : function() {
            this._cutMaxLength();
            this.dispatch('action', {actionCommand: 'lostFocus'});
        },
        _focus : function() {
            this.dispatch('action', {actionCommand: 'focus'});
        },
        _change : function() {
            if ($(this.id) + '_txtArea') {
                this._value = $(this.id + '_txtArea').value;
            }
            this.dispatch('action', {actionCommand: 'change'});
        }

    });
})();
