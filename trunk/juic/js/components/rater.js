/*======================================================================================================
  Component   : EXPRater
  Created     : 5/8/2008
  Developer   : Brendan Delumpa
  Description : The EXPRater is a simple 5-star rating widget for quickly setting ratings.
                It is modeled very similarly to other rating widgets that you see on the web:
                1. Stars will track rollovers
                2. Clicking on a star will set the rating

                Another added feature is that it has the ability to execute an external function or
                object method via its click handler which is actually its own setValue method.

                Component is built entirely from an unordered list element for simplicity.
========================================================================================================*/

/**
 * Constructor for the EXPRater
 * @param value                         Number    Current rating value -- 0 to total stars (either default _DEFAULT_STAR_TOTAL or options.ratings.total).
 *                                                0 means no rating, null means "please rate"
 *
 * @param options                       Object    JSON object with the following properties: 
 *
 * @property options.clickCallBackFunc  Function  (optional) Additionally, if setting a rating will require further action, a function can
 *                                                be passed that will be executed after the new rating is set.
 *
 * @property options.float_             String    CSS 'float' property passed to component.  Need the underscore at the end to not
 *                                                conflict with the JavaScript reserved keyword 'float'.
 *                                  
 * @property options.icons              Object    JSON object with alternative star icon configuration.  The alternative icon configuration
 *                                                is optional.
 *
 * @property options.icons.height       Number    Alternative star icon height in pixels.
 *
 * @property options.icons.marginHoriz  Number    Star icon horizontal margin in pixels.
 *
 * @property options.icons.marginVert   Number    Star icon vertical margin in pixels.
 *
 * @property options.icons.srcE         String    Alternative 'src' property for the editable star icon.
 *
 * @property options.icons.srcRO        String    Alternative 'src' property for the read-only star icon.
 * 
 * @property options.icons.width        Number    Alternative star icon width in pixels.
 *
 * @property options.ratings            Object    Custom ratings configuration
 *
 * @property options.ratings.ask        Boolean   Makes the widget ask user for rating if there is none
 *
 * @property options.ratings.total      Number    Total ratings (_DEFAULT_STAR_TOTAL by default)
 *
 * @property options.readOnly           Boolean   Makes the widget read-only.
 */

function EXPRater(value, options) {
    this.register();
    this._value = value;

    this._options = options || {};

    this._init();
}

