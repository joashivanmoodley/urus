//! include /ui/uicore/css/components/rteditor.css
//_
// $Id: rteditor.js 121880 2011-01-14 21:52:02Z svn $
//

/**
 * SuccessFactors' Rich-text editor.
 *
 * @param (optional) value                    - the initial value of the RTEditor.  This
 *                                              should be a string containing HTML.
 *
 * @param (optional) options                  - configuration options for the RTEditor.
 *
 * @property name: (string)                   - input field name for a backing hidden input.
 *                                              When a containing form is submitted, the name specified
 *                                              here will be sent containing the html the user typed.  If
 *                                              not specified, there will be no hidden backing input field.
 *
 * @property legalScan                        - Enables the Legal Scan button if true
 *
 * @property manuallyInit                     - If this property is set, then the RTE iframe used on Firefox will not be auto-
 *                                              initialized when the RTE control loads.  Necessary to support Firefox in cases
 *                                              in which the RTE is displayed inside a container that is initially set to CSS
 *                                              style 'display:none', such as in the Beige Dialog.  The RTE iframe cannot be
 *                                              auto-initialized in such cases because it is not yet ready for initialization
 *                                              at the time the control is loaded because parent container is set to
 *                                              'display:none'. 
 *
 *                                              Note:  There is also a function with the same name as this config options
 *                                              property.  That function is used in conjunction with this property.  The
 *                                              function 'manuallyInit()' must be called from the same routine that causes the
 *                                              CSS 'display' property on the parent container to be set to 'block'. 
 *
 * @property notebook                         - Includes the Notebook button in the toolbar if true
 *
 * @property notebook.event                   - JUIC event to dispatch if the Notebook icon is clicked
 *
 * @property readOnly                         - Makes the RTE read-only if true
 *
 * @property spellCheck                       - Enables the Spell Check button if true
 *
 * @property waca                             - Enables the Writing Assistant button if true
 *
 * @property waca.employeeId                  - Employee id for Writing Assistant
 *
 * @property waca.competencyId                - Competency id for Writing Assistant
 * 
 * @property waca.competencyLocale            - Competency locale for Writing Assistant
 *
 * @property absolutePosition                 - Enables absolute positioning (can be in relation to parent element)
 *
 * @property absolutePosition.left            - Absolute position left edge
 *
 * @property height                           - Static height of the component, defaults to _DEFAULT_RTE_HEIGHT
 *
 * @property width                            - Static width of the component, defaults to 100%
 *
 * @property textpane.background              - Text pane background color
 *
 * @property textpane.border                  - Text pane border configuration
 *
 * @property textpane.border.color            - Text pane border color, defaults to _DEFAULT_TEXTPANE_BORDER_COLOR
 *
 * @property textpane.border.style            - Text pane border style, defaults to _DEFAULT_TEXTPANE_BORDER_STYLE
 *
 * @property textpane.fontFamily              - Text pane default CSS font-family, or none
 *
 * @property textpane.fontSize                - Text pane default CSS font-size, or none
 *
 * @property toolbar                          - Toolbar configuration
 *
 * @property toolbar.background               - Toolbar background color
 *
 * @property toolbar.border                   - Toolbar border configuration
 *
 * @property toolbar.border.color             - Toolbar border color, defaults to _DEFAULT_TOOLBAR_BORDER_COLOR
 *
 * @property toolbar.border.style             - Toolbar border style, defaults to _DEFAULT_TOOLBAR_BORDER_STYLE
 *
 * @property toolbar.buttons                  - Toolbar buttons configuration
 *
 * @property toolbar.buttons.border.color     - Toolbar buttons border color
 *
 * @property toolbar.hide                     - Hides the toolbar if true
 *
 * @property toolbar.sub                      - Sub-toolbar options
 *
 * @property toolbar.sub.background           - Sub-toolbar background color
 *
 * @property toolbar.sub.border.color         - Sub-toolbar border color
 *
 * @property toolbar.sub.buttons              - Sub-toolbar buttons configuration
 *
 * @property toolbar.sub.buttons.border.color - Sub-toolbar buttons border color
 *
 *
 * Events dispatched:
 *
 * Event 'change'       Fired when any kind of a change or a mouse click occurs inside the RTE
 *
 * Event 'click'        Fired when a mouse click occurs inside the RTE
 *
 * Event 'clickIFrame'  Fired when a mouse click occurs inside the RTE iframe on FF.  Not used in IE environment.
 *                      RTEditor API user should subscribe to the 'clickIFrame' event to avoid detecting the same mouse
 *                      click twice if he is already listening to the DOM onClick from a parent HTML component.
 *
 */

function RTEditor(value, options) {
    assert({object:1,undefined:1}[typeof options], "options argument is not an object");

    // The following will determine the instance number for this instance.
    // The instance number will then be used to give this instance a uniquely
    // named global reference, which will be passed to the Keyoti RapidSpell.
    // The Keyoti RapidSpell requires a global reference to set spelling
    // corrections.
    if (RTEditor.prototype.totalInstances) {
        ++ RTEditor.prototype.totalInstances;
    } else {
        RTEditor.prototype.totalInstances = 1;
    }
    this.numInstance = RTEditor.prototype.totalInstances;
    this._gname = 'juic_RTEditor_' + this.numInstance;
    window[this._gname] = this;

    this.setValue(value);
    this._valueOriginal = this._valueSet;
    this._options = options||{};

    // An alternative gname (global name) is based on the hidden input field name.
    // The alternative gname is used by routines which emit JavaScript before the main gname is known.
    // The alternative gname is not as safe as the main gname because it is not guaranteed unique as the main gname,
    // as hidden input field names are not guaranteed to be unique.
    if (this._options.name) {
        this.gnameAlt = 'juic_RTEditor_alt_' + this._options.name;
        window[this.gnameAlt] = this;
    }

    if (!this._options.height) this._options.height = this._DEFAULT_RTE_HEIGHT;

    // The following will set text pane height.  Toolbar height is subtracted from total RTE height as long as the
    // configuration options do not specify the 'toolbar.hide' or 'readOnly' modes.
    this._paneHeight = (this.isReadOnly() || this.isToolbarHidden()) ? this._options.height
                                                                     : this._options.height - this._DEFAULT_TOOLBAR_HEIGHT;


    if (this._options.width) this._paneWidth = this._options.width;

    assert({string:1,undefined:1}[typeof this._options.name], "options.name is not a string");

    this._init();
}

RTEditor.msgs = window.jsSFMessages || {}; // This is for Internationalization

