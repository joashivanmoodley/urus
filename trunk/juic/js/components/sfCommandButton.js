/**
 * This component is specific to modal dlg, but can probably be used elsewhere.
 * It creates an XI-styled modal dialog button
 *
 * @param label   label of the button (e. g. "Ok", "Cancel", etc)
 * @param active  true if displaying as "active" button; false otherwise
 * @param enabled  true if displaying as enabled button; false otherwise
 */
function SFCommandButton(label /* string */,
                         active /* boolean */,
                         enabled /* boolean */) {
    assert(label, "SFCommandButton: label argument is required.");

    this.register();
    this._label = label;

    if (active == undefined) this.setActive();  //not active
    else                     this.setActive(active);

  // if present this will override the active argument value
    if (enabled == undefined) this.setEnabled(true);
    else                      this.setEnabled(enabled);
    this._visible = true;
}

SFCommandButton.prototype = (function() {

    function getClassName(me) {
      return me._enabled ? (me._active ? 'aquabtn active' : 'aquabtn') : 'aquabtn disabled';
    }

    return set(new Component(), {

        renderHtml : function(h) {
            var clsName = getClassName(this);

            var visibility = (!this._visible) ? " style='display:none;' " : "";

            h.push(
                    "<span id='btnWrapper_" + this.id + "' " + visibility + " class='" + clsName + this._getSize() + "'>" +
                    "<span>" +
                    "<button " + (!this._enabled ? "disabled=\"disabled\"" : "") +
                    " id='dlgButton_" + this.id + "'" +
                    " onclick='" + this.fireCode("_click") + "'" +
                    " type='button'>" + escapeHTML(this._label) + "</button>" +
                    "</span>" +
                    "</span>"
                    );
        },


        _click : function() {
            if (this._actionCommand)
                this.dispatch("action", { actionCommand : this._actionCommand });
            else
                this.dispatch("action");
        },

        _getSize: function() {
          switch (this._size) {
            case "sml":
                return " sml";
                break;
            case "mid":
                return " mid";
                break;
            default: return "";
          }
        },

        isEnabled : function() {
            return this._enabled;
        },

        isActive : function() {
            return this._active;
        },

        setLabel : function(label) {
            this._label = label;

            var btn = $("dlgButton_" + this.id);
            if (btn)  btn.innerHTML = escapeHTML(label);
        },

        setActionCommand : function(actionCommand) {
            this._actionCommand = actionCommand;
        },
        setEnabled : function(enabled) {
            this._enabled = enabled;

            var btn = $("dlgButton_" + this.id);
            if (btn)  btn.disabled = !enabled;

      //change css
            var clsName;

            if (enabled)
                clsName = this._prevButtonType ? this._prevButtonType : getClassName(this);
            else {
                this._prevButtonType = this._buttonType;
                clsName = "aquabtn disabled";
            }

            clsName = clsName + this._getSize();
            var btnWrapper = $("btnWrapper_" + this.id);
            if (btnWrapper) btnWrapper.className = clsName;
        },

        setSize: function(size) {
            this._size = size;
        },

        setActive : function(active) {
            this._active = active;

            if (active) this._buttonType = 'aquabtn active';
            else        this._buttonType = 'aquabtn';

            var btnWrapper = $("btnWrapper_" + this.id);
            if (btnWrapper) btnWrapper.className = this._buttonType;
        },
        setVisible : function(visible) {
            this._visible = visible;
            $("btnWrapper_" + this.id).style.display = (visible) ? "" : "none";
        }
    });
})();
