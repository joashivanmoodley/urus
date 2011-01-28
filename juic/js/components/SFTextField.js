//! include /ui/juic/js/core/component.js

/**
 * This is the superclass of all the objects needing to use form validation manager. This will enforce the objects to
 * have several methods necessary to do the validation.
 */
function SFInputField(){}

SFInputField.prototype = (function() {
    return set(new Component(), {
        showErrorMessage: function(arg) {
            assert(false, "ERROR: the subclasses must override showErrorMessage(): " + arg);
        },
        hideErrorMessage: function(arg) {
            assert(false, "ERROR: the subclasses must override hideErrorMessage(): " + arg);
        },
        getValue: function() {
            assert(false, "ERROR: the subclasses must override getValue(): ");
        }
    });
})();

/**
 * Renders an input field
 * @param value - text field value
 * @param config
 * 		size: text field size
 * 		show: whether to show, true by default
 * 		css: CSS to use for the input field
 * 		width: set the width
 * 		onkeypress: fires an event when an alphanumeric key is pressed
 * 		onkeydown: fires an event when a key is pressed
 * 		onfocus: fires an event when onfocus
 * 		onblur: fires an event when onblur
 * 		defaultValue: a default value to replace when user didn't enter anything and clear default when onfocus
 * @return text field
 */
function SFTextField(value, config) {
	this.register();
	this._config = config;
    this._show = true;
    this._enabled = true;
    if (this._config) {
    	this._size = this._config.size;
    	this._show = (this._config.show === undefined) ? true : this._config.show;
    	this._css = this._config.css;
        this._width = this._config.width;
        this._onkeypress = this._config.onkeypress;
        this._onkeydown = this._config.onkeydown;
        this._onfocus = this._config.onfocus;
        this._onblur = this._config.onblur;
        this._defaultValue = this._config.defaultValue;
        this._required = this._config.required;
        this._maxLength = this._config.maxLength;
        // Check to see if there is a boolean value assigned to permission. If the key is not present we will not need to
        // check permission for that field.
        this._permission = (typeof this._config.permission === "boolean" ? (this._config.permission) : true);
    }
    this.setValue(value);
}


SFTextField.prototype = (function() {
    return set(new SFInputField(), {
       setValue: function (value) {
         this._value = value;

         if ($(this.id))
           this.reRender();
       },
      setEnabled : function(enabled) {
        this._enabled = enabled;

        var tf = $(this.id + "_txtFld");
        if (tf)  tf.disabled = !enabled;
      },
       showErrorMessage: function (JSONarray) {
            var fieldObj = $(this.id);
            var elem = "";
            if ($(this.id+"_error")) {
                elem = $(this.id+"_error");
                elem.innerHTML = "";
            } else {
                elem=document.createElement('SPAN');
                elem.setAttribute("id",this.id+"_error");
                elem.style.color = "red";
            }
            for (var index=0,len=JSONarray.length;index<len;index++) {
                elem.innerHTML += "<br />" + JSONarray[index].msg + "<br />";
            }

            if (fieldObj.nextSibling) fieldObj.insertBefore(elem,fieldObj.nextSibling);
            else fieldObj.appendChild(elem);
        },
        hideErrorMessage: function(){
            // If error fixed remove the error span
            var errorSpan = $(this.id+"_error");
            if (errorSpan) errorSpan.parentNode.removeChild(errorSpan);
        },
       show: function() {
    	   this._show = true;
    	   this.reRender();
       },
       hide: function() {
    	   this._show = false;
    	   this.reRender();
       },
       reRender: function() {
    	   var h = [];
    	   this._renderTextField(h);
    	   $(this.id).innerHTML = h.join("");
       },
       renderHtml: function(h) {
           h.push('<div id="' + this.id + '">');
           this._renderTextField(h);
           h.push('</div>');
       },
       _renderTextField: function(h) {
    	   h.push('<input ');
           if (this._permission === false || !this._enabled) h.push('disabled="true" ');
           h.push('id="' + this.id + '_txtFld" value="' + escapeHTML(this._value) + '"');
    	   if (this._css) {
    		   h.push(' class="' + this._css + '"');
    	   }

         if (this._config && this._config.type)
           h.push(' type="' + this._config.type + '"');
         else
           h.push(' type="text"');

           h.push(' onchange="' + this.fireCode('_handleChange') + '"');

           if (this._maxLength) {
        	   h.push(' maxlength="' + this._maxLength + '"')
           }
           if (this._size) {
        	   h.push(' size="' + this._size + '"')
           }
           if (this._width || !this._show) {
              h.push(' style="');

              if (this._width) h.push('width:', this._width, ';');
              if (!this._show) h.push('display:none;');

              h.push('"');
           }
           if (this._onkeypress && (this._permission === true)) {
        	   h.push(" onkeypress=\"var key=event.keyCode;fire('" + this.id + "', 'handleOnkeypress', key);\"");
           }
           if (this._onkeydown && (this._permission === true)) {
        	   h.push(" onkeydown=\"var key=event.keyCode;fire('" + this.id + "', 'handleOnkeydown', key);\"");
           }
           if (this._permission === true) h.push(' onfocus="' + this.fireCode('_handleOnFocus') + 'return false;"');
           if (this._permission === true) h.push(' onblur="' + this.fireCode('_handleOnBlur') + 'return false;"');
           h.push('/>');
           if (this._required) h.push('<span class="refer_a">&#42;</span>');
       },
       _handleChange: function() {
         this.dispatch("change",{newValue:this.getValue()});
       },
       getValue: function() {
    	   this._value = $(this.id+'_txtFld').value;
           return this._value;
       },
       focus: function() {
    	   $(this.id+'_txtFld').focus();
       },
       handleOnkeypress: function(keyCode) {
    	   this.dispatch(this._onkeypress, {keyCode:keyCode});
       },
       handleOnkeydown: function(keyCode) {
    	   this.dispatch(this._onkeydown, {keyCode:keyCode});
       },
       _handleOnFocus: function() {
    	   //if a default value is set, clear it when onfocus
    	   if (this._defaultValue) {
    		   if (this.getValue() === this._defaultValue) {
    			   this.setValue('');
    			   $(this.id+'_txtFld').value = '';
    		   }
    	   }
    	   //optional onfocus event
    	   if (this._onfocus) {
    		   this.dispatch(this._onfocus);
    	   }
       },
       _handleOnBlur: function() {
    	   //if a default value is set, set it when user didn't enter anything
    	   if (this._defaultValue) {
    		   if (this.getValue() === '') {
    			   this.setValue(this._defaultValue);
    			   //not calling Util.escapeHTML in this case assuming default value must be valid, not entered by user
    			   //this makes the matching feasible since encoding some charactars would cause the comparison to fail
    			   $(this.id+'_txtFld').value = this._defaultValue;
    		   }
    	   }
    	   //optional onblur event
    	   if (this._onblur) {
    		   this.dispatch(this._onblur);
    	   }
       },
       cleanup: function() {
    	   var ctrl = $(this.id);
    	   if (ctrl) {
    		   ctrl.innerHTML = "";
    	   }
    	   this.unregister();
       }
   });
})();