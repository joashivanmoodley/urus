function SFCheckBox(checked, value, label, changeCommand, name) {
  this.register();
  this._checked = checked;
  this._enabled = true;

  if (name) this._name = name;
  if (value) this._value = value;
  if (label) this._label = label;
  if (changeCommand) this._changeCommand = changeCommand;
}

SFCheckBox.prototype = (function() {
  return set(new Component(), {
    renderHtml : function(h) {
      h.push('<input type="checkbox" ',
                    'id="', this.id, '" ',
                    (this._checked ? "checked " : " "),
                    (!this._enabled ? 'disabled="disabled" ' : ''), '" ');

      if (this._name)
             h.push('name="', this._name, '" ');

      if (this._value)
             h.push('value="', this._value, '"');

             h.push('onclick="' + this.fireCode('_click') + '"/>');

      if (typeof this._label != "undefined")
        h.push('&nbsp;<label for="' + this.id + '">',
                 '<span id="lbl', this.id , '" class="', !this._enabled ? 'readonly' : '' , '">', escapeHTML(this._label), '</span>',
               '</label>');
    },

    setChecked: function(checked) {
      this._checked = checked;

      if ($(this.id))
        $(this.id).checked = checked;
    },

    isChecked: function() {
      return  ($(this.id) && $(this.id).checked);
    },

    setValue : function(value) {
      this._value = value;

      if ($(this.id))
        $(this.id).value = this._value;
    },

    getValue : function() {
      return this._value;
    },

    setChangeCommand: function(changeCommand) {
      this._changeCommand = changeCommand;
    },

    setEnabled: function(enabled) {
      this._enabled = enabled;

      var cb = $(this.id);
      if (cb)  cb.disabled = !enabled;

      if (!enabled && typeof this._label != "undefined" && $('lbl' + this.id))
        $('lbl' + this.id).className = 'readonly';
      else
        if ($('lbl' + this.id))
          $('lbl' + this.id).className = '';
    },

    isEnabled : function() {
      return this._enabled;
    },

    setLabel: function(label) {
      this._label = label;

      if ($('lbl' + this.id))
        $('lbl' + this.id).innerHTML = escapeHTML(this._label);
    },

    setName : function(name) {
      this._name = name;

      if ($(this.id))
        $(this.id).name = this._name;
    },

    getName : function() {
      return this._name;
    },

    _click: function() {
      this.dispatch("change", {checked:$(this.id).checked, changeCommand : this._changeCommand } );
    }
  });
})();
