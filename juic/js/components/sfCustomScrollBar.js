//! include /ui/juic/js/core/component.js

function SFCustomScrollBarMgr(autoScroller, options) {
    this._init(autoScroller, options);
}

SFCustomScrollBarMgr.SCROLL_BAR_SIZE = 17;
SFCustomScrollBarMgr.prototype = ( function() {
    return set(new EventTarget(), {
        _init : function(options) {
            this._vertical = new SFCustomScrollBar('y', options);
            this._horizontal = new SFCustomScrollBar('x', options);
            this._vertical.addEventListener('scrollChanged', this);
            this._horizontal.addEventListener('scrollChanged', this);
            this._spacer = new SFCustomScrollSpacer(options);
        },

        handleEvent : function(event) {
            switch (event.type) {
            case 'scrollChanged':
                var scrollLeft = event.axisType == 'x' ? event.position
                        : this._scrollInfo && this._scrollInfo.x ? this._scrollInfo.x.position : 0;
                var scrollTop = event.axisType == 'y' ? event.position
                        : this._scrollInfo && this._scrollInfo.y ? this._scrollInfo.y.position : 0;
                this._autoScroller.setScrollPosition(scrollLeft, scrollTop);
                break;
            }
        },

        cleanup : function() {
            this._vertical.cleanup();
            this._horizontal.cleanup();
            this._spacer.cleanup();
        },

        update : function(dimension, scrollInfo) {
            this._scrollInfo = scrollInfo;
            this._vertical.update(dimension, scrollInfo && scrollInfo.y);
            this._horizontal.update(dimension, scrollInfo && scrollInfo.x);
            this._spacer.setVisible(this._vertical.isVisible() && this._horizontal.isVisible());
        },

        get : function(axisType) {
            return axisType == 'x' ? this._horizontal : this._vertical;
        },

        getHorizontal : function() {
            return this._horizontal;
        },

        getVertical : function() {
            return this._vertical;
        },

        getSpacer : function() {
            return this._spacer;
        },

        setAutoScroller : function(autoScroller) {
            this._autoScroller = autoScroller;
        }
    });
})();

function SFCustomScrollBar(axisType, options) {
    this.register();
    this._init(axisType, options);
}

