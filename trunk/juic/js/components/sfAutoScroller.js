//! include /ui/juic/js/core/component.js
//! include /ui/uicore/js/Util.js

/**
 * Construct the SFAutoScroller. An auto scroller allows a component to start
 * auto-scrolling a scrollable DOM element in any direction. For example, when
 * using drag & drop it is useful to start auto-scrolling a container in the
 * direction of the drag event.
 */
function SFAutoScroller(options) {
    this._init(options);
}

SFAutoScroller.prototype = ( function() {
    var DEFAULT_INTERVAL = 200;
    var DEFAULT_TICK_SIZE = 20;
    var DEFAULT_INCREASE_TICK_SIZE = false;
    var AXIS_TYPES = {
        x : {
            scrollPositionType :'scrollLeft',
            dimensionType :'width',
            startRegionType :'left',
            endRegionType :'right',
            clientDimensionType :'clientWidth',
            scrollDimensionType :'scrollWidth'
        },
        y : {
            scrollPositionType :'scrollTop',
            dimensionType :'height',
            startRegionType :'top',
            endRegionType :'bottom',
            clientDimensionType :'clientHeight',
            scrollDimensionType :'scrollHeight'
        }
    };

    /**
     * Helper apply the min/max to a given value.
     * 
     * @param value : A number
     * @param min : The min to apply (optional)
     * @param max : The max to apply (optional)
     * @return The closest number to value that fits in the min/max bounds
     */
    function applyMinMax(value, min, max) {
        if (min != null && value < min) {
            return min;
        }
        if (max != null && value > max) {
            return max;
        }
        return value;
    }

    /**
     * Returns the distance the destination is from the region on the given
     * axis.
     * 
     * @param region : The region to test distance from
     * @param destination : The destination point or region to test distance to
     * @param axisType : Either 'x' or 'y'
     */
    function getDelta(region, destination, axisType) {
        var constants = AXIS_TYPES[axisType];
        var underBegin = Math.min(0, destination[constants.startRegionType] - region[constants.startRegionType]);
        var overEnd = Math.max(0, destination[constants.endRegionType] - region[constants.endRegionType]);
        return overEnd + underBegin;
    }

    /**
     * Ensure that the given region is within view on the given scroll El.
     * 
     * @param axisType {String} The axis type either 'x' or 'y'
     * @param scrollEl {HTMLElement} The scroll html element
     * @param region {Region} The region to scroll to
     */
    function scrollToAxis(axisType, scrollEl, region) {
        var constants = AXIS_TYPES[axisType];
        var scrollRegion = YAHOO.util.Dom.getRegion(scrollEl);
        var scrollStart = scrollRegion[constants.startRegionType];
        var scrollEnd = scrollRegion[constants.endRegionType];
        var regionStart = region[constants.startRegionType];
        var regionEnd = region[constants.endRegionType];
        if (scrollStart > regionStart || scrollEnd < regionEnd) {
            var startDistance = Math.min(Math.abs(scrollStart - regionStart), Math.abs(scrollStart - regionEnd));
            var endDistance = Math.min(Math.abs(scrollEnd - regionStart), Math.abs(scrollEnd - regionEnd));
            var scrollPosition = scrollEl[constants.scrollPositionType];
            if (startDistance < endDistance) {
                scrollPosition = Math.max(0, scrollPosition + regionStart - scrollStart);
            } else {
                scrollPosition = Math.max(0, scrollPosition + regionEnd - scrollEnd);
            }
            scrollEl[constants.scrollPositionType] = scrollPosition;
        }
    }

    return set(new EventTarget(), {
        /**
         * Initialize the SFAutoScroller.
         * 
         * @param options : JSON containing optional properties {scrollEl,
         *            extenderEl, interval, tickSize}
         */
        _init : function(options) {
            this._scrollEl = (options && options.scrollEl);
            this._extenderEl = (options && options.extenderEl);
            this._interval = (options && options.interval) || DEFAULT_INTERVAL;
            this._tickSize = (options && options.tickSize) || DEFAULT_TICK_SIZE;
            this._increaseTickSize = (options && options.increaseTickSize) || DEFAULT_INCREASE_TICK_SIZE;
            this._axisData = {
                x : {},
                y : {}
            };

            assert(typeof this._interval == 'number' && this._interval > 0, 'interval must be a positive number');
            assert(typeof this._tickSize == 'number' && this._tickSize > 0, 'tickSize must be a positive number');
        },

        /**
         * Auto scroll to a destination point on a single axis ignoring the
         * other.
         * 
         * @param destination : The point to start scrolling in the direction of
         * @param axisType : Either 'x' or 'y'
         * @param autoIncreaseSize : If scrolling beyond the bounderies, should
         *            the auto scroller increase the size of the extender?
         */
        autoScrollAxis : function(destination, axisType, autoIncreaseSize) {
            assert(this._scrollEl, 'Scroll DOM element not available');
            var scrollRegion = YAHOO.util.Dom.getRegion(this._scrollEl);
            var axisData = {};
            axisData[axisType] = {
                delta :getDelta(scrollRegion, destination, axisType)
            };
            this._startScrolling(axisData, autoIncreaseSize);
        },

        /**
         * Auto scroll to a destination point on both x and y axis.
         * 
         * @param destination : The point to start scrolling in the direction of
         * @param autoIncreaseSize : If scrolling beyond the bounderies, should
         *            the auto scroller increase the size of the extender?
         */
        autoScroll : function(destination, autoIncreaseSize) {
            assert(this._scrollEl, 'Scroll DOM element not available');
            var scrollRegion = YAHOO.util.Dom.getRegion(this._scrollEl);
            var axisData = {};
            for ( var axisType in AXIS_TYPES) {
                axisData[axisType] = {
                    delta :getDelta(scrollRegion, destination, axisType)
                };
            }
            this._startScrolling(axisData, autoIncreaseSize);
        },

        /**
         * Ensure that the given region is entirely visible by the scroll html
         * element.
         * 
         * @param region {Region} The region to scroll to
         */
        scrollTo : function(region) {
            var scrollEl = this.getScrollEl();
            if (scrollEl) {
                var scrollX = scrollEl[AXIS_TYPES.x.scrollPositionType];
                var scrollY = scrollEl[AXIS_TYPES.y.scrollPositionType];
                scrollToAxis('x', scrollEl, region);
                scrollToAxis('y', scrollEl, region);
                var deltaX = scrollEl[AXIS_TYPES.x.scrollPositionType] - scrollX;
                var deltaY = scrollEl[AXIS_TYPES.y.scrollPositionType] - scrollY;
                if (deltaX != 0 || deltaY != 0) {
                    this.dispatch('autoScroll', {
                        delta : {
                            x :deltaX,
                            y :deltaY
                        }
                    });
                    return true;
                }
            }
            return false;
        },

        /**
         * Ensure that the given region is entirely visible on the given axis
         * (ignoring the other) by the scroll html element.
         * 
         * @param region {Region} The region to scroll to
         */
        scrollToAxis : function(axisType, region) {
            var scrollEl = this.getScrollEl();
            if (scrollEl) {
                var constants = AXIS_TYPES[axisType];
                var scrollPosition = scrollEl[constants.scrollPositionType];
                scrollToAxis(axisType, scrollEl, region);
                var deltaPosition = scrollEl[constants.scrollPositionType] - scrollPosition;
                if (deltaPosition != 0) {
                    var delta = {};
                    delta[axisType] = deltaPosition;
                    this.dispatch('autoScroll', {
                        delta :delta
                    });
                    return true;
                }
            }
            return false;
        },

        /**
         * Move the scroll one time in any direction.
         * 
         * @param deltaX {integer} how far to move the scroll position
         *            horizontally (use negative to go left, positive to go
         *            right.
         * @param deltaY {integer} how far to move the scroll position
         *            vertically (use negative to go up, positive to go down)
         */
        scrollMove : function(deltaX, deltaY) {
            var scrollEl = this.getScrollEl();
            if (scrollEl) {
                var scrollX = scrollEl[AXIS_TYPES.x.scrollPositionType];
                var scrollY = scrollEl[AXIS_TYPES.y.scrollPositionType];
                scrollEl[AXIS_TYPES.x.scrollPositionType] += deltaX;
                scrollEl[AXIS_TYPES.y.scrollPositionType] += deltaY;
                var deltaX = scrollEl[AXIS_TYPES.x.scrollPositionType] - scrollX;
                var deltaY = scrollEl[AXIS_TYPES.y.scrollPositionType] - scrollY;
                if (deltaX != 0 || deltaY != 0) {
                    this.dispatch('autoScroll', {
                        delta : {
                            x :deltaX,
                            y :deltaY
                        }
                    });
                    return true;
                }
            }
            return false;
        },

        /**
         * Set the scroll position to a particular location.
         * 
         * @param scrollLeft {int} The left position
         * @param scrollTop {int} The top position
         */
        setScrollPosition : function(scrollLeft, scrollTop) {
            var scrollEl = this.getScrollEl();
            if (scrollEl) {
                var previousLeft = scrollEl.scrollLeft
                var previousTop = scrollEl.scrollTop;
                scrollEl.scrollLeft = Math.max(0, Math.min(scrollEl.scrollWidth - scrollEl.clientWidth, scrollLeft));
                scrollEl.scrollTop = Math.max(0, Math.min(scrollEl.scrollHeight - scrollEl.clientHeight, scrollTop));
                var deltaX = scrollEl.scrollLeft - previousLeft;
                var deltaY = scrollEl.scrollTop - previousTop;
                if (deltaX != 0 || deltaY != 0) {
                    this.dispatch('autoScroll', {
                        delta : {
                            x :deltaX,
                            y :deltaY
                        }
                    });
                    return true;
                }
            }
            return false;
        },

        /**
         * Stop any scrolling on the given axisType, if no axisType provided
         * stop all scrolling on both axis.
         * 
         * @param axisType : Optional, Either 'x' or 'y', If null will stop on
         *            both axis
         */
        stopScrolling : function(axisType) {
            if (this.isScrolling()) {
                var stop = !axisType;
                if (axisType) {
                    this._axisData[axisType].multiplier = 0;
                    if (this._axisData[axisType == 'x' ? 'y' : 'x'].multiplier == 0) {
                        stop = true;
                    }
                }
                if (stop) {
                    clearInterval(this._intervalId);
                    this._intervalId = null;
                }
            }
        },

        /**
         * This method returns basic information about the scrollable container.
         * 
         * @return {Object} Contains vertical and horizontal space/position
         */
        getScrollInfo : function() {
            var scrollEl = this.getScrollEl();
            if (scrollEl) {
                return {
                    y : {
                        size :scrollEl.scrollHeight,
                        scrollArea :scrollEl.clientHeight,
                        position :scrollEl.scrollTop
                    },
                    x : {
                        size :scrollEl.scrollWidth,
                        scrollArea :scrollEl.clientWidth,
                        position :scrollEl.scrollLeft
                    }
                };
            }
            return null;
        },

        getScrollEl : function() {
            return typeof this._scrollEl == 'string' ? $(this._scrollEl) : this._scrollEl;
        },

        setScrollEl : function(scrollEl) {
            this._scrollEl = scrollEl;
        },

        getExtenderEl : function() {
            return typeof this._extenderEl == 'string' ? $(this._extenderEl) : this._extenderEl;
        },

        setExtenderEl : function(extenderEl) {
            this._extenderEl = extenderEl;
        },

        isScrolling : function() {
            return this._intervalId != null;
        },

        /**
         * Start scrolling on either axis providing extra data on each axis,
         * such as min/max scrolling position.
         * 
         * @param axisData : JSON containing information on either axis
         * @param autoIncreaseSize : If scrolling beyond the bounderies, should
         *            the auto scroller increase the size of the extender?
         */
        _startScrolling : function(axisData, autoIncreaseSize) {
            assert(axisData, 'axisData required to startScrolling');
            this._autoIncreaseSize = autoIncreaseSize;
            assert(!this._autoIncreaseSize || this._extenderEl, 'Must have an extender to auto-increase size');
            this._axisData = this._createAxisData(axisData);

            if (!this.isScrolling() && (this._axisData.x.multiplier != 0 || this._axisData.y.multiplier != 0)) {
                this._intervalId = setInterval(Util.createCallback(this, '_autoScroll'), this._interval);
                this._autoScroll();
            }
        },

        /**
         * This is the method being called using the setInterval. It is called
         * to scroll the scrollEl one tick on either x or y axis (or both).
         */
        _autoScroll : function() {
            var scrollX = this._autoScrollAxis('x');
            var scrollY = this._autoScrollAxis('y');
            if (scrollX == 0 && scrollY == 0) {
                this.stopScrolling();
            } else {
                this.dispatch('autoScroll', {
                    delta : {
                        x :scrollX,
                        y :scrollY
                    }
                });
            }
        },

        /**
         * Helper to handle scrolling on a single axis.
         * 
         * @param axisType : Either 'x' or 'y'
         */
        _autoScrollAxis : function(axisType) {
            var result = 0;
            var axisData = this._axisData[axisType];
            var multiplier = axisData.multiplier;

            if (multiplier != 0) {
                var constants = AXIS_TYPES[axisType];
                var scrollEl = this.getScrollEl();
                var position = scrollEl[constants.scrollPositionType];
                var delta = multiplier * this._tickSize;
                var newPosition = applyMinMax(position + delta, axisData.minPosition, axisData.maxPosition);
                delta = newPosition - position;

                if (delta != 0) {
                    if (this._autoIncreaseSize && newPosition > axisData.clientMaxPosition) {
                        this._increaseClientSize(axisType, newPosition);
                    }

                    scrollEl[constants.scrollPositionType] = newPosition;
                    result = scrollEl[constants.scrollPositionType] - position;
                }
            }

            return result;
        },

        /**
         * Helper will take the axisData given by the user object and will
         * create new objects which will guarantee the JSON structure and
         * provide pre-calculated values.
         * 
         * @param axisDataInput : The JSON from the input
         */
        _createAxisData : function(axisDataInput) {
            var axisData = {};

            for ( var axisType in AXIS_TYPES) {
                var constants = AXIS_TYPES[axisType];
                var data = set( {}, axisDataInput[axisType]);

                if (data.delta) {
                    data.multiplier = data.delta < 0 ? -1 : 1;
                    if (this._increaseTickSize) {
                        var modulus = Math.floor(Math.abs(data.delta) / 25);
                        if (modulus > 0) {
                            data.multiplier *= modulus;
                        }
                    }
                    var scrollEl = this.getScrollEl();
                    var scrollDimension = scrollEl[constants.scrollDimensionType];
                    var clientDimension = scrollEl[constants.clientDimensionType];
                    var clientMaxPosition = scrollDimension - clientDimension;
                    var minPosition = data.minPosition || 0;
                    var maxPosition = data.maxPosition;
                    if (maxPosition > clientMaxPosition && !this._autoIncreaseSize) {
                        maxPosition = clientMaxPosition;
                    }
                    data.clientMaxPosition = clientMaxPosition;
                    data.minPosition = minPosition;
                    data.maxPosition = maxPosition;
                } else {
                    data.multiplier = 0;
                }

                axisData[axisType] = data;
            }

            return axisData;
        },

        /**
         * Handle increasing the extender dom element's size (width or height
         * depending on axisType) such that the given scroll position can be set
         * without being cut off.
         * 
         * @param axisType : Either 'x' or 'y' the axis to increase size on
         * @param newPosition : The scrollPosition the element is trying to
         *            scroll to
         */
        _increaseClientSize : function(axisType, newPosition) {
            var axisData = this._axisData[axisType];
            var constants = AXIS_TYPES[axisType];
            var delta = newPosition - axisData.clientMaxPosition;
            var extenderEl = this.getExtenderEl();
            var childDimension = extenderEl.firstChild[constants.clientDimensionType];
            var clientDimension = extenderEl[constants.clientDimensionType];
            clientDimension = Math.max(childDimension, clientDimension);
            var newDimension = clientDimension + delta;
            extenderEl.style[constants.dimensionType] = newDimension + 'px';
            this.dispatch('clientSizeIncrease', {
                dimensionType :constants.clientDimensionType,
                oldSize :clientDimension,
                newSize :newDimension
            });
        }
    });
})();