EXPRater.prototype = (function(){

    // Constants used by EXPRaterStar:
    var STAR_VALUE_PLEASE_RATE  =  0;
    var STAR_VALUE_NOT_RATED    =  1;
    var STAR_VALUE_EMPTY        =  2;
    var STAR_VALUE_FULL         =  3;

    /**
     * Constructor for EXPRaterStar
     * This sub-widget is used to render each individual star icon
     * 
     * @param     value                Number    Current value to display.  Available values are:
     *                                           STAR_VALUE_PLEASE_RATE  0  Please rate
     *                                           STAR_VALUE_NOT_RATED    1  Not rated
     *                                           STAR_VALUE_EMPTY        2  Empty
     *                                           STAR_VALUE_FULL         3  Full
     *
     * @param     options              Object    JSON object with the following properties:
     * 
     * REQUIRED
     * @property  options.height       Number    Star icon height.
     * 
     * REQUIRED
     * @property  options.index        Number    Star icon index.
     *
     * REQUIRED
     * @property  options.marginHoriz  Number    Star icon horizontal margin in pixels.
     *
     * REQUIRED
     * @property  options.marginVert   Number    Star icon vertical margin in pixels.
     *
     * REQUIRED
     * @property  options.readOnly     Boolean   If the star icon is read-only.  Used to determine if event handlers are necessary.
     *
     * REQUIRED
     * @property  options.src          String    Star icon's location url.
     * 
     * REQUIRED
     * @property  options.width        Number    Star icon width.
     * 
     */
    function EXPRaterStar(value,options) {
        this._value = value;
        this._options = options || {};

        assert(this._options.height       != undefined, "Missing height option!");
        assert(this._options.index        != undefined, "Missing index option!");
        assert(this._options.marginHoriz  != undefined, "Missing marginHoriz option!");
        assert(this._options.marginVert   != undefined, "Missing marginVert option!");
        assert(this._options.src          != undefined, "Missing src option!");
        assert(this._options.width        != undefined, "Missing width option!");

        this.register();
    }
    EXPRaterStar.prototype = set(new Component(), {

        /**
         * Returns the index of this star.
         */
        getIndex: function() {
            return this._options.index;
        },

        /**
         * Renders the component.
         * 
         * @param h  Array  Array of Strings containing HTML.
         */
        renderHtml: function(h) {
            h.push( "<li id='"+
                        this.id+
                        "' style='"+
                        "float:left;"+
                        "margin-top:"+this._options.marginVert+"px;"+
                        "margin-bottom:"+this._options.marginVert+"px;"+
                        "margin-left:"+this._options.marginHoriz+"px;"+
                        "margin-right:"+this._options.marginHoriz+"px;"+
                        "padding:0px;"+
                        "'"+
                        (this._options.readOnly
                            ? ""
                            : " onclick=\"" + this.fireCode("_handleMouseClick") + "\""+
                              " onmouseout=\"" + this.fireCode("_handleMouseOut") + "\""+
                              " onmouseover=\"" + this.fireCode("_handleMouseOver") + "\"")+
                        ">");

            this._renderHtmlI(h);

            h.push( "</li>");
        },

        /**
         * Re-renders the component.
         */
        reRender : function() {
            var h = [];
            this._renderHtmlI(h);
            $(this.id).innerHTML = h.join("");
        },

        /**
         * Sets a new value and re-renders the component.
         * @param   value   Number  New value.  Available values are:
         *                  STAR_VALUE_PLEASE_RATE  0  Please rate
         *                  STAR_VALUE_NOT_RATED    1  Not rated
         *                  STAR_VALUE_EMPTY        2  Empty
         *                  STAR_VALUE_FULL         3  Full
         */
        setValue: function(value) {
            if (this._value == value) return;

            this._value = value;
            this.reRender();
        },

        /**
         * Returns the appropriate background position for this star.
         */
        _getStarBPos: function() {
            switch (this._value) {
                case STAR_VALUE_PLEASE_RATE:
                    return this._getStarBposNonePR();
                case STAR_VALUE_NOT_RATED:
                    return this._getStarBposNone();
                case STAR_VALUE_EMPTY:
                    return this._getStarBposEmpty();
                case STAR_VALUE_FULL:
                    return this._getStarBposFull();
            }
        },

        /**
         * Returns the background position for an "empty" star.
         */
        _getStarBposEmpty: function() {
            return "0px " + (this._BPOS_SCLR_EMPTY*this._options.height) + "px";
        },

        /**
         * Returns the background position for a "full" star.
         */
        _getStarBposFull: function() {
            return "0px " + (this._BPOS_SCLR_FULL*this._options.height) + "px";
        },

        /**
         * Returns the background position for the "not rated" icon.
         */
        _getStarBposNone: function() {
            return "0px " + (this._BPOS_SCLR_NONE*this._options.height) + "px";
        },

        /**
         * Returns the background position for the "please rate" icon.
         */
        _getStarBposNonePR: function() {
            return "0px " + (this._BPOS_SCLR_NONE_PR*this._options.height) + "px";
        },

        /**
         * Called when the mouse is clicked on a star.
         */
        _handleMouseClick: function() {
            var self = this;
            this.dispatch('click', {source: self});
        },

        /**
         * Called when the mouse is hovered out of the widget.
         */
        _handleMouseOut: function() {;
            var self = this;
            this.dispatch('out', {source: self});
        },

        /**
         * Called when the mouse is hovered over the widget.
         */
        _handleMouseOver: function() {
            var self = this;
            this.dispatch('over', {source: self});
        },
        
        _renderHtmlI: function(h) {
            h.push( "<div style='"+
                            "background-position:"+this._getStarBPos()+";"+
                            "background-image:url("+this._options.src+");"+
                            "height:"+this._options.height+"px;"+
                            "font-size:1px;"+                            // This is needed for IE6 to respect small div height.  http://archivist.incutio.com/viewlist/css-discuss/71562
                            "margin:0px;"+
                            "padding:0px;"+
                            "width:"+this._options.width+"px;"+
                            "'"+
                            ">"+
                    "</div>");  
        },

        _BPOS_SCLR_EMPTY:    -2,
        _BPOS_SCLR_FULL:     -3,
        _BPOS_SCLR_NONE:      0,
        _BPOS_SCLR_NONE_PR:  -1
    });
    
    return set(new Component(),{

        /**
         * Unregisters child components.
         */
        cleanup: function() {
            assert(this._stars, "Expected stars.");

            for (var i =0; i < this._stars.length; i++) {
                if (this._stars[i]) this._stars[i].cleanup();
            }
            this.unregister();
        },

        /**
         * Returns a 'Number' corresponding to the rating selected by the user.
         * Rating ranges from 0 to 5.  5 is the highest rating, 1 is the lowerst.
         * 0 is not rated.
         */
        getValue : function() {
            return this._value;
        },
        
        /**
         * Returns a 'Number' corresponding to the rating over which the user is hovering with a mouse.
         * The rating over which the user is hovering with a mouse is not the selected rating until the user clicks on it.
         * If the user is not hovering over the widget at all, then null is returned.
         */
        getValueHover : function() {
            return this._valueHover;
        },

        /**
         * Returns the 'readOnly' option.
         */
        isReadOnly: function() {
            return this._options && this._options.readOnly;
        },

        /**
        * Render method for the component. Note the use of firecode to dispatch object methods.
        */
        renderHtml : function(h) {
            h.push( "<div id='" + this.id + "' style='margin:0px;padding:0px;height:"+this._getWidgetHeight()+"px;width:"+this._getWidgetWidth()+"px;");
            if (this._options && this._options.float_) {
                h.push( "float:"+this._options.float_+";");
            }
            h.push(     "'"+
                        (this.isReadOnly()?"":" onmouseout=\"" + this.fireCode("_handleMouseOut") + "\"")+
                        ">");
            h.push(     "<ul style='list-style:none;padding:0;margin:0;'"+
                        (this.isReadOnly()?"":" onmouseout=\"" + this.fireCode("_handleMouseOut") + "\"")+
                        ">");
            for (var index=this.isReadOnly()?1:0;index<this._stars.length;++index) {
                this._stars[index].renderHtml(h);
            }
            h.push(     "</ul>");            
            h.push( "</div>");
            h.push( "<input type=\"hidden\" name=\"" + this.id + "_field\" id=\"" + this.id + "_field\" />");
        },
        /**
        * Click handler and value setter for the component
        * will also execute an external method or function (if provided in the constructor's config param)
        */
        setValue : function(value) {
            if (value) {
                this._value = value;
            } else {
                this._value = 0;    // Value of 0 means not rated
            }

            this._updateStars(this._value);

            $(this.id + "_field").value = value;
            this.dispatch("change", {rating:this._value});

            // Call the callback function in case it has been specified in the options:
            if (this._options && this._options.clickCallBackFunc) clickCallBackFunc(value);
        },

        /**
         * Returns the option ratings.ask
         */
        _getOptRatingsAsk: function() {
            return this._options && this._options.ratings && this._options.ratings.ask;
        },

        /**
         * Returns the option ratings.total, or the default this._DEFAULT_STAR_TOTAL
         */
        _getOptRatingsTotal: function() {
            return (this._options && this._options.ratings && this._options.ratings.total) || this._DEFAULT_STAR_TOTAL;
        },

        /**
         * Returns either the alternative star icon height in pixels specified under the 'icon' option,
         * or the default height which is _DEFAULT_STAR_HEIGHT.
         */
        _getStarHeight: function() {
            return this._options && this._options.icons && this._options.icons.height
                            ? this._options.icons.height
                            : this._DEFAULT_STAR_HEIGHT;
        },

        /**
         * Returns the horizontal star icon margin in pixels specified under the 'icon' option,
         * or the default margin which is _DEFAULT_STAR_MARGIN_HORIZ
         */
        _getStarMarginHoriz: function() {
            return this._options && this._options.icons && this._options.icons.marginHoriz
                            ? this._options.icons.marginHoriz
                            : this._DEFAULT_STAR_MARGIN_HORIZ;
        },

        /**
         * Returns the vertical star icon margin in pixels specified under the 'icon' option,
         * or the default margin which is _DEFAULT_STAR_MARGIN_VERT
         */
        _getStarMarginVert: function() {
            return this._options && this._options.icons && this._options.icons.marginVert
                            ? this._options.icons.marginVert
                            : this._DEFAULT_STAR_MARGIN_VERT;
        },

        /**
         * Returns either the alternative regular star icon 'src' property specified under the 'icon' option,
         * or the default 'src' property which is _DEFAULT_STAR_SRC_E.
         */
        _getStarSrcE: function() {
            return this._options && this._options.icons && this._options.icons.srcE
                            ? this._options.icons.srcE
                            : this._DEFAULT_STAR_SRC_E;
        },

        /**
         * Returns either the alternative read-only star icon 'src' property specified under the 'icon' option,
         * or the default 'src' property which is _DEFAULT_STAR_SRC_RO.
         */
        _getStarSrcRO: function() {
            return this._options && this._options.icons && this._options.icons.srcRO
                            ? this._options.icons.srcRO
                            : this._DEFAULT_STAR_SRC_RO;
        },

        /**
         * Returns what the background position VALUE of the would be for the star at the specified index.
         *
         * @param index     Index of the star.
         */
        _getStarValue: function(index) {
            if (index == 0) {
                return ((this._value != null && this._value >= 0) || !this._getOptRatingsAsk()) ? STAR_VALUE_NOT_RATED : STAR_VALUE_PLEASE_RATE;
            }
            if (index <= this._value) return STAR_VALUE_FULL;
            return STAR_VALUE_EMPTY;
        },

        /**
         * Returns either the alternative star icon width in pixels specified under the 'icon' option,
         * or the default width which is _DEFAULT_STAR_WIDTH.
         */
        _getStarWidth: function() {
            return this._options && this._options.icons && this._options.icons.width
                            ? this._options.icons.width
                            : this._DEFAULT_STAR_WIDTH;
        },

        /**
         * Returns what the height of the whole widget should be in pixels depending on the vertical margin around the stars.
         */
        _getWidgetHeight: function() {
            return this._getStarHeight() + (2 * this._getStarMarginVert());
        },

        /**
         * Returns what the width of the whole widget should be in pixels depending on the number of stars and the horizontal margin around them.
         */
        _getWidgetWidth: function() {
            var widthStar = this._getStarWidth();
            var widthWithMargin = widthStar + (2 * this._getStarMarginHoriz());
            return (widthWithMargin*this._stars.length)
                   +1;    // This extra 1 is needed for IE6
        },

        /**
         * Called when mouse leaves the widget and also when it leaves any of the EXPRaterStar sub-widgets.
         * Resets the mouse hover status to null.
         */
        _handleMouseOut: function() {
            this._valueHover = null;
            this._updateHover();
        },

        /**
         * Initializes the component.
         */
        _init: function() {
            var self = this;

            this._stars = [];

            for (var i = 0; i <= this._getOptRatingsTotal(); ++i) {
                if (i == 0 && this.isReadOnly()) continue;

                this._stars[i] = new EXPRaterStar(
                                        this._getStarValue(i),
                                        {
        	                                height: this._getStarHeight(),
                                            index: i,
                                            marginHoriz: this._getStarMarginHoriz(),
                                            marginVert: this._getStarMarginVert(),
                                            readOnly: this.isReadOnly(),
                                            src: this.isReadOnly() ? this._getStarSrcRO() : this._getStarSrcE(),
                                            width: this._getStarWidth()
                                        });

                if (!this.isReadOnly()) {
                    this._stars[i].addEventListener('click', {
                        handleEvent: function(e){
                            assert(e && e.source && e.source.getIndex() != undefined, "Expected index.");
                            self.setValue(e.source.getIndex());
                        }
                    });
                    this._stars[i].addEventListener('out', {
                        handleEvent: function(e){
                            self._handleMouseOut();
                        }
                    });
                    this._stars[i].addEventListener('over', {
                        handleEvent: function(e){
                            assert(e && e.source && e.source.getIndex() != undefined, "Expected index.");
                            
                            self._valueHover = e.source.getIndex();
                            self._updateHover();
                        }
                    });
                }
            }
        },

        /**
         * Updates the EXPRater appearance to reflect mouse hover.
         */
        _updateHover : function() {
            var valueHover = this.getValueHover();

            if (valueHover == null) {
                this._updateStars(this._value);
            } else {
                this._updateStars(valueHover);
            }

            this.dispatch("changeHover", {rating:valueHover});
        },


        /**
         * Updates the indication shown by the stars.
         *
         * @param  rating  Number  The rating to update the indications to.
         */
        _updateStars: function(rating) {
            if (rating != null && rating >= 0) {
                for (var iEmpty = this._stars.length - 1; iEmpty > rating ; --iEmpty) {
                    var star = this._stars[iEmpty];
                    assert(star, "Expected a star.");
                    star.setValue(STAR_VALUE_EMPTY);
                }
                for (var iFull = 0; iFull <= rating; ++iFull) {
                    var star = this._stars[iFull];
                    assert(iFull == 0 || star, "Expected a star.");
                    if (iFull == 0) {
                        if (star) star.setValue(STAR_VALUE_NOT_RATED);
                    } else {
                        star.setValue(STAR_VALUE_FULL);
                    }
                }
            } else {
                this._stars[0].setValue(this._getOptRatingsAsk() ? STAR_VALUE_PLEASE_RATE : STAR_VALUE_NOT_RATED);
                for (var iEmpty = 1; iEmpty < this._stars.length; ++iEmpty) {
                    var star = this._stars[iEmpty];
                    assert(star, "Expected a star.");
                    star.setValue(STAR_VALUE_EMPTY);
                }
            }
        },

        _DEFAULT_STAR_HEIGHT:        24,
        _DEFAULT_STAR_MARGIN_HORIZ:  0,
        _DEFAULT_STAR_MARGIN_VERT:   0,
        _DEFAULT_STAR_SRC_E:         IMAGES["/ui/uicore/img/components/rater_star.gif"],
        _DEFAULT_STAR_SRC_RO:        IMAGES["/ui/uicore/img/components/rater_star_ro.gif"],
        _DEFAULT_STAR_TOTAL:         5,
        _DEFAULT_STAR_WIDTH:         24
    });
})();

