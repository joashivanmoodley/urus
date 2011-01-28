
/**
 * Constructor for EXPCommentBox
 *
 * @param    value                           Object   JSON object representing value with the following properties
 * @property value.numRating                 Number   Numeric rating
 * @property value.txtComment                String   Text comment
 *
 * @param    options                         Object   JSON object with the following properties:
 * @property options.height                  Number   Static height of the component
 * @property options.leftTail                Boolean  Enables left talk tail
 * @property options.legalScan               Boolean  Enables legal scan popup
 * @property options.notebook                Boolean  Includes the Notebook button in the RTE toolbar if true
 * @property options.notebook.event          String   JUIC event to dispatch if the Notebook RTE icon is clicked
 * @property options.rater                   Object   Rater configuration
 * @property options.rater.caption           String   Caption to display in the rater bar
 * @property options.rater.hide              Boolean  Hides the rater bar in the top right, and expands the RTE to take up space
 * @property options.rater.ratings           Object   Custom ratings configuration
 * @property options.rater.ratings.ask       Object   Makes the widget ask user for rating if there is none
 * @property options.rater.ratings.ask.desc  String   Optional description for the rating asking notification
 * @property options.rater.ratings.descs     Array    Optional descriptions of ratings 0 to x
 * @property options.rightTail               Boolean  Enables right talk tail
 * @property options.readOnly                Boolean  Makes the comment box widget read-only
 * @property options.spellCheck              Boolean  Enables spell check popup
 * @property options.waca                    Boolean  Enables Writing Assistant popup
 * @property options.waca.competencyId       Number   Competency ID to relay to the Writing Assistant popup
 * @property options.waca.employeeId         String   Employee ID to relay to the Writing Assistant popup
 * @property options.width                   Number   Static width of the component
 *
 *
 */
function EXPCommentBox(value, options) {
    this.register();

    this._value = value || {};
    this._options = options || {};

    if (!this._options || !this._options.rater || !this._options.rater.hide) {
        this._rater = new EXPAdvancedRater( this._value.numRating,
                                    {
                                        absolutePosition: {
                                            right: this._RATER_POS_RIGHT,
                                            top: this._RATER_POS_TOP
                                        },
                                        caption: this._getRaterCaption(),
                                        captionMaxLength: this._getRaterCaptionMaxLength(),
                                        ratings: this._options.rater && this._options.rater.ratings,
                                        readOnly: this._options.readOnly
                                    });
        this._rater.addEventListener('change', {
        	_obj: this,
            handleEvent : function(evt) {
                this._obj.dispatch("ratingChanged", evt);
            }
        });
    }

    this._rte = new RTEditor(this._value.txtComment,
                                {
                                    absolutePosition: {
                                        left: this._RTE_POS_LEFT,
                                        top: this._rater ? this._RTE_POS_TOP_WR : this._RTE_POS_TOP_NR
                                    },
                                    width: this._getOptWidth() - this._RTE_WSUB,
                                    height: this._rater ? (this._getOptHeight() - this._RTE_HSUB_WR) : (this._getOptHeight() - this._RTE_HSUB_NR),
                                    legalScan: this._options.legalScan,
                                    notebook: this._options.notebook ? {event: this._EVENT_NOTEBOOK}: null,
                                    readOnly: this._options.readOnly,
                                    spellCheck: this._options.spellCheck,
                                    textpane: {
                                        background:    this.isReadOnly() ? this._TP_BACKGROUND_RO : this._TP_BACKGROUND_E,
                                        border: {
                                            color:   this.isReadOnly() ? this._TP_BACKGROUND_RO : this._TP_BORDER_COLOR_E,
                                            style:   this.isReadOnly() ? this._TB_BORDER_STYLE_RO : this._TB_BORDER_STYLE_E
                                        },
                                        fontFamily:  this._TP_FONT_FAMILY,
                                        fontSize:    this._TP_FONT_SIZE
                                    },
                                    toolbar: {
                                        background:    this._TB_BACKGROUND_E,
                                        border: {
                                            color:   this._TB_BACKGROUND_E
                                        },
                                        buttons: {
                                            border: {
                                                color: this._TB_BACKGROUND_E
                                            }
                                        },
                                        sub: {
                                            background: this._TB_BACKGROUND_E,
                                            border: {
                                                color: this._TP_BORDER_COLOR_E
                                            },
                                            buttons: {
                                                border: {
                                                    color: this._TB_BACKGROUND_E
                                                }
                                            }
                                        }
                                    },
                                    waca: this._options.waca
                                });
     this._rte.addEventListener('change', {
        	_obj: this,
            handleEvent : function(evt) {
                this._obj.dispatch("rteChanged", evt);
            }
        });
    if (this._options && this._options.notebook) {
        var self = this;
        this._rte.addEventListener(this._EVENT_NOTEBOOK, {
            handleEvent: function() {
                if (self._options && self._options.notebook && self._options.notebook.event) self.dispatch(self._options.notebook.event);
            }
        });
    }
}

