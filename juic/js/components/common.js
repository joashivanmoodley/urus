//! include /ui/uicore/js/DateFormat.js

/************************************************************************************
 *
 * NOTE: None of these components have been certified as JUIC common components.
 * If you wish to use one of these, please speak with the component developer who
 * wrote it.
 *
 * THIS FILE WILL EVENTUALLY BE DEPRECATED!!!
 *
 ************************************************************************************/

function hasXSS(value) {
	return (
            (value.indexOf("<script") >= 0) ||
			(value.indexOf("<iframe") >= 0) ||
			(value.indexOf("/>") >= 0)
           );
}

/**
 * Removed from component.js
 */
function ComponentConsts() {
}

ComponentConsts.ISO8601DATEFORMAT = 'yyyy-MM-dd';

if (typeof jsSFMessages != "undefined") {
  var ISO8601Dateformatter = new DateFormat(ComponentConsts.ISO8601DATEFORMAT);
  var dateformatter = new DateFormat(jsSFMessages.COMMON_DateFormat);
}

/**
 * Utility class used to filter events
 */
function EventFilterUtil() {
}

/**
 * Filters carriage return event to avoid
 * default form submission behavior
 * Needs to be linked to the keypress event of text fields
 */
EventFilterUtil.catchCR = function ( evt ) {
	var keynum =   evt.keyCode || evt.charCode;
		// detect carriage return key
    if (keynum == 13) {
    	return false;
    }
}

/**
 * JUIC Component for creating an img tag
 * @param value: Source of the image
 * @param config:
 *      Possible values for the configuration:
 *      width: Width of the image
 *      height: height of the image
 *      cssClass: CSS class of the image
 */
function SFImage(value, config) {
    this.register();
    this.setValue(value);
    this._config = config;
}

SFImage.prototype = (function() {
     return set(new Component(), {
        setValue: function (value) {
            // this._valuer is the URL of the image
            this._value = value;
        },
        getValue: function (value) {
            return this._value;
        },
        _handleMouseover : function() {
            this.dispatch("mouseover");
        },
        _handleMouseout : function() {
            this.dispatch("mouseout");
        },
        _handleClick : function() {
            this.dispatch("click");
        },
        renderImage: function(h) {
            assert(this._value != "", "There is no source to create the image");
            h.push('<img src="' + this._value + '"'+
                   ' onmouseover="' + this.fireCode ("_handleMouseover") + '"' +
                   ' onmouseout="' + this.fireCode ("_handleMouseout") + '"'+
                   ' onclick="' + this.fireCode ("_handleClick") + '"'+
                   (this._config && this._config.width ? " width='"+ this._config.width +"'" : "")+
                   (this._config && this._config.height ? " height='"+ this._config.height +"'" : "")+
                   (this._config && this._config.border != undefined ? " border='"+ this._config.border +"'" : "")+ //border may be 0
                   (this._config && this._config.cssClass ? " class='"+ this._config.cssClass +"'" : ""));
            if (this._config && this._config.mapName) {
                h.push(' ismap usemap="#' + this._config.mapName + '"');
            }
            h.push(' />');
      },
      renderHtml: function(h) {
           h.push('<div id="' + this.id + '" >');
           this.renderImage(h);
           h.push('</div>');
       },
       reRender: function() {
    	   var h = [];
    	   this.renderImage(h);
    	   $(this.id).innerHTML = h.join("");
       }
    });
})();


/**
 * DEPRECATED. Please use SFSimpleLink in JUICCommon.js.
 * This component will create a link tag
 * @param value is the label of the link
 * @param config
 *      Possible Values:
 *          Onclick: handler attached to the onclick event of the link
 *          css: CSS class of the link
 *          href: href of the link
 */
function SFLink(value, config) {
    this.register();
    this._config = config;
    // default values of href and click. We must probably will use the onclick event on the links more often than the direct link to another URL.
    this._href = "javascript:void(0);";
    this._onClick = "click";
    if (this._config) {
        this._css = this._config.css;
        this._outerCss = this._config.outerCss;
        this._maxLength = this._config.maxLength;
        this._clickParam = this._config.clickParam;
        // make sure that if there is a href value of the link there is no onclick event attached to the object
        if (this._config.href) {
            assert(this._config.onClick == null, "an Onclick event cannot be assigned to an object with an href.");
            this._href = this._config.href;
        } else {
            if (this._config.onClick) this._onClick = this._config.onClick;
        }
        }
    this._style = false;
    this.setValue(value);
}

SFLink.prototype = (function() {
    return set(new Component(), {
       setValue: function(value) {
           this._value = value;
       },
       setCss: function(css) {
           this._css = css;
       },
       renderHtml: function(h) {
           h.push('<div id="' + this.id + '"');
           if (this._outerCss) {
               h.push(' class="' + this._outerCss + '"');
           }
           h.push('>');
           this._renderLink(h);
           h.push('</div>');
       },
       _renderLink: function(h) {
           h.push('<a');
           if (this._href) {
               h.push(' href="' + this._href + '"');
           }
           if (this._css) {
               h.push(' class="' + this._css + '"');
           }
           if (this._style) {
               h.push(' style="' + this._style + '"');
           }
           if (this._onClick) {
               h.push(' onclick="' + this.fireCode('_handleClick', this._clickParam ? this._clickParam : '') + 'return false;"');
           }
           h.push(' onmouseout="' + this.fireCode('_handleMouseOut') + 'return false;"');
           h.push(' onmouseover="' + this.fireCode('_handleMouseOver') + 'return false;"');

           var str = this._value;
              if (this._maxLength) {
                  if (this._value && this._value.length > this._maxLength) {
                      h.push(' title="' + Util.escapeHTML(this._value) + '"');
                      str = this._value.truncateByLength(this._maxLength);
                  }
           }
           h.push('>' + Util.escapeHTML(str) + '</a>');
       },
       setStyle: function(style) {
         this._style = style;
       },
       reRender: function() {
           var h = [];
           this._renderLink(h);
           $(this.id).innerHTML = h.join("");
       },
       _handleMouseOut: function() {
           this.dispatch("mouseout");
       },
       _handleMouseOver: function() {
           this.dispatch("mouseover");
       },
       _handleClick: function() {
           // if an Onclick event listener is specified the object will dispatch that event, otherwise it will dispatch click event
           if (this._onClick) {
               this.dispatch(this._onClick, {param: this._clickParam ? this._clickParam : ''});
           }
       }
   });
})();


/**
 *  EXPString is the object to create a string wrapped in a div.
 * @param value: Value to be displayed
 * @param config:
 *        dataKey:
 */
function EXPString(value,config) {
    this.register();
    this._config = config;
    if (this._config) {
    	this._dataKey = this._config.dataKey;
    	this._cssClass = this._config.cssClass;
    	this._maxLength = this._config.maxLength; //truncate to maxLength is specified and add ...
    }
    this.setValue(value);
}

EXPString.prototype = (function() {
     return set(new Component(), {
        setValue: function (value) {
            _str = "";
            //if () {
                if (this._dataKey) {
                    for (var i=0,len=this._dataKey.length;i < len; i++) {
                      _str += (!value[this._dataKey[i]] ? this._dataKey[i] : value[this._dataKey[i]]);
                    }
                }
            //} else _str = value;
            this._value = _str;
        },
        renderHtml: function(h) {
            h.push('<div id="' + this.id + '"');
            if (this._cssClass) {
            	h.push(' class="' + this._cssClass + '"')
            }
            h.push('>');
            this._renderString(h);
            h.push('</div>');
        },
        _renderString: function(h) {
        	var str = this._value;
        	if (this._maxLength) {
        		//truncate string if maxLength is specified and add ...
    		   str = this._value.truncateByLength(this._maxLength);
    		}
        	//encode string to display
        	h.push(Util.escapeHTML(str));
        },
        reRender: function() {
        	var h = [];
     	   	this._renderString(h);
     	   	$(this.id).innerHTML = h.join("");
        }
    });
})();

/**
 *
 * The following section is code from the old js_components. This is only a temporary holding area.
 *
 */


/**
 * This is the constructor for the LabelField.
 *
 * The LabelField is either text or a clickable anchor.
 * @param value - internal value
 * @param displayvalue - displayed
 * @param config
 *     link - display as link
 */
function LabelField(value, displayValue, config) {
  this.register();
  this.setValue(value, displayValue);

  if (config) {
    this._config = config;

    if (config.link)
  	  this._link = true;
  }
}

LabelField.prototype = (function() {

  function createUndoEvent(ipe, oldValue, newValue) {

    return {
      undo:function() {
        ipe.setValue(oldValue);
      },

      redo:function() {
        ipe.setValue(newValue);
      }
    };
  }

  function _highlight(me, bool) {
    if (me.isShowModified()) {
      var input = $(me.id);

      if (input) {
        if (me._writable) {
          input = input.previousSibling;
        }

        if (bool) {
          YAHOO.util.Dom.addClass(input.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(input.id, 'unsaved');
        }
      }
    }
  }


  return set(new Component(), {

    setValue : function(value, displayValue) {
      this.value = value;
      this.displayValue = displayValue ? displayValue : value;

      var input = $(this.id);
      if (input) {
        input.innerHTML = Util.escapeHTML(this.displayValue);
      }
    },

    getValue : function() {
      return this.value;
    },

    renderHtml : function(h) {
    	//Target Should be a parameter to determine if it needs to be opened in new or same window.
    	if(this._link) {
    		h.push('<a id="' + this.id + '" class="" target="new" href="' + Util.escapeHTML(this.value) + '">' + Util.escapeHTML(this.displayValue) + '</a>');
    	}
    	else {
        var escVal = Util.escapeHTML(this.value);
        var escDVal = Util.escapeHTML(this.displayValue);

        h.push('<span id="' + this.id + '" class="" ');

        if (this._config && this._config.mouseoverDisplay)
          h.push(' alt="' + escVal + '" title="' + escVal + '"');

        h.push('>' + escDVal + '</span>');
    	}
    },

    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
    },

      /**
     * The LabelField state consists of the value and a display value along with the modified flag.
     * Therefore, if the state needs to be changed, the caller must indicate the new
     * value for the input field as well as the modified flag.
     *
     * @param newState  an object representing the input field value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.defaultValue, newState.value);
      this.setModified(newState.modified);
    },

    /**
     * @return an object representing the LabelField's state.
     */
    serializeState : function() {
      return {value:this.value, modified:this._modified, defaultValue:this.displayValue};
    }
  });

})();