RTEditor.prototype = (function() {

    // prefer contentEditable when available--it doesn't require a
    // heavy weigh IFRAME, and does not potentially have race
    // condition with the onload used to fill in the content.
    //
    // Note: contentEditable is also available on Safari, but
    // designMode seems to work better.  It's probably some bug that
    // can be fixed in rte-styles.css to make contentEditable work in
    // Safari too.  Once that works, the better test will be to see if
    // !/Gecko/.test(...) (until FF 3 which reportedly supports
    // contentEditable)
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var isSafari = /Safari/.test(navigator.userAgent);
    var useContentEditable = isSafari || /MSIE/.test(navigator.userAgent);

    function hook(th1s, func) {
        return function() { return func.apply(th1s, arguments); };
    }

    /**
     * TBBtn is a private component that handles the toolbar buttons in the rich text editor.
     *
     * @param     title                 - localized text to associate with the button and tooltip
     *
     * @param     pix                   - the background image offset (an integer pixel offset), or a color string.
     *                                   (typeof operater determines what offset), or a color string.  (typeof operater
     *                                   determines what is displayed).
     *
     * @param     options               - button configuration options
     *
     * @property  options.border color  - Buttons border color, defaults to _DEFAULT_BORDER_COLOR
     * @property  options.disabled      - If true, the button should not change appearance due to mouse hovers
     *
     */
    function TBBtn(title, pix, options) {
        this.title = title;
        this.pix = pix;

        this._options = options || {};

        this.register();
    }

    TBBtn.prototype = set(new Component(), {
        _DEFAULT_BORDER_COLOR: "#ececec",
        _active : 0,
        _hover : 0,
        _pressed : 0,

        renderHtml : function(h) {
            h.push( "<div id='",this.id,"' style='"+                        // Using an outer div for margin and border
                        "border-color:",this._getOptBorderColor(),";'"+      // so that the layout still looks the same in Quirks mode.                        
                        "class='nrte_button_div'>"+
                        "<a href='#' id='link_icon_",this.id,"'title='",escapeHTML(this.title),"' style='" 
                            );

            if ("number" == typeof this.pix) {
				h.push(     "background-repeat:no-repeat;"+
                            // TODO: for FF "...position: 1 ..." seems to work better
                            "background-position: 0 ",this.pix,"px;");
            } else {
                h.push(     "background-color:",this.pix,";");
            }

            if (!this._options || !this._options.disabled) {
                h.push(     "cursor:pointer;");
            }
            h.push(         "'"); // end of the style attribute
            
            h.push(         "class='nrte_button_link");
			
            if ("number" == typeof this.pix) {
                h.push(" nrte_button_icon");
            }
			
            h.push("'"); // end of the class attribute

            if (!this._options || !this._options.disabled) {
                   h.push(  " onclick='",this.fireCode("_click"),"return false;'");
                   h.push(  " onmousedown='",this.fireCode("_down"),"'");
                   h.push(  " onmouseup='",this.fireCode("_up"),"'");
                   h.push(  " onmouseover='",this.fireCode("_over"),"'");
                   h.push(  " onmouseout='",this.fireCode("_out"),"'");
            }

            h.push(         " ondragstart='javascript:return(false);'"); // This disables mouse dragging in IE.
            h.push(         " unselectable='on'>"); // end of the button div

            h.push(         "<span style='display:none;'>",escapeHTML(this.title),"</span>"+
                        "</a>"+
                    "</div>");
        },

        // Returns the (approximate) pixel position of this component.
        getPos : function() {
            var el = $(this.id);
            return {x:el.offsetLeft,y:el.offsetTop};
        },

        // Handles a click on the <a> tag
        _click : function() {
            this.dispatch("click");
        },

        /**
         * Returns the border color specified in the options, or _DEFAULT_BORDER_COLOR
         */
        _getOptBorderColor : function() {
            return (this._options && this._options.border && this._options.border.color) ? this._options.border.color
                                                                                         : this._DEFAULT_BORDER_COLOR;
        },

        /**
         * Updated button border appearance, making it respond to mouse movements to make it appear active
         * Makes the button appear active only if it is not in the 'disabled' state
         */
        _updateView : function() {
            var el = $(this.id);
            if (!el) return;

            var bc = this._getOptBorderColor();

            if (!this._options || !this._options.disabled) {
                if (this._active) {                     // Indicate that the button mode is active even if the mouse has not yet moved off the button
                    bc = "#808080 #fff #fff #808080";
                } else if (this._pressed) {
                    bc = "#808080 #fff #fff #808080";
                } else if (this._hover) {
                    bc = "#fff #808080 #808080 #fff";
                }
            }

            el.style.borderColor = bc;
        },

        setActive : function(value) {
            this._active = value;
            this._updateView();
        },

        _over : function() {
            // hover highlight
            this._hover = 1;
            this._updateView();
        },

        _out : function() {
            // initial state
            this._hover = 0;
            this._pressed = 0;      // When the mouse pointer is out, the button is no longer be pressed.
            this._updateView();
        },

        _down : function() {
            // depressed look
            this._pressed = 1;
            this._updateView();
        },

        _up : function() {
            // raised look
            this._pressed = 0;
            this._updateView();
        }

    });


    /**
     * TBColor is a private component that handles the toolbar color button.  It uses TBBtns to display the toolbar
     * icon and the color selection swatches.
     *
     * @param options - Button options
     *
     */
    function TBColor(optionsMButton, optionsToolbar) {
        this._optionsMButton = optionsMButton || {};
        this._optionsToolbar = optionsToolbar || {};

        this.register();

        var msgs = RTEditor.msgs; // This is for Internationalization
        this.btn = new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR || "Text Color", -240, this._optionsMButton);
        this.btn.addEventListener("click", {el:this, handleEvent:function() {
            // "this" is the event handler object
            this.el.toggleDisplay();
        }});

        this.colors = [
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_RED || "Red", "red", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_ORANGE || "Orange", "#ff6600", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_YELLOW || "Yellow", "yellow", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_GREEN || "Green", "green", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_BLUE || "Blue", "blue", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_VIOLET || "Violet", "#6363ff", this._optionsToolbar.buttons),
            new TBBtn(msgs.COMMON_RTE_TOOLBAR_TEXT_COLOR_BLACK || "Black", "black", this._optionsToolbar.buttons)
        ];

        for (var iColor=0 ; iColor<this.colors.length ; ++iColor) {
            this.colors[iColor].addEventListener("click", {el:this, color:this.colors[iColor].pix, handleEvent:function() {
                this.el.toggleDisplay();
                this.el.dispatch("color", {color:this.color});
            }});
        }
    }

    TBColor.prototype = set(new Component(), {
        _DEFAULT_BACKGROUND_COLOR: "#eee",
        _DEFAULT_BORDER_COLOR: "#ccc",

        cleanup: function() {
            if (this.colors && this.colors.length) {
                for (var iColor=0; iColor < this.colors.length; ++iColor) {
                    this.colors[iColor].cleanup();
                }
            }
            this.unregister();
        },

        renderHtml : function(h) {
        	////For RTE related issue modified by Manoj Adekar : Date-22-09-2010
        	this.btn.renderHtml(h);
        	h.push( "<div style='",                                                     // Using an outer div for margin and border
                        "background:",this._getOptToolbarBackground(),";",              // so that the layout still looks the same in Quirks mode.
                        "border:1px solid ",this._getOptToolbarBorderColor(),";",
                        
                        "' class='nrte_color_div' id='",this.id,
                        "'>",
                        "<ul class='nrte_color_ul' style='"+        
                            "width:",((this.colors.length*26)+4),"px;"+
                            "' onmouseover='",this.fireCode('_over'),
                            "' onmouseout='",this.fireCode('_out'),"'>");

            for (var iColor=0 ; iColor<this.colors.length; ++iColor) {
                h.push(     "<li style='border:none;display:inline;margin:0px;padding:0px;'>");
                this.colors[iColor].renderHtml(h);
                h.push(     "</li>");
            }

            h.push(     "</ul></div>");
            

        },

        _getOptToolbarBackground: function() {
            return (this._optionsToolbar && this._optionsToolbar.background) ? this._optionsToolbar.background
                                                                             : this._DEFAULT_BACKGROUND_COLOR;
        },

        _getOptToolbarBorderColor: function() {
            return (this._optionsToolbar && this._optionsToolbar.border && this._optionsToolbar.border.color)
                   ? this._optionsToolbar.border.color
                   : this._DEFAULT_BORDER_COLOR;
        },

        _over : function() {
            if (this._tid) {
                clearTimeout(this._tid);
                delete this._tid;
            }
        },
        _out : function() {
            var self = this;
            this._tid = setTimeout(function() {
                self.hideDisplay();
            }, 500);
        },
        toggleDisplay : function() {
/*
            if (!this._rendered) {
                var ul = $(this.id);
                
                for (var i=0 ; i<this.colors.length; ++i) {
                    var li = document.createElement("li");
                    set(li.style, {display:"inline",padding:"0px",margin:"0px"});
                    var h = [];
                    this.colors[i].renderHtml(h);
                    li.innerHTML = h.join("");
                    ul.appendChild(li);
                }

                this._rendered = 1;
            }
*/

            var style = $(this.id).style;
            if (style.display == "none") this.showDisplay(); else this.hideDisplay();
        },
        hideDisplay: function() {
            var elToolbar = $(this.id);
            if (elToolbar) {
                var style = elToolbar.style;
                style.display = "none";
            }
        },
        showDisplay: function() {
            var elToolbar = $(this.id);
            if (elToolbar) {
                var style = elToolbar.style;
                style.display = "block";
                var pos = this.btn.getPos();
                style.left = pos.x+"px";
				var colorElems = elToolbar.childNodes[0];
				var id = "link_icon_" + colorElems.childNodes[0].firstChild.id;
				if($(id)) $(id).focus();
            }
        }
    });

    // return the prototype of the RTEditor component
    return set(new Component(), {
        cleanup: function() {
            // Cleanup all the buttons:
            if (this._tb) {
                var tb = this._tb;
                if (tb.bold) tb.bold.cleanup();
                if (tb.italic) tb.italic.cleanup();
                if (tb.underline) tb.underline.cleanup();
                if (tb.numbers) tb.numbers.cleanup();
                if (tb.bullets) tb.bullets.cleanup();
                if (tb.indent) tb.indent.cleanup();
                if (tb.outdent) tb.outdent.cleanup();
                if (tb.createLink) tb.createLink.cleanup();
                if (tb.textColor) tb.textColor.cleanup();
                if (tb.spellCheck) tb.spellCheck.cleanup();
                if (tb.legalScan) tb.legalScan.cleanup();
                if (tb.waca) tb.waca.cleanup();
                if (tb.notebook) tb.notebook.cleanup();
            }
            this.unregister();
        },

        _DEFAULT_RTE_HEIGHT:             200,
        _DEFAULT_TEXTPANE_BORDER_COLOR:  '#ddd',
        _DEFAULT_TEXTPANE_BORDER_STYLE:  'solid',
        _DEFAULT_TEXTPANE_PADDING:       5,
        _DEFAULT_TOOLBAR_BACKGROUND:     '#f3f3f3',
        _DEFAULT_TOOLBAR_BORDER_COLOR:   '#ddd',
        _DEFAULT_TOOLBAR_BORDER_STYLE:   'solid',
        _DEFAULT_TOOLBAR_BUTTON_HEIGHT:  16,
        _DEFAULT_TOOLBAR_HEIGHT:         29,            // 28px content height + 1px upper border width 

        _init : function() {
            var self = this;
            this.register();

            function ExecCmdHandler(cmd, ui, value) {
                this.handleEvent = function() {
                    self._execCommand(cmd, ui, value);
                };
            }

            function createBtn(title, cls, cmd, ui, value) {
                var options = {
                    border: {
                        color: self._getOptToolbarButtonsBorderColor()
                    },
                    disabled: !cmd  // if cmd is not truthy then button should be disabled
                };
                var btn = new TBBtn(title, cls, options);


                btn.addEventListener("click", new ExecCmdHandler(cmd, ui, value));
                return btn;
            }

            var msgs = RTEditor.msgs; // This is for Internationalization

            this._tb = {
                bold:createBtn(msgs.COMMON_RTE_TOOLBAR_BOLD || "Bold", -32, "bold"),
                italic:createBtn(msgs.COMMON_RTE_TOOLBAR_ITALIC || "Italic", -48, "italic"),
                underline:createBtn(msgs.COMMON_RTE_TOOLBAR_UNDERLINE || "Underline", -64, "underline"),
                numbers:createBtn(msgs.COMMON_RTE_TOOLBAR_NUMBERING || "Numbering", -80, "insertorderedlist"),
                bullets:createBtn(msgs.COMMON_RTE_TOOLBAR_BULLETS || "Bullets", -96, "insertunorderedlist"),
                indent:createBtn(msgs.COMMON_RTE_TOOLBAR_INDENT || "Indent", -128, "indent"),
                outdent:createBtn(msgs.COMMON_RTE_TOOLBAR_OUTDENT || "Outdent", -112, "outdent"),
                createLink:createBtn(msgs.COMMON_RTE_TOOLBAR_HYPERLINK || "Hyperlink", -208, "createlink", true),
                textColor:new TBColor({
                                          border: {
                                              color: this._getOptToolbarButtonsBorderColor()
                                          }
                                      },
                                      this._getOptToolbarSub()),
                spellCheck:createBtn(msgs.COMMON_RTE_TOOLBAR_SPELL_CHECK || "Spell Check", this._getBackPosSpellCheck(), this._options && this._options.spellCheck ? "_popUpSpellCheck" : null),
                legalScan:createBtn(msgs.COMMON_RTE_TOOLBAR_LEGAL_SCAN || "Legal Scan", this._getBackPosLegalScan(), this._options && this._options.legalScan ? "_popUpLegalScan" : null),
                waca:createBtn(msgs.COMMON_RTE_TOOLBAR_WRITING_ASSISTANT || "Writing Assistant", this._getBackPosWACA(), this._options && this._options.waca ? "_popUpWACA" : null),
                notebook:createBtn(msgs.COMMON_RTE_TOOLBAR_NOTEBOOK || "Notebook", this._getBackPosNotebook(), this._options && this._options.notebook ? "_notebook" : null)
            };

            this._tb.textColor.addEventListener("color", {handleEvent:function(evt) {
                self._execCommand("forecolor", false, evt.color);
            }});
        },

        /**
         * Returns the content/value typed by the user,
         */
        getValue : function() {
            var el = $(this.id);
            if (!el) {
                //This RTE has not yet been rendered, so just return the initial value.
                return this._valueSet;
            }

            // IE and Safari use a content-editable div.
            // Firefox uses a design-mode iframe.

            if (useContentEditable) return el.innerHTML;

            var value = el.contentDocument && el.contentDocument.body && el.contentDocument.body.innerHTML;

            if (value && value != this._valueOriginal && isFirefox) {
                // EXP-216  Firefox may append a '<br>' tag to the end of the
                // HTML even when nothing has been entered into the text pane,
                // need to check for it and remove it.
                value = value.replace(/<br>$/g, "");
            }

            return value;
        },

        /**
         * Returns the content/value typed by the user,
         * with any special characters converted to HTML
         * escape sequences.
         */
        getValueEscaped : function() {
            return this._txtEscQuotes(this._txtEscEntities(this.getValue()));
        },
        /**
         * Returns the content/value typed by the user
         * in plain text without any HTML styling.
         *
         * All HTML entities are decoded into their plaintext equivalents
         */
        getValuePlain : function() {
            return this._txtUnEscEntities(this._txtTranslateHTML(this.getValue()));
        },
        /**
         * Returns the content/value typed by the user,
         * with any special characters converted to HTML
         * entities.
         *
         * Note: HTML entities are NOT escaped.
         */
        getValueStripped : function() {
            return this._txtTranslateHTML(this.getValue());
        },

        /**
         * Returns [true] if RTE is in the 'readOnly' mode, otherwiser returns [false].
         */
        isReadOnly : function() {
            return (this._options && this._options.readOnly);
        },

        /**
         * Returns [true] if the RTE either has no value or if the value is only whitespace.
         */
        isValueBlank : function() {
            var valuePlain = this.getValuePlain();
            if (!valuePlain) return true;

            var valuePlainTrimmed = valuePlain.replace(/^(\s|\xA0)+|(\s|\xA0)+$/mg,"");
                                                                        // The character '\xA0' is the non-breaking space character
                                                                        // used by IE that is not detected by the '\s' escape sequence on IE.
            return (!valuePlainTrimmed || valuePlainTrimmed.length == 0);
        },

        /**
         * Returns [true] if the RTE contents have changed since the RTE was instantiated.
         */
        hasValueChanged: function() {
            return this._valueOriginal != this.getValue();
        },

        /**
         * Returns [true] if the toolbar is in the 'toolbar.hide' mode, otherwiser returns [false].
         */
        isToolbarHidden : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.hide);
        },

        /**
         * Manually initializes the iframe, useful on Firefox only.  Works in conjunction with the
         * 'manuallyInit' option.
         */
        manuallyInit: function() {
            if (!useContentEditable && !this._ifloaded) {
                this._ifload();
            }
        },

        /**
         * Sets rich text in the RTE text pane.  Same as setValue(html)
         * Called by the Keyoti Rapid Spell.
         *
         * @param html  Rich text to set encoded in HTML
         */
        setText : function(html) {
            this.setValue(html);
        },

        /**
         * Sets rich text in the RTE text pane.
         *
         * @param html  Rich text to set encoded in HTML
         */
        setValue : function(html) {
            function cleanHtml(html) {
                // cheap trick to insure we're putting in valid HTML.  Create
                // a div, set it's innerHTML, then fetch the innerHTML from
                // it.  Setting the innerHTML causes the browser to parse the
                // innerHTML into DOM, fetching it causes the DOM to be
                // converted back to HTML.
                
                // NOTE: this does not prevent harmful or malicious HTML from
                // being displayed (scripts, etc...).  The server-side utility
                // HtmlUtils.filterHtml can take care of that.
        
                var tmpDiv = document.createElement("div");
                tmpDiv.innerHTML = html||"";
                return tmpDiv.innerHTML;
            }

            this._valueSet = cleanHtml(html);

            // Update the visual appearance with the new value only if the RTE
            // has already been rendered:
            var el = $(this.id);
            if (el) {
                if (useContentEditable) {
                    el.innerHTML = this._valueSet;
                } else {
                    if (el.contentDocument && el.contentDocument.body) {
                        el.contentDocument.body.innerHTML = this._valueSet;
                    }
                }

                if (this._options.name) {
                    // we are using the name at the moment because the id attribute
                    // is using the name value in the options object
                    //var elFormInput = $(this.id + "value");
                    var elFormInput = $(this._options.name);
                    if (elFormInput) {
                        elFormInput.value = this._valueSet;
                    }
                }
                this._update();
            }
        },

        /**
         * Sets plain text in the RTE text pane.  Mainly converts certain characters used in HTML into HTML entities so
         * that the RTE text pane does not treat them as HTML code.
         *
         * @param text  Plain text to set
         */
        setValuePlain : function(text) {
            setValue(this._txtEscEntities(text));
        },

        renderHtml : function(h) {
            var id = this.id;
            var tb = this._tb;

            var self = this;
            var tbWidth = 0;    // Toolbar width taken up by buttons and separators

            function renderButton(btn) {
                if (self._paneWidth&&(tbWidth+26+8)>self._paneWidth) return 0;  // Button will not fit inside the remaining toolbar width
                tbWidth+=26;                                                    // Add button width to used toolbar width counter

                h.push("<li class='nrte_toolbar_button_li'>");
                btn.renderHtml(h);
                h.push("</li>");

                return 1;                                                       // Button successfully appended to toolbar
            }

            function sep() {
                if (self._paneWidth&&(tbWidth+9+8)>self._paneWidth) return 0;   // Separator will not fit inside the remaining toolbar width
                tbWidth+=9;                                                     // Add separator width to used toolbar width counter

                h.push("<li class='nrte_toolbar_sep_li'>|</li>");
                return 1;                                                       // Separator successfully appended to toolbar
            }

            h.push( "<div onclick='",this.fireCode('_eventClick'),"'",          // Beginning of RTE parent div
                        " style='");
            if (this._options.absolutePosition) {
                h.push( "position:absolute;");
                if (this._options.absolutePosition.left) {
                    h.push("left:" , this._options.absolutePosition.left , "px;");
                }
                if (this._options.absolutePosition.top) {
                    h.push("top:" , this._options.absolutePosition.top , "px;");
                }
            }
            h.push( "'>");

            if (!this.isToolbarHidden() && !this.isReadOnly()) {
                h.push( "<div class='nrte_toolbar_div' style='");                // Beginning of toolbar div
                if (this._getOptToolbarBackground()) {
                    h.push( "background:" , this._getOptToolbarBackground() , ";");
                }
                if (this._getOptToolbarBorderColor()) {
                    h.push( "border-color:" , this._getOptToolbarBorderColor() , ";");
                }
//              h.push(     "overflow:hidden;");  Unfortunately hiding overflow to keep toolbar buttons inside short toolbars causes color pallete to end up under RTE pane in FF2
                if (this._paneWidth) {
                    h.push( "width:" , this._paneWidth , "px");
                }
                h.push(     "'>");
                h.push(     "<ul",
                                " unselectable='on' ondragstart='javascript:return 0'"+    // this disables mouse dragging in IE
                                " onmousedown='javascript:return 0'"+                      // this disables mouse dragging in FF
                                " id='" , id , "_toolbar' class='nrte_toolbar_div_ul'");

                if (isSafari) {
                    // In Safari we have to save the selection before the
                    // toolbar button click is handled so that the
                    // selection range can be restored when applying a
                    // toolbar button change.  Without this step, the
                    // whole text would be selected on a re-focus
                    // operation and the execCommand would apply to the
                    // entire rich text field.
                    h.push(     " onmousedown='",this.fireCode('_saveSelection'),"'");
                }

                // Had to comment out the following line because it caused the popups for Spell Check, Legal Scan, and WACA
                // disappear under the browser window.
                // h.push(" onclick='"+this.fireCode('_refocus')+"'");


                h.push(         ">");


                //Toolbar buttons will be appended only as long as they fit inside the toolbar width
                renderButton(tb.bold)
                && renderButton(tb.italic)
                && renderButton(tb.underline)
                && sep()
                && renderButton(tb.numbers)
                && renderButton(tb.bullets)
                && renderButton(tb.indent)
                && renderButton(tb.outdent)
                && sep()
                && renderButton(tb.createLink)
                && sep()
                && renderButton(tb.textColor)

                && sep()
                && renderButton(tb.spellCheck)
                && renderButton(tb.legalScan)
                && renderButton(tb.waca)
                && (this._options && this._options.notebook ? renderButton(tb.notebook) : 1)

                h.push(     "</ul>",
                        "</div>");                                              // End of toolbar div
            }

            if (useContentEditable) {                                           // Beginning of text edit pane
                // The "padding:2px" should match the padding in _ifload on the iframe's body
                h.push( "<div style='overflow:auto;padding:",this._DEFAULT_TEXTPANE_PADDING ,"px;",
                        "border-width:1px;");
                if (this._getOptTextpaneBackground()) {
                    h.push( "background:" , this._getOptTextpaneBackground() , ";");
                }
                if (this._getOptTextpaneBorderColor()) {
                    h.push( "border-color:" , this._getOptTextpaneBorderColor() , ";");
                }
                if (this._getOptTextpaneBorderStyle()) {
                    h.push( "border-style:" , this._getOptTextpaneBorderStyle() , ";");
                }
                if (this._paneHeight) {
                    //Need to subtract the padding height from the height to make the actual height appear the same.
                    h.push( "height:" , (this._paneHeight - (2*this._DEFAULT_TEXTPANE_PADDING)) , "px;");
                }
                if (this._paneWidth) {
                    //Need to subtract the padding width from the width to make the actual width appear the same.
                    h.push( "width:" , (this._paneWidth - (2*this._DEFAULT_TEXTPANE_PADDING)) , "px;");
                }
                if (isSafari) {
                    if (this._getOptTextpaneFontFamily()) {
                        h.push( "font-family:" , this._getOptTextpaneFontFamily() , ";");
                    }
                    if (this._getOptTextpaneFontSize()) {
                        h.push( "font-size:" , this._getOptTextpaneFontSize() , ";");
                    }
                }
                h.push(     "'",
                            " onclick='" , this.fireCode("_eventClickTextPane") , "'");


                if (isSafari) {
                    // end the style attribute, add an id attribute,
                    // and do NOT start another div.  The inner div in
                    // safari produces almost the reverse problem of
                    // IE's bug fixed below.
                    h.push( " id='",id,"'");
                } else {
                    // end the style attribute, and START an inner
                    // div.  The inner div is to fix an IE specific
                    // problem in which it appears as though the user
                    // is type white text on a white background
                    // (PLT-6895).

                    // The "onclick" is also need now since the nested
                    // div may not fill the containing div.  The
                    // expected behavior would be to click on the RTE
                    // and have the cursor appear.

                    h.push( ">",
                            // Beginning of IE contenteditable div
                            "<div class=\"nrte_content\" id='",id,"' style='");
                    if (this._getOptTextpaneFontFamily()) {
                        h.push( "font-family:" , this._getOptTextpaneFontFamily() , ";");
                    }
                    if (this._getOptTextpaneFontSize()) {
                        h.push( "font-size:" , this._getOptTextpaneFontSize() , ";");
                    }
                    h.push(     "'");
                }

                if (!this.isReadOnly()) {                // Setting 'contenteditable' only if not in 'readOnly' mode
                    h.push( " contenteditable='true'");
                }
                h.push(     " onblur='" , this.fireCode("_blur") , "'" ,
                            " onkeyup='" , this.fireCode("_update") , "'" ,
                            " onkeypress='" , this.fireCode("_update") , "'" ,
                            " onmouseup='" , this.fireCode("_update") , "'" ,
                            " onpaste='" , this.fireCode("_paste") , "'" ,
                            " onfocus='" , this.fireCode("_focus") , "'" ,
                            ">",this._valueSet,"</div>"); // end of the content editable div

                if (!isSafari) {
                    // close the outer div.
                    h.push("</div>");
                }

            } else {
                
                h.push( "<iframe id='",id,"' style='");                         // Beginning of FF design mode iframe
                h.push(     "border-width:1px;");
                if (this._getOptTextpaneBorderColor()) {
                    h.push( "border-color:" , this._getOptTextpaneBorderColor() , ";");
                }
                if (this._getOptTextpaneBorderStyle()) {
                    h.push( "border-style:" , this._getOptTextpaneBorderStyle() , ";");
                }
                if (this._paneHeight) {
                    h.push( "height:" , this._paneHeight , "px;");
                }
                if (this._paneWidth) {
                    h.push( "width:" , this._paneWidth , "px;");
                } else {
                    h.push( "width:100%;");
                    h.push( "-moz-box-sizing:border-box;");//This prevents the iframe from expanding past the toolbar when at 100% width
                }
                h.push(     "'");
                if (!this._options || !this._options.manuallyInit) { 
		            h.push( " onload='",this.fireCode("_ifload"),"'");
		        }
		        h.push(     " src='javascript:\"loading...\";'>");
                h.push( "</iframe>");                                           // End of FF design mode iframe
            }

            if (this._options.name) {
                // TODO: use the util method for escaping an attribute
                // type=text not type=hidden for isFormModified() to work properly.  see form_modified.js
                // type="hidden" does not get reset with a form.reset() call.  type="text" does.

                //id is being set to the _options.name because of the way the full fomr legalscan works
                //legalscan uses the id to access the value to scan, but the old rte and text area on the form
                // use the comment.key for their id.  in our case the name is set to the value of the comment.key.

                //h.push("<input type='text' style='display: none;' id='"+id+"value' name='"+this._options.name+"' value='"+
                //       value.replace(/&/g,"&amp;").replace(/\'/g,"&#39;").replace(/</g,"&lt;")+
                //       "'>");

                h.push("<input type='text' style='display: none;' id='",this._options.name,"' name='",this._options.name,"' value='",
                       this._valueSet.replace(/&/g,"&amp;").replace(/\'/g,"&#39;").replace(/</g,"&lt;"),
                       "'>");
            }

            h.push("</div>");
        },

        _blur: function() {
            if (this._options.name) {
                // using _options.name because of the full form legalscan
                //$(this.id+"value").value =
                $(this._options.name).value =
                    (useContentEditable ? $(this.id) : $(this.id).contentDocument.body).innerHTML;
            }
        },

        /**
         * Called when the user clicks inside the widget.  Dispatches a 'click' event.
         */
        _eventClick: function() {
            this.dispatch('click');
        },

        /**
         * Called when the user clicks inside the text pane.
         */
        _eventClickTextPane: function() {
            if (!isSafari) {
            	var curElement = document.activeElement;
            	if(!(curElement && curElement.id && curElement.id == this.id)) {
                  this._refocus();
            	}
            }
            
            // Per PLT-6961, hide the color palette toolbar when the user clicks into the text pane
            // so that the entered text is not obscured by the color palette toolbar:
            this._tb.textColor.hideDisplay();
        },

        /**
         * Called specifically when the user clicks inside the iframe on FF; not used in IE environment.  Dispatches a
         * 'clickIFrame' event.
         * 
         * RTEditor API user should subscribe to the 'clickIFrame' event to avoid detecting the same mouse click twice
         * if he is already listening to the DOM onClick from a parent HTML component.
         */
        _eventClickIFrame: function() {
            this._eventClickTextPane();     // A click inside the iframe also counts as a click inside the text pane.
            this._eventClick();             // A click inside the iframe still counts like a click inside the widget.
            this.dispatch('clickIFrame');
        },

        // Dispatch an execCommand to the RTE pane.  This takes care
        // of the browser-specific handling (contentEditabel
        // vs. designMode, and missing default UIs).
        //
        // @param cmd    command to exectute
        // @param ui     true to use the default UI
        // @param value  value to set
        _execCommand:function(cmd,ui,value) {
            if (cmd == "_popUpSpellCheck") return this._popUpSpellCheck();
            if (cmd == "_popUpLegalScan") return this._popUpLegalScan();
            if (cmd == "_popUpWACA") return this._popUpWACA();
            if (cmd == "_notebook") return this._notebook();
			
			var curElement = document.activeElement;
            if(!(curElement && curElement.id && curElement.id == this.id)) {
              this._refocus();
            }

            // IE is the only browser that seems to have a default UI for createlink
            if (ui && cmd == "createlink" && !/MSIE/.test(navigator.userAgent)) {
                value = prompt(jsSFMessages.COMMON_RTE_HYPERLINK_URL, jsSFMessages.COMMON_RTE_HYPERLINK_HTTP);

                if (!value) {
                    return;
                }


                // Completing the URL with default protocol if user doesn't apply any.
                var patt = /^(https?:)?\/\/.*/i;
                var result = patt.exec(value);
                if (result == null) {
                    value = jsSFMessages.COMMON_RTE_HYPERLINK_HTTP + value;
                }

                if (typeof(disableInterstitialForRTE) == 'undefined'
                        && typeof(interstitial) != 'undefined') {
                    // This secured URL only shows in the preview of Email
                    // and Offer Letter and the interstitial prefix will be removed
                    // from the email content when sending out.
                    value = secureUrl(value);
                }
                ui = false;
            }

            if (useContentEditable) {
                // contentEditable: applies to the current document
                document.execCommand(cmd, ui, value);
            } else {
                // designMode: apply to iframe's document
                $(this.id).contentDocument.execCommand(cmd, ui, value);
            }

            this._update();
        },

        /**
         * Returns the background position of the Legal Scan icon, depending on if the Legal Scan option is enabled or not.
         */
        _getBackPosLegalScan : function() {
            if (!this._options || !this._options.legalScan) {
                return -(19 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
            }
            return -(18 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
        },
        /**
         * Returns the background position of the Notebook icon, depending on if the Notebook option is enabled or not.
         */
        _getBackPosNotebook : function() {
            if (!this._options || !this._options.notebook) {
                return -(24 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
            }
            return -(23 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
        },
        /**
         * Returns the background position of the Spell Check icon, depending on if the Spell Check option is enabled or not.
         */
        _getBackPosSpellCheck : function() {
            if (!this._options || !this._options.spellCheck) {
                return -(17 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
            }
            return -(16 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
        },
        /**
         * Returns the background position of the WACA icon, depending on if the WACA option is enabled or not.
         */
        _getBackPosWACA : function() {
            if (!this._options || !this._options.waca) {
                return -(21 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
            }
            return -(20 * this._DEFAULT_TOOLBAR_BUTTON_HEIGHT);
        },

        /**
         * Returns option textpane.border.color, or _DEFAULT_TEXTPANE_BORDER_COLOR if not specified
         */
        _getOptTextpaneBorderColor : function() {
            return (this._options && this._options.textpane && this._options.textpane.border && this._options.textpane.border.color)
                    ? this._options.textpane.border.color
                    : this._DEFAULT_TEXTPANE_BORDER_COLOR;
        },

        /**
         * Returns option textpane.border.style, or _DEFAULT_TEXTPANE_BORDER_STYLE if not specified
         */
        _getOptTextpaneBorderStyle : function() {
            return (this._options && this._options.textpane && this._options.textpane.border && this._options.textpane.border.style)
                    ? this._options.textpane.border.style
                    : this._DEFAULT_TEXTPANE_BORDER_STYLE;
        },

       /**
         * Returns option textpane.background, or _DEFAULT_TEXTPANE_BACKGROUND if not specified
         */
        _getOptTextpaneBackground : function() {
            return (this._options && this._options.textpane && this._options.textpane.background)
                    ? this._options.textpane.background
                    : null;
        },

        /**
         * Returns the option 'textpane.fontFamily', if specified.
         */
        _getOptTextpaneFontFamily: function() {
            return this._options && this._options.textpane && this._options.textpane.fontFamily;
        },

        /**
         * Returns the option 'textpane.fontSize', if specified.
         */
        _getOptTextpaneFontSize: function() {
            return this._options && this._options.textpane && this._options.textpane.fontSize;
        },

        /**
         * Returns option toolbar.background, or _DEFAULT_TOOLBAR_BACKGROUND if not specified
         */
        _getOptToolbarBackground : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.background)
                    ? this._options.toolbar.background
                    : this._DEFAULT_TOOLBAR_BACKGROUND;
        },

        /**
         * Returns option toolbar.border.style, or _DEFAULT_TOOLBAR_BACKGROUND if not specified
         */
        _getOptToolbarBackground : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.background)
                    ? this._options.toolbar.background
                    : this._DEFAULT_TOOLBAR_BACKGROUND;
        },

        /**
         * Returns option toolbar.border.color, or _DEFAULT_TOOLBAR_BORDER_COLOR if not specified
         */
        _getOptToolbarBorderColor : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.border && this._options.toolbar.border.color)
                    ? this._options.toolbar.border.color
                    : this._DEFAULT_TOOLBAR_BORDER_COLOR;
        },

        /**
         * Returns option toolbar.border.style, or _DEFAULT_TOOLBAR_BORDER_STYLE if not specified
         */
        _getOptToolbarBorderStyle : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.border && this._options.toolbar.border.style)
                    ? this._options.toolbar.border.style
                    : this._DEFAULT_TOOLBAR_BORDER_STYLE;
        },

        /**
         * Returns option toolbar.buttons.border.color, or null if not specified
         */
        _getOptToolbarButtonsBorderColor : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.buttons && this._options.toolbar.buttons.border && this._options.toolbar.buttons.border.color)
                    ? this._options.toolbar.buttons.border.color
                    : null;
        },

        _getOptToolbarSub : function() {
            return (this._options && this._options.toolbar && this._options.toolbar.sub) ? this._options.toolbar.sub
                                                                                         : null;
        },

        // _ifload is called when the iframe for Firefox's designMode
        // is loaded.  This sets the content of the iframe and enables
        // designMode an any remaining hooks that are normally setup
        // through fireCode on contentEditable.
        _ifload:function() {
            var doc = $(this.id).contentDocument;
            doc.body.innerHTML = this._valueSet;
            // the padding here should match the padding on the <div>
            // used in useContentEditable branch in renderHtml
            doc.body.style.padding = ''+this._DEFAULT_TEXTPANE_PADDING+'px';//Using constant for padding.
            doc.body.style.margin = '0px';
            if (this._getOptTextpaneBackground()) {
                doc.body.style.background = this._getOptTextpaneBackground(); 
            }
            if (this._getOptTextpaneFontFamily()) {
                doc.body.style.fontFamily = this._getOptTextpaneFontFamily();
            }
            if (this._getOptTextpaneFontSize()) {
                doc.body.style.fontSize = this._getOptTextpaneFontSize();
            }

            doc.addEventListener("click", hook(this, this._eventClickIFrame), false);

            if (this.isReadOnly()) return;                    // If in 'readOnly' mode, then no need to do anything further in this function
                                                              // as the steps which follow are all associated with iframe design mode.

            try {
                // Make the iframe's document user editable (if only this
                // was the only required step to get a toolbar and
                // everything!)
                doc.designMode = "on";
    
                // doc.execCommand("useCSS", false, true) does the same
                // (true/false logically reversed, and is deprecated)
                doc.execCommand("styleWithCSS", false, false);
            } catch (e) {
//              alert("Error initializing the RTE iframe to design mode.  RTE will not be editable.  Is the RTE not in 'manuallyInit' mode when it is not initially visible?\r\nError is: " + e + "");
                throw e;    // The error is re-thrown to prevent the code below with dependency on the code above from executing, and also so that the error will still register
                            // in the browser JavaScript error console.  If you want to remove this re-throw statement, then make sure to either replace it by a return statement,
                            // or move this catch block down to the end of the function to prevent the code below from executing.
            }

            var self = this;

            // The addEventListener API should normally be avoided
            // since it is browser-specific and the IE equivalent is
            // prone to creating memory leaks through cyclical
            // references.  Here, however, we don't have a choice, and
            // it should be okay since this method is only executed on
            // Firefox.
            doc.addEventListener("blur", hook(this, this._blur), true);

            // Firefox/Gecko also needs a bit of help with some standard
            // key combinations that Safari and IE seem to handle on their
            // own:
            //    TAB    = focus traveral (TODO: still needs more work, shift key, etc...)
            //    CTRL-B = bold
            //    CTRL-I = italic
            //    CTRL-U = underline
            doc.addEventListener("keydown", function(evt){
                function ifCtrlApply(cmd) {
                    if (evt.ctrlKey && !evt.shiftKey && !evt.altKey && !evt.metaKey) {
                        $(self.id).contentDocument.execCommand(cmd, false, null);

                        // preventDefault so that CTRL-B doesn't open
                        // bookmarks as well, etc...
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                }

                switch (evt.keyCode) {
                case 9: // TAB
                    // use preventDefault to prevent spaces from
                    // appearing in the editable area.
                    evt.preventDefault();

                    if (!evt.shiftKey) {
                        // sort of simulate a tab forward for tab
                        // focus traversal by putting focus on the
                        // iframe.  The next tab will jump to the next
                        // focusable item.
                        $(self.id).focus();
                    } else {
                        if(self._tb) {
                            var tb = self._tb;
							if (tb.waca) $("link_icon_" + tb.waca.id).focus();
                            else if (tb.legalScan) $("link_icon_" + tb.legalScan.id).focus();
                            else if (tb.spellCheck) $("link_icon_" + tb.spellCheck.id).focus();
                            else if (tb.textColor) $("link_icon_" + tb.textColor.id).focus();
                            else if (tb.createLink) $("link_icon_" + tb.createLink.id).focus();
                            else if (tb.outdent) $("link_icon_" + tb.outdent.id).focus();
                            else if (tb.indent) $("link_icon_" + tb.indent.id).focus();
                            else if (tb.bullets) $("link_icon_" + tb.bullets.id).focus();
                            else if (tb.numbers) $("link_icon_" + tb.numbers.id).focus();
                            else if (tb.underline) $("link_icon_" + tb.underline.id).focus();
                            else if (tb.italic) $("link_icon_" + tb.italic.id).focus();
                            else if (tb.bold) $("link_icon_" + tb.bold.id).focus();
                        }
                     }

                    // TODO: make the tab key navigate to the next
                    // focusable DOM element.  Unfortunately, there
                    // does not appear to be a good way to get firefox
                    // to give focus to the next focusable item, other
                    // than traversing the DOM and looking for it.
                    break;
                case 66: // B
                    ifCtrlApply("bold");
                    break;
                case 73: // I
                    ifCtrlApply("italic");
                    break;
                case 85: // U
                    ifCtrlApply("underline");
                    break;
                }
            }, true);


            doc.addEventListener("keypress", hook(this, this._update), true);
            doc.addEventListener("keyup", hook(this, this._update), true);
            doc.addEventListener("mouseup", hook(this, this._update), true);
            doc.addEventListener("paste", hook(this, this._paste), true);
            doc.addEventListener("focus", hook(this, this._focus), true);
            
            this._ifloaded = true;
        },
		
		_focus: function() {
            this.dispatch("focus");
		},

        /**
         * Handles the notebook icon click and relays it to the event handler specified in the options.
         * Passes a pointer to this 'RTEditor' object instance to the next event handler.
         */
        _notebook : function() {
            assert(this._options && this._options.notebook, "Notebook configuration not specified.");
            if (this._options.notebook.event) this.dispatch(this._options.notebook.event);
        },

        /**
         * Adds the CSRF token to the form URLs.
         */
        _secureForm : function(url) {
            // TODO: this is quick and dirty and assumes that the url
            // has a ? or & at the end of it.
            return url + "_s.crb="+ajaxSecKey;
        },

        /**
         * Pops up the Spell Check popup
         */
        _popUpSpellCheck : function() {
            var txt = this.getValueEscaped();

            var spellBoot = [];
            spellBoot.push( "<html>\n");
            spellBoot.push(     "<head>\n");
            spellBoot.push(         "<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n");
            spellBoot.push(     "</head>\n");
            spellBoot.push(     "<body onLoad='document.forms[0].submit();'>\n");
            spellBoot.push(         "<font face='arial, helvetica' size=2>", RTEditor.msgs.COMMON_RTE_SPELL_CHECK_DOCUMENT ,"</font>\n");
            spellBoot.push(         "<form action='"+this._secureForm("/rapidspellcheck?")+"' method='post' ACCEPT-CHARSET='UTF-8'>\n");
            spellBoot.push(             "<input type='hidden' name='textToCheck' value=\"");
            spellBoot.push(                 txt);
            spellBoot.push(                 "\">\n");
            spellBoot.push(             "<input type='hidden' name='InterfaceObject' value='");
            spellBoot.push(                 this._gname);
            spellBoot.push(                 "'>\n");
            spellBoot.push(             "<input type='hidden' name='mode' value='popup'>\n");
            spellBoot.push(             "<input type='hidden' name='UserDictionaryFile' value=''>\n");
            spellBoot.push(             "<input type='hidden' name='SuggestionsMethod' value='HASHING_SUGGESTIONS'>\n");
            spellBoot.push(             "<input type='hidden' name='SeparateHyphenWords' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='IncludeUserDictionaryInSuggestions' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='FinishedListener' value=''>\n");
            spellBoot.push(             "<input type='hidden' name='callBack' value=''>\n");
            spellBoot.push(             "<input type='hidden' name='IgnoreXML' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='IgnoreCapitalizedWords' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='GuiLanguage' value='ENGLISH'>\n");
            spellBoot.push(             "<input type='hidden' name='LanguageParser' value='ENGLISH'>\n");
            spellBoot.push(             "<input type='hidden' name='Modal' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='AllowAnyCase' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='IgnoreWordsWithDigits' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='ShowFinishedMessage' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='ShowNoErrorsMessage' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='ShowXMLTags' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='AllowMixedCase' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='WarnDuplicates' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='DictFile' value=''>\n");
            spellBoot.push(             "<input type='hidden' name='PopUpWindowName' value=''>\n");
            spellBoot.push(             "<input type='hidden' name='CreatePopUpWindow' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='ConsiderationRange' value='80'>\n");
            spellBoot.push(             "<input type='hidden' name='UseUpdate' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='LookIntoHyphenatedText' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='CheckCompoundWords' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='EnableUndo' value='true'>\n");
            spellBoot.push(             "<input type='hidden' name='LeaveWindowOpenForUndo' value='false'>\n");
            spellBoot.push(             "<input type='hidden' name='FinishClosesWindow' value='true'>\n");
            spellBoot.push(         "</form>\n");
            spellBoot.push(     "</body>\n");
            spellBoot.push( "</html>\n");

            this._popUpWin('rspellnwin', 'spell checker', spellBoot.join(''));
        },

        /**
         * Pops up the Legal Scan popup
         */
        _popUpLegalScan : function() {
            var txt = this.getValueStripped();

            var lscanBoot = [];
            lscanBoot.push( "<html>\n");
            lscanBoot.push(     "<head>\n");
            lscanBoot.push(         "<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n");
            lscanBoot.push(     "</head>\n");
            lscanBoot.push(     "<body onLoad='document.forms[0].submit();'>\n");
            lscanBoot.push(         "<font face='arial, helvetica' size=2>", RTEditor.msgs.COMMON_RTE_SCANNING_DOCUMENT, "</font>\n");
            lscanBoot.push(         "<form action='"+this._secureForm("/legalscan?")+"' method='post' ACCEPT-CHARSET='UTF-8'>\n");
            lscanBoot.push(             "<input type='hidden' name='lscn_param_fieldvalue' value=\"");
            lscanBoot.push(                 this._txtEscQuotes(txt));
            lscanBoot.push(                 "\">\n");
            lscanBoot.push(         "</form>\n");
            lscanBoot.push(     "</body>\n");
            lscanBoot.push( "</html>\n");

            this._popUpWin('legalscanwin', 'legal scanner', lscanBoot.join(''));
        },

        /**
         * Pops up the WACA popup
         */
        _popUpWACA : function() {
            assert(this._options && this._options.waca, "Writing assistant configuration not specified.");

            var txt = this.getValueEscaped();
            var wacaBoot = [];
            wacaBoot.push(  "<html>\n");
            wacaBoot.push(      "<head>\n");
            wacaBoot.push(          "<meta http-equiv='Content-Type' content='text/html; charset=utf-8'>\n");
            wacaBoot.push(      "</head>\n");
            wacaBoot.push(      "<body onLoad='document.forms[0].submit();'>\n");
            wacaBoot.push(          "<font face='arial, helvetica' size=2>", RTEditor.msgs.COMMON_RTE_INIT_WACA_DOCUMENT, "</font>\n");
            wacaBoot.push(          "<form action='"+this._secureForm("/handbook?")+"' method='post' ACCEPT-CHARSET='UTF-8'>\n");
            wacaBoot.push(              "<input type='hidden' name='hbpge_param_hbnavtab' value='hb_all'>\n");
            wacaBoot.push(              "<input type='hidden' name='hbpge_sh_wri' value='true'>\n");
            wacaBoot.push(              "<input type='hidden' name='hbpge_sh_coa' value='true'>\n");
            if (this._options.waca.competencyId) {
                wacaBoot.push(          "<input type='hidden' name='hball_param_compid' value='" , this._options.waca.competencyId , "'>\n");
            }
            wacaBoot.push(          	"<input type='hidden' name='hball_param_complocale' value='" , (this._options.waca.competencyLocale ? this._options.waca.competencyLocale : "en_US") , "'>\n");
            if (this._options.waca.employeeId) {
                wacaBoot.push(          "<input type='hidden' name='hbpge_param_sub_id' value='" , this._options.waca.employeeId , "'>\n");
            }
            wacaBoot.push(              "<input type='hidden' name='rte' value='true'>\n");
            wacaBoot.push(              "<input type='hidden' name='fbwaca_param_rte_gname' value='");
            wacaBoot.push(                  this._gname);
            wacaBoot.push(                  "'>\n");
            wacaBoot.push(              "<input type='hidden' name='fbwaca_param_rte_sufx' value='<br><br>'>\n");
            wacaBoot.push(          "</form>\n");
            wacaBoot.push(      "</body>\n");
            wacaBoot.push(  "</html>\n");
            this._popUpWin('wacawin', 'writing assistant', wacaBoot.join(''), {width: 740, height: 580});
        },

        /**
         * Pops up a generic window
         * @param win_name      HTML name to give this window
         * @param win_desc      Text to put into the window <TITLE> tags
         * @param win_content   HTML to put inside the window
         * @param dims          Window dimensions, defaults to 370x430 to support VGA 640x480
         */
        _popUpWin : function(win_name, win_desc, win_content, dims) {
            var width = 370, height = 430;  //These are default width & height
            if (dims != null && dims.width != null) width = dims.width;
            if (dims != null && dims.height != null) height = dims.height;
            var win = this._rsw_create_popup_window(
                    '/blank.html',
                    win_name,
                    'resizable=yes,scrollbars=yes,dependent=yes,toolbar=no,left=100,top=100,status=no,location=no,menubar=no,width=' + width + ',height=' + height);
            if (!win) {
                alert('The ' + win_desc + ' popup has been blocked, most likely by a popup blocker.');
            } else {
                win.focus();
                win.document.open();
                win.document.write(win_content);
                win.document.close();
            }
        },

        /**
         * Refocuses on the text pane, reselects text selection lost during last blur if necessary.
         */
        _refocus:function() {
            var el = $(this.id);

            if (useContentEditable) {
                el.focus();
            } else {
                el.contentWindow.focus();
            }

            if (this._savedRange) {
                // Only happens in Safari--restore the selection range.
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(this._savedRange);

                // after restoring, delete the range so that it is not
                // applied back through another focus operation.
                delete this._savedRange;
            }
        },

        /**
         * Creates a generic popup window
         * @param url           URL to point the window to
         * @param name          HTML name to give this window
         * @param options       Window CSS style options
         */
        _rsw_create_popup_window : function(url, name, options) {
            var toWindow;
            if (window.showModelessDialog) {
                var toOpener = window.dialogArguments || window.opener;
                if (toOpener && toOpener != window && !toOpener.closed) {
                    toWindow = toOpener.open(url, name, options);
                    if (toWindow) {
                        toWindow.opener = window;
                    }
                } else {
                    toWindow = window.open(url, name, options);
                    toWindow.opener = window;
                }
            } else {
                toWindow = window.open(url, name, options);
            }
            return toWindow;
        },        

        // Only called in Safari--this saves the selection state
        // before losing focus so that it may be restored later.
        _saveSelection:function() {
            this._savedRange = window.getSelection().getRangeAt(0);
        },
        _togglePalette:function() {
            var style = $(this.id+"pal").style;
            style.display = (style.display==""?"block":"");
        },

        /**
         * Returns text with escaped quotes
         * @param text  text from which to escape quotes
         */
        _txtEscQuotes: function(text) {
            if (!text) return null;

            var rx = new RegExp("\"", "g");
            return text.replace(rx,"&#34;");
        },

        /**
         * Returns text with escaped HTML entities
         * @param text  text from which to escape HTML entities
         */
        _txtEscEntities: function(text) {
            if (!text) return null;

            var rx = new RegExp("&", "g");
            text = text.replace(rx,"&amp;");
            for (var iLetter=161; iLetter<=255; iLetter++) {
                rx = new RegExp(String.fromCharCode(iLetter), "g");
                text = text.replace(rx, "&#"+iLetter+";");
            }
            return text;
        },

        /**
         * Translates HTML tags from the text specified,
         * but does not translate out HTML entities.
         *
         * @param text  text in which to translate HTML tags
         */
        _txtTranslateHTML: function(text) {
            if (!text) return null;

            // Initially clear out any new lines, as these would interfere with translation to plain text:
            text = text.replace(/\r/g, "").replace(/\n/g, "");

            // Replaces <div>...</div> tags with '\n...':
            text = text.replace(/<div(\s+((\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*))?>(.*?)<\/\s*div>/gi, "\n$6");
            
            // Replaces <li>...</li> tags with '\n...':
            text = text.replace(/<li(\s+((\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*))?>(.*?)<\/\s*li>/gi, "\n$6\n");

            // Replaces <br> tags with '\n':
            text = text.replace(/<br(\s+((\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*))?>/gi, "\n");

            // Replaces <p>...</p> tags with '\n...\n\n':
            text = text.replace(/<p(\s+((\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*))?>(.*?)<\/\s*p>/gi, "\n$6\n\n");

            // Replaces single <p> tags with '\n\n':
            text = text.replace(/<p(\s+((\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*))?>/gi, "\n\n");

            // Strip out remaining HTML tags: (any tags which should not be replaced by blanks should be replaced above).
            text = text.replace(/<(\"([^\"\\]|\\.)*\"|\'([^\'\\]|\\.)*\'|[^>\'\"])*>/g, "");

            return text;
        },

        /**
         * Returns text with unescaped HTML entities
         *
         * @param text  text from which to unescape HTML entities
         */
        _txtUnEscEntities: function(text) {
            if (!text) return null;

            var convFun = function(input) {
                // Borrowed from:  http://paulschreiber.com/blog/2008/09/20/javascript-how-to-unescape-html-entities/
                // Unfortunately eats new lines, so cannot use for all the text at once, but only for HTML entities.
                var temp = document.createElement("div");
                temp.innerHTML = input;
                var result = temp.childNodes[0].nodeValue;
                temp.removeChild(temp.firstChild);
                return result;
            }

            //Get an array of all HTML entities in the String and iterate through them:
            var matches = text.match(/&(.*?);/g);
            if (matches && matches.length) {    // for each does not work in IE
                for (var iMatch = 0; iMatch < matches.length; ++iMatch) {
                    var match = matches[iMatch];
                    if (match) {
                        var rx = new RegExp(match, "g");
                        text = text.replace(rx, convFun(match));
                    }
                }
            }
            return text;
        },

        // Update the active state of the toolbar buttons after a user
        // action to make the toolbar state reflect the text at the
        // cursor or selection.
        _update:function() {
            if (this.isReadOnly() || (!useContentEditable && !this._ifloaded)) return;
                                                        // No need to do anything if in 'readOnly' mode
                                                        // or if using an iframe and the iframe is not yet initialized

            var doc = $(this.id), tb = this._tb;

            if (doc) {
                doc = useContentEditable ? document : doc.contentDocument;

                tb.bold.setActive(doc.queryCommandState("bold"));
                tb.italic.setActive(doc.queryCommandState("italic"));
                tb.underline.setActive(doc.queryCommandState("underline"));
                tb.numbers.setActive(doc.queryCommandState("insertorderedlist"));
                tb.bullets.setActive(doc.queryCommandState("insertunorderedlist"));
            }

            this.dispatch("change");
        },

        /**
         * This is the onpaste event handler.  It cleans up the pasted
         * text.  Some editors (mostly Microsoft Word), will paste
         * text that is not well formed and sometimes contains
         * vendor-specific non-standard html tags.
         */
        _paste : function() {
            var self = this;
            // "onpaste" is fired before the text is pasted into the
            // the DOM.  setTimeout is used to manipulate the DOM
            // after the paste completes.  (Strange behavior since IE
            // has an "onbeforepaste" event too)
            setTimeout(function() {
//                alert($(self.id).innerHTML);

                function pdom(out, indent, node) {
                    if (node.nodeType == 1) {
                        out.push(indent+node.nodeName);

                        for (var c = node.firstChild ; c ; c = c.nextSibling) {
                            pdom(out, indent+"..", c);
                        }
                    } else {
                        out.push(indent+node.nodeValue);
                    }
                }

                var out = [];
                pdom(out, "", $(self.id));
//                alert(out.join("\n"));
            },1);
        }
    });
})();


/*
TODO:
- Background palette (backcolor vs. hilitecolor)
- Detect that RTE is not supported
- Update the hidden text area whenever a change happens when focus is not on (e.g. a button updating the field when there is no focus results in the changes not appearing in the hidden input)
- state tracking in toolbar
- state tracking for createlink custom UI
- focus/blur to display/hide toolbar
- RTE styles--borders, padding, newline translation, space between <P> tags
- In designMode, IFRAMES may keep selection visible even when not focused
- style.left position of color toolbar is off when component is positioned off the left edge (e.g. in 2-columns, the right toolbar appears under the left)
- display:none on initial render has problems in FF.
- copy/paste from Word and related has caused problems in the past

OTHER NOTES:
- General concern--event handling may create cyclical references in
  JS.  Possibly fixed removing _events array?

TEST PLATFORMS:
- IE 6/7
- FF 2/3
- Opera 9
- Safari 3.1

TEST CASES:
- Perfect pixel alignment of toolbar and edit area
- No separation between toolbar and edit area
- Clicking on a toolbar button does not remove focus or change the selection from the affected textarea
- Safari used to lose the selection when clicking on a toolbar button and end up applying a change to the whole document.
- CTRL-B = bold, CTRL-I = italic, CTRL-U = underline
- Setting the link URL works consistently in all browsers (whether custom UI or default)
- Color palette displays when toolbar icon is clicked
- Color palette hides after inactivity with it
- Color palette hides after selecting a color
- Putting cursor on formatted text updates the state of the toolbar
  buttons.  Bold, Italic, Underline, Bullets and Numbers all should
  appear selected when the selected text or the cursor includes the
  related formatting.
- Spell Check, Legal Scan, and WACA popups work properly
- No HTML tags appear inside the Legal Scan popup, while all regular text appears, and legal errors are detected
  inside all text, including text previously surrounded by HTML tags
- The total size of the RTE always remains the same as the size specified in the options, regardless of if the toolbar
  is visible or not
- RTE is displaying appropriate default colors and backgrounds, or the colors/backgrounds specified in the options
- Disabled RTE buttons should not be responding to mouse-overs
- Default RTE height should be 200 if no 'height' parameter is specified in the options.  And default RTE width should
  be 100% of parent div width if no 'width' parameter is specified in the options.
- RTE toolbar should not be mouse-selectable or mouse-draggable.
- Toolbar buttons should indicate active mode state as soon as active mode is enabled by clicking the button.
- Toolbar buttons should not appear outside of the toolbar rectangle when the RTE width is too narrow for all of them.
- The colors palette sub-toolbar should appear in front of the text pane and react to user clicks in FF2 and all other browsers.
*/