EXPCommentBox.prototype = (function() {
    return set(new Component(), {
//PUBLIC:

        /**
         * Cleans up the sub-widgets.
         */
        cleanup: function () {
            if (this._rater) this._rater.cleanup();
            if (this._rte) this._rte.cleanup();
            this.unregister();
        },

        /**
         * Returns the value inside the Comment Box Widget as a JSON structure with the following properties:
         *
         * @property    numRating     Numeric rating
         * @property    txtComment    Text comment
         */
        getValue : function() {
            return {
                numRating:   this._rater  ? this._rater.getValue()  : null,
                txtComment:  this._rte    ? this._rte.getValue()    : null
            }
        },

        /**
         * Returns only the comment text value as a regular String.
         */
        getValueComment : function() {
            return this._rte ? this._rte.getValue() : null;
        },

        /**
         * Returns [true] if the 'readOnly' mode is specified in the options.
         */
        isReadOnly : function() {
            return (this._options && this._options.readOnly);
        },

        /*
         * Function called by JUIC framework to render the component HTML.
         */
        renderHtml : function(h) {
            h.push( "<div id='" + this.id + "' style='width:"+this._getOptWidth()+"px;height:"+this._getOptHeight()+"px;'>\n");
            h.push(     "<div style='position: absolute;'>\n");
            h.push(         "<div class='cbox_margin_top " + this._appendRO("cbox_top_tile") + "' style='position: relative; width: " + this._getOptWidth() + "px;' >\n");
            h.push(             "<div class='cbox_margin_left cbox_margin_side cbox_margin_top " + this._appendRO("cbox_top_left") + "'></div>\n");
            h.push(             "<div class='cbox_margin_right cbox_margin_side cbox_margin_top " + this._appendRO("cbox_top_right") + "'></div>\n");
            h.push(         "</div>\n");
            h.push(         "<div class='cbox_middle " + this._appendRO("cbox_middle_tile") + "' style=' width: " + this._getOptWidth() + "px; height: " + (this._getOptHeight() - this._MARGIN_TOP - this._MARGIN_BOTTOM) + "px;'>\n");
            h.push(             "<div class='cbox_margin_left cbox_margin_side " + this._appendRO("cbox_middle_left") + "' style='height: " + (this._getOptHeight() - this._MARGIN_TOP - this._MARGIN_BOTTOM) + "px;'></div>\n");
            h.push(             "<div class='cbox_margin_right cbox_margin_side " + this._appendRO("cbox_middle_right") + "' style='height: " + (this._getOptHeight() - this._MARGIN_TOP - this._MARGIN_BOTTOM) + "px;'></div>\n");
            h.push(         "</div>\n");
            h.push(         "<div class='cbox_margin_bot " + this._appendRO("cbox_bot_tile") + "' style='width: " + this._getOptWidth() + "px;'>\n");
            h.push(             "<div class='cbox_margin_bot cbox_margin_left cbox_margin_side ");
            if (this._options && this._options.leftTail) {
                h.push(             this._appendRO("cbox_bot_left_wt"));
            } else {
                h.push(             this._appendRO("cbox_bot_left_nt"));
            }
            h.push(                 "'></div>\n");
            h.push(             "<div class='cbox_margin_bot cbox_margin_right cbox_margin_side ");
            if (this._options && this._options.rightTail) {
                h.push(             this._appendRO("cbox_bot_right_wt"));
            } else {
                h.push(             this._appendRO("cbox_bot_right_nt"));
            }
            h.push(                 "'></div>\n");
            h.push(         "</div>\n");

            if (this._rte) this._rte.renderHtml(h);
            if (this._rater) this._rater.renderHtml(h);

            h.push(     "</div>\n");
            h.push( "</div>\n");

            h.push(	"<input type=\"hidden\" name=\"" + this.id + "_field\" id=\"" + this.id + "_field\" />");
        },

        /**
         * Sets a new value inside the Comment Box Widget, expecting a JSON structure with the following properties:
         *
         * @param       value           JSON object with the following properties:
         * @property      numRating     Numeric rating
         * @property      txtComment    Text comment
         */
        setValue : function(value) {
            if (this._rater && value.numRating) this._rater.setValue(value.numRating);
            if (this._rte && value.txtComment) this._rte.setValue(value.txtComment);
        },

        /**
         * Sets only the comment text value as a regular String.
         *
         * @param value    String containing value to set
         */
        setValueComment : function(value) {
            if (this._rte) this._rte.setValue(value);
        },


//PRIVATE:

        _EVENT_NOTEBOOK:       "_notebook",  // Used internally to trap the toolbar notebook icon in the RTE.

        /*
         * These static values or margin widths are used to calculate the dimensions of internal components.
         */
        _DEFAULT_CBOX_HEIGHT:  350,
        _DEFAULT_CBOX_WIDTH:   650,

        _MARGIN_TOP:           30,
        _MARGIN_BOTTOM:        70,
        _MARGIN_SIDE:          60,

        _RATER_POS_RIGHT:      52,
        _RATER_POS_TOP:        7,

        _RTE_POS_LEFT:         50,
        _RTE_POS_TOP_NR:       20,
        _RTE_POS_TOP_WR:       50,

        _RTE_HSUB_NR:          50,
        _RTE_HSUB_WR:          80,
        _RTE_WSUB:             105,

        _TB_BACKGROUND_E:      '#91b7ed',
        _TP_BACKGROUND_E:      '#bcd1ef',
        _TP_BACKGROUND_RO:     'transparent',
        _TP_BORDER_COLOR_E:    '#869cba',
        _TP_FONT_FAMILY:       'Trebuchet, Trebuchet MS',
        _TP_FONT_SIZE:         '12pt',

        _TB_BORDER_STYLE_E:    'solid',
        _TB_BORDER_STYLE_RO:   'hidden',


        /*
         * This function appends "_ro" to the CSS class name if the widget is to appear read-only,
         * or "_e" if the widget is to appear editable.
         */
        _appendRO : function(cname) {
            if (this._options && this._options.readOnly) return cname + "_ro";
            return cname + "_e";
        },

        /**
         * Returns the option '_options.height' or _DEFAULT_CBOX_HEIGHT
         */
        _getOptHeight : function() {
            return (this._options && this._options.height) ? this._options.height
                                                           : this._DEFAULT_CBOX_HEIGHT;
        },

        /**
         * Returns the option '_options.width' or _DEFAULT_CBOX_WIDTH
         */
        _getOptWidth : function() {
            return (this._options && this._options.width) ? this._options.width
                                                          : this._DEFAULT_CBOX_WIDTH;
        },

        /**
         * Returns the appropriate caption for the rater component.
         */
        _getRaterCaption : function() {
            return this._options && this._options.rater && this._options.rater.caption;
        },

        _getRaterCaptionMaxLength : function() {
            return this._options && this._options.rater && this._options.rater.captionMaxLength;
        },
        
        _place_holder : null
    });
})();