/**
 * The advanced rater also has label status indicators around the rater bar.
 *
 * Dependencies:  web/static/js/Util.js  Util.escapeHTML() 
 *
 * @param value                              Number    Current rater value, passed on to the rater bar
 * 
 * @param options                            Object    JSON object with the following options:
 *
 * @property options.absolutePosition        Object    JSON object with optional absolute positioning configuration
 *                                                     (can be in relation to parent element)
 *
 * @property options.absolutePosition.left   Number    Absolute positioning left coordinate in pixels.
 * 
 * @property options.absolutePosition.right  Number    Absolute positioning right coordinate in pixels.
 *
 * @property options.absolutePosition.top    Number    Absolute positioning top coordinate in pixels.
 *
 * @property options.expandHorizontally      Boolean   Makes the widget expand horizontally at 100%.
 * 
 * @property options.caption                 String    Caption to display in the widget.
 * 
 * @property options.captionFontColorE       String    Font color of the caption in edit mode.
 * 
 * @property options.captionFontColorRO      String    Font color of the caption in read-only mode.
 * 
 * @property options.captionFontStyle        String    Font style of the caption.
 * 
 * @property options.captionFontWeight       String    Font weight of the caption.
 * 
 * @property options.captionOnly             Boolean   Display caption only -- no 'EXPRater'.  This turns 'EXPAdvancedRater' into a simple
 *                                                     heading with the caption.
 *
 * @property options.captionTooltip          String    Caption to display in the tooltip over the regular caption
 *
 * @property options.icons                   Object    JSON object with alternative star icon configuration.  The alternative icon configuration
 *                                                     is optional.
 * 
 * @property options.icons.height            Number    Alternative star icon height in pixels.
 *
 * @property options.icons.marginHoriz       Number    Star icon horizontal margin in pixels.
 *
 * @property icons.marginVert                Number    Star icon vertical margin in pixels.
 *
 * @property options.icons.srcE              String    Alternative 'src' property for the editable star icon.
 * 
 * @property options.icons.srcRO             String    Alternative 'src' property for the read-only star icon.
 * 
 * @property options.icons.width             Number    Alternative star icon width in pixels.
 *
 * @property options.numFontColorE           String    Font color of the numeric indicator in edit mode.
 * 
 * @property options.numFontColorRO          String    Font color of the numeric indicator in read-only mode.
 * 
 * @property options.numFontSize             String    Font size of the numeric indicator.
 *
 * @property options.numFontStyle            String    Font style of the numeric indicator.
 * 
 * @property options.ratings                 Object    Custom ratings configuration
 *
 * @property options.ratings.ask             Object    Makes the widget ask user for rating if there is none
 *
 * @property options.ratings.ask.desc        String    Optional description for the rating asking notification (this._DESC_PLEASE_RATE by default)
 *
 * @property options.ratings.descs           Array     Optional descriptions of ratings 0 to x (this._DESCS by default)
 *
 * @property options.readOnly                Boolean   Makes the control read-only
 * 
 * @property options.wordWrap                Boolean   Makes the caption text word-wrap if the parent container is not wide enough to display
 *                                                     the caption on one line
 *
 */
