//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sf-select-menu.js
//! include /ui/juic/js/components/SFTextField.js
//! include /ui/juic/js/components/sfInput.js
//! include /ui/juic/js/components/sfCheckbox.js

/**
 * This is a collection of form element components. Some are
 */


/**
 * This is a simple file input field component
 * @param fldNum - If there will be multiple files to be uploaded, you can pass an optional integer representing the
 *                 field number. This will be added as a suffix to the "fileData" string.
 */
function SFFileInput(fldNum, cssClass) {
    this.register();
    this._fldName = (fldNum) ? "fileData" + fldNum : "fileData1";
    if (cssClass) this._cssClass = cssClass;
}

SFFileInput.prototype = (function() {
    return set(new Component(), {
    	setEnabled : function(state){
    		$(this.id).disabled = !state
    	},
        renderHtml : function(h) {
            h.push("<input type=\"file\" " + ((this._cssClass) ? "class=\"" + this._cssClass + "\"" : "")
                                           + " id=\"" + this.id + "\" name=\"" + this._fldName + "\"/>");
        },
        getValue : function(){
        	if($(this.id)){
        		return $(this.id).value;
        	}
        	return "";
        }
    });
})();

/**
 * Single select box. Pass in value/key JSON object, and it will create a select element.
 *
 * @param value - the selected value
 * @param optionList - array of JSON value/key pairs for select options
 * @param name - name parameter value
 */
function SFSingleSelect(value /*string*/, optionList /*array*/, name /*string*/) {
  this.register();
  this._value = value;
  this._optionList = optionList ? optionList : [];
  this._name = name;

  this.setEnabled(true);
}

SFSingleSelect.prototype = (function() {
  return set(new Component(), {

    renderHtml : function(h) {
      h.push('<select id="' + this.id + '" onchange="' + this.fireCode("_onChange") + '"');

      if (this._name)
        h.push(' name="' + this._name + '"');

      if (!this._enabled)
        h.push(' disabled="true"');
      
      h.push('>');

      for (var idx = 0, len = this._optionList.length; idx < len; ++idx) {
        h.push('<option value="' + this._optionList[idx].value + '"');
        if (this._value == this._optionList[idx].value)
          h.push('selected');
        h.push('>');
        h.push(escapeHTML(this._optionList[idx].key));
        h.push('</option>');
      }

      h.push('</select>');
    },

    _onChange : function() {
        this.dispatch('change', { newValue: $(this.id).options[$(this.id).options.selectedIndex].value });
    },
                                                     
    getValue: function() {
      if ($(this.id))
        return $(this.id).options[$(this.id).options.selectedIndex].value;
      else
        return this._optionList ? this._optionList[0].value : undefined;
    },

    setValue: function(value) {
      this._value = value;
      
      var me = $(this.id);

      if (me) {
        for (var idx = 0; idx < me.options.length; idx++) {
          if (me.options[idx].value == value) {
            me.options[idx].selected=true;
            break;
          }
        }
      }
    },

    setEnabled: function(enabled) {
      this._enabled = enabled;
      
      if ($(this.id))
        $(this.id).disabled = !enabled;
    },

    setSelectedIndex : function(index) {
      assert(index >= 0 && index < this._optionList.length, 'SFSingleSelect.setSelectedIndex(): Index out of bounds');

      if ($(this.id)) {
        $(this.id).options[index].selected=true;
        this._value = $(this.id).options[index].value;
      }
    },

    setSelectedOption : function(value) {
      this.setValue(value);
    },
    
    getSelectedIndex : function() {
      if ($(this.id))
        return $(this.id).options.selectedIndex;  
    },

    getSelectedText: function() {
       if ($(this.id))
        return $(this.id).options[this.getSelectedIndex()].text;
       else return "";
    },

    setOptions : function (newOptions) {
      this._optionList = newOptions;

      if ($(this.id)) {
        var me = $(this.id);
        me.innerHTML = '';

        for (var idx = 0; idx < newOptions.length; idx++)
          me.options[idx] = new Option(newOptions[idx].key, newOptions[idx].value);
      }
    },

    addOption : function(option) {
      if ($(this.id))
        $(this.id).options[$(this.id).options.length] = new Option(option.key, option.value);
    },

    removeOption: function (value) {
      var me = $(this.id);

      if (me) {
        for (var idx = 0; idx < me.options.length; idx++) {
          if (me.options[idx].value == value) {
            this.removeOptionAtIndex(idx);
            break;
          }
        }
      }
    },
    
    removeOptionAtIndex : function(index) {
      if ($(this.id) && (index >= 0 && index < $(this.id).options.length))
        $(this.id).removeChild($(this.id).options[index]);
    }
  });
})();