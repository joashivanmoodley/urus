//! include /ui/juic/js/core/component.js

// constructor for SelectOneMenu
// @param value :         the selected 'value' (ie, not label)
// @param itemOptions :   an array of objects, each object is an instance of {value,label}
// @param config :
//   - editable :      true or false
//   - styleClass :    the HTML element class
//   - required  :     true if this field is required.
//   - labelText:      label for error message
//   - hidden:         initially hidden
function SelectOneMenu(value, itemOptions, config) {
  this.register();
  this._itemOptions = itemOptions;
  this._valueLabelMap = [];
  this._disabledMap = [];
  this._editable = true; /*default value */
  this.setValue(value);
  for(var sConfig in config) {
     if (sConfig) {
        this["_" + sConfig] = config[sConfig];
     }
  }
}
SelectOneMenu.DISABLED = 'disabled';
SelectOneMenu.prototype = (function() {

  function createUndoEvent(comp, oldState, newState) {

    return {
      undo:function() {
        comp.deserializeState(oldState);
      },

      redo:function() {
        comp.deserializeState(newState);
      }
    };
  }

  function _highlight(me, bool) {
    if (me.isShowModified() && me.id) {
      if (bool) {
        YAHOO.util.Dom.addClass(me.id, 'unsaved');
      }
      else {
        YAHOO.util.Dom.removeClass(me.id, 'unsaved');
      }
    }
  }


  return set(new Component(), {

    setValue : function(value) {
      // 'this' is the component corresponding to the DOM select element.
      // Update its value.
      this.value = value;

      // Now retrieve the corresponding DOM element
      var selectInput = $(this.id);

      if (selectInput) {
        var selectedIndex=0;
        // figure out the index of the selected item.
        for (var idx=0; idx<this._itemOptions.length; idx++) {
          if (this._itemOptions[idx].value == this.value) {
            selectedIndex=idx;
            break;
          }
        }
        // Set the selected index.
        selectInput.selectedIndex = selectedIndex;
      }
    },

    // Update the item options
    setItemOptions: function(itemOptions) {
      this._itemOptions = itemOptions;  
    },

    getValue : function() {
      return $(this.id) ? $(this.id).value : this.value;
    },

    setLabel : function(value) {
      this._label = value;
    },

    getLabel : function() {
      return this._label;
    },

    // if an error occurs, use this DOM element Id to highlight the field
    getHighLightElemId : function() {
      return this.id;
    },

    renderHtml : function(h) {
      var disabled = this._editable? '' : 'disabled="disabled"';
      var styleClass = this._styleClass? this._styleClass : '';
      h.push('<select category="'+this.value+'"'+
                    ' id="'+this.id+'"'+
                    ' name="'+this.id+'"'+
                    ' '+disabled+
                    ' class="'+styleClass+'"' +
                    ' style="'+ (this._hidden ? 'display:none;" ' : '" ') +
                    ' onfocus='+this.fireCode('focus')+
                    ' onblur='+this.fireCode('blur')+
                    ' onchange='+this.fireCode('change')+'>');

      for(var index = 0; index < this._itemOptions.length; index++){
        var opt = this._itemOptions[index];
        var selected = (opt.value == this.value ? 'selected="selected"' : '');
        
        h.push('<option  value="',opt.value,'" ');
        //If the option is disabled render it disabled.
        if(opt.disabled){
        	
        	h.push(' class="disabled_option"');
        	this._disabledMap[opt.value] = SelectOneMenu.DISABLED;
        }
        
        h.push(selected, '>',opt.displayLabel,'</option>');
        this._valueLabelMap[opt.value] = opt.displayLabel;
        if(selected == 'selected') {
        	this.setLabel(opt.displayLabel);
        }
      }
      h.push('</select>');
      h.push("<div id='" + this.id+ "_error' style='display:none; color: rgb(255, 0, 0);'></div>");
    },

    focus : function() {
      var input = $(this.id);
      this.oldValue = input.value;
    },

    blur : function() {
      // inform the observers that the component value has changed.
      var select = $(this.id);
      var newValue = select.value;
      // If not valid, set focus back to control.
      if(!this.isValid(newValue)) {
      	var error =  $(this.id + "_error");
        error.style.display = '';
        error.innerHTML = this.appendErrorIcon(this.getLastValidationError(this._labelText));
      }
      this.dispatch("blur", {});

    },

    change : function() {
      var select = $(this.id);
      var newValue = select.value;
      
      // save the old state for the purpose of the undo manager.
      // Since the component and the corresponding DOM element are not
      // in sync yet (the DOM element contains the new selection whereas
      // the js component still contains the old selection), create the
      // old state based on the state of the component not the DOM element,
      // ie, do not call the serializeState() method.
      var oldState = {value:this.value, modified:this.isModified(), label:this.getLabel()};

      
      // Check if option is disabled
      if(!this._disabledMap[newValue]){
	      
	      if (newValue != this.oldValue ) {
	
	          // Update the component selection value to be in sync with the
	          // corresponding DOM element selection
	          this.value = newValue;
	          if (newValue != "") this.setLabel(this._valueLabelMap[newValue]);
	          else this.setLabel('['+jsSFMessages.COMMON_Click_to_edit+']');
	          // Then update the modified flag
	          if (!this.isModified()) {
	            this.setModified(true);
	          }
	
	          this.dispatch("change", {oldValue:this.oldValue, newValue:newValue,
	                                   newLabel:this.getLabel()});
	
	          // retrieve the new state
	          var newState = this.serializeState();
	          // register this change event with the undo manager
	          undoManager.add(createUndoEvent(this, oldState, newState));
	
	
	        // Dispatch the change value regardless of its validity
	      	if(this.isValid(newValue)) {
	          var error =  $(this.id + "_error");
	          error.style.display = 'none';
	
	      	}
	      	else {
	      	  var error =  $(this.id + "_error");
	      	  error.style.display = '';
	          error.innerHTML = this.appendErrorIcon(this.getLastValidationError(this._labelText));
	
	      	}
	     } 
	  }else {
		this.deserializeState(oldState);
	  }
	      
	   delete this.oldValue;
    },

    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
    },

    /**
     * The SelectOneMenu state consists of the value in the select element and the modified flag.
     * Therefore, if the state needs to be changed, the caller must indicate the new
     * value for the input field as well as the modified flag.
     *
     * @param newState  an object representing the input element value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setModified(newState.modified);
      this.setLabel(newState.label);
    },

    /**
     * @return an object representing the SelectOneMenu's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this.getValue(), modified:this.isModified(),
              label:this.getLabel()};
    }
  });

})();