SFCustomScrollBar.prototype = ( function() {
    /* Use these constants to normalize handling of both x and y axis. */
    var AXIS_TYPES = {
        x : {
            axisType :'x',
            oppositeAxisType :'y',
            dimensionType :'width',
            startRegionType :'left',
            scrollPositionType :'scrollLeft'
        },
        y : {
            axisType :'y',
            oppositeAxisType :'x',
            dimensionType :'height',
            startRegionType :'top',
            scrollPositionType :'scrollTop'
        }
    };

    /**
     * Render all styles to an html array. <br>
     * !WARNING!: This method will not escape anything.
     * 
     * @param html : String array
     * @param style : JSON containing all styles
     */
    function renderStyle(html, style) {
        if (style) {
            html.push(' style="');
            for ( var property in style) {
                html.push(property, ':', style[property], ';');
            }
            html.push('"');
        }
    }

    /**
     * Update the styles on a DOM element to match styles provided in the style
     * JSON.
     * 
     * @param el : HTML DOM Element
     * @param style : The style JSON
     */
    function updateStyle(el, style) {
        for ( var property in style) {
            YAHOO.util.Dom.setStyle(el, property, style[property]);
        }
    }

    return set(new Component(), {
        _init : function(axisType, options) {
            this._axisType = axisType;
            this._autoScroller = options && options.autoScroller;
            this._size = (options && options.scrollBarSize) || SFCustomScrollBarMgr.SCROLL_BAR_SIZE;
            if (typeof this._size != 'number') {
                this._size = options.scrollBarSize[axisType];
            }
        },

        renderHtml : function(html) {
            var constants = AXIS_TYPES[this._axisType];
            html.push('<div id="', this.id, '"');
            html.push(' onscroll="', this.fireCode('_fireScroll'), '"');
            renderStyle(html, this._getBarStyle());
            html.push('><div id="', this.id, 'extender"');
            renderStyle(html, this._getExtenderStyle());
            html.push('></div></div>');
        },

        _fireScroll : function() {
            var constants = AXIS_TYPES[this._axisType];
            var el = $(this.id);
            var extenderPosition = el[constants.scrollPositionType];
            var scrollPosition = Math.round(this._scrollInfo.size * extenderPosition / this._extenderSize);
            this.dispatch('scrollChanged', {
                axisType :this._axisType,
                position :scrollPosition
            });
        },

        _getBarStyle : function() {
            var constants = AXIS_TYPES[this._axisType];
            var other = AXIS_TYPES[constants.oppositeAxisType];
            var barStyle = {};
            barStyle['overflow-' + this._axisType] = 'auto';
            barStyle['overflow-' + constants.oppositeAxisType] = 'hidden';
            barStyle[other.dimensionType] = this._size + 'px';

            if (!this.isVisible()) {
                barStyle.display = 'none';
            } else if (this._dimension) {
                barStyle.display = '';
                barStyle[constants.dimensionType] = this._dimension[constants.dimensionType] + 'px';
            }

            return barStyle;
        },

        _getExtenderStyle : function() {
            var constants = AXIS_TYPES[this._axisType];
            var other = AXIS_TYPES[constants.oppositeAxisType];
            var handleStyle = {};
            handleStyle[other.dimensionType] = '1px';

            if (this.isVisible()) {
                this._extenderSize = Math.round(this._dimension[constants.dimensionType] * this._scrollInfo.size
                        / this._scrollInfo.scrollArea);
                handleStyle[constants.dimensionType] = this._extenderSize + 'px';
            }

            return handleStyle;
        },

        adjustDOM : function() {
            var obj = $(this.id);
            if (obj) {
                var constants = AXIS_TYPES[this._axisType];
                var extender = $(this.id + 'extender');
                updateStyle(obj, this._getBarStyle());
                updateStyle(extender, this._getExtenderStyle());
                if (this._scrollInfo) {
                    var ratio = this._scrollInfo.position / this._scrollInfo.size;
                    var scrollPosition = Math.round(this._extenderSize * ratio);
                    var previousPosition = obj[constants.scrollPositionType];
                    if (previousPosition != scrollPosition) {
                        obj[constants.scrollPositionType] = scrollPosition;
                    }
                }
            }
        },

        update : function(dimension, scrollInfo) {
            this._dimension = {
                width :dimension.width,
                height :dimension.height
            };
            this._scrollInfo = scrollInfo;
            this.adjustDOM();
        },

        getScrollInfo : function() {
            return this._scrollInfo;
        },

        getSize : function() {
            return this._size;
        },

        isVisible : function() {
            return this._dimension && this._scrollInfo && this._scrollInfo.scrollArea < this._scrollInfo.size;
        }
    });
})();

function SFCustomScrollSpacer(options) {
    this.register();
    this._init(options);
}

SFCustomScrollSpacer.prototype = ( function() {
    return set(new Component(), {
        _init : function(options) {
            this._width = (options && options.scrollBarSize) || SFCustomScrollBarMgr.SCROLL_BAR_SIZE;
            this._height = (options && options.scrollBarSize) || SFCustomScrollBarMgr.SCROLL_BAR_SIZE;
            if (typeof this._width != 'number') {
                this._width = options.scrollBarSize.x;
                this._height = options.scrollBarSize.y;
            }
        },

        renderHtml : function(html) {
            html.push('<div id="', this.id, '" class="customScrollSpacer" style="');
            if (!this.isVisible()) {
                html.push('display:none;');
            }
            html.push('width:', this._width, 'px;height:', this._height, 'px;"></div>');
        },

        setVisible : function(visible) {
            this._visible = visible;
            var obj = $(this.id);
            if (obj) {
                obj.style.display = visible ? '' : 'none';
            }
        },

        isVisible : function() {
            return this._visible;
        }
    });
})();