/**
 * This is the constructor for the IPE textarea field.
 *
 * The IPE textarea state: The state is defined as the value in the IPE textarea's input field as well as the
 * modified flag. Any observer registered with this component will receive that state as per the event type.
 *
 * @param value
 * @param config
 *   - writable
 *   - rows
 *   - cols
 */
function IPETextAreaField(value, config) {
  this.register();
  this.setValue(value);
  this._readOnlyClass = (config.readOnlyClass != undefined)?config.readOnlyClass:'readonly';
  this._writable = config.writable != undefined ? config.writable : true;
  this._rows = config.rows ? config.rows : 3;
  this._cols = config.cols ? config.cols : 40;
}

IPETextAreaField.prototype = (function() {

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
    if (me.isShowModified()) {
      var input = $(me.id);

      if (input) {
        if (me._writable) {
          input = input.previousSibling;
        }

        if (bool) {
          YAHOO.util.Dom.addClass(input.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(input.id, 'unsaved');
        }
      }
    }
  }


  return set(new Component(), {
    /** When setting the value for this component, we need to
        set the value for the associated anchor. */
    setValue : function(value) {
      this.value = value;

      var input = $(this.id);

      // Do we need to escape the value
      if (input) {
        // this is the input
        input.value = Util.escapeHTML(value);

        // this is the anchor
        if (this._writable) {
          if (!value || value.trim().length == 0) {
            input.previousSibling.firstChild.nodeValue = '['+jsSFMessages.COMMON_Click_to_edit+']';
            YAHOO.util.Dom.removeClass(input.previousSibling.id, 'editable');
            YAHOO.util.Dom.addClass(input.previousSibling.id, 'empty');
          } else {
            input.previousSibling.firstChild.nodeValue = value;
            YAHOO.util.Dom.removeClass(input.previousSibling.id, 'empty');
            YAHOO.util.Dom.addClass(input.previousSibling.id, 'editable');
          }
        }
        else {
          input.value = Util.escapeHTML(this.value);
        }

      }
    },

    //getValue(); if writeable and visible (element exists because it's visible) return the elements value
    getValue : function() {
      if (this._writable && $(this.id)) {
        return $(this.id).value;
      }
      else {
        return this.value;
      }
    },

    renderHtml : function(h) {
      var anchorString = this.value;
      var anchorClass = 'editable';
      if (!this.value || this.value.length == 0) {
        anchorString = '['+jsSFMessages.COMMON_Click_to_edit+']';
      }
      if (this._writable) {
        h.push("<a href='javascript:void(0)' id='"+this.id+"_a' onfocus='" + this.fireCode("focus") + "'" +
               " class='"+anchorClass+"' onclick='return false'>" + Util.escapeHTML(anchorString) + "</a>" +
               "<textarea id='" + this.id + "'" +
                        " rows='" + this._rows + "'" +
                        " cols='" + this._cols + "'" +
                        " onblur='" + this.fireCode("blur") + "'" +
                        " style='display:none;'>" + Util.escapeHTML(anchorString) + "</textarea>");
      }
      else {
        h.push('<span id="' + this.id + '" class="'+this._readOnlyClass+'">' + Util.escapeHTML(this.value) + '</span>');
      }
    },

    focus : function() {
      var input = $(this.id);
      var link = input.previousSibling;

      link.style.display = 'none';
      input.style.display = '';
      input.focus();
      input.select();

      this.oldValue = input.value;
    },

    blur : function() {
      var input = $(this.id);
      var link = input.previousSibling;

      var oldState = this.serializeState();

      input.style.display = 'none';
      link.style.display = '';

      this.setValue(input.value);
      var newValue = input.value;

      if (newValue != this.oldValue) {
        // Only update the modified flag if it's not already
        // in modified mode.
        if (!this.isModified())
          this.setModified(true);
        // Inform the observers of the change.
        this.dispatch('change', {oldValue:this.oldValue, newValue:newValue});
        // retrieve the new state of this IPE for the undo manager
        var newState = this.serializeState();
        // register this change event with the undo manager
        undoManager.add(createUndoEvent(this, oldState, newState));
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
     * The IPE state consists of the value in the input field and the modified flag.
     * Therefore, if the state needs to be changed, the caller must indicate the new
     * value for the input field as well as the modified flag.
     *
     * @param newState  an object representing the input field value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setModified(newState.modified);
    },

    /**
     * @return an object representing the IPE's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this.value, modified:this._modified};
    }
  });

})();

/**
 * This is the constructor for the IPAutoCompleteFindUser field.
 *
 * The IP consist of an input and a hidden field.  The input stores the username
 * while the hidden field stores the userId.
 *
 * @param value
 * @param writable
 * @param inputSize
 * @param maxDisplayed - maximum dropdown items to display.
 * @param labelText - for error messages.
 * @param params - series of optional parameters.
 *        validator (optional)
 *        readOnlyClass (optional)
 *        required (optional)
 *        userNameHidden (optional)
 *        usePhoto (optional) defaults to false
 *        userDisplayValue (optional) - what to display in edit box.
 *        delimChar (optional) - set it to a character if you want to
 *                               accept multiple selections.  Required for multi-selection.
 *        minQueryLength (optional) minimum number of characters to trigger autocompletion
 *        recruitEventId (optional) filter users based on interviewers assigned to recruiting event if event Id > 0
 */

function IPAutoCompleteFindUser(value, writable, inputSize, maxDisplayed, labelText, params) {
  this.register();
  if(value) {
     this.setValue(value);
  }
  this._lastErrorMessage;
  this._labelText = labelText;
  this._rendered = false;

  if (writable) { this._writable = writable; }

  if (inputSize) { this._inputSize = inputSize; }

  if (maxDisplayed) { this._maxDisplayed = maxDisplayed; }


  this._userNameHidden = true;
  this._usePhoto = false;
  this._readOnlyClass = 'readonly';
  this._minQueryLength = 2;
  this._recruitEventId = 0;

  if(params) {
	  this._userNameHidden = (params.userNameHidden != undefined) ? params.userNameHidden : true;
	  this._usePhoto = (params.usePhoto != undefined) ? params.usePhoto : false;
	  this._readOnlyClass = (params.readOnlyClass != undefined)?params.readOnlyClass:'readonly';

    if (params.required) {
      this._required = params.required;
    }
    if(value != "" && params.userDisplayValue) {
    	this._userDisplayValue = params.userDisplayValue;
    }
    if(params.delimChar) {
    	this._delimChar = params.delimChar;
    }
    this._clickable = (params.clickable != undefined) ? params.clickable : false;
    this._minQueryLength = (params.minQueryLength != undefined) ? params.minQueryLength : 2;
    this._recruitEventId = (params.recruitEventId != undefined) ? params.recruitEventId : 0;
  }
}

IPAutoCompleteFindUser.prototype = (function() {

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
    if (me.isShowModified()) {
      var link = $(me.id + "_a");
      if (link) {
        if (bool) {
          YAHOO.util.Dom.addClass(link.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(link.id, 'unsaved');
        }
      }
    }
  }

  function trimDisplayName(displayName) {
    // remove the last ','
     if(displayName) {
       displayName = displayName.trim();
       if(displayName.substr(displayName.length - 1) == ',') {
         displayName = displayName.substr(0, displayName.length - 1);
       }
     }
     return displayName;
  }


  return set(new Component(), {

    _inputType : "text",

    _writable : false,

    _inputSize : 20,

    setValue : function(value) {
//      var oldState = this.serializeState();

      this.value = value;
      var userIdCtrl = $(this.id + "_hidden");
      // Do we need to escape the value
         // Do we need to escape the value
      if (userIdCtrl) {
        if (!value || value.trim().length == 0) {
          userIdCtrl.nodeValue = "";
        } else {
          userIdCtrl.nodeValue = value;
        }
      }

//      var newState = this.serializeState();
//      undoManager.add(createUndoEvent(this, oldState, newState));
    },


    getValue : function() {
      if (this._writable) {

        return $(this.id + "_hidden").value;
      }
      else {
        return this.value;
      }
    },

    setUserDisplayValue : function(value) {
    	// remove the last ','
    	value = trimDisplayName(value);

      this._userDisplayValue = value;
      var link = $(this.id + "_a");
      var input= $(this.id);
      //Do we need to escape the value
      if (link && input) {
        if (!value || value.trim().length == 0) {
          var hiddenCtrl = (this.id + "_hidden");
          link.innerHTML = '['+jsSFMessages.COMMON_Click_to_edit+']';
          input.value = "";
          YAHOO.util.Dom.removeClass(link.id, 'editable');
          YAHOO.util.Dom.addClass(link.id, 'empty');
        } else {
          link.innerHTML = value;
          input.value = value;
          YAHOO.util.Dom.removeClass(link.id, 'empty');
          YAHOO.util.Dom.addClass(link.id, 'editable');
        }
      }
      else {
      	var ro = $(this.id);
      	if (ro) {
      	  if (!value){
      	    ro.innerHTML = "";
      	  }
      	  else {
      	    ro.innerHTML = value.trim();;
         	}
      	}

      }
    },


    getUserDisplayValue : function() {
        return this._userDisplayValue;
    },

    // if an error occurs, use this DOM element Id to highlight the field
    getHighLightElemId : function() {
      return this.id;
    },

    renderHtml : function(h) {

      var anchorString = this._userDisplayValue;
      var anchorClass = 'editable';
      if (!this.value || this.value.length == 0) {
        anchorString = '['+jsSFMessages.COMMON_Click_to_edit+']';
      }
      if (this._writable) {
        h.push("<a href='javascript:void(0)' id='"+this.id+"_a' onfocus='" + this.fireCode("focus") + "'" +
               " class='"+anchorClass+"' onclick='return false'>" + Util.escapeHTML(anchorString) + "</a>" +
                "<span class='autocompspan' style='z-index:998;'> <input type='text' id='" +this.id +
                "' name='" + this.id + "' class='autocompinput' style='z-index:998; display:none' " +
                " onkeypress='return EventFilterUtil.catchCR(event);' " +
                " size='" + this._inputSize + "' onfocus= '" + this.fireCode("focus") + "' value='" + Util.escapeHTML(this._userDisplayValue) + "'/>" +
                "</span><input type='hidden' value='" + this.value + "' id='" + this.id + "_hidden' name='" + this.id + "_hidden'" +
                " /><div id='" + this.id+ "_error' style='display:none; color: rgb(255, 0, 0);'></div>"
              );
        this._rendered = true;
      }
      else {
		if (this._clickable){
			h.push("<a href='javascript:void(0)' id='"+this.id+"' class='editTransfer' onclick='" + this.fireCode("startAction") + "' title='" + jsSFMessages.EMPLOYEE_FILES_Icon_Tooltip_Edit_Request_Approval +"'>" + Util.escapeHTML(this._userDisplayValue) + "</a>"
			  );
		}else{
			h.push('<span id="' + this.id +'" class="'+this._readOnlyClass+'">' + Util.escapeHTML(this._userDisplayValue) + '</span>');
		}

      }
    },

	startAction: function() {
		this.dispatch("action", {actionCommand : "startWorkflow"});
	},

    isValid : function (text) {
      if(this._autoCompleteFindUser) {
        if(this._autoCompleteFindUser.unknownNames.length <= 0) {
          if(this._required && (!text || !(/[^ \t\r\n]/.test(text)))) {
            this._lastErrorMessage = sfMessageFormat.format(jsSFMessages["COMMON_ERR_DATA_REQUIRED"], this._labelText)
         	  return false;
          }
        }
        else {
          this._lastErrorMessage =  sfMessageFormat.format(jsSFMessages["COMMON_ERR_INVALID_USERID"], this._labelText);
          return false;
        }
      }
      return true;
    },

    getLastValidationError : function () {
      return this._lastErrorMessage;
    },

    blur : function() {

      var input = $(this.id);
      var error = $(this.id + "_error");
      var link = $(this.id + "_a");
      var userId = $(this.id + "_hidden");
      var oldState = this.serializeState();

      input.style.display = 'none';
      link.style.display = '';


      if (trimDisplayName(input.value) != oldState.defaultValue) {
        if(!this.isValid(userId.value)) {
          link.style.display = 'none';
          input.style.display = '';
          error.style.display = '';
          error.innerHTML = this.appendErrorIcon(this.getLastValidationError());
        } else {
          error.style.display = 'none';
        }
        if (!this.isModified())
          this.setModified(true);
        // retrieve the new state of this IPE for the undo manager
        this.setValue(userId.value);
        this.setUserDisplayValue(input.value);
        var newState = this.serializeState();
        // register this change event with the undo manager
        undoManager.add(createUndoEvent(this, oldState, newState));
        this.dispatch("change",  {"oldvalue":oldState.value, "newvalue":userId.value});
      }
    },



    focus : function() {
    	if(this._writable){
    		var input = $(this.id);
    		if(this._rendered) {
    		   var hiddenElementId = this.id + "_hidden";
    		   this._autoCompleteFindUser = new AutoCompleteFindUser({textElementId: this.id, maxResultsDisplayed:this._maxDisplayed,
                                               minQueryLength:this._minQueryLength, findtype:'fullname',
                                               delimChar: (this._delimChar ? this._delimChar : ""), hideUserName: this._userNameHidden? 1 : 0,
                                               enablePhoto:this._usePhoto, enableAutoCompFind:true,
                                               selectedUsersElementId: hiddenElementId,
                                               errMsg: jsSFMessages.COMMON_AUTOCOMP_FINDUSER_ERR,
                                               v10:false, supressAlert:true, recruitEventId:this._recruitEventId});
    		   this._autoCompleteFindUser.widget.textboxBlurEvent.subscribe(this.blur, this, true);
    		   this._rendered = false;
    		}
        var link = $(this.id + "_a");
        link.style.display = 'none';
        input.style.display = '';
        input.focus();
        input.select();
      }
    },

    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
      _highlight(this, bool);
    },

    /**
     * The IPE state consists of the value in the input field and a value in the
     * hidden field which represents userid.
     * @param newState  an object representing the input field value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setUserDisplayValue(newState.defaultValue);
      this.setModified(newState.modified);
    },

    /**
     * @return an object representing the IPE's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this.value, defaultValue:this._userDisplayValue,
              modified:this._modified};
    }
  });
})();

/**
 * This is the constructor for the IPAutoCompleteFindTags field.
 *
 * The IP consist of an input and a link.  .
 *
 * @param value
 * @param writable
 * @param inputSize
 * @param maxDisplayed - maximum dropdown items to display.
 * @param labelText - for error messages.
 * @param params - series of optional parameters.
 *        validator (optional)
 *        findType (optional) - defaults to userTags, can also be department, division, or location
 *        readOnlyClass (optional)
 *        required (optional) - is this field required, default to false.
 *        forceSelection (optional) - force user to select from dropdown, default to false
 *        delimChar (optional) - set it to a character if you want to
 *                               accept multiple selections.  Required for multi-selection.
 */

function IPAutoCompleteDataList(value, writable, inputSize, maxDisplayed, labelText, params) {
  this.register();
  if(value) {
    this.setValue(value);
  }
  this._findType = 'userTags';
  this._forceSelection = false;
  this._labelText = labelText;
  this._rendered = false;

  if (writable) { this._writable = writable; }

  if (inputSize) { this._inputSize = inputSize; }

  if (maxDisplayed) { this._maxDisplayed = maxDisplayed; }

  this._readOnlyClass = (params.readOnlyClass != undefined)?params.readOnlyClass:'readonly';

  if(params) {
    if (params.validator) {
      this._validator = params.validator;
      this._validatorActions = [];
    }
    if(params.delimChar) {
      this._delimChar = params.delimChar;
    }

    if(params.required) {
    	this.setRequired(params.required);
    }

    if(params.defaultValue) {
      this._defaultValue = params.defaultValue;
    }

    if(params.findType) {
    	this._findType = params.findType;
    }

    if(params.forceSelection) {
      this._forceSelection = params.forceSelection;
    }
  }
}

IPAutoCompleteDataList.prototype = (function() {

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
    if (me.isShowModified()) {
      var link = $(me.id + "_a");
      if (link) {
        if (bool) {
          YAHOO.util.Dom.addClass(link.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(link.id, 'unsaved');
        }
      }
    }
  }


  return set(new Component(), {

    _inputType : "text",

    _writable : false,

    _inputSize : 20,

    setValue : function(value) {
     // remove the last ','
     value = value.trim();
     if(value.substr(value.length - 1) == ',') {
        value = value.substr(0, value.length - 1);
      }
      this.value = value;


      var link = $(this.id + "_a");
      // Do we need to escape the value
      if (link) {
        if (!value || value.trim().length == 0) {
          link.innerHTML = "";
        } else {
          link.innerHTML = value;
        }
      }
      else {
      	var text = $(this.id);
      	if(text) {
      	  if (!value || value.trim().length == 0) {
            text.innerHTML = "";
          } else {
            text.innerHTML = value;
          }
      	}
      }
    },


    getValue : function() {
        return this.value;
    },

    // if an error occurs, use this DOM element Id to highlight the field
    getHighLightElemId : function() {
      return this.id;
    },
    stopBlur : false,
    stopStateFalse : function(){
    	this.stopBlur = true;
    	var input = $(this.id);
    	input.blur();
    },
    renderHtml : function(h) {

      var anchorString = this.value;
      var anchorClass = 'editable';
      if (!this.value || this.value.length == 0) {
        anchorString = this._defaultValue;
      }
      if (this._writable) {
        h.push("<a href='javascript:void(0)' id='"+this.id+"_a' onfocus='" + this.fireCode("focus") + "'" +
               " class='"+anchorClass+"' onclick='return false'>" + Util.escapeHTML(anchorString) + "</a>" +
                "<span class='autocompspan' style='z-index:998;'>" +
                "<input type='text' id='" +this.id +
                "' onblur='" + this.fireCode("blur") + "' onkeyup='"+ this.fireCode("keypress") +"' name='" + this.id + "' class='autocompinput' style='z-index:998; display:none'" +
                " size='" + this._inputSize + "' value='" + Util.escapeHTML(this.value) + "'/>" +
                "</span><div id='" + this.id+ "_error' style='display:none; color: rgb(255, 0, 0);'></div>"
              );
        this._rendered = true;
      }
      else {
        h.push('<span id="' + this.id + '" class= "'+this._readOnlyClass+'">' + Util.escapeHTML(this.value) + '</span>');
      }
    },
    keypress : function(e) {
        var input = $(this.id);

      	   var keynum;
      	   if(window.event) // IE
      	     {
      	     keynum = e.keyCode;
      	     }
      	   else if(e.which) // Netscape/Firefox/Opera
      	     {
      	     keynum = e.which;
      	     }
      	   if(keynum == 13){
      		 this.stopStateFalse()
      	   }
    },

    blur : function() {
      if(!this.stopBlur)
      {
      	  this.stopStateFalse();
      	  return true;
      }
      var input = $(this.id);
      var error = $(this.id + "_error");
      var link = $(this.id + "_a");
      var oldState = this.serializeState();

      link.style.display = '';
      input.style.display = 'none';

      if (input.value != oldState.value) {
      	  if(this.isValid(input.value)) {
            if (!this.isModified())
              this.setModified(true);
            // retrieve the new state of this IPE for the undo manager
            this.setValue(input.value);
            var newState = this.serializeState();
            // register this change event with the undo manager

            this.dispatch("change",  {"oldvalue":oldState.value, "newvalue":newState.value});
            // retrieve the new state of this IPE for the undo manager
            var newState = this.serializeState();
            // register this change event with the undo manager
            undoManager.add(createUndoEvent(this, oldState, newState));
            error.style.display = 'none';
      	  }
      	  else {
            error.style.display = '';
            error.innerHTML = this.appendErrorIcon(sfMessageFormat.format(jsSFMessages["COMMON_ERR_DATA_REQUIRED"], this._labelText));
            link.style.display = 'none';
            input.style.display = '';
          }
      }
      this.stopBlur = false;
    },

    focus : function() {
      if(this._writable){
        var input = $(this.id);
        if(this._rendered) {
           this._autoCompleteFindDataList = new AutoCompleteDataList({textElementId: this.id, maxResultsDisplayed:this._maxDisplayed,
                                               minQueryLength:2, delimChar: (this._delimChar ? this._delimChar : ""),
                                               findtype:this._findType, enableAutoCompFind:true, forceSelection:this._forceSelection,
                                               v10:false, errMsg: jsSFMessages.COMMON_AUTOCOMP_FINDTAGS_ERR});
           this._rendered = false;
        }
        var link = $(this.id + "_a");
        link.style.display = 'none';
        input.style.display = '';
        input.focus();
        input.select();
      }
      this.stopBlur = false;
    },

    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
    },

    /**
     * The IPE state consists of the value in the input field and a value in the
     * hidden field which represents userid.
     * @param newState  an object representing the input field value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setModified(newState.modified);
    },

    /**
     * @return an object representing the IPE's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this.value, modified:this._modified};
    }
  });
})();



// constructor for Calendar component
// @param value: This is the date to be used as the inital value
//               for the calendar. It should be in string format
//               based on ISO standard 8601 (i.e., yyyy-mm-dd).
// @param config: config values
//   - editable: whether it's readonly or not.
//   - min: the minimum date shown on the drop down selection.
//   - max: the maxium date shown on the drop down selection.
//   - readOnlyClass: optional if parents edit state dictates read only style
//   - validator: validator object supporting validate.
function CalendarField(value, config) {
  this.register();
  this.setValue(value);
  this._writable = config.editable != undefined ? config.editable : true;
  this._min = config.min ? config.min : 1901;
  this._max = config.max ? config.max : 2099;
  this._readOnlyClass = (config.readOnlyClass != undefined)? config.readOnlyClass:'readonly';
  if(config.validator) {
  	this._validator = config.validator;
    this._validatorActions = [];
  }
}

CalendarField.prototype = (function() {

  function createUndoEvent(calendarField, oldValue, newValue) {

    return {
      undo:function() {
        calendarField.setValue(oldValue);
      },

      redo:function() {
        calendarField.setValue(newValue);
      }
    };
  }

  function _highlight(me, bool) {
    if (me.isShowModified()) {
      var input = $(me.id + '_input');

      if (input) {
        if (me._writable) {
          input = input.previousSibling;
        }

        if (bool) {
          YAHOO.util.Dom.addClass(input.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(input.id, 'unsaved');
        }
      }
    }
  }


  return set(new Component(), {

    /**
     * When setting the value for this component, we need to
     * set the value for the associated anchor.
     *
     * The value must be in string format based on ISO standard
     * 8601 (i.e., yyyy-mm-dd)
     */
    setValue : function(value) {
      if (value && value.trim().length != 0) {
        var iso8601Date = ISO8601Dateformatter.parse(value);
        this.value = dateformatter.format(iso8601Date);
      } else {
        this.value = jsSFMessages.COMMON_DateFormatExample;
      }

      var input = $(this.id + '_input');

      if (input) {
        if (this._writable) {
          input.value = this.value;                                  // this is the input
          input.previousSibling.firstChild.nodeValue = Util.escapeHTML(this.value);   // this is the anchor
        }
        else {
          input.innerHTML = Util.escapeHTML(this.value);
        }
      }
    },

    /**
     * The returned value represents the date in string type in ISO 8601
     * format (i.e., yyyy-mm-dd).
     */
    getValue : function() {
      var localizedDateStr;
      if (!this._writable) {
        localizedDateStr = this.value;
      } else {
        localizedDateStr = $(this.id + '_input') ? $(this.id + '_input').value : this.value;
      }

      // Localized dateStr equals default date string, return ""
      if(localizedDateStr == jsSFMessages.COMMON_DateFormatExample)
         return "";

      var localizedDateObj = dateformatter.parse(localizedDateStr);
      var iso8601DateStr = null;
      // it's possible that localizedDateObj is null if there is no date in the
      // input field.
      if (localizedDateObj) {
        iso8601DateStr = ISO8601Dateformatter.format(localizedDateObj);
      }

      return iso8601DateStr;
    },

    showErrorMessage: function (JSONarray) {
        var fieldObj = $(this.id+"_input");
        var elem = "";
        if ($(this.id+"_error")) {
            elem = $(this.id+"_error");
            elem.innerHTML = "";
        }
        for (var index=0,len=JSONarray.length;index<len;index++) {
            elem.innerHTML += "<br />" + JSONarray[index].msg + "<br />";
        }
        elem.style.display = "";
     },

    hideErrorMessage: function(){
        var errorDiv = $(this.id+"_error");
        if (errorDiv) errorDiv.style.display = "none";
    },

    // if an error occurs, use this DOM element Id to highlight the field
    getHighLightElemId : function() {
      return this.id+"_input";
    },

    renderHtml : function(h) {
      if (this._writable) {
        h.push('<a class="editable" href="javascript:void(0);" id="'+this.id+'_a"'+
                   ' onfocus="' + this.fireCode("focus") + '"' +
                   ' title="'+jsSFMessages.COMMON_Click_to_edit+'" onclick="return false">' +Util.escapeHTML(this.value)+'</a>' +
               '<input id="'+this.id+'_input"' +
                   ' name="'+this.id+'_input"' +
                   ' onfocus="'+this.fireCode("focusCalendar")+'"'+
                   ' onchange="' + this.fireCode("change") + '"' +
                   ' onmouseover="Calendar.overIpe(this)"' +
                   ' size="12"' +
                   ' style="display: none"' +
                   ' type="text"' +
                   ' value="'+this.value+'"/>' +
                   '<div id="' + this.id+ '_error" style="display:none; color: rgb(255, 0, 0);"></div>');
      } else {
        h.push('<span id="' + (this.id + '_input') + '" class="'+this._readOnlyClass+'">'+Util.escapeHTML(this.value)+'</span>');
      }
    },

    focusCalendar : function() {
        var self = this;
        Calendar.hook($(this.id + '_input'), jsSFMessages.COMMON_DateFormatExample,
                      jsSFMessages.COMMON_DateFormat,
                      "ipe", 1,
                      this._min, this._max,
                      null, null, this.id+'_a',
                      function(){self.blur()});
    },

    focus : function() {
      if (this._writable) {
	      var input = $(this.id + '_input');
	      var link = input.previousSibling;
	      link.style.display = 'none';
	      input.style.display = '';
	      input.focus();
	      input.select();
	      this.oldValue = input.value;
    	}
    },

    blur : function() {
      var input = $(this.id + '_input');
      var link = input.previousSibling;
      var error = $(this.id + '_error');

      input.style.display = 'none';
      link.style.display = '';
      var inputValue = input.value;
      inputValue =  Util.escapeHTML(inputValue.trim());
      if(inputValue.length > 0) {
	      link.innerHTML = inputValue;
      }
      else{
    	  link.innerHTML = jsSFMessages.COMMON_DateFormatExample;
      }
      this.change();

    },

    change : function() {
      var input = $(this.id + '_input');
      var newValue = input.value;
      var error = $(this.id + "_error");

      if (newValue != this.oldValue ) {
      	if(this.isValid(newValue)) {
          this.setModified(true);
          this.dispatch('change', {oldValue:this.oldValue, newValue:newValue});
          delete this.oldValue;
          error.style.display = 'none';
      	}
      	else {
          error.style.display = '';
          error.innerHTML = this.appendErrorIcon(this._lastErrorMessage);
      	}
      }

      this.oldValue = newValue;
    },

     isValid : function (text) {
      var warnings = []; // warnings not used.
      var errors = [];

      if(text == jsSFMessages.COMMON_DateFormatExample)
         text = "";

      // first check for require
      out = (!this._validator ||!this._validator.validate(this.id + "_input" , errors, warnings, text == "" ? text : null));
      if(out) {
        this._lastErrorMessage = "";
      }
      else {
         this._lastErrorMessage = errors[0];
      }
      return out;
    },

    getLastValidationError : function () {
      return this._lastErrorMessage;
    },
    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
    },

    serializeState : function() {
      return {value:this.getValue(), modified:this.isModified()};

    },

    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setModified(newState.modified);
    },

      /**
     * Binds the validator settings to the validator.   Needed
     * because validation model requiers controls to be in DOM
     */
    bindValidators: function() {
      if(this._validatorActions) {
        for(var idx= 0; idx< this._validatorActions.length; idx++){
          var validatorActionItem = this._validatorActions[idx];
          this._validator.add(validatorActionItem.name, validatorActionItem.id, validatorActionItem.formater,
                            validatorActionItem.required);
        }
      }
    },

    addToValidatorBindings: function(nameval, idval, formatval, reqval ) {
      if(this._validator && this._writable) {
        this._validatorActions [this._validatorActions.length ] = { "name" : nameval, "id": idval,
                                                                    "formater": formatval, "required": reqval } ;
      }
    }
  });

})();


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
  this._editable = true; /*default value */
  this.setValue(value);
  for(var sConfig in config) {
     if (sConfig) {
        this["_" + sConfig] = config[sConfig];
     }
  }
}

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
      h.push('<select category="'+escapeHTML(this.value)+'"'+
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
        h.push('<option value="'+escapeHTML(opt.value)+'" '+selected+'>' + escapeHTML(opt.displayLabel) + '</option>');
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

// constructor for IPSelectOneMenu
// @param value :         the selected 'value' (ie, not label)
// @param linkValue:      the default text inside <a>
// @param itemOptions :   an array of objects, each object is an instance of {value,label}
// @param config :
//   - editable :      true or false
//   - disabled :      true or false
//   - styleClass :    the HTML element class
//   - required  :     true if this field is required.
//   - labelText :     label for error message.
//
function IPSelectOneMenu(value, linkValue, itemOptions, config) {
  this.register();
  this.setLinkValue(linkValue);
  this._writable = config.editable != undefined ? config.editable : true;
  this._disabled = config.disabled != undefined ? config.disabled : false;
  this._readOnlyClass = config.readOnlyClass != undefined ? config.readOnlyClass : 'readonly';
  config.hidden = true;
  if(this._writable) {
    this._selectOneMenu = new SelectOneMenu(value, itemOptions, config);
    this._selectOneMenu.addEventListener("change", this);
    this._selectOneMenu.addEventListener("blur", this);
  }
  this.setValue(value ? value : "");
}

IPSelectOneMenu.prototype = (function() {

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
    	this.value = value;
    	if(this._writable && this._selectOneMenu && this._selectOneMenu.getValue() != value) {
        this._selectOneMenu.setValue(value);
    	}
    },

    getValue : function() {
        return this.value;
    },


    isValid : function (text) {
    	if(this._writable) {
         return this._selectOneMenu.isValid(text);
    	}
    	else {
    		 return true;
    	}
    },

    getLastValidationError : function () {
      return this._selectOneMenu.getLastValidationError(this._selectOneMenu._labelText);
    },

    setLinkValue : function (value) {
    	this._linkValue = value;
      // Now retrieve the corresponding DOM element

      var anchor = $(this.id);
      if(anchor) {
      	if(anchor && anchor.firstChild) {
          anchor.firstChild.nodeValue = value;
      	}
      	else {
      		anchor.innerHtml = value;
      	}
      }
    },

    getLinkValue : function () {
    	return this._linkValue;
    },

    renderHtml : function(h) {
      var anchorString = this._linkValue;
      var anchorClass = 'editable';
      if (!this._linkValue || this._linkValue.length == 0) {
        anchorString = '['+jsSFMessages.COMMON_Click_to_edit+']';
      }
      if (this._writable) {
      // XI-2505: Make sure that href does not get called.
        h.push("<a href='javascript:void(0)' id='"+this.id+"' onfocus='" + this.fireCode("focus") + "'" +
               " onclick='return false;' class='"+anchorClass+"'>" + Util.escapeHTML(anchorString) + "</a>");
        this._selectOneMenu.renderHtml(h);
      }
      else {
        h.push('<span id="' + this.id + '" class="' + this._readOnlyClass + '">' + Util.escapeHTML(this._linkValue) + '</span>');
      }
    },

    focus : function() {
    	/* Do not change the name of this method, it is overridden by EMPajaxipselectone.   If it was intended to be private
    	 * I would expect the name to be _focus.
    	 *
    	 * TODO:  Another way to solve this is to dispatch focus and provide a configuration option
    	 * to be cancelable.   Our lack of unit tests and QA resources puts too much testing burden on this solution at this point.
    	 */
      if(this._writable && !this._disabled){
        var select = $(this._selectOneMenu.id);
        var link = $(this.id);
        link.style.display = 'none';
        select.style.display = '';
        this.oldValue = select.value;
        select.focus();
      }
    },

    setModified : function(bool) {
    	_highlight(this, bool);
      this._modified = bool;

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
      this.setLinkValue(newState.defaultValue);
    },

    /**
     * @return an object representing the SelectOneMenu's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this.getValue(), modified:this.isModified(),
              linkValue:this.getLinkValue()};
    },

    getErrorId : function() {
    	if(this._selectOneMenu) {
    		return this._selectOneMenu.getErrorId();
    	}
    	return null;
    },

    handleEvent : function(event) {
      switch(event.type) {
        case 'change':
          this.setModified(true);
          var select = $(this._selectOneMenu.id);
          var link = $(this.id);
          link.style.display = '';
          this.setLinkValue(event.newLabel);
          this.value = event.newValue;
          select.style.display = 'none';
          this.dispatch('change', {});
          break;
       case 'blur':
          var select = $(this._selectOneMenu.id);
          var link = $(this.id);
          link.style.display = '';
          select.style.display = 'none';
          break;
     }
    }
  });
})();




/**
 * Table object.  A (quasi) generic table widget that renders data you pass into it.
 */
function Table(data, metaData, styleClassObj, msgObj) {
  this.register();
  this._msgObj = msgObj;
  this._metaData = metaData;
  this._styleClassObj = styleClassObj;

  this._data = [];
  this.init(data, this._metaData);
}

Table.prototype = (function() {

  function createUndoEvent(comp, oldValue, newValue) {

    return {
      undo:function() {
        comp.setValue(oldValue);
      },

      redo:function() {
        comp.setValue(newValue);
      }
    };
  }

  function toggle(showObjIdArr, hideObjIdArr) {
    for (var index1 = 0; index1 < showObjIdArr.length; index1++) {
      $(showObjIdArr[index1]).style.display = '';
    }

    for (var index2 = 0; index2 < hideObjIdArr.length; index2++) {
      $(hideObjIdArr[index2]).style.display = 'none';
    }
  }

  //todo figure out the impl of this later
  function createRemoveUndoEvent(table, index, value) {
    return {
      undo : function() {
        table.insertRowAt(index, value);
      },
      redo : function() {
        table.removeRowAt(index);
      }
    };
  }

  function createInsertUndoEvent(table, index, value) {
    return {
      undo : function() {
        table.insertRowAt(index);
      },
      redo : function() {
        table.insertRowAt(index, value);
      }
    };
  }

  //convenience function that takes a TableRow component and returns it as an HTML DOM element.
  function createNewTableRowElement(newTr) {
    var h = [];
    newTr.renderHtml(h);
    var html = h.join("");
    var domEvalElement = document.getElementById('DOM_evaluator');
    domEvalElement.innerHTML = '<table><tbody>'+html+'</tbody></table>';
    return domEvalElement.firstChild.tBodies[0].rows[0]    ;
  }

  return set(new Component(), {

    init : function(data, metaData) {
      //create my rows, set myself as parent of rows
      for (var index = 0; index < data.length; index++) {
        var tr = new TableRow(data[index], metaData, index, this);
        this._data.push(tr);
      }
    },

    setValue : function(data) {
      for (var index = 0; index < data.length; index++) {
        this._data[index].setValue(data[index]);
      }
    },

    getValue : function() {
      var obj = [];

      //loop thru TableRow's and get their value
      for (var index = 0; index < this._data.length; index++) {
        obj.push(this._data[index].getValue());
      }

      return obj;
    },

    unregister : function() {
      for (var index = 0; index < this._data.length; index++) {
        this._data[index].unregister();
      }

      Component.prototype.unregister.apply(this, arguments);
    },

    //Info (column, default values, etc) I need to create a new row is in metaData
    addNewRow : function() {
      //create new TableRow
      var defaultValuesObj = {};
      for (var index = 0; index < this._metaData.length; index++) {
        defaultValuesObj[this._metaData[index].name] = this._metaData[index].defValue;
      }

      var newTr = new TableRow(defaultValuesObj, this._metaData, this._data.length + 1, this);

      //put new row in front of this._data array
      this._data = [newTr].concat(this._data);

      var newTrElement = createNewTableRowElement(newTr);

      var tbodyObj = $(this.id + "_data");

      if (tbodyObj.rows.length == 0) {
        tbodyObj.appendChild(newTrElement);
      } else {
        tbodyObj.insertBefore(newTrElement, tbodyObj.rows[0]);
      }

      newTr.setModified(true);
      this.setModified(true);

      this.dispatch('change', {});
      this.dispatch('adjust_size', {});

    },

    addFirstRow : function() {
      toggle([this.id + '_header', this.id + '_header_2'], [this.id + '_add_new_btn']);

      this.addNewRow();
    },

    deleteRow : function(rowId) {
      //remove from this._data
      for (var index = 0; index < this._data.length; index++) {
        if (this._data[index].id == rowId) {
          var value = this._data[index].getValue();
          this._data[index].unregister();
          this._data.splice(index, 1);

          undoManager.add(createRemoveUndoEvent(this, index, value));

          break;
        }
      }

      //remove from DOM
      $(rowId).parentNode.removeChild( $(rowId) );

      //check if you've removed the last row; if so switch display of 'Add Button' and 'table view;
      if (this._data.length == 0) {
        toggle([this.id + '_add_new_btn'], [this.id + '_header', this.id + '_header_2']);
      }

      this.setModified(true);
      this.dispatch('change', {});
      this.dispatch('adjust_size', {});

    },

    insertRowAt : function(index, value) {
      //insert into _data
      this._data.splice(index, 0, value);

      //insert into DOM
      var tbody = $(this.id + '_data');

      if (tbody) {
        //render it
//        value.register();
//        value.setParent(this);
        var newTrElement = createNewTableRowElement(value);
        tbody.insertBefore(newTrElement, index < tbody.rows.length ? tbody.rows[index] : null);
      }

      //add to undo mgr
      undoManager.add(createInsertUndoEvent(this, index, value));
    },

    removeRowAt : function(index) {
      //remove from _data
      var value = this._data[index].getValue();
      this._data[index].unregister();
      this._data.splice(index, 1);

      //remove from DOM
      var tbody = $(this.id + '_data');
      if (tbody) {
        tbody.removeChild(tbody.rows[index]);
      }

      //add to undo mgr
      undoManager.add(createRemoveUndoEvent(this, index, value));
    },

    renderHtml : function(h) {
      var styleClass = this._styleClassObj? this._styleClassObj.styleClass : '';

      h.push('<!-- BEGIN Table-->' +
         '<div class="' + styleClass + '" id="' + this.id + '" style="">' +
           //Add new target button
           '<div id="' + this.id + '_add_new" class=\"button_row\">' +
             '<span class="aquabtn mid" id="'+ this.id+'_add_new_btn" style="' + (this._data.length == 0 ? '':'display:none') + ';">' +
               '<span>' +
                 '<button class="icon_add" onclick="' + this.fireCode("addFirstRow") + '" type="button">' + this._msgObj.addNewObject + '</button>' +
               '</span>' +
             '</span>' +
           '</div>' +
           //table heading; new row template
           '<div id="' + this.id + '_header" style="' + (this._data.length == 0 ? 'display:none':'') + '">' +
             '<div class="table_header_rounded_corner">'+
               '<span class="leftCorner"></span>'+
               '<span class="rightCorner"></span>'+
             '</div>'+
             '<table class="grid" style="margin-bottom: 0;" id="' + this.id + '_header">' +
               '<thead>' +
               '<tr>' +
                 '<th colspan="' + (this._metaData.length + 1) + '" class="table_header"><em>' + jsSFMessages.COMMON_Click_below_to_edit + '</em>' + this._msgObj.title + ':' +
                   '<small class="table_header_links">' +
                     '<a id="' + this.id + '_add_new_row_link"' +
                        'href="#"' +
                        'onclick="' + this.fireCode("addNewRow") + 'return false;"' +
                        'style="" title="' + jsSFMessages.COMMON_Click_to_add_a_new + '">' + this._msgObj.add + '</a>' +
                   '</small>' +
                 '</th>' +
               '</tr>' +
               '</thead>' +
               '<tbody></tbody>' +
             '</table>' +
           '</div>' +
           '<div id="' + this.id + '_header_2" style="' + (this._data.length == 0 ? 'display:none':'') + '">' +
             '<table class="grid">' +
               '<thead>' +
                 '<tr>');
  for (var index = 0; index < this._metaData.length; index++) {
            h.push('<th class="">' + this._metaData[index].displayName +  '</th>');
  }
            h.push('<th class="col_width1 textright"></th>' +
                 '</tr>' +
               '</thead>' +
               '<tbody id="'+ this.id+'_data">');
  for (var index = 0; index < this._data.length; index++) {
    this._data[index].renderHtml(h);
  }
        h.push('</tbody>' +
             '</table>' +
           '</div>' +
         '</div>' +
         '<!-- END Table -->');
    },

    setModified : function(bool) {
      this._modified = bool;
    },

    isModified : function() {
      return this._modified;
    },

    setAllModified : function(bool) {
      this.setModified(bool);

      for (var index = 0; index < this._data.length; index++) {
        this._data[index].setAllModified(bool);
      }
    },

    handleEvent : function(event) {
      assert(event.type == 'change', "Event is not of type 'change' (Table)!");
      this.dispatch('change', {});
    }

  });

})();

/**
   * This object is used to hold row data for a Table object.

   * @param data - The data to display
   * @param metaData - meta data describing the row data (type, editable, etc)
   * @param rowIndex - The position of the row (used to alternate row classes)
  */
  function TableRow(data, metaData, rowIndex, parent) {
    this.register();
    this._data = data;
    this._metaData = metaData;
    this._rowIndex = rowIndex;
    this._fields = [];
    this._parent = parent;

    //setup the field objects based on TEMPLATE INFO
    var newField;
    for (var index = 0; index < this._metaData.length; index++) {
      var fieldMetaData = this._metaData[index];
      var val = this._data[ fieldMetaData.name ];

      switch(fieldMetaData.type) {
        case 'text':
          newField = new IPEField(val, {writable: fieldMetaData.editable,
                                        inputType: fieldMetaData.type ,
                                        inputSize: 20});
          break;
        case 'percent':
        case 'number':
          newField = new IPEField(val, {writable: fieldMetaData.editable,
                                        inputType: fieldMetaData.type,
                                        inputSize: 20,
                                        validator: null,
                                        inputMaxLength: null,
                                        readOnlyClass: null,
                                        valueType: 'percent'});
          break;
        case 'textarea':
          newField = new IPETextAreaField(val, {writable:fieldMetaData.editable, rows:2, cols:10});
          break;
        case 'date':
          newField = new CalendarField(val, {editable: fieldMetaData.editable, min:1901, max:2099});
          break;
        default:
          break;
      }

      //pass along some parent state settings to my fields
      newField.setShowModified(this._parent.isShowModified());
      //parent handles change event
      newField.addEventListener('change', this._parent);

      this._fields.push(newField);
    }
  }

  TableRow.prototype = set(new Component(), {
    setValue : function(data) {
      this._data = data;

      for (var index = 0; index < this._metaData.length; index++) {
        var fieldMetaData = this._metaData[index];
        var val = this._data[ fieldMetaData.name ];

        switch(fieldMetaData.type) {
          case 'text':
          case 'textarea':
          case 'percent':
          case 'date':
            this._fields[index].setValue(val);
            break;
          default:
            break;
        }
      }
    },

    getValue : function() {
      var obj = {};
      for (var index = 0; index < this._metaData.length; index++) {
        var fieldMetaData = this._metaData[index];
        obj[ fieldMetaData.name ] = this._fields[index].getValue();
      }

      return obj;
    },

    unregister : function() {
      for (var index = 0; index < this._fields.length; index++) {
        this._fields[index].unregister();
      }

      Component.prototype.unregister.apply(this, arguments);
    },

    renderHtml : function(h) {
          h.push('<tr id="' + this.id + '" class="' + (this._rowIndex % 2 == 0 ? "a": "b") + '">');

      for (var index = 0; index < this._fields.length; index++) {
              h.push('<td class="editable_cell">');
        this._fields[index].renderHtml(h);
              h.push('</td>');
      }
            h.push('<td class="textright">' +
                      '<a class="delete_button"' +
                          'href="#" id=""' +
                          'onclick="' + this._parent.fireCode("deleteRow", this.id) + 'return false;" title="' + jsSFMessages.COMMON_Remove + '"></a>' +
                   '</td>' +
                 '</tr>');
    },

    setModified : function(bool) {
      this._modified = bool;
      for (var index = 0; index < this._fields.length; index++) {
        this._fields[index].setModified(bool);
      }
    },

    isModified : function() {
      return this._modified;
    },

    setAllModified : function(bool) {
      this.setModified(bool);
    }
  });

/**
 * Constructor for the FindUserField widget.  This widget consists of an input and
 * a hidden field, backed by a AutoCompleteFindUser JS widget.  The display name
 * is stored in the input field, while the userId is stored in the hidden field.
 * This object is merely a wrapper for the AutoCompleteFindUser widget which adds
 * event listening and state saving functionality.
 *
 * @param value         The userId value for this field (not to be confused
 *                      with the name that is displayed).
 * @param inputSize     The size of the input tag displayed on the page.
 * @param maxDisplayed  Maximum dropdown items to display when a user attempts
 *                      to find a user.
 * @param opts          An object containing parameters to control display
 *                      and behavior.
 *
 *                      userNameHidden (optional): If true, hide the username.
 */
function FindUserField(value, inputSize, maxDisplayed, opts) {
  this.register();

  this._inputSize = (inputSize) ? inputSize : 30;
  this._maxDisplayed = (maxDisplayed) ? maxDisplayed : 5;

  if (opts) {
    this._userNameHidden = opts.userNameHidden ? opts.userNameHidden : true;
    this._alwaysLoad = (opts.alwaysLoad == undefined) ? false : opts.alwaysLoad;
  }

  this.init(value);

}

FindUserField.prototype = (function() {

   function selectUserCB(obj) {
      var userDisplayValue = $(obj.id+"_input").value; // display name
      var userIdValue = $(obj.id+"_hidden").value; // userId

      obj.setValue({"userId": userIdValue, "userDisplayValue": userDisplayValue});
      obj.setUserDisplayValue(userDisplayValue);

      obj.dispatch('select_user',  {"userId": userIdValue, "displayName": userDisplayValue});
  };

  return set(new Component(), {
    init : function(value) {
      this.setValue({userId:value, userDisplayValue:''});
    },

    setValue : function(data) {
      this._userId = data.userId;
      this._userDisplayValue = data.userDisplayValue;

      var userIdInput = $(this.id+"_hidden");
      if (userIdInput) {
        if (!this._userId || this._userId.trim().length == 0) {
          userIdInput.value = "";
        } else {
          userIdInput.value = this._userId;
        }
      }

      var userDisplayInput = $(this.id+"_input");
      if (userDisplayInput) {
        if (!this._userDisplayValue ||
            this._userDisplayValue.trim().length == 0) {
          userDisplayInput.value = "";
        } else {
          userDisplayInput.value = this._userDisplayValue;
        }
      }
    },

    getValue : function() {
      return { userId: this._userId, userDisplayValue: this._userDisplayValue };
    },

    setUserDisplayValue : function(displayValue) {
      this._userDisplayValue = displayValue;
    },

    getUserDisplayValue : function() {
      return this._userDisplayValue;
    },

    renderHtml : function(h) {
      h.push("<span class='autocompspan' style='z-index:998;'>" +
                  "<input type='text' id='" + this.id + "_input' name='" +
                    this.id + "_input' class='autocompinput' style='z-index:998'" +
                  " size='" + this._inputSize + "' onfocus= '" + this.fireCode("focus") + "' value='" +
                    Util.escapeHTML(this._userDisplayValue) + "'/>" +
                  "</span><input type='hidden' value='" + this._userId + "' id='" +
                    this.id + "_hidden' name='" + this.id + "_hidden'/>");
    },

    focus : function() {
      // lazily instantiate the AutoCompleteFindUser widget
      // Note that this control must be created *after* the DOM elements are
      // rendered to the page.  That is why this widget is created after the
      // rendering phase.
    	if (!this._autocompleteFindUserCtrl || this._alwaysLoad) {
        var inputElemId = this.id + "_input";
        var hiddenElemId = this.id + "_hidden";
        var me = this; // need this to keep 'this' scope in callback
        this._autocompleteFindUserCtrl = new AutoCompleteFindUser(
                                            { textElementId: inputElemId,
                                              maxResultsDisplayed: this._maxDisplayed,
                                              minQueryLength: 2, findtype: 'fullname', hideUserName: 0,
                                              enablePhoto: false, enableAutoCompFind: true,
                                              selectedUsersElementId: hiddenElemId,
                                              onItemSelect: function() {
                                                selectUserCB(me);
                                              },
                                              errMsg: jsSFMessages.COMMON_AUTOCOMP_FINDUSER_ERR,
                                              v10: false,
                                              supressAlert:true});
      }

      // focus on input element
      var userDisplayInput = $(this.id+"_input");
      userDisplayInput.focus();
      userDisplayInput.select();
    },


    /**
     * State of a FindUser widget consists of the value in the input field
     * and a value in the hidden field which contains the userid for the
     * displayed user.
     * @param inState An object containing the input field value and displayed
     * user name.  See setValue() for clues on how object should look.
     */
    deserializeState : function(inState) {
      this.setValue(inState);
    },

    /**
     * Returns the current state of this widget.
     *
     * @return An object containing the input field value and displayed
     * user name.  See setValue() for clues on how object should look.
     */
    serializeState : function() {
      return this.getValue();
    }
  });

})();


/**
 * Utility component that produces paragraphs of lorem ipsum. Very useful
 * for testing out how text will display in a container.
 * To use, instantiate the component like this:
 *
 * this.lorem = new SFLoremIpsum();
 *
 * Then, in your renderHTML, you can do something like this:
 *
 * h.push(this.lorem.getLines(20));
 *
 * to get 20 lines of lorem ipsum text.
 */
function SFLoremIpsum() {
    this._paragraphs = [];
    this.init();
}

SFLoremIpsum.prototype = (function() {
    return {
        /**
         * Loads the paragraphs array with 10 paragraphs of lorem ipsum
         */
        init : function() {
            this._paragraphs.push("Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nulla vulputate dictum pede. Duis viverra aliquam pede. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Sed tristique venenatis metus. Cras et est. Mauris ultrices. Nulla interdum. Vivamus fermentum, elit nec dictum malesuada, libero nisi fringilla neque, eu fermentum purus dui eu sapien. Ut laoreet arcu eget augue. Curabitur egestas auctor ante. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam suscipit semper metus. Curabitur bibendum arcu in est.");
            this._paragraphs.push("Proin semper, sapien nec lacinia vehicula, massa orci ornare urna, in cursus libero massa in arcu. Aenean rhoncus eleifend mi. Mauris lacus nunc, fringilla ac, bibendum eget, semper vel, metus. Mauris consequat. Praesent elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aliquam tempor tellus. Praesent ullamcorper cursus enim. Ut magna augue, commodo ac, fermentum sed, adipiscing cursus, erat. Nulla quis quam tempus libero sagittis dictum. Quisque dignissim eros non risus.");
            this._paragraphs.push("Mauris bibendum dictum arcu. In mollis, dui vitae interdum ultrices, sem sapien aliquet risus, semper pulvinar urna leo sit amet arcu. Mauris non sapien. Aliquam aliquet mi eu urna. Phasellus ac nibh ac magna gravida malesuada. Ut id dolor. Duis vitae lectus a lectus mollis lacinia. Duis id erat et tortor iaculis viverra. Integer porttitor, eros quis tempor vulputate, lectus erat fermentum lorem, sollicitudin faucibus tortor ante at nisl. Maecenas id risus ut nibh pharetra sollicitudin. Nam arcu lorem, tempus et, dictum at, vulputate vel, nunc. Aliquam ante. Integer aliquet, mi sit amet imperdiet rutrum, lectus felis imperdiet est, nec condimentum lorem arcu in nunc. Suspendisse eleifend dignissim nisi. Aliquam gravida. Aliquam nec leo. Suspendisse laoreet. Donec id urna. Quisque aliquam pulvinar ante.");
            this._paragraphs.push("Nunc imperdiet, urna vitae tristique mattis, arcu turpis scelerisque orci, non convallis lorem magna sit amet magna. Quisque turpis lacus, aliquet aliquet, gravida ac, varius in, orci. Duis vel sapien ac elit porttitor faucibus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed odio arcu, malesuada non, tristique eu, facilisis malesuada, nisi. Cras hendrerit lorem vitae augue. Nam at magna sed leo suscipit vulputate. Etiam nisl. Aenean pretium pretium sem. Donec nec tortor sed ligula auctor faucibus. Curabitur tincidunt imperdiet eros.");
            this._paragraphs.push("Proin mollis. Phasellus hendrerit lacinia sem. Nullam vestibulum rutrum tellus. Etiam in dui. Vestibulum interdum libero ac orci. Cras a nunc. In tellus nibh, lobortis at, sollicitudin at, dapibus eu, lorem. Donec dapibus. Nulla eget ligula. Nullam ante. Suspendisse vitae urna. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quis lectus. Etiam ac purus eu nibh dignissim laoreet. Donec aliquet. Sed arcu lorem, lobortis non, euismod eget, consectetuer eu, leo. Nullam gravida nunc a massa. Nulla nisl ligula, faucibus eu, pulvinar id, cursus in, odio. Sed sed tellus. Pellentesque at dui.");
            this._paragraphs.push("Morbi tortor mi, feugiat posuere, dapibus sit amet, viverra ut, turpis. Aliquam hendrerit nisi. Sed lacinia elit eget purus. Maecenas varius neque nec ligula. Curabitur quis est. Suspendisse imperdiet. Mauris nec diam sit amet leo ultrices pharetra. Praesent placerat sodales urna. Donec vel augue porta orci lobortis vehicula. Cras egestas diam sit amet purus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas leo. Nulla facilisi. Fusce suscipit interdum elit. Vivamus et diam ac urna gravida suscipit.");
            this._paragraphs.push("Sed a nisi. Phasellus fringilla nisl ut erat. Duis adipiscing. Aliquam erat volutpat. In euismod ligula non odio. Phasellus fermentum aliquet mauris. Suspendisse gravida magna vel metus. Nullam vel dui vitae nunc vestibulum feugiat. Curabitur consectetuer. Vestibulum a metus. Nullam sed ipsum quis lectus faucibus porttitor.");
            this._paragraphs.push("Mauris tempor euismod lacus. Integer porttitor hendrerit dolor. Vivamus dapibus. Quisque in dui vitae purus vestibulum sollicitudin. Donec dui. Maecenas in mi. Vivamus vulputate dui eget sem. Cras sit amet nulla vel eros semper vulputate. Donec nec sapien. Ut augue elit, lobortis nec, ullamcorper aliquam, pharetra sed, velit. Aliquam odio quam, ultrices quis, consequat nec, varius et, orci. Integer tellus. In hac habitasse platea dictumst. Nam at dolor. Praesent lacus. Aenean tortor elit, molestie a, pulvinar et, lacinia at, libero. Integer orci elit, tincidunt sed, luctus consequat, ultricies at, velit. Donec bibendum sagittis sem.");
            this._paragraphs.push("Integer vel arcu id orci volutpat dignissim. Pellentesque vel dui a libero sodales rhoncus. Vivamus tempus, orci sed ultrices auctor, tellus mi rutrum ante, nec hendrerit neque nunc sit amet eros. Maecenas dapibus tellus ac neque. Nunc quis justo id sem cursus mollis. Sed faucibus metus at leo. Aenean pellentesque, lorem eu luctus dapibus, odio nunc imperdiet est, eu elementum leo diam id enim. Mauris semper magna eu eros. Nulla iaculis eros eu mauris. Etiam varius.");
            this._paragraphs.push("Nunc rhoncus volutpat ipsum. Suspendisse commodo tellus vitae turpis. Praesent turpis sapien, molestie non, pharetra non, rhoncus at, mi. Vivamus dignissim, orci quis eleifend scelerisque, neque arcu pulvinar leo, ut posuere neque tellus et purus. Pellentesque est. Mauris dolor dolor, egestas non, sagittis id, consequat eu, dolor. Vestibulum ipsum ligula, sagittis eu, suscipit eu, iaculis quis, ipsum. Duis eu sem. In lobortis volutpat nunc. Aenean imperdiet. Mauris sed eros. Cras vulputate, massa a ullamcorper iaculis, leo lectus pharetra lacus, a hendrerit justo odio sit amet risus.");
        },
        /**
         * The method that actually returns the paragraphs of lorem ipsum....
         * @param numLines Number of lines you want to display
         */
        getLines : function(numLines) {
            var retVal = [];
            var ref = 0;
            for (var i=0;i<numLines;i++) {
                if (ref > 9) ref=0;
                retVal.push("<p>" + this._paragraphs[ref] + "</p>");
                ref++;
            }
            return retVal.join("")
        }
    }
})();


/**
 * This is the constructor for the IPE field.
 *
 * The IPE state: The state is defined as the value in the IPE's input
 * field as well as the modified flag. Any observer registered with this
 * component will receive that state as per the event type.
 *
 * @param value
 * @param config
 *   - writable
 *   - inputType
 *   - inputSize
 *   - validator (optional)
 *   - inputMaxLength (optional)
 *   - readOnlyClass (optional)
 *   - valueType (optional)
 *   - defaultValue (optional) - standard default value when field is empty
 */
function IPEField(value, config) {
  this.register();


  if(config) {
     this._writable = config.writable == false ? config.writable : true;
     this._inputType = config.inputType ? config.inputType : 'text';      // not used
     this._inputSize = config.inputSize ? config.inputSize : 20;          // not used
     this._defaultValue = config.defaultValue ? config.defaultValue : "";

     this._inputMaxLength = config.inputMaxLength ? config.inputMaxLength : 30;   // not used
     this._valueType = config.valueType ? config.valueType : 'text';              // Should not used

     if (config.validator) {
       this._validator = config.validator;
       this._validatorActions = [];
     }


     this._readOnlyClass = (config.readOnlyClass != undefined)?config.readOnlyClass:'readonly';
  }

  if(value) {
	    this.setValue(value);
  }
}

IPEField.prototype = (function() {

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
    if (me.isShowModified()) {
      var input = $(me.id);

      if (input && input.id) {
        if (me._writable) {
          input = input.previousSibling;
        }

        if (bool) {
          YAHOO.util.Dom.addClass(input.id, 'unsaved');
        }
        else {
          YAHOO.util.Dom.removeClass(input.id, 'unsaved');
        }
      }
    }
  }


  return set(new Component(), {
    /** When setting the value for this component, we need to
        set the value for the associated anchor. */
    setValue : function(value) {
      this._value = value;
      if ( this._value && this._valueType == 'text' && value.trim().length > 0) {
    	  this._escapedValue = Util.escapeHTML(this._value).replace(/\n|\r\n?/g, "<br/>");
      } else {
    	  this._escapedValue = this._value;
      }

      var input = $(this.id);

      // Do we need to escape the value
      if (input) {
        // this is the input
        input.value = value;

        // this is the anchor
        if (this._writable) {
          if (!value || (this._valueType == 'text' && value.trim().length == 0)) {
            input.previousSibling.innerHTML = '['+jsSFMessages.COMMON_Click_to_edit+']';
            YAHOO.util.Dom.removeClass(input.previousSibling.id, 'editable');
            YAHOO.util.Dom.addClass(input.previousSibling.id, 'empty');
          } else {
            input.previousSibling.innerHTML = this._escapedValue;
            YAHOO.util.Dom.removeClass(input.previousSibling.id, 'empty');
            YAHOO.util.Dom.addClass(input.previousSibling.id, 'editable');
          }
        }
        else {
          input.innerHTML = this._escapedValue;
        }

      }
    },

    //getValue(); if writeable and visible (element exists because it's visible) return the elements value
    getValue : function() {
      if (this._writable && $(this.id)) {
        var thisValue = $(this.id).value;
        if(thisValue == this._defaultValue) {
            thisValue = "";
        }
        if (this._valueType &&
            (this._valueType == 'percent' || this._valueType == 'number') ) {
          return Number( thisValue );
        }
        else {
          return thisValue;
        }
      }
      else {
        return this._value;
      }
    },

    renderHtml : function(h) {
      var anchorClass = 'editable';
      var anchorString = this._escapedValue;

      if (!this._value || this._value.length == 0) {
        anchorString = '['+jsSFMessages.COMMON_Click_to_edit+']';
      }

      if (this._writable) {
        h.push("<a href='javascript:void(0)' id='"+this.id+"_a' onfocus='" + this.fireCode("focus") + "' onclick='return false;' " +
               " class='"+anchorClass+"'>" +  anchorString + "</a>" +
               "<textarea id='" + this.id + "'");
        h.push(" onblur='" + this.fireCode("blur") + "'" +
               " style='display:none;'>" +
               Util.escapeHTML(this._value) + "</textarea>" +
               "<div id='" + this.id+ "_error' style='display:none; color: rgb(255, 0, 0);'></div>");

      }
      else {
        h.push('<span id="' + this.id + '" class="' + this._readOnlyClass + '">' +   (this._escapedValue ? this._escapedValue : "") + '</span>');
      }
    },


    focus : function() {
      if(this._writable){
        var input = $(this.id);
        var link = input.previousSibling;
        var h = link.offsetHeight;
        link.style.display = 'none';
        input.style.display = '';
        input.style.height = h + "px";
        input.focus();
        input.select();
        this.oldValue = input.value;
      }

    },

    blur : function() {
      var input = $(this.id);
      var link = input.previousSibling;
      var oldState = this.serializeState();
      var error = input.nextSibling;

      input.style.display = 'none';
      link.style.display = '';

      input.value = input.value.trim();

      this.setValue(input.value);
      var newValue = input.value;

// If the last name is set to "Thompson" and user clears the field, the background for
// the field will turn red. Now if the user types in "Thompson" again, the field's background color won't
// get cleared if we check new value against old value.
      if (newValue != this.oldValue) {

        // Only update the modified flag if it's not already
        if (!this.isModified())
            this.setModified(true);

          this.dispatch("change",  {"oldvalue":this.oldValue, "newvalue":newValue});
          // retrieve the new state of this IPE for the undo manager
          var newState = this.serializeState();
          // register this change event with the undo manager
          undoManager.add(createUndoEvent(this, oldState, newState));
          delete this.oldValue;
      }

     if(this.isValid(newValue)) {
        error.style.display = 'none';
     } else {
        _highlight(this, true);
        link.style.display = '';
        input.style.display = 'none';
        error.style.display = '';
        error.innerHTML = this.appendErrorIcon(this._lastErrorMessage);
      }
    },

    setModified : function(bool) {
      this._modified = bool;
      _highlight(this, bool);
    },

    isModified : function() {
      return this._modified;
    },

    /**
     * The IPE state consists of the value in the input field and the modified flag.
     * Therefore, if the state needs to be changed, the caller must indicate the new
     * value for the input field as well as the modified flag.
     *
     * @param newState  an object representing the input field value and the modified flag.
     */
    deserializeState : function(newState) {
      this.setValue(newState.value);
      this.setModified(newState.modified);
        this._defaultValue = newState.defaultValue;
    },

    /**
     * @return an object representing the IPE's current input field value and
     *         the modified flag.
     */
    serializeState : function() {
      return {value:this._value, modified:this._modified,
      defaultValue:this._defaultValue ? this._defaultValue : ""};
    },

    isValid : function (text) {
         if(this._writable) {
         var errors = [];
         var warnings = [];
         // Text equals default value, then set text to "".
         if(text == this._defaultValue) {
           text = "";
         }

         // string is needed for this._validator.validate(), cannot be a Number since validator uses
         // string methods.
         text = text.toString();

         if(!this._writable || !this._validator ||!this._validator.validate(this.id, errors, warnings, text)) {
            return true;
         }
         this._lastErrorMessage = errors[0];
         return false
         }
         return true;
    },

    getLastValidationError : function () {
      return this._lastErrorMessage;
    },


    bindValidators: function() {
        if(this._validatorActions) {
          for(var idx= 0; idx< this._validatorActions.length; idx++){
            var validatorActionItem = this._validatorActions[idx];
            if(validatorActionItem.maxLength > -1) {
              this._validator.add(validatorActionItem.name, validatorActionItem.id, validatorActionItem.formater,
                            validatorActionItem.required, {maxLength:validatorActionItem.maxLength});
            }
            else {
              this._validator.add(validatorActionItem.name, validatorActionItem.id, validatorActionItem.formater,
                            validatorActionItem.required);
            }
          }
        }
    },

    addToValidatorBindings: function(nameval, idval, formatval, reqval, maxLength ) {
      if(this._validator && this._writable) {
        this._validatorActions [this._validatorActions.length ] = { "name" : nameval, "id": idval,
                                                                    "formater": formatval, "required": reqval,
                                                                    "maxLength" :maxLength } ;
      }
    }
  });

})();