function EXPAdvancedRater(value, options) {
    this.register();

    this._options = options || {};
    
    if (!this._getOptCaptionOnly()) {
        this._rater = new EXPRater( value,
                                    {
                                        icons: this._options.icons,
                                        ratings: {
                                            ask: this._getOptRatingsAsk(),
                                            total: this._getOptRatingsDescs().length - 1 // Subtracting 1 because of the 'Please Rate'/'Not Rated' icon which is excluded from the total
                                        },
                                        readOnly: this._options.readOnly
                                    });
    
        var self = this;
        this._rater.addEventListener(
                'change',
                {
                    handleEvent: function(evt) {
                        self._eventChange(evt);
                    }
                });
        this._rater.addEventListener(
                'changeHover',
                {
                    handleEvent: function(evt) {
                        self._eventChange(evt);
                    }
                });
    
        this._createSpanStrings();
    }
}
EXPAdvancedRater.prototype = (function(){
    function EXPSpanString(value) {
        this.register();
        this._value = value;
    }
    EXPSpanString.prototype = set(new Component(), {
        getValue : function() {
            return this._value;
        },
        renderHtml : function(h) {
            h.push( "<span id='"+this.id+"'>");
            this.renderHtmlI(h);
            h.push( "</span>");
        },
        renderHtmlI : function(h) {
            h.push(this._value);
        },
        reRender : function() {
            var h = [];
            this.renderHtmlI(h);
            $(this.id).innerHTML = h.join("");
        },
        setValue : function(value) {
            this._value = value;
        }
    });
    return set(new Component(),{
        /**
         * Unregisters child components.
         */
        cleanup: function() {
            if (this._rater) this._rater.cleanup();
            if (this._desc) this._desc.cleanup();
            if (this._num) this._num.cleanup();

            this.unregister();
        },

        /**
         * Returns current rater value, 0 means no rating.
         */
        getValue : function() {
            return this._rater.getValue();
        },
        /**
         * Returns the 'readOnly' option
         */
        isReadOnly: function() {
            return this._options && this._options.readOnly;
        },
        /**
        * Render method for the component.
        */
        renderHtml : function(h) {
            assert(Util.escapeHTML, "Missing dependency:  Util.escapeHTML() not available, most likely web/static/js/Util.js not included.");

            var caption = Util.escapeHTML(this._options.caption);   // Prepare the caption
            if (!this._options || !this._options.wordWrap) {
                caption = caption.replace(/\s/g,'&nbsp;');          // Replace any spaces by nbsps so that the caption does not split into lines.
            }

            var truncatedCaption = caption;
            var captionTooltip = (this._options && this._options.captionTooltip) ? this._options.captionTooltip : undefined;
            if (this._options && this._options.captionMaxLength) {
            	truncatedCaption = caption.truncateByLength(this._options.captionMaxLength);
            }
            
            if(!captionTooltip) {
                if (truncatedCaption != caption) {
                	captionTooltip = caption;	
                }          	
            }
            
            h.push(     "<table id='" + this.id + "' style='margin:0px;padding:0px;");
            if (this._options && this._options.expandHorizontally) {
                h.push(         "width:100%;");
            }
            if (this._options && this._options.absolutePosition)  {
                h.push(         "position:absolute;")
                if (this._options.absolutePosition.left) {
                    h.push(     "left:"+this._options.absolutePosition.left+"px;");
                }
                if (this._options.absolutePosition.right) {
                    h.push(     "right:"+this._options.absolutePosition.right+"px;");
                }
                if (this._options.absolutePosition.top) {
                    h.push(     "top:"+this._options.absolutePosition.top+"px;");
                }
            }
            h.push(             "'>");

            h.push(         "<tr style='line-height:1;'>"+
                                "<td style='"+
                                    "color:"+this._getValCaptionFontColor()+";"+
                                    "font-size:1em;"+
                                    "font-style:"+this._getOptCaptionFontStyle()+";"+
                                    "font-weight:"+this._getOptCaptionFontWeight()+";"+
                                    "vertical-align:bottom;"+
                                    "padding-right:1em;"+
                                    (this._options && this._options.expandHorizontally ? "" : "width:1px;")+
                                    "'>"+
                                    "<span"+
                                    (captionTooltip ? (" title='"+captionTooltip+"'") : "")+    // Tooltip caption                                    
                                        ((!this._options || !this._options.wordWrap)
                                            ? " style='white-space:nowrap;'"                    // Specify the 'nowrap' style for IE6
                                            : "")+
                                    ">"+
                                    truncatedCaption+                                                    // Regular caption
                                "</span>"+                                    
                                "</td>");

            h.push(             "<td style='vertical-align:bottom;width:1px;'>");
            if (this._rater) this._rater.renderHtml(h);
            h.push(             "</td>");
            h.push(             "<td style='"+
                                    "color:"+this._getValNumFontColor()+";"+
                                    "font-size:"+this._getOptNumFontSize()+";"+
                                    "font-style:"+this._getOptNumFontStyle()+";"+
                                    "font-weight:bold;"+
                                    "text-align:right;"+
                                    "vertical-align:bottom;"+
                                    "width:1.8em;"+
                                    "'>&nbsp;");
            if (this._num) this._num.renderHtml(h);
            h.push(             "</td>");
            h.push(         "</tr>");
            h.push(         "<tr>");
            h.push(             "<td colspan='3' style='"+
                                    "border-color:"+(this.isReadOnly()?this._DEFAULT_LINE_COLOR_RO:this._DEFAULT_LINE_COLOR_E)+";"+
                                    "border-style:solid;border-width:1px 0px 0px 0px;"+
                                    "color:"+(this.isReadOnly()?this._DEFAULT_DESC_COLOR_RO:this._DEFAULT_DESC_COLOR_E)+";"+
                                    "font-size:1em;"+
                                    "text-align:right;"+
                                    "'>");
            if (this._desc) {
                this._desc.renderHtml(h);
            } else {
                h.push("&nbsp;");   //This is done to maintain the vertical height.
            }
            h.push(             "</td>");
            h.push(         "</tr>");
            h.push(     "</table>");
        },
        /**
        * Sets rater value, which is the new current rating.  Rating of 0 means no rating.
        */
        setValue : function(value) {
            this._rater.setValue(value);
        },

        _createSpanStrings : function() {
            this._desc = new EXPSpanString(this._getCurrentDesc());
            this._num = new EXPSpanString(this._getCurrentNum());
        },

        /**
         * Processes the 'change' event from EXPRater
         *
         * @param evt   The event object
         */
        _eventChange : function(evt) {
        	var desc = this._getCurrentDesc();
            this._desc.setValue(desc);
            this._desc.reRender();
            
            this._num.setValue(this._getCurrentNum());
            this._num.reRender();
            
            this.dispatch(evt.type, {rating:evt.rating, desc:desc});
        },

        /**
         * Returns what the current label should be.
         */
        _getCurrentDesc : function() {
            var valueUse = this._rater.getValueHover()
            if (valueUse == null) valueUse = this._rater.getValue();
            if (valueUse != null && valueUse >= 0) return this._getOptRatingsDescs()[valueUse];
            return (this._getOptRatingsAsk() && !this.isReadOnly()) ? this._getOptRatingsAskDesc() : this._getOptRatingsDescs()[0];
        },

        /**
         * Returns what the current numeric indicator should be.
         */
        _getCurrentNum : function() {
            return this._rater.getValue() ? (""+this._rater.getValue()+".0") : "&mdash;&mdash;";
        },

        /**
         * Returns the option 'captionFontColorE'.
         */
        _getOptCaptionFontColorE: function() {
            return this._options && this._options.captionFontColorE
                            ? this._options.captionFontColorE
                            : this._DEFAULT_CAPTION_FONTCOLOR_E;
        },

        /**
         * Returns the option 'captionFontColorRO'.
         */
        _getOptCaptionFontColorRO: function() {
            return this._options && this._options.captionFontColorRO
                            ? this._options.captionFontColorRO
                            : this._DEFAULT_CAPTION_FONTCOLOR_RO;
        },

        /**
         * Returns the option 'captionFontStyle'.
         */
        _getOptCaptionFontStyle: function() {
            return this._options && this._options.captionFontStyle
                            ? this._options.captionFontStyle
                            : this._DEFAULT_CAPTION_FONTSTYLE;
        },

        /**
         * Returns the option 'captionFontWeight'.
         */
        _getOptCaptionFontWeight: function() {
            return this._options && this._options.captionFontWeight
                            ? this._options.captionFontWeight
                            : this._DEFAULT_CAPTION_FONTWEIGHT;
        },

        /**
         * Returns the option 'captionOnly'.
         */
        _getOptCaptionOnly: function() {
            return this._options && this._options.captionOnly;
        },

        /**
         * Returns the option 'numFontColorE'.
         */
        _getOptNumFontColorE: function() {
            return this._options && this._options.numFontColorE
                            ? this._options.numFontColorE
                            : this._DEFAULT_NUM_FONTCOLOR_E;
        },

        /**
         * Returns the option 'numFontColorRO'.
         */
        _getOptNumFontColorRO: function() {
            return this._options && this._options.numFontColorRO
                            ? this._options.numFontColorRO
                            : this._DEFAULT_NUM_FONTCOLOR_RO;
        },

        /**
         * Returns the option 'numFontSize'.
         */
        _getOptNumFontSize: function() {
            return this._options && this._options.numFontSize
                            ? this._options.numFontSize
                            : this._DEFAULT_NUM_FONTSIZE;
        },

        /**
         * Returns the option 'numFontStyle'.
         */
        _getOptNumFontStyle: function() {
            return this._options && this._options.numFontStyle
                            ? this._options.numFontStyle
                            : this._DEFAULT_NUM_FONTSTYLE;
        },

        /**
         * Returns the option 'ratings.ask'.
         */
        _getOptRatingsAsk: function() {
            return this._options && this._options.ratings && this._options.ratings.ask;
        },

        /**
         * Returns the option 'ratings.ask.desc' or 'this._DESC_PLEASE_RATE' by default.
         */
        _getOptRatingsAskDesc: function() {
            return (this._options && this._options.ratings && this._options.ratings.ask && this._options.ratings.ask.desc) || this._DESC_PLEASE_RATE;
        },

        /**
         * Returns the option 'ratings.descs' or 'this._DESCS' by default.
         */
        _getOptRatingsDescs: function() {
            return (this._options && this._options.ratings && this._options.ratings.descs) || this._DESCS;
        },

        /**
         * Returns what the value of the caption font color should be.
         */
        _getValCaptionFontColor: function() {
            return this.isReadOnly()
                            ? this._getOptCaptionFontColorRO()
                            : this._getOptCaptionFontColorE();
        },

        /**
         * Returns what the value of the numeric indicator font color should be.
         */
        _getValNumFontColor: function() {
            return this.isReadOnly()
                            ? this._getOptNumFontColorRO()
                            : this._getOptNumFontColorE();
        },

        _DEFAULT_CAPTION_FONTCOLOR_E:   'black',
        _DEFAULT_CAPTION_FONTCOLOR_RO:  '#666666',
        _DEFAULT_CAPTION_FONTSTYLE:     'normal',
        _DEFAULT_CAPTION_FONTWEIGHT:    'bold',

        _DEFAULT_DESC_FONTCOLOR_E:      '#595959',
        _DEFAULT_DESC_FONTCOLOR_RO:     '#8c8c8c',

        _DEFAULT_NUM_FONTCOLOR_E:       'black',
        _DEFAULT_NUM_FONTCOLOR_RO:      '#666666',
        _DEFAULT_NUM_FONTSIZE:          '2.7em',
        _DEFAULT_NUM_FONTSTYLE:         'normal',

        _DEFAULT_LINE_COLOR_E:          '#5d7698',
        _DEFAULT_LINE_COLOR_RO:         '#9f9f9f',

        _DESCS:                         ['Not Rated','Unsatisfactory','Needs Development','Meets Expectations','Exceeds Expectations','Substantially Exceeds Expectations'],
        _DESC_PLEASE_RATE:              "Please Rate"
    });
})();
