//! include /ui/juic/js/components/sfAutoScroller.js
//! include /ui/juic/js/components/sfDragDropMgr.js
//! include /ui/juic/js/components/sfSpacingManager.js
//! include /ui/static/css/components/sfMatrixLayout.css

/**
 * The Matrix Layout is a very flexible layout which will take in a 2D array of
 * components and display these components in a matrix or table. Each row/column
 * will have a fixed width and height, sizes will be calculated by the
 * SFSpacingManager and will be based off rules defined in your spacing options.
 * 
 * The child components will be constantly notified through a 'resize' event of
 * the dimension (width and height) of the cell containing the component. This
 * event is fired any time a cell dimension changes.
 * 
 * ------------------------------------------------------------------------------
 * Constructor Options:
 * 
 * <li>columnOptions {Object}: Options to pass to the column's SFSpacingManager
 * <li>columnSpacing {Object[]}: Spacing options for each column.
 * <li>rowOptions {Object}: Options to pass to the row's SFSpacingManager
 * <li>rowSpacing {Object[]}: Spacing options for each row.
 * <li>adjusterSize {integer}: The size of the adjuster
 * <li>scrollableCells {boolean}: Should the cells be scrollable
 * <li>dragByResizing {boolean}: Set to false if you want the hovering line to
 * show, true will adjust cells as you drag.
 * <li>dragBothAdjusters {boolean}: Set to true if you want the row/column
 * intersection to adjust both axis at the same time.
 * <li>minimizeSpace {boolean}: Set to true if you want the matrix layout to
 * reduce size if cells have been adjusted to be smaller than allotted size.
 * <li>hideScrollBars {boolean}: Set to true if you want the scroll bars not to
 * show.
 * <li>scrollBarMgr {Any}: The scroll bar manager, if you want to use something
 * other than the browser default
 * 
 * NOTE: These are all OPTIONAL (see defaults below)
 * 
 * <li>columnOptions: {adjustmentType: 'simple', bounded: false}
 * <li>columnSpacing: [{minSize: 0, weight: 1}, ...] (one for each column)
 * <li>rowOptions: {adjustmentType: 'simple', bounded: false}
 * <li>rowSpacing: [{minSize: 0, weight: 1}, ...] (one for each row)
 * <li>adjusterSize: 5
 * <li>scrollableCells: true
 * <li>dragByResizing: true
 * <li>dragBothAdjusters: true
 * <li>minimizeSpace: false
 * <li>hideScrollBars: false
 * <li>scrollBarMgr: null
 * 
 * ------------------------------------------------------------------------------
 * Column / Row Options:
 * 
 * These options are passed along to the SFSpacingManager. These go into the
 * constructor options {rowOptions, columnOptions}
 * 
 * <li>adjustmentType {String} The scheme to use when adjusting a column or row
 * <li>bounded {boolean} If the row/column should not increase or decrease in
 * size
 * 
 * ------------------------------------------------------------------------------
 * Spacing Options:
 * 
 * These are attributes on the spacing object array in the constructor options.
 * Some of these options are passed along to the SFSpacingManager to calculate
 * the sizes for rows and columns.
 * 
 * <li>minSize {integer} The space should go no less than this
 * <li>maxSize {integer} The space should go no greater than this
 * <li>fixedSize {integer} The space will always be this value
 * <li>weight {integer} The relative weight to apply to this cell
 * <li>adjustable {boolean} If this cell should have an adjuster
 * <li>frozen {boolean} Is this cell frozen (should be on the edge)
 * <li>hidden {boolean} Is this cell hidden from view (but still rendered)
 * <li>className {String} This style class will be applied to the row or column
 * 
 * ------------------------------------------------------------------------------
 * Updating Spacing Options (after construction):
 * 
 * After you create the matrix layout, you can update some of the spacing
 * options.
 * 
 * Update-able Options:
 * <li>className: You can update the style class of a row
 * <li>hidden: You can make a row or column hidden or visible
 * 
 * How to update spacing options:
 * <code>getCellManager().setSpacingOption(axisType, index, propertyName, value)</code>
 * 
 * Note: axisType will be 'x' or 'y'
 * 
 * ------------------------------------------------------------------------------
 * Cell Properties:
 * 
 * These properties can be set on individual cells in the matrix, and must be
 * set on the cell manager after you construct the matrix layout.
 * 
 * Supported Properties:
 * <li>header {boolean} Set to true if the cell should be rendered as a TH
 * <li>scrollable {boolean} Set to override the scrollableCells option on a
 * particular cell
 * 
 * How to set properties:
 * <code>getCellManager().setCellProperty(rowIndex, columnIndex, propertyName, value)</code>
 * <code>getCellManager().setCellProperties(rowIndex, columnIndex, properties)</code>
 * 
 * ------------------------------------------------------------------------------
 * Frozen Row/Column:
 * 
 * Through use of the frozen spacing option, you may specify that a row or
 * column will be frozen or fixed - meaning it will not scroll out of view. You
 * may only specify frozen rows/columns in the beginning or the end of the
 * section (i.e. the 'edges' of the matrix) as long as the frozen cells are
 * contiguous.
 * 
 * Example:
 * 
 * <pre>
 * columnSpacing = [{frozen: true}, {frozen: true}, {}, {}, {frozen: true}];
 * rowSpacing = [{frozen: true}, {}, {}];
 * 
 * These options will layout a matrix like this:
 * [frozen, frozen, frozen, frozen, frozen]
 * [frozen, frozen, scroll, scroll, frozen]
 * [frozen, frozen, scroll, scroll, frozen]
 * </pre>
 * 
 * ------------------------------------------------------------------------------
 * Adjustable Row/Column:
 * 
 * Rows and/or columns can be set with the adjustable flag to show a cell
 * adjuster. Row adjusters appear below the row, column adjusters appear to the
 * right side of the column.
 */
function SFMatrixLayout(cells, options) {
    this.register();
    this._init(cells, options);
}

SFMatrixLayout.FIRST_SECTION = 'first';
SFMatrixLayout.MIDDLE_SECTION = 'middle';
SFMatrixLayout.LAST_SECTION = 'last';
SFMatrixLayout.prototype = ( function() {
    /* Default values for some properties. */
    var ADJUSTER_SIZE = 5;
    var SCROLLABLE_CELLS = true;
    var DRAG_BOTH_ADJUSTERS = true;
    var DRAG_BY_RESIZING = false;
    var MINIMIZE_SPACE = false;
    var HIDE_SCROLL_BARS = false;
    var SCROLL_BAR_TYPE = 'default';

    /* Constants. */
    var EXTENDER_PADDING = 30;
    var MOUSE_WHEEL_TICK = 20;
    var MIDDLE = SFMatrixLayout.MIDDLE_SECTION;
    var SECTIONS = [ SFMatrixLayout.FIRST_SECTION, MIDDLE, SFMatrixLayout.LAST_SECTION ];
    var MANAGER_EVENTS = [ 'contentsChanged', 'propertiesChanged', 'spacingOptionsChanged', 'requestAdjust',
            'intervalAdded', 'intervalRemoved', 'intervalMoved' ];
    var SCROLL_BAR_TYPES = [ 'default', 'custom', 'hidden' ];

    /* Use these constants to normalize handling of both x and y axis. */
    var AXIS_TYPES = {
        x : {
            axisType :'x',
            oppositeAxisType :'y',
            cursorType :'col-resize',
            cellType :'column',
            spanType :'colSpan',
            dimensionType :'width',
            startRegionType :'left',
            endRegionType :'right',
            clientDimensionType :'clientWidth',
            offsetDimensionType :'offsetWidth',
            scrollDimensionType :'scrollWidth',
            scrollPositionType :'scrollLeft',
            paddingStart :'padding-left',
            paddingEnd :'padding-right',
            scrollBarSize :17
        },
        y : {
            axisType :'y',
            oppositeAxisType :'x',
            cursorType :'row-resize',
            cellType :'row',
            spanType :'rowSpan',
            dimensionType :'height',
            startRegionType :'top',
            endRegionType :'bottom',
            clientDimensionType :'clientHeight',
            offsetDimensionType :'offsetHeight',
            scrollDimensionType :'scrollHeight',
            scrollPositionType :'scrollTop',
            paddingStart :'padding-top',
            paddingEnd :'padding-bottom',
            scrollBarSize :17
        }
    };

    /**
     * Match the scroll on a particular axis to the given dom element id.
     * 
     * @param scrollEl : The scrollable dom element
     * @param axisType : Either 'x' or 'y'
     * @param id : The dom element id to modify the scroll position
     * @param extenderId : The id of the extender dom el
     */
    function matchScroll(scrollEl, axisType, id, extenderId) {
        var el = $(id);
        if (el) {
            var constants = AXIS_TYPES[axisType];
            var positionType = constants.scrollPositionType;
            var position = scrollEl[positionType];
            var scrollDimension = el[constants.scrollDimensionType];
            var maxPosition = scrollDimension - el[constants.clientDimensionType];
            if (position > maxPosition) {
                var extender = $(extenderId);
                var newSize = scrollDimension + position - maxPosition;
                extender.style[constants.dimensionType] = newSize + 'px'
            }
            el[positionType] = position;
        }
    }

    /**
     * Determine if a point has a particular axis contained within the region.
     * 
     * @param region : The region to check (with top, left, bottom, right)
     * @param point : The point (with x and y)
     * @param axisType : Either 'x' or 'y'
     */
    function regionContainsAxis(region, point, axisType) {
        var constants = AXIS_TYPES[axisType];
        var min = region[constants.startRegionType];
        var max = region[constants.endRegionType];
        var value = point[axisType];
        return value >= min && value <= max;
    }

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
     * Get a single dimension style.
     * 
     * @param axisType : Either 'x' or 'y'
     * @param size : number
     * @param style : optional JSON to append to
     */
    function getSingleDimensionStyle(axisType, size, style) {
        var result = style || {};
        result[AXIS_TYPES[axisType].dimensionType] = size + 'px';
        return result;
    }

    /**
     * Get a dimension style with width/height.
     * 
     * @param dimension : JSON contains width and height
     * @param style : optional JSON to append to
     */
    function getDimensionStyle(dimension, style) {
        var result = getSingleDimensionStyle('x', dimension.width, style);
        return getSingleDimensionStyle('y', dimension.height, result);
    }

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
     * Render the row and col span attributes.
     * 
     * @param html {String[]} The html array
     * @param cellSpan {Object} Contains the rowSpan and colSpan values.
     */
    function renderCellSpan(html, cellSpan) {
        if (cellSpan) {
            if (cellSpan.colSpan > 1) {
                html.push(' colSpan="', cellSpan.colSpan, '"');
            }
            if (cellSpan.rowSpan > 1) {
                html.push(' rowSpan="', cellSpan.rowSpan, '"');
            }
        }
    }

    /**
     * Update the span of an element.
     * 
     * @param el {HTMLElement} The html element to update
     * @param cellSpan {Object} Contains the row and column span.
     */
    function updateCellSpan(el, cellSpan) {
        if (cellSpan) {
            if (cellSpan.colSpan >= 1) {
                el.colSpan = cellSpan.colSpan;
            }
            if (cellSpan.rowSpan >= 1) {
                el.rowSpan = cellSpan.rowSpan;
            }
        }
    }

    /**
     * Render a class name into the html.
     * 
     * @param html {String[]} The html array
     * @param className {String} The class name to render.
     */
    function renderClassName(html, className) {
        if (className) {
            html.push(' class="', className, '"');
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

    /**
     * Get an option from the options object, if not present then return a
     * default.
     * 
     * @param options {Object} The object containing all options
     * @param optionName {String} The name of the option
     * @param defaultValue {any} The default value if the option isn't there
     */
    function getOption(options, optionName, defaultValue) {
        return (options && options[optionName] != null) ? options[optionName] : defaultValue;
    }

    /**
     * A util that abstracts position so that the caller doesn't need to check
     * the axis type and switch.
     * 
     * @param axisTypeFirst {String} which axis type is the first object from?
     * @param first {any} The first object
     * @param second {any} The second object
     */
    function getRowColumn(axisTypeFirst, first, second) {
        var xFirst = axisTypeFirst == 'x';
        return {
            row :xFirst ? second : first,
            column :xFirst ? first : second
        };
    }

    /**
     * A helper which will increase any indices in the array that are after
     * index0.
     * 
     * @param indices {integer[]} Array of indices
     * @param index0 {integer} The from index
     * @param index1 {integer} The to index
     */
    function increaseIndices(indices, index0, index1) {
        for ( var idx = 0, len = indices.length; idx < len; idx++) {
            if (indices[idx] >= index0) {
                indices[idx] += index1 - index0 + 1;
            }
        }
    }

    /**
     * A helper which will insert all indices between the given ones into the
     * indices array.
     * 
     * @param indices {integer[]} Array of indices
     * @param index0 {integer} The from index
     * @param index1 {integer} The to index
     */
    function insertIndices(indices, index0, index1) {
        var start = Math.max(index0 - indices[0], 0);
        for ( var idx = index1; idx >= index0; idx--) {
            indices.splice(start, 0, idx);
        }
    }

    /**
     * A helper which will remove all indices between the given ones from the
     * indices array.
     * 
     * @param indices {integer[]} Array of indices
     * @param index0 {integer} The from index
     * @param index1 {integer} The to index
     */
    function removeIndices(indices, index0, index1) {
        var idx = 0;
        while (idx < indices.length) {
            if (indices[idx] >= index0 && indices[idx] <= index1) {
                var remove = Math.min(indices.length - idx, index1 - index0 + 1);
                indices.splice(idx, remove);
            } else {
                if (indices[idx] >= index1) {
                    indices[idx] -= index1 - index0 + 1;
                }
                idx++;
            }
        }
    }

    /**
     * Return the index of an object from the given array.
     * 
     * @param array {Object[]} The array to test
     * @param obj {any} The object to look for
     * @return {integer} The index of the given object, -1 if not exist
     */
    function indexOf(array, obj) {
        for ( var idx = 0, len = array.length; idx < len; idx++) {
            if (array[idx] == obj) {
                return idx;
            }
        }
        return -1;
    }

    /**
     * Render an adjuster cell.
     * 
     * @param html {String[]} The html array
     * @param adjusterInfo {Object} An object containing the adjuster
     *            information
     */
    function renderAdjuster(html, info) {
        if (info) {
            html.push('<td id="', info.id);
            html.push('" class="', info.className);
            html.push('" onmousedown="', info.onmousedown);
            html.push('" onmouseover="', info.onmouseover);
            html.push('" onmouseout="', info.onmouseout, '"');
            renderCellSpan(html, info);
            renderStyle(html, info.style);
            html.push(' unselectable="on">');
            info.renderSpacerMethod(html, info);
            html.push('</td>');
        }
        return html;
    }

    /**
     * Render a spacer image.
     * 
     * @param html {String[]} String array
     * @param info {Object} The object containing the adjuster info
     */
    function renderSpacer(html, info) {
        var width = info.intersection || info.axisType == 'x' ? info.adjusterSize : 1;
        var height = info.intersection || info.axisType == 'y' ? info.adjusterSize : 1;
        if (Util.browserInfo.ie) {
            html.push('<img src="/ui/uicore/img/_old.gif" style="width: ', width, 'px; height: ');
            html.push(height, 'px; visibility: hidden">');
        } else {
            html.push('<div style="width: ', width, 'px; height: ');
            html.push(height, 'px;"></div>');
        }
    }

    /**
     * Update the adjuster DOM object with new information.
     * 
     * @param scratchPad {HTMLElement} The scratch pad div object
     * @param obj {HTMLElement} The dom object to update
     * @param info {Object} An object containing the adjuster information
     */
    function updateAdjuster(scratchPad, obj, info) {
        var adjuster = createCellDOM(renderAdjuster( [], info), scratchPad);
        obj.parentNode.replaceChild(adjuster[0], obj);
    }

    /**
     * Insert one or more DOM objects into a parent DOM object.
     * 
     * @param parent {HTMLElement} The element to append the child to
     * @param childArray {HTMLElement[]} The array of current children
     * @param index {integer} The index to insert the child into
     * @param child {HTMLElement|HTMLElement[]} The child to insert into the
     *            parent
     * @param removeFirst {boolean} Should the child be removed first
     */
    function insertDOMInto(parent, childArray, index, child, removeFirst) {
        if (removeFirst) {
            var firstChild = child;
            var childCount = 1;
            if (child instanceof Array) {
                firstChild = child[0];
                countCount = child.length;
            }
            var childIndex = indexOf(childArray, firstChild);
            if (index >= childIndex) {
                index += countCount;
            }
        }
        var append = childArray.length <= index;
        var insertBefore = append ? null : childArray[index];
        if (child instanceof Array) {
            for ( var idx = 0, len = child.length; idx < len; idx++) {
                var obj = child[idx];
                if (append) {
                    parent.appendChild(obj);
                } else {
                    parent.insertBefore(obj, insertBefore);
                }
            }
        } else if (append) {
            parent.appendChild(child);
        } else {
            parent.insertBefore(child, insertBefore);
        }
    }

    /**
     * Move all the children from one dom element to another.
     * 
     * @param from {HTMLElement} The from element
     * @param to {HTMLElement} The to element
     */
    function moveChildren(from, to) {
        if (from != to) {
            var first = true;
            for ( var idx = from.childNodes.length - 1; idx >= 0; idx--) {
                var child = from.childNodes[idx];
                if (first) {
                    to.appendChild(child);
                } else {
                    to.insertBefore(child, to.firstChild);
                }
                first = false;
            }
        }
    }

    /**
     * Copy an array object. Useful when a given array is actually an
     * HTMLElement array and we dont want it change when dom elements change.
     * 
     * @param array {any[]} The array to copy
     * @return {any[]} A copy of the given array
     */
    function copyArray(array) {
        var result = [];
        for ( var idx = 0, len = array.length; idx < len; idx++) {
            result[idx] = array[idx];
        }
        return result;
    }

    /**
     * Create one or more row DOM objects.
     * 
     * @param html {String[]} The html array to get the html from
     * @param scratchPad {HTMLElement} A scratch pad dom object
     * @return {HTMLElement} The new DOM object(s)
     */
    function createRowDOM(html, scratchPad) {
        scratchPad.innerHTML = '<table>' + html.join('') + '</table>';
        return copyArray(scratchPad.firstChild.rows);
    }

    /**
     * Create a cell DOM object.
     * 
     * @param html {String[]} The html array to get the html from
     * @param scratchPad {HTMLElement} A scratch pad dom object
     * @return {HTMLElement} The new DOM object.
     */
    function createCellDOM(html, scratchPad) {
        scratchPad.innerHTML = '<table><tr>' + html.join('') + '</tr></table>';
        return copyArray(scratchPad.firstChild.rows[0].cells);
    }

    /**
     * Determine if the scroll element can scroll the given delta.
     * 
     * @param scrollEl {HtmlElement} The scrollable area
     * @param axisType {String} The axis to scroll on
     * @param delta {int} How much to scroll
     */
    function canScrollMove(scrollEl, axisType, delta) {
        var constants = AXIS_TYPES[axisType];
        var position = scrollEl[constants.scrollPositionType];
        if (delta < 0) {
            return position > 0;
        } else {
            var clientSize = scrollEl[constants.clientDimensionType];
            var scrollSize = scrollEl[constants.scrollDimensionType];
            return position < scrollSize - clientSize;
        }
    }

    /**
     * Private util function that will retrieve a suggested value (i.e. padding
     * left, padding top, etc) for a particular html element. The value will
     * default to the defined value in the width or height of that element, if
     * that is not provided then it will take the offset and subtract any
     * defined padding.
     * 
     * @param el {HTMLElement} The html element to get the suggested value from
     * @param axisType {String} Either 'x' or 'y'
     */
    function getSuggestedValue(el, axisType) {
        var value = null;
        if (el) {
            var getStyle = YAHOO.util.Dom.getStyle;
            var constants = AXIS_TYPES[axisType];
            var size = getStyle(el, constants.dimensionType);
            var sizeValue = parseInt(size);
            if (size && size.indexOf('%') < 0 && !isNaN(sizeValue)) {
                return sizeValue;
            }
            var offset = el[constants.offsetDimensionType];
            var paddingStart = parseInt(getStyle(el, constants.paddingStart));
            var paddingEnd = parseInt(getStyle(el, constants.paddingEnd));
            value = offset - (isNaN(paddingStart) ? 0 : paddingStart) - (isNaN(paddingEnd) ? 0 : paddingEnd);
        }
        return value;
    }

    /**
     * This is a private function util function defined only for the use within
     * the sfMatrixLayout - it is not a member function and instead is a static
     * function.
     * 
     * It is used inside the new public 'adjustDOM' method of the sfMatrixLayout
     * which will be similar to the 'adjustDOM' method of the sfDataGrid - but
     * this method will be purely optional (whereas the sfDataGrid made this
     * required to be called after render).
     * 
     * This will size the entire matrix layout to be the same size as the matrix
     * layout's parent element.
     * 
     * If the parent element has a width/height defined in the style - it will
     * use that - otherwise it will use the offsets.
     * 
     * This same logic (not exact code) was taken from the sfDataGrid.
     * 
     * @el {HTMLElement} The element you want to suggest a dimension on
     */
    function getSuggestedDimension(el) {
        var dimension = null;
        if (el) {
            var parent = el.parentNode || el.parentElement;
            dimension = {
                width :getSuggestedValue(parent, 'x'),
                height :getSuggestedValue(parent, 'y')
            };
        }
        return dimension;
    }

    return set(new Component(), {
        /**
         * Initialize the layout.
         * 
         * @param cells {Component[][] | SFMatrixCellManager}: The 2D array of
         *            cells (or the matrix cell manager).
         * @param options {Object} See documentation for options
         */
        _init : function(cells, options) {
            var dimensionOption = getOption(options, 'dimension', null);

            this._adjusterSize = getOption(options, 'adjusterSize', ADJUSTER_SIZE);
            this._dragBothAdjusters = getOption(options, 'dragBothAdjusters', DRAG_BOTH_ADJUSTERS);
            this._dragByResizing = getOption(options, 'dragByResizing', DRAG_BY_RESIZING);
            this._minimizeSpace = getOption(options, 'minimizeSpace', MINIMIZE_SPACE);
            this._scrollableCells = getOption(options, 'scrollableCells', SCROLLABLE_CELLS);
            this._renderSpacerMethod = getOption(options, 'renderSpacerMethod', renderSpacer);
            this._scrollBarMgr = getOption(options, 'scrollBarMgr');
            this._hideScrollBars = getOption(options, 'hideScrollBars', HIDE_SCROLL_BARS);
            this._className = getOption(options, 'className');

            if (!this._renderSpacerMethod) {
                this._renderSpacerMethod = renderSpacer;
            }

            if (this._scrollBarMgr) {
                this._hideScrollBars = true;
                this._scrollBarMgr.setAutoScroller(this.getAutoScroller());
            }

            var manager = null;
            if (cells instanceof SFMatrixCellManager) {
                manager = cells;
            } else {
                manager = new SFMatrixCellManager(cells, options);
            }

            this.setCellManager(manager);
            if (dimensionOption) {
                this.setDimension(dimensionOption);
            }
        },

        /**
         * Set the cell manager for this layout.
         */
        setCellManager : function(cellManager) {
            assert(cellManager instanceof SFMatrixCellManager,
                    '[SFMatrixLayout] The cell manager is not a SFMatrixCellManager');

            if (this._cellManager) {
                for ( var idx = 0, len = MANAGER_EVENTS.length; idx < len; idx++) {
                    this._cellManager.removeEventListener(MANAGER_EVENTS[idx], this);
                }
            }

            this._cellManager = cellManager;
            for ( var idx = 0, len = MANAGER_EVENTS.length; idx < len; idx++) {
                this._cellManager.addEventListener(MANAGER_EVENTS[idx], this);
            }

            this._axisData = {};
            this._createAxisData('x');
            this._createAxisData('y');

            if (this._dimension) {
                this._refreshDimensions();
            }

            this._updateContent();
        },

        /**
         * Retrieve a reference to the matrix's cell manager.
         * 
         * @return the reference to the SFMatrixCellManager instance.
         */
        getCellManager : function() {
            return this._cellManager;
        },

        /**
         * Cleanup the matrix layout.
         */
        cleanup : function(cleanupComponents) {
            for ( var idx = 0, len = MANAGER_EVENTS.length; idx < len; idx++) {
                this._cellManager.removeEventListener(MANAGER_EVENTS[idx], this);
            }
            this._cellManager.cleanup(cleanupComponents);
            this.unregister();
        },

        /**
         * JUIC Event handle function.
         * 
         * @param event : The event object
         */
        handleEvent : function(event) {
            switch (event.type) {
            case 'autoScroll':
                this._onAutoScroll(event);
                break;
            case 'resize':
                this.setDimension( {
                    width :event.width,
                    height :event.height
                });
                break;
            case 'contentsChanged':
                this._updateCellContent(event.rowIndex, event.columnIndex);
                break;
            case 'propertiesChanged':
                this._updateCellProperties(event.rowIndex, event.columnIndex);
                break;
            case 'spacingOptionsChanged':
                this._updateSpacingOptions(event.axisType, event.index, event.oldOptions);
                break;
            case 'requestAdjust':
                this._requestAdjust(event.rowIndex, event.columnIndex, event.dimension, event.bounds);
                break;
            case 'intervalAdded':
                this._intervalAdded(event.axisType, event.index0, event.index1);
                break;
            case 'intervalRemoved':
                this._intervalRemoved(event.axisType, event.index0, event.index1);
                break;
            case 'intervalMoved':
                this._intervalMoved(event.axisType, event.index0, event.index1, event.count);
                break;
            }
        },

        /**
         * This method is called by SFDragDropMgr to handle drag events
         * originating from the cell adjusters.
         * 
         * @param event {Event} : The drag event
         */
        handleDragEvent : function(event) {
            switch (event.type) {
            case 'dragStart':
                this._handleDragStart(event);
                break;
            case 'drag':
                this._handleDrag(event);
                break;
            case 'dragEnd':
                this._handleDragEnd(event);
                break;
            }
        },

        /**
         * Render the JUIC Component.
         * 
         * @param html : Html Array
         */
        renderHtml : function(html) {
            this._cellManager.clearCache();
            html.push('<div id="', this.id, '"');
            renderClassName(html, 'sfMatrixLayout' + (this._className ? ' ' + this._className : ''));
            if (this._scrollBarMgr) {
                html.push(' onmouseover="', this.fireCode('_fireMouseOver'), '"');
            }
            html.push('>');
            this._renderContent(html);
            html.push('</div>');
            return html;
        },

        /**
         * Get the viewable dimension of this matrix layout.
         */
        getDimension : function() {
            if (!this._dimension || !this._sizesAvailable) {
                return null;
            }
            return {
                width :this._getTotalDimensionAxis('x'),
                height :this._getTotalDimensionAxis('y')
            };
        },

        /**
         * Set the viewable dimension for this matrix layout.
         */
        setDimension : function(dimension) {
            assert(dimension && typeof dimension.width == 'number' && dimension.width > 0
                    && typeof dimension.height == 'number' && dimension.height > 0,
                    '[SFMatrixLayout] Dimension must provide positive width and height values');
            var old = this.getDimension();
            this._dimension = {
                width :parseInt(dimension.width),
                height :parseInt(dimension.height)
            };
            if (!old || (this._dimension.width != old.width || this._dimension.height != old.height)) {
                this._refreshDimensions();
            }
        },

        /**
         * You may call this method in alternative to the setDimension or
         * passing the dimension object in on the constructor in case you want
         * to set the dimension based on the width/height properties defined on
         * the parent DOM element that you have rendered the matrix layout
         * inside of.
         */
        adjustDOM : function() {
            var suggestDimension = getSuggestedDimension($(this.id));
            if (suggestDimension) {
                this.setDimension(suggestDimension);
            }
        },

        /**
         * Retrieve the dimension for a particular cell.
         * 
         * @param rowIndex : The index of the row
         * @param columnIndex : The index of the column
         * @return Dimension {width, height} of the cell
         */
        getCellDimension : function(rowIndex, columnIndex) {
            assert(this._sizesAvailable, '[SFMatrixLayout] Cannot get cell sizes before they are available.');
            this._validateIndices(rowIndex, columnIndex);
            if (this._sizesAvailable) {
                var placeholderCell = this._cellManager.getPlaceholderCell(rowIndex, columnIndex);
                if (placeholderCell) {
                    rowIndex = placeholderCell.rowIndex;
                    columnIndex = placeholderCell.columnIndex;
                }
                var cellSpan = this._cellManager.getCellSpan(rowIndex, columnIndex);
                return {
                    width :this._getTotalSize('x', columnIndex, columnIndex + cellSpan.colSpan, true),
                    height :this._getTotalSize('y', rowIndex, rowIndex + cellSpan.rowSpan, true)
                };
            } else {
                return {
                    width :null,
                    height :null
                };
            }
        },

        /**
         * Adjust a particular cell's size.
         * 
         * @param rowIndex : The row index
         * @param columnIndex : The column index
         * @param size : The new size the cell should be
         */
        setCellDimension : function(rowIndex, columnIndex, size) {
            this._validateIndices(rowIndex, columnIndex);
            this._cellManager.getSpacingManager('x').setCustomSize(columnIndex, size);
            this._cellManager.getSpacingManager('y').setCustomSize(rowIndex, size);
            this._refreshDimensions();
        },

        /**
         * Retrieve the dimension of a single row or column.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index {integer} The row or column index
         */
        getSingleDimension : function(axisType, index) {
            this._validateIndex(axisType, index);
            if (this._sizesAvailable) {
                return this._axisData[axisType].sizes[index];
            }
            return null;
        },

        /**
         * Adjust a particular column or row to the input size.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param index : The column or row index
         * @param size : The new size the column or row should be
         */
        setSingleDimension : function(axisType, index, size) {
            this._cellManager.getSpacingManager(axisType).setCustomSize(index, size);
            if (this._sizesAvailable) {
                this._refreshDimensions();
            }
        },

        /**
         * Get all the sizes on one axis.
         * 
         * @param axisType {String} The axis type either 'x' or 'y'
         */
        getAxisSizes : function(axisType) {
            this._validateAxisType(axisType);
            if (this._sizesAvailable) {
                return this._axisData[axisType].sizes.concat();
            }
            return null;
        },

        /**
         * Get all the sizes for both axis.
         */
        getAllSizes : function() {
            if (this._sizesAvailable) {
                return {
                    y :this._axisData.y.sizes.concat(),
                    x :this._axisData.x.sizes.concat()
                };
            }
            return null;
        },

        /**
         * Set all the sizes for one axis
         * 
         * @param axisType {String} The axis type either 'x' or 'y'
         * @param sizes {int[]} The sizes to set
         */
        setAxisSizes : function(axisType, sizes) {
            this._cellManager.getSpacingManager(axisType).setSizes(sizes);
            if (this._sizesAvailable) {
                this._refreshDimensions();
            }
        },

        /**
         * Set all the sizes.
         * 
         * @param rowSizes {int[] | Object} The sizes for the rows or an object
         *            containing both row and column sizes
         * @param columnSizes {int[]} The sizes for the columns
         */
        setAllSizes : function(rowSizes, columnSizes) {
            if (rowSizes.x && rowSizes.y) {
                this.setAllSizes(rowSizes.y, rowSizes.x);
            } else {
                this._cellManager.getSpacingManager('y').setSizes(rowSizes);
                this._cellManager.getSpacingManager('x').setSizes(columnSizes);
                if (this._sizesAvailable) {
                    this._refreshDimensions();
                }
            }
        },

        /**
         * Broadcast a particular method call to all children in the model.
         */
        broadcast : function(methodName, args) {
            this._cellManager.broadcast(methodName, args);
        },

        /**
         * Ensure that the given cell is in view.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The columnIndex
         */
        scrollTo : function(rowIndex, columnIndex) {
            this._validateIndices(rowIndex, columnIndex);
            var region = this._getScrollToRegion('y', rowIndex);
            this._getScrollToRegion('x', columnIndex, region);
            this.getAutoScroller().scrollTo(region);
        },

        /**
         * Ensure that the given row or column is in view.
         * 
         * @param axisType {String} The axis type
         * @param index {integer} The row or column index
         */
        scrollToAxis : function(axisType, index) {
            this._validateIndex(axisType, index);
            if (this._sizesAvailable && this.getSectionName(axisType, index)) {
                var region = this._getScrollToRegion(axisType, index);
                this.getAutoScroller().scrollToAxis(axisType, region);
            }
        },

        /**
         * Helper method to retrieve the region to scroll to when you want to
         * scroll to a particular row or column.
         * 
         * @param axisType {String} either 'x' or 'y'
         * @param index {integer} The row or column index
         * @param region {Region} Optional provide a region to append to
         */
        _getScrollToRegion : function(axisType, index, region) {
            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var offset = this.getPageOffset(axisType, index);
            var dimension = axisData.sizes[index];
            if (this._cellManager.isAdjustable(axisType, index)) {
                dimension += axisData.adjusterSize;
            }
            var region = region || {};
            region[constants.startRegionType] = offset;
            region[constants.endRegionType] = offset + dimension;
            return region;
        },

        /**
         * Get (or create) the autoScroller.
         */
        getAutoScroller : function() {
            if (!this._autoScroller) {
                this._autoScroller = new SFAutoScroller( {
                    scrollEl :this._getSectionId(MIDDLE, MIDDLE),
                    extenderEl :this._getSectionExtenderId(MIDDLE, MIDDLE),
                    autoIncreaseSize :true
                });
                this._autoScroller.addEventListener('autoScroll', this);
            }
            return this._autoScroller;
        },

        /**
         * Get a single page offset.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index {integer} The index of the column or row
         */
        getPageOffset : function(axisType, index) {
            var offsets = this.getPageOffsets(axisType, index || 0);
            if (offsets) {
                return offsets[index || 0];
            }
            return null;
        },

        /**
         * Get all of the offsets on the given axis.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @return {integer[]}
         */
        getPageOffsets : function(axisType, index) {
            this._validateAxisType(axisType);
            var obj = $(this.id);
            if (obj && this._sizesAvailable) {
                var constants = AXIS_TYPES[axisType];
                var axisData = this._axisData[axisType];
                var indices = this._getSectionIndices(axisType, MIDDLE);
                var offsets = [];
                var middle = $(this._getSectionId(MIDDLE, MIDDLE));
                var scrollPosition = middle[constants.scrollPositionType];
                var firstOffset = YAHOO.util.Dom['get' + axisType.toUpperCase()](obj);
                var offset = firstOffset;
                index = index || axisData.size - 1;
                for ( var idx = 0; idx < axisData.size && idx <= index; idx++) {
                    if (idx == indices[0]) {
                        offset -= scrollPosition;
                    }
                    offsets.push(offset);
                    if (!this._cellManager.isHidden(axisType, idx)) {
                        offset += axisData.sizes[idx];
                        if (this._cellManager.isAdjustable(axisType, idx)) {
                            offset += axisData.adjusterSize;
                        }
                    }
                    if (idx == indices[indices.length - 1]) {
                        offset = firstOffset + axisData[SFMatrixLayout.FIRST_SECTION + 'Size'] + axisData.viewableSize;
                    }
                }
                return offsets;
            }
            return null;
        },

        /**
         * Which section will the given index be in?
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index {integer} The index to test
         * @return Either FIRST_SECTION, MIDDLE_SECTION, or LAST_SECTION
         */
        getSectionName : function(axisType, index) {
            this._validateAxisType(axisType);
            var axisData = this._axisData[axisType];
            var section = undefined;
            if (this._cellManager.isFrozen(axisType, index)) {
                var middleIndices = this._getSectionIndices(axisType, MIDDLE);
                if (index < middleIndices[0] || middleIndices.length == 0) {
                    section = SFMatrixLayout.FIRST_SECTION;
                } else if (index > middleIndices[middleIndices.length - 1]) {
                    section = SFMatrixLayout.LAST_SECTION;
                } else {
                    assert(false, '[SFMatrixLayout] Invalid frozen section in middle');
                }
            } else {
                section = MIDDLE;
            }
            return section;
        },

        /**
         * Update the drag by resizing option.
         * 
         * @param dragByResizing {boolean} If the adjusters should drag by
         *            resizing.
         */
        setDragByResizing : function(dragByResizing) {
            this._dragByResizing = dragByResizing;
        },

        /**
         * Validate a single index.
         * 
         * @param axisType {String} The axis type
         * @param index {integer} The index to validate
         */
        _validateIndex : function(axisType, index) {
            this._validateAxisType(axisType);
            assert(typeof index == 'number' && index >= 0 && index < this._axisData[axisType].size,
                    '[SFMatrixLayout] Invalid index = ' + index);
        },

        /**
         * Validate the row and column index.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         */
        _validateIndices : function(rowIndex, columnIndex) {
            assert(typeof rowIndex == 'number' && rowIndex >= 0 && rowIndex < this._axisData.y.size
                    && typeof columnIndex == 'number' && columnIndex >= 0 && columnIndex < this._axisData.x.size,
                    '[SFMatrixLayout] Invalid [rowIndex, columnIndex] = [' + rowIndex + ', ' + columnIndex + ']');
        },

        /**
         * Validate the axis type is either 'x' or 'y'
         * 
         * @param axisType {String} The axis type
         */
        _validateAxisType : function(axisType) {
            assert(AXIS_TYPES[axisType], '[SFMatrixLayout] Invalid axisType: ' + axisType);
        },

        /**
         * Compose an id for the given cell.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         */
        _getCellId : function(rowIndex, columnIndex) {
            return this.id + 'cell:' + rowIndex + ':' + columnIndex;
        },

        /**
         * Compose an id for the given adjuster.
         * 
         * @param iAxisType {String} The axis type the adjuster is on
         * @param idx {integer} The index of this axis
         * @param jdx {integer} The index of the other axis
         * @param intersection {boolean} Is this adjuster on an intersection
         */
        _getAdjusterId : function(iAxisType, idx, jdx, intersection) {
            var iConstants = AXIS_TYPES[iAxisType];
            var info = getRowColumn(iAxisType, idx, jdx);
            var result = null;

            if (intersection) {
                result = this.id + 'int-adj:' + info.row + ':' + info.column;
            } else {
                result = this.id + iConstants.cellType + '-adj:' + info.row + ':' + info.column;
            }

            return result;
        },

        /**
         * Determine if the given cell is an adjuster.
         * 
         * @param el {HTMLElement} The element to check
         */
        _isAdjuster : function(el) {
            return el && el.id && el.id.indexOf('adj:') >= 0;
        },

        /**
         * Return the section id.
         * 
         * @param rowSection {String} The row section
         * @param columnSection {String} The column section
         */
        _getSectionId : function(rowSection, columnSection) {
            return this.id + rowSection.charAt(0) + '-' + columnSection.charAt(0);
        },

        /**
         * Return the section table id.
         * 
         * @param rowSection {String} The row section
         * @param columnSection {String} The column section
         */
        _getSectionTableId : function(rowSection, columnSection) {
            return this.id + rowSection.charAt(0) + '-' + columnSection.charAt(0) + '-tbl';
        },

        /**
         * Return the section extender id.
         * 
         * @param rowSection {String} The row section
         * @param columnSection {String} The column section
         */
        _getSectionExtenderId : function(rowSection, columnSection) {
            return this.id + rowSection.charAt(0) + '-' + columnSection.charAt(0) + '-ext';
        },

        /**
         * Add one or more rows or columns.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _intervalAdded : function(axisType, index0, index1) {
            assert(index0 >= 0 && index1 >= index0, '[SFMatrixLayout] Invalid interval [' + index0 + ', ' + index1
                    + ']');

            var rendered = !!$(this.id);
            var axisData = this._axisData[axisType];
            var otherAxisType = AXIS_TYPES[axisType].oppositeAxisType;
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                var section = SECTIONS[idx];
                increaseIndices(axisData[section + 'Indices'], index0, index1);
            }
            for ( var idx = index0; idx <= index1; idx++) {
                var section = this.getSectionName(axisType, idx);
                var indices = this._getSectionIndices(axisType, section);
                var empty = indices.length == 0;
                insertIndices(indices, idx, idx);
                if (rendered && empty) {
                    for ( var jdx = 0; jdx < SECTIONS.length; jdx++) {
                        var otherSection = SECTIONS[jdx];
                        var otherIndices = this._getSectionIndices(otherAxisType, otherSection);
                        if (otherIndices.length > 0) {
                            var sections = getRowColumn(axisType, section, otherSection);
                            var obj = $(this._getSectionId(sections.row, sections.column));
                            obj.style.display = '';
                        }
                    }
                }
            }
            axisData.size += index1 - index0 + 1;
            this._insertDOM(axisType, index0, index1);
            if (this._sizesAvailable) {
                this._refreshDimensions();
            }
        },

        /**
         * Remove one or more rows or columns.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _intervalRemoved : function(axisType, index0, index1) {
            assert(index0 >= 0 && index1 >= index0, '[SFMatrixLayout] Invalid interval [' + index0 + ', ' + index1
                    + ']');

            var rendered = !!$(this.id);
            var otherAxisType = AXIS_TYPES[axisType].oppositeAxisType;
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                var section = SECTIONS[idx];
                var indices = this._getSectionIndices(axisType, section);
                removeIndices(indices, index0, index1);
                if (indices.length == 0 && rendered) {
                    for ( var jdx = 0; jdx < SECTIONS.length; jdx++) {
                        var otherSection = SECTIONS[jdx];
                        var sections = getRowColumn(axisType, section, otherSection);
                        var obj = $(this._getSectionId(sections.row, sections.column));
                        obj.style.display = 'none';
                    }
                }
            }

            var axisData = this._axisData[axisType];
            axisData.size -= index1 - index0 + 1;
            this._removeDOM(axisType, index0, index1);
            if (this._sizesAvailable) {
                this._refreshDimensions();
            }
        },

        /**
         * Move a row or column from one index to another.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         * @param count {integer} The number of cells to move
         */
        _intervalMoved : function(axisType, index0, index1, count) {
            var section0 = this.getSectionName(axisType, index0);
            var section1 = this.getSectionName(axisType, index1);
            var section2 = this.getSectionName(axisType, index1 + count - 1);
            assert(section0 == section1 && section0 == section2,
                    '[SFMatrixLayout] Cannot move a column or row across different sections');

            var axisData = this._axisData[axisType];
            var sizes = axisData.sizes;
            var removed = sizes.splice(index0, count);
            removed.splice(0, 0, index1, 0);
            sizes.splice.apply(sizes, removed);

            if ($(this.id)) {
                for ( var idx = 0; idx < SECTIONS.length; idx++) {
                    if (axisType == 'y') {
                        this._moveRowDOM(section0, SECTIONS[idx], index0, index1, count);
                    } else {
                        this._moveColumnDOM(section0, SECTIONS[idx], index0, index1, count);
                    }
                }

                this._correctDOM(axisType, Math.min(index0, index1));
            }
        },

        /**
         * Set all related styles for this matrix layout into the style sheet.
         * This will ensure that proper cell dimensions are calculated. This can
         * be called either before or after render.
         */
        _refreshDimensions : function() {
            var old = this.getDimension();

            for ( var axisType in AXIS_TYPES) {
                this._updateAxisData(axisType);
            }
            if (!this._hideScrollBars || this._scrollBarMgr) {
                for ( var axisType in AXIS_TYPES) {
                    this._updateAxisDataScroll(axisType);
                }
            }

            /* All sizes are now available. */
            this._sizesAvailable = true;
            this._adjustDOM();

            /* Notify children of their size. */
            var size = this._cellManager.size();
            for ( var rowIndex = 0; rowIndex < size.height; rowIndex++) {
                var rowHidden = this._cellManager.isHidden('y', rowIndex);
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    var colHidden = this._cellManager.isHidden('x', columnIndex);
                    if (!rowHidden && !colHidden) {
                        this._cellManager.resize(rowIndex, columnIndex, this.getCellDimension(rowIndex, columnIndex));
                    }
                }
            }

            this._updateScrollManager();
        },

        /**
         * Refresh the content of this layout.
         */
        _updateContent : function() {
            var obj = $(this.id);
            if (obj) {
                updateStyle(obj, getDimensionStyle(this.getDimension()));
                obj.innerHTML = this._renderContent( []).join('');
            }
        },

        /**
         * Refresh the content of a particular cell.
         */
        _updateCellContent : function(rowIndex, columnIndex) {
            if ($(this.id)) {
                var placeholderCell = this._cellManager.getPlaceholderCell(rowIndex, columnIndex);
                if (!placeholderCell) {
                    var cellSpan = this._cellManager.getCellSpan(rowIndex, columnIndex);
                    var firstRow = this._firstVisibleRowIndex(rowIndex, cellSpan);
                    if (firstRow < 0) {
                        firstRow = rowIndex;
                    }
                    var cellId = this._getCellId(firstRow, columnIndex);
                    var component = this._cellManager.get(rowIndex, columnIndex);
                    if (component && component.render) {
                        component.render(cellId);
                    } else {
                        $(cellId).innerHTML = component ? escapeHTML(component.toString()) : '';
                    }
                    this._cellManager.resize(rowIndex, columnIndex, this.getCellDimension(rowIndex, columnIndex));
                }
            }
        },

        /**
         * Render all the content for this layout.
         * 
         * @param html : Html array
         */
        _renderContent : function(html) {
            html.push('<div id="', this.id, 'adjusters" class="adjusters"></div>');
            html.push('<table id="', this.id, 'outer" class="outer-table"><tbody>');
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                this._renderSectionRow(html, SECTIONS[idx]);
            }
            if (this._scrollBarMgr) {
                html.push('<tr><td colspan="3">');
                this._scrollBarMgr.getHorizontal().renderHtml(html);
                html.push('</td><td>');
                this._scrollBarMgr.getSpacer().renderHtml(html);
                html.push('</td></tr>');
            }
            html.push('</tbody></table>');
            return html;
        },

        /**
         * Render all rows in a row section of the matrix.
         * 
         * @param html : Html array
         * @param rowSection : The row section
         */
        _renderSectionRow : function(html, rowSection) {
            var indices = this._getSectionIndices('y', rowSection);
            html.push('<tr>');
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                this._renderSection(html, rowSection, SECTIONS[idx]);
            }
            if (this._scrollBarMgr && rowSection == SFMatrixLayout.FIRST_SECTION) {
                html.push('<td rowspan="3">');
                this._scrollBarMgr.getVertical().renderHtml(html);
                html.push('</td>');
            }
            html.push('</tr>');
            return html;
        },

        /**
         * Renders all rows and columns in a section of the matrix.
         * 
         * @param html : Html array
         * @param rowSection : The row section
         * @param columnSection : The column section
         */
        _renderSection : function(html, rowSection, columnSection) {
            var rowMiddle = rowSection == MIDDLE;
            var columnMiddle = columnSection == MIDDLE;
            var outerStyle = this._getOverflowStyle(rowMiddle && columnMiddle);
            var innerStyle = null;
            var rowIndices = this._getSectionIndices('y', rowSection);
            var className = rowSection + '-row ' + columnSection + '-column';

            if (this._sizesAvailable) {
                var sectionDimension = this._getSectionDimension(rowSection, columnSection);
                getDimensionStyle(sectionDimension, outerStyle);
                if (!rowMiddle || !columnMiddle) {
                    sectionDimension.width += columnMiddle ? EXTENDER_PADDING : 0;
                    sectionDimension.height += rowMiddle ? EXTENDER_PADDING : 0;
                    innerStyle = getDimensionStyle(sectionDimension);
                }
            }

            if (rowIndices.length == 0) {
                outerStyle.display = 'none';
            }

            html.push('<td><div id="', this._getSectionId(rowSection, columnSection), '"');
            renderClassName(html, className);
            if (rowMiddle && columnMiddle && this._frozenFlag) {
                /* No need for scroll event if nothing frozen. */
                html.push(' onscroll="', this.fireCode('_fireScroll'), '"');
            }
            renderStyle(html, outerStyle);

            /* Inner extender DIV. */
            html.push('><div id="', this._getSectionExtenderId(rowSection, columnSection), '" class="extender"');
            renderStyle(html, innerStyle);

            /* Main layout table. */
            html.push('><table id="',
                    this._getSectionTableId(rowSection, columnSection),
                    '" class="inner-table"><tbody>');

            for ( var row = 0, len = rowIndices.length; row < len; row++) {
                this._renderRow(html, rowIndices[row], columnSection);
            }

            html.push('</tbody></table></div></div></td>');

            return html;
        },

        /**
         * Render every cell in a particular section.
         * 
         * @param rowIndex {integer} The row index to render.
         * @param columnSection {String} The column section to render
         */
        _renderRow : function(html, rowIndex, columnSection) {
            var rowStyle = null;
            var rowClassName = this._cellManager.getSpacingOption('y', rowIndex, 'className');
            if (this._cellManager.isHidden('y', rowIndex)) {
                rowStyle = {
                    display :'none'
                };
            }

            html.push('<tr');
            renderClassName(html, rowClassName);
            renderStyle(html, rowStyle);
            html.push('>');
            var columnIndices = this._getSectionIndices('x', columnSection);
            for ( var idx = 0, len = columnIndices.length; idx < len; idx++) {
                this._renderCell(html, rowIndex, columnIndices[idx]);
            }
            html.push('</tr>');
            if (this._cellManager.isAdjustable('y', rowIndex)) {
                html.push('<tr');
                renderClassName(html, rowClassName);
                renderStyle(html, rowStyle);
                html.push('>');
                for ( var idx = 0, len = columnIndices.length; idx < len; idx++) {
                    this._renderRowAdjuster(html, rowIndex, columnIndices[idx]);
                }
                html.push('</tr>');
            }
            return html;
        },

        /**
         * Render just one cell.
         * 
         * @param html {String[]} The html array
         * @param rowIndex {integer} The rowIndex
         * @param columnIndex {integer} The columnIndex
         */
        _renderCell : function(html, rowIndex, columnIndex) {
            var component = this._cellManager.get(rowIndex, columnIndex);
            var placeholderCell = this._cellManager.getPlaceholderCell(rowIndex, columnIndex);
            var properties = this._cellManager.getCellProperties(rowIndex, columnIndex);
            var header = properties.header || this._cellManager.getSpacingOption('y', rowIndex, 'header')
                    || this._cellManager.getSpacingOption('x', columnIndex, 'header');
            var divStyle = this._getCellStyle(rowIndex, columnIndex);
            var cellType = header ? 'th' : 'td';

            var cellStyle = null;
            var cellClassName = this._cellManager.getSpacingOption('x', columnIndex, 'className');
            var actualSpan = this._getActualSpan(rowIndex, columnIndex);

            var columnHidden = this._cellManager.isHidden('x', columnIndex);
            var rowHidden = this._cellManager.isHidden('y', rowIndex);
            var hidden = rowHidden || columnHidden;
            if (placeholderCell) {
                var cellSpan = this._cellManager.getCellSpan(placeholderCell.rowIndex, placeholderCell.columnIndex);
                var firstRow = this._firstVisibleRowIndex(placeholderCell.rowIndex, cellSpan);
                if (firstRow == rowIndex && columnIndex == placeholderCell.columnIndex) {
                    component = this._cellManager.get(placeholderCell.rowIndex, placeholderCell.columnIndex);
                    divStyle = this._getCellStyle(placeholderCell.rowIndex, placeholderCell.columnIndex);
                    actualSpan = this._getActualSpan(placeholderCell.rowIndex, placeholderCell.columnIndex);
                    hidden = false;
                } else {
                    hidden = true;
                }
            } else {
                var cellSpan = this._cellManager.getCellSpan(rowIndex, columnIndex);
                var firstRow = this._firstVisibleRowIndex(rowIndex, cellSpan);
                if (rowHidden && firstRow > rowIndex) {
                    component = null;
                    actualSpan = null;
                } else {
                    hidden = actualSpan.rowSpan <= 0 || actualSpan.colSpan <= 0;
                }
            }

            if (hidden) {
                cellStyle = {
                    display :'none'
                };
            }

            html.push('<', cellType);
            renderStyle(html, cellStyle);
            renderClassName(html, cellClassName);
            renderCellSpan(html, actualSpan);
            html.push('><div id="', this._getCellId(rowIndex, columnIndex), '"');
            renderClassName(html, properties.className);
            renderStyle(html, divStyle);
            html.push('>');
            if (component) {
                if (component.renderHtml) {
                    component.renderHtml(html);
                } else {
                    html.push(escapeHTML(component.toString()));
                }
            }
            html.push('</div></', cellType, '>');
            renderAdjuster(html, this._getAdjusterInfo('x', columnIndex, rowIndex));
            return html;
        },

        /**
         * Retrieve the cell style for an individual cell.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         */
        _getCellStyle : function(rowIndex, columnIndex) {
            var cellStyle = {};

            var properties = this._cellManager.getCellProperties(rowIndex, columnIndex);
            if (properties.scrollable == null ? this._scrollableCells : properties.scrollable) {
                cellStyle.overflow = 'auto';
            } else {
                cellStyle.overflow = 'hidden';
            }

            if (this._sizesAvailable) {
                var cellDimension = this.getCellDimension(rowIndex, columnIndex);
                getDimensionStyle(cellDimension, cellStyle);
            }

            return cellStyle;
        },

        /**
         * Update the properties for a particular cell.
         * 
         * @param rowIndex {integer} The row index.
         * @param columnIndex {integer} The column index.
         */
        _updateCellProperties : function(rowIndex, columnIndex) {
            var obj = $(this._getCellId(rowIndex, columnIndex));
            if (obj) {
                var properties = this._cellManager.getCellProperties(rowIndex, columnIndex);
                obj.className = properties.className || '';
                updateStyle(obj, this._getCellStyle(rowIndex, columnIndex));
            }
        },

        /**
         * Update the spacing options for one column or row.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index {integer} The index of the spacing
         * @param oldOptions {object} The old options
         */
        _updateSpacingOptions : function(axisType, index, oldOptions) {
            var hidden = this._cellManager.isHidden(axisType, index);
            if (hidden != oldOptions.hidden) {
                this._setHiddenDOM(axisType, index, hidden);
                this._refreshDimensions();
            }
            var adjustable = this._cellManager.isAdjustable(axisType, index);
            assert(adjustable == oldOptions.adjustable, '[SFMatrixLayout] Cannot change the adjustable property');
            var className = this._cellManager.getSpacingOption(axisType, index, 'className');
            if (className != oldOptions.className) {
                this._setClassName(axisType, index, className);
            }
        },

        /**
         * Get the style for the middle section including the overflow styles.
         * 
         * @param middle {boolean} Is this the middle section
         * @return an object containing the overflow style.
         */
        _getOverflowStyle : function(middle) {
            var overflowStyle = {
                overflow :'hidden'
            };
            if (middle && this._sizesAvailable && !this._hideScrollBars) {
                var xScroll = this._isScrollRequired('x');
                var yScroll = this._isScrollRequired('y');
                if (xScroll || yScroll) {
                    overflowStyle.overflow = '';
                    overflowStyle['overflow-x'] = xScroll ? 'auto' : 'hidden';
                    overflowStyle['overflow-y'] = yScroll ? 'auto' : 'hidden';
                } else {
                    overflowStyle['overflow-x'] = '';
                    overflowStyle['overflow-y'] = '';
                }
            }
            return overflowStyle;
        },

        /**
         * Render a single row adjuster.
         * 
         * @param html {String[]} The html array to append to
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         */
        _renderRowAdjuster : function(html, rowIndex, columnIndex) {
            renderAdjuster(html, this._getAdjusterInfo('y', rowIndex, columnIndex));
            renderAdjuster(html, this._getAdjusterInfo('y', rowIndex, columnIndex, true));
            return html;
        },

        /**
         * Insert the DOM objects for all row/column in the given index range.
         * 
         * @param axisType {String} Either 'x' or 'y' The axis type to insert
         * @param index0 {integer} The start index
         * @param index1 {integer} The end index
         */
        _insertDOM : function(iAxisType, index0, index1) {
            if ($(this.id)) {
                var iSection = this.getSectionName(iAxisType, index0);
                var jAxisType = AXIS_TYPES[iAxisType].oppositeAxisType;
                var iIndices = this._getSectionIndices(iAxisType, iSection);
                var iAdjusterCount = this._countAdjustableSpacing(iAxisType, iIndices[0], index0);
                for ( var iIndex = index0; iIndex <= index1; iIndex++) {
                    if (iIndex > index0) {
                        var newSection = this.getSectionName(iAxisType, iIndex);
                        if (newSection != section) {
                            section = newSection;
                            adjusterCount = 0;
                        }
                    }
                    for ( var sdx = 0; sdx < SECTIONS.length; sdx++) {
                        var jSection = SECTIONS[sdx];
                        var jAxisData = this._axisData[jAxisType];
                        var jIndices = this._getSectionIndices(jAxisType, jSection);
                        if (jIndices.length > 0) {
                            var section = getRowColumn(iAxisType, iSection, jSection);
                            var table = $(this._getSectionTableId(section.row, section.column));
                            var tbody = table.tBodies[0];
                            var scratchPad = this._getScratchPad();
                            var startIndex = indexOf(iIndices, iIndex) + iAdjusterCount;
                            if (iAxisType == 'y') {
                                var rowDOM = createRowDOM(this._renderRow( [], iIndex, jSection), scratchPad);
                                insertDOMInto(tbody, tbody.rows, startIndex, rowDOM);
                            } else {
                                var jAdjusterCount = 0;
                                for ( var jdx = 0; jdx < jIndices.length; jdx++) {
                                    var jIndex = jIndices[jdx];
                                    var jAdjustable = this._cellManager.isAdjustable(jAxisType, jIndex);
                                    var cellDOM = createCellDOM(this._renderCell( [], jIndex, iIndex), scratchPad);
                                    var row = tbody.rows[jdx + jAdjusterCount];
                                    insertDOMInto(row, row.cells, startIndex, cellDOM)
                                    if (jAdjustable) {
                                        row = tbody.rows[jdx + jAdjusterCount + 1];
                                        cellDOM = createCellDOM(this._renderRowAdjuster( [], jIndex, iIndex),
                                                scratchPad);
                                        insertDOMInto(row, row.cells, startIndex, cellDOM);
                                        jAdjusterCount++;
                                    }
                                }
                            }
                        }
                    }
                    if (this._cellManager.isAdjustable(iAxisType, iIndex)) {
                        iAdjusterCount++;
                    }
                }
                this._correctDOM(iAxisType, index0);
            }
        },

        /**
         * Remove the dom objects for the given row/column(s).
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _removeDOM : function(axisType, index0, index1) {
            if ($(this.id)) {
                var iConstants = AXIS_TYPES[axisType];
                var jAxisType = iConstants.oppositeAxisType;
                var iAxisData = this._axisData[axisType];
                var jAxisData = this._axisData[jAxisType];
                for ( var idx = index0; idx <= index1; idx++) {
                    for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                        var indices = getRowColumn(axisType, idx, jdx);
                        var div = $(this._getCellId(indices.row, indices.column));
                        if (div) {
                            var cell = div.parentNode;
                            var row = cell.parentNode;
                            var tbody = row.parentNode;
                            var cellIndex = indexOf(row.cells, cell);
                            var rowIndex = indexOf(tbody.rows, row);
                            var nextCell = row.cells[cellIndex + 1];
                            var nextRow = tbody.rows[rowIndex + 1];
                            var xAdjustable = this._isAdjuster(nextCell);
                            var yAdjustable = nextRow && this._isAdjuster(nextRow.cells[0]);
                            row.removeChild(cell);
                            if (axisType == 'y') {
                                tbody.removeChild(row);
                            }
                            if (xAdjustable) {
                                row.removeChild(nextCell);
                            }
                            if (yAdjustable) {
                                if (axisType == 'y') {
                                    tbody.removeChild(nextRow);
                                } else {
                                    var rowAdjuster = nextRow.cells[cellIndex];
                                    if (xAdjustable) {
                                        nextRow.removeChild(nextRow.cells[cellIndex + 1]);
                                    }
                                    nextRow.removeChild(rowAdjuster);
                                }
                            }
                        }
                    }
                }
                if (index0 < iAxisData.size) {
                    this._correctDOM(axisType, index0);
                }
            }
        },

        /**
         * Update the DOM objects to be hidden or visible.
         * 
         * @param iAxisType {String} Either 'x' or 'y'
         * @param idx {integer} The index of the row/column
         * @param hidden {boolean} Should the row/column be hidden?
         */
        _setHiddenDOM : function(iAxisType, idx, hidden) {
            if ($(this.id)) {
                var iConstants = AXIS_TYPES[iAxisType];
                var jAxisType = AXIS_TYPES[iAxisType].oppositeAxisType;
                var jAxisData = this._axisData[jAxisType];
                var index0 = idx;
                for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                    var indices = getRowColumn(iAxisType, idx, jdx);
                    var placeholderCell = this._cellManager.getPlaceholderCell(indices.row, indices.column);
                    if (placeholderCell) {
                        var index = placeholderCell[iConstants.cellType + 'Index'];
                        index0 = Math.min(index0, index);
                    }
                }
                if (iAxisType == 'y') {
                    var iAdjustable = this._cellManager.isAdjustable(iAxisType, idx);
                    var display = hidden ? 'none' : '';
                    for ( var sdx = 0; sdx < SECTIONS.length; sdx++) {
                        var jSection = SECTIONS[sdx];
                        var jIndices = this._getSectionIndices(jAxisType, jSection);
                        if (jIndices.length > 0) {
                            var div = $(this._getCellId(idx, jIndices[0]));
                            var row = div.parentNode.parentNode;
                            row.style.display = display;
                            if (iAdjustable) {
                                var tbody = row.parentNode;
                                var rowIndex = indexOf(tbody.rows, row);
                                var nextRow = tbody.rows[rowIndex + 1];
                                nextRow.style.display = display;
                            }
                        }
                    }
                }
                this._correctDOM(iAxisType, index0, idx);
            }
        },

        /**
         * Update the class name of a row or column.
         * 
         * @param iAxisType {String} The axis we're changing
         * @param idx {integer} The index of the row or column
         * @param className {String} The class name to apply to the row or
         *            column
         */
        _setClassName : function(iAxisType, idx, className) {
            if ($(this.id)) {
                var jAxisType = AXIS_TYPES[iAxisType].oppositeAxisType;
                var jAxisData = this._axisData[jAxisType];
                if (iAxisType == 'x') {
                    for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                        var div = $(this._getCellId(jdx, idx));
                        if (div) {
                            div.parentNode.className = className;
                        }
                    }
                } else {
                    var iSection = this.getSectionName(iAxisType, idx);
                    var iIndices = this._getSectionIndices(iAxisType, iSection);
                    var iSectionIndex = indexOf(iIndices, idx);
                    var iAdjusterCount = this._countAdjustableSpacing(iAxisType, iIndices[0], idx);
                    var iOffset = iAdjusterCount + iSectionIndex;
                    for ( var sdx = 0; sdx < SECTIONS.length; sdx++) {
                        var jSection = SECTIONS[sdx];
                        var table = $(this._getSectionTableId(iSection, jSection));
                        var tbody = table.tBodies[0];
                        var row = tbody.rows[iOffset];
                        if (row) {
                            row.className = className;
                        }
                    }
                }
            }
        },

        /**
         * Move all the rows in one section.
         * 
         * @param iSection {String} The section we're moving in
         * @param jSection {String} The section of the opposite axis we're
         *            moving
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _moveRowDOM : function(iSection, jSection, index0, index1, count) {
            var iConstants = AXIS_TYPES['y'];
            var jIndices = this._getSectionIndices('x', jSection);
            if (jIndices.length > 0) {
                var iIndices = this._getSectionIndices('y', iSection);
                var iAdjusterCount = this._countAdjustableSpacing('y', iIndices[0], index1);
                var iSectionIndex = indexOf(iIndices, index1);
                var iOffset = iSectionIndex + iAdjusterCount;
                var insertRows = [];
                for ( var idx = 0; idx < count; idx++) {
                    var div = $(this._getCellId(index0 + idx, jIndices[0]));
                    var row = div.parentNode.parentNode;
                    var tbody = row.parentNode;
                    var rowIndex = indexOf(tbody.rows, row);
                    var rowAdjustable = this._cellManager.isAdjustable('y', index1);
                    insertRows.push(row);
                    var iAdjustable = this._cellManager.isAdjustable('y', index1 + idx);
                    if (iAdjustable) {
                        insertRows.push(tbody.rows[rowIndex + 1]);
                    }
                }
                insertDOMInto(tbody, tbody.rows, iOffset, insertRows, true);
            }
        },

        /**
         * Move all the columns in one section.
         * 
         * @param iSection {String} The section we're moving in
         * @param jSection {String} The section of the opposite axis we're
         *            moving
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _moveColumnDOM : function(iSection, jSection, index0, index1, count) {
            var iConstants = AXIS_TYPES['x'];
            var jIndices = this._getSectionIndices('y', jSection);
            if (jIndices.length > 0) {
                var iIndices = this._getSectionIndices('x', iSection);
                var iAdjusterCount = this._countAdjustableSpacing('x', iIndices[0], index1);
                var iSectionIndex = indexOf(iIndices, index1);
                var iOffset = iSectionIndex + iAdjusterCount;
                var tbody = $(this._getSectionTableId(jSection, iSection));
                var firstDiv = $(this._getCellId(jIndices[0], iIndices[0]));
                var firstIndex = indexOf(tbody.rows, firstDiv.parentNode.parentNode);
                var jAdjusterCount = 0;
                for ( var jdx = 0; jdx < jIndices.length; jdx++) {
                    var rowIndex = firstIndex + jdx + jAdjusterCount;
                    var jIndex = jIndices[jdx];
                    var jAdjustable = this._cellManager.isAdjustable('y', jIndex);
                    var row = tbody.rows[rowIndex];
                    var nextRow = tbody.rows[rowIndex + 1];
                    var insertCells = [];
                    var adjusterCells = [];
                    for ( var idx = 0; idx < count; idx++) {
                        var iAdjustable = this._cellManager.isAdjustable('x', index1 + idx);
                        var cell = $(this._getCellId(jIndex, index0 + idx)).parentNode;
                        var cellIndex = indexOf(row.cells, cell);
                        insertCells.push(cell);
                        if (iAdjustable) {
                            insertCells.push(row.cells[cellIndex + 1]);
                        }
                        if (jAdjustable) {
                            adjusterCells.push(nextRow.cells[cellIndex]);
                            if (iAdjustable) {
                                adjusterCells.push(nextRow.cells[cellIndex + 1]);
                            }
                        }
                    }
                    if (jAdjustable) {
                        insertDOMInto(nextRow, nextRow.cells, iOffset, adjusterCells, true);
                    }
                    insertDOMInto(row, row.cells, iOffset, insertCells, true);
                    if (jAdjustable) {
                        jAdjusterCount++;
                    }
                }
            }
        },

        /**
         * Update all the DOM ids of each cell after the given index on the
         * given axis.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The starting index
         * @param index1 {integer} The ending index (optional)
         */
        _correctDOM : function(iAxisType, index0, index1) {
            var iAxisData = this._axisData[iAxisType];
            index1 = index1 || iAxisData.size - 1;
            var iConstants = AXIS_TYPES[iAxisType];
            var iSection = this.getSectionName(iAxisType, index0);
            var iIndices = this._getSectionIndices(iAxisType, iSection);
            var iAdjusterCount = this._countAdjustableSpacing(iAxisType, iIndices[0], index0);
            var iSectionIndex = indexOf(iIndices, index0);

            for ( var iIndex = index0; iIndex <= index1; iIndex++) {
                if (iIndex > index0) {
                    var newSection = this.getSectionName(iAxisType, iIndex);
                    if (newSection != iSection) {
                        iSection = newSection;
                        iAdjusterCount = 0;
                    }
                }

                for ( var sdx = 0; sdx < SECTIONS.length; sdx++) {
                    var maxSpan = this._correctSectionDOM(iAxisType, iIndex, iAdjusterCount, iSection, SECTIONS[sdx]);
                    index1 = Math.max(index1, iIndex + maxSpan - 1);
                }

                if (this._cellManager.isAdjustable(iAxisType, iIndex)) {
                    iAdjusterCount++;
                }
            }
            this._handleMissingRow(iAxisType, index0, index1);
        },

        /**
         * Correct the DOM of one section.
         * 
         * @param iAxisType {String} The axis type
         * @param iIndex {integer} The index of the cell
         * @param iAdjusterCount {integer} The number of adjusters so far
         * @param iSection {String} The section we're correcting
         * @param jSection {String} The opposite section we're correcting
         */
        _correctSectionDOM : function(iAxisType, iIndex, iAdjusterCount, iSection, jSection) {
            var iConstants = AXIS_TYPES[iAxisType];
            var jAxisType = iConstants.oppositeAxisType;
            var jAxisData = this._axisData[jAxisType];
            var jIndices = this._getSectionIndices(jAxisType, jSection);
            var maxSpan = 1;

            if (jIndices.length > 0) {
                var iIndices = this._getSectionIndices(iAxisType, iSection);
                var idx = indexOf(iIndices, iIndex);
                var section = getRowColumn(iAxisType, iSection, jSection);
                var table = $(this._getSectionTableId(section.row, section.column));
                var jAdjusterCount = 0;
                for ( var jdx = 0, len = jIndices.length; jdx < len; jdx++) {
                    var jIndex = jIndices[jdx];
                    var jAdjustable = this._cellManager.isAdjustable(jAxisType, jIndex);
                    var info = getRowColumn(iAxisType, {
                        index :iIndex,
                        sectionIndex :idx + iAdjusterCount
                    }, {
                        index :jIndex,
                        sectionIndex :jdx + jAdjusterCount
                    });
                    this._correctCellDOM(table,
                            info.row.index,
                            info.row.sectionIndex,
                            info.column.index,
                            info.column.sectionIndex);
                    var cellSpan = this._cellManager.getCellSpan(info.row.index, info.column.index);
                    maxSpan = Math.max(maxSpan, cellSpan[iConstants.spanType]);
                    if (jAdjustable) {
                        jAdjusterCount++;
                    }
                }
            }

            return maxSpan;
        },

        /**
         * Handle the case when the first row of a rowSpan is invisible.
         * 
         * @param iAxisType {String} The axisType
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         */
        _handleMissingRow : function(iAxisType, index0, index1) {
            var iConstants = AXIS_TYPES[iAxisType];
            var jAxisType = iConstants.oppositeAxisType;
            var jAxisData = this._axisData[jAxisType];
            for ( var iIndex = index0; iIndex <= index1; iIndex++) {
                for ( var jIndex = 0; jIndex < jAxisData.size; jIndex++) {
                    var indices = getRowColumn(iAxisType, iIndex, jIndex);
                    var cellSpan = this._cellManager.getCellSpan(indices.row, indices.column);
                    if (cellSpan.colSpan > 1 || cellSpan.rowSpan > 1) {
                        var firstRow = this._firstVisibleRowIndex(indices.row, cellSpan);
                        if (firstRow >= 0) {
                            var position = this._findCellWithContents(indices.row, indices.column, cellSpan);
                            var actualSpan = this._getActualSpan(indices.row, indices.column);
                            var to = $(this._getCellId(firstRow, indices.column));
                            if (position && (position.rowIndex != firstRow || position.columnIndex != indices.column)) {
                                var from = $(this._getCellId(position.rowIndex, position.columnIndex));
                                if (from != to) {
                                    moveChildren(from, to);
                                    from.parentNode.style.display = 'none';
                                }
                            }
                            updateCellSpan(to.parentNode, actualSpan);
                            if (actualSpan.colSpan > 0 && actualSpan.rowSpan > 0) {
                                to.parentNode.style.display = '';
                            }
                        }
                    }
                }
            }
        },

        /**
         * Find the first visible row within the row span.
         * 
         * @param rowIndex {integer} The row index
         * @param cellSpan {Object} Contains the rowSpan
         */
        _firstVisibleRowIndex : function(rowIndex, cellSpan) {
            for ( var rdx = 0; rdx < cellSpan.rowSpan; rdx++) {
                if (!this._cellManager.isHidden('y', rowIndex + rdx)) {
                    return rowIndex + rdx;
                }
            }
            return -1;
        },

        /**
         * Find the cell that contains some contents within the cell span range.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         * @param cellSpan {Object} Contains the rowSpan and colSpan
         */
        _findCellWithContents : function(rowIndex, columnIndex, cellSpan) {
            for ( var rdx = 0; rdx < cellSpan.rowSpan; rdx++) {
                for ( var cdx = 0; cdx < cellSpan.colSpan; cdx++) {
                    var div = $(this._getCellId(rowIndex + rdx, columnIndex + cdx));
                    if (div.childNodes.length > 0) {
                        return {
                            rowIndex :rowIndex + rdx,
                            columnIndex :columnIndex + cdx
                        };
                    }
                }
            }
            return null;
        },

        /**
         * Update the DOM ids for elements for a single cell.
         * 
         * @param table {HTMLElement} The DOM object for the table
         * @param rowIndex {integer}
         * @param rowSectionIndex {integer}
         * @param columnIndex {integer}
         * @param columnSectionIndex {integer}
         */
        _correctCellDOM : function(table, rowIndex, rowSectionIndex, columnIndex, columnSectionIndex) {
            var cell = table.rows[rowSectionIndex].cells[columnSectionIndex];
            var cellSpan = this._getActualSpan(rowIndex, columnIndex);
            var scratchPad = this._getScratchPad();
            var row = table.rows[rowSectionIndex];
            var nextRow = table.rows[rowSectionIndex + 1];
            var cellVisible = this._isCellVisible(rowIndex, columnIndex);
            var xAdjuster = this._getAdjusterInfo('x', columnIndex, rowIndex);
            var yAdjuster = this._getAdjusterInfo('y', rowIndex, columnIndex);
            var xyAdjuster = this._getAdjusterInfo('y', rowIndex, columnIndex, true);

            /* Update the cell. */
            cell.firstChild.id = this._getCellId(rowIndex, columnIndex);
            updateCellSpan(cell, cellSpan);
            cell.style.display = cellVisible ? '' : 'none';

            /* Update the adjusters. */
            if (xAdjuster) {
                var adjusterCell = row.cells[columnSectionIndex + 1];
                updateAdjuster(scratchPad, adjusterCell, xAdjuster);
            }
            if (yAdjuster) {
                var adjusterCell = nextRow.cells[columnSectionIndex];
                updateAdjuster(scratchPad, adjusterCell, yAdjuster);
            }
            if (xyAdjuster) {
                var adjusterCell = nextRow.cells[columnSectionIndex + 1];
                updateAdjuster(scratchPad, adjusterCell, xyAdjuster);
            }
        },

        /**
         * Get the actual span for a cell - which will include adjusters.
         * 
         * @param rowIndex {integer} The row index
         * @param columnIndex {integer} The column index
         */
        _getActualSpan : function(rowIndex, columnIndex) {
            var placeholderCell = this._cellManager.getPlaceholderCell(rowIndex, columnIndex);
            if (placeholderCell) {
                return {
                    colSpan :0,
                    rowSpan :0
                };
            } else {
                var cellSpan = this._cellManager.getCellSpan(rowIndex, columnIndex);
                return {
                    colSpan :this._getActualSpanAxis('x', columnIndex, cellSpan.colSpan),
                    rowSpan :this._getActualSpanAxis('y', rowIndex, cellSpan.rowSpan)
                };
            }
        },

        /**
         * Get the actual span on one axis.
         * 
         * @param axisType {String} The axis to calculate
         * @param index {integer} The row or column index
         * @param span {integer} The number of cells this will span
         */
        _getActualSpanAxis : function(axisType, index, span) {
            var first = true;
            var spanCount = 0;
            for ( var idx = 0; idx < span; idx++) {
                var iIndex = index + span - idx - 1;
                if (!this._cellManager.isHidden(axisType, iIndex)) {
                    spanCount++;
                    if (!first && this._cellManager.isAdjustable(axisType, iIndex)) {
                        spanCount++;
                    }
                    first = false;
                }
            }
            return spanCount;
        },

        /**
         * Is the given cell visible?
         * 
         * @param rowIndex {integer}
         * @param columnIndex {integer}
         */
        _isCellVisible : function(rowIndex, columnIndex) {
            var result = true;
            var placeholderCell = this._cellManager.getPlaceholderCell(rowIndex, columnIndex);
            if (placeholderCell) {
                result = false;
            } else {
                cellSpan = this._getActualSpan(rowIndex, columnIndex);
                if (cellSpan.rowSpan <= 0 || cellSpan.colSpan <= 0) {
                    result = false;
                } else if (cellSpan.rowSpan > 1 || cellSpan.colSpan > 1) {
                    result = true;
                } else {
                    result = !this._cellManager.isHidden('x', columnIndex)
                            && !this._cellManager.isHidden('y', rowIndex);
                }
            }
            return result;
        },

        /**
         * Should the given adjuster be visible? This takes into account the
         * hidden flag and the col/row spans.
         * 
         * @param iAxisType {String} The axis type of "this" axis
         * @param idx {integer} The index of this axis
         * @param jdx {integer} The index of the other axis
         * @param intersection {boolean} If this adjuster is at an intersection
         */
        _isAdjusterVisible : function(iAxisType, idx, jdx, intersection) {
            var iConstants = AXIS_TYPES[iAxisType];
            var jAxisType = iConstants.oppositeAxisType;
            var info = getRowColumn(iAxisType, idx, jdx);
            var iHidden = this._cellManager.isHidden(iAxisType, idx);
            var jHidden = this._cellManager.isHidden(jAxisType, jdx);
            var visible = !iHidden && !jHidden;
            if (visible) {
                var cellSpan = null;
                var placeholderCell = this._cellManager.getPlaceholderCell(info.row, info.column);
                if (placeholderCell) {
                    cellSpan = this._cellManager.getCellSpan(placeholderCell.rowIndex, placeholderCell.columnIndex);
                } else {
                    placeholderCell = {
                        rowIndex :info.row,
                        columnIndex :info.column
                    };
                    cellSpan = this._cellManager.getCellSpan(info.row, info.column);
                }

                var indicesIdx = iAxisType == 'x' ? placeholderCell.columnIndex : placeholderCell.rowIndex;
                var span = cellSpan[iConstants.spanType];
                visible = this._isLastVisibleSpace(iAxisType, idx, indicesIdx + span - 1);
                if (intersection) {
                    var jConstants = AXIS_TYPES[jAxisType];
                    var indicesJdx = iAxisType == 'x' ? placeholderCell.rowIndex : placeholderCell.columnIndex;
                    span = cellSpan[jConstants.spanType];
                    visible = visible || this._isLastVisibleSpace(jAxisType, jdx, indicesJdx + span - 1);
                }
            }
            return visible;
        },

        /**
         * Determine if the given index is the last visible row/column in the
         * given index range.
         * 
         * @param iAxisType {String} The axis type this axis is on
         * @param index0 {integer} The index we're checking
         * @param index1 {integer} The last index or the 'to index'
         */
        _isLastVisibleSpace : function(iAxisType, index0, index1) {
            for ( var jdx = index1; jdx > index0; jdx--) {
                if (!this._cellManager.isHidden(iAxisType, jdx)) {
                    return false;
                }
            }
            return true;
        },

        /**
         * Get an object with all the information we need to render/update an
         * adjuster.
         * 
         * @param iAxisType {String} The axis the adjuster is on
         * @param idx {integer} The index of this axis
         * @param jdx {integer} The index of the other axis
         * @param intersection {boolean} If this adjuster is at an intersection
         */
        _getAdjusterInfo : function(iAxisType, idx, jdx, intersection) {
            var iConstants = AXIS_TYPES[iAxisType];
            var jAxisType = iConstants.oppositeAxisType;
            var jConstants = AXIS_TYPES[jAxisType];
            if (!this._cellManager.isAdjustable(iAxisType, idx)) {
                return null;
            }
            if (intersection && !this._cellManager.isAdjustable(jAxisType, jdx)) {
                return null;
            }

            var iAxisData = this._axisData[iAxisType];
            var indices = getRowColumn(iAxisType, idx, jdx);
            var result = {
                axisType :iAxisType,
                rowIndex :indices.row,
                columnIndex :indices.column,
                intersection :intersection,
                adjusterSize :iAxisData.adjusterSize,
                renderSpacerMethod :this._renderSpacerMethod
            };

            if (!this._isAdjusterVisible(iAxisType, idx, jdx, intersection)) {
                result.style = {
                    display :'none'
                };
            }

            result.id = this._getAdjusterId(iAxisType, idx, jdx, intersection);
            var adjusterClasses = [ iConstants.cellType + '-adjuster' ];
            if (intersection) {
                adjusterClasses.push('intersection');
            }
            result.onmouseover = this.fireCode('_setAdjusterHover', iAxisType, idx, true);
            result.onmouseout = this.fireCode('_setAdjusterHover', iAxisType, idx, false);
            if (intersection && this._dragBothAdjusters) {
                result.onmousedown = this.fireCode('_fireIntersectionMouseDown', indices.row, indices.column);
                result.onmouseover += this.fireCode('_setAdjusterHover', jAxisType, jdx, true);
                result.onmouseout += this.fireCode('_setAdjusterHover', jAxisType, jdx, false);
            } else {
                if (intersection) {
                    adjusterClasses.push('row-only');
                }
                result.onmousedown = this.fireCode('_fireAdjusterMouseDown', iAxisType, idx);
            }
            result.className = adjusterClasses.join(' ');
            return result;
        },

        /**
         * Count the number of adjustable cells between index0 (inclusive) and
         * index1 (exclusive).
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} From index (inclusive)
         * @param index1 {integer} To index (exclusive)
         * @param excludeHidden {boolean} Exclude hidden spacing
         */
        _countAdjustableSpacing : function(axisType, index0, index1, excludeHidden) {
            var count = 0;
            for ( var idx = index0; idx < index1; idx++) {
                if (!excludeHidden || !this._cellManager.isHidden(axisType, idx)) {
                    if (this._cellManager.isAdjustable(axisType, idx)) {
                        count++;
                    }
                }
            }
            return count;
        },

        /**
         * Get (or create) a scratch pad div element to render table
         * rows/columns into.
         * 
         * @return {HTMLElement} The scratch pad element (won't be placed into
         *         dom tree)
         */
        _getScratchPad : function() {
            if (!this._scratchPad) {
                this._scratchPad = document.createElement('div');
            }
            return this._scratchPad;
        },

        /**
         * Get all indices in the given section.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param section {String} The section name
         */
        _getSectionIndices : function(axisType, section) {
            return this._axisData[axisType][section + 'Indices'];
        },

        /**
         * Mouse over will initialize the listener on the mouse wheel event.
         */
        _fireMouseOver : function() {
            var obj = $(this.id);
            if (this._fireMouseOverDOMCache !== obj) {
                this._fireMouseOverDOMCache = obj;
                var eventName = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
                YAHOO.util.Event.addListener(this.id, eventName, this._fireMouseWheel, this, true);
            }
        },

        /**
         * Called when the mouse wheel is scrolled.
         * 
         * @param event {Event} The mouse wheel event.
         */
        _fireMouseWheel : function(event) {
            var delta = 0;
            event = event || window.event;
            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
                if (window.opera)
                    delta = -delta;
            } else if (event.detail) { /* Mozilla case. */
                delta = -event.detail / 3;
            }
            var axisType = event.axis == event.VERTICAL_AXIS ? 'y' : 'x';
            var constants = AXIS_TYPES[axisType];
            var move = (delta < 0 ? 1 : delta > 0 ? -1 : 0) * MOUSE_WHEEL_TICK;
            var el = $(this.id);
            var target = YAHOO.util.Event.getTarget(event);
            var horizontal = this._scrollBarMgr.getHorizontal().id;
            var vertical = this._scrollBarMgr.getVertical().id;
            while (target != el) {
                if (target.id == horizontal || target.id == vertical) {
                    break;
                }
                var overflow = YAHOO.util.Dom.getStyle(target, 'overflow-' + axisType)
                        || YAHOO.util.Dom.getStyle(target, 'overflow');
                if (overflow == 'auto') {
                    if (canScrollMove(target, axisType, move)) {
                        return;
                    }
                }
                target = target.parentNode;
            }
            if (delta) {
                if (this._isScrollRequired(axisType)) {
                    var args = [ move ];
                    if (axisType == 'x') {
                        args.push(0);
                    } else {
                        args.splice(0, 0, 0);
                    }
                    var autoScroller = this.getAutoScroller();
                    if (autoScroller.scrollMove.apply(autoScroller, args)) {
                        YAHOO.util.Event.stopEvent(event);
                    }
                }
            }
        },

        /**
         * Called on the fireCode within the middle scroll region when upon the
         * scroll event. This method will ensure that any frozen regions have
         * matching scroll.
         */
        _fireScroll : function() {
            if (this._frozenFlag) {
                this._setScrollOnAxis('x');
                this._setScrollOnAxis('y');
            }
            this._updateScrollManager();
        },

        /**
         * Helper to set the scroll on an individual axis.
         * 
         * @param axisType : Either 'x' or 'y'
         */
        _setScrollOnAxis : function(axisType) {
            var scrollEl = $(this._getSectionId(MIDDLE, MIDDLE));
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                var section = SECTIONS[idx];
                if (section != MIDDLE) {
                    var info = getRowColumn(axisType, MIDDLE, section);
                    var sectionId = this._getSectionId(info.row, info.column);
                    var extenderId = this._getSectionExtenderId(info.row, info.column);
                    matchScroll(scrollEl, axisType, sectionId, extenderId);
                }
            }
        },

        /**
         * Reset the scroll position.
         */
        _fixScrollBars : function() {
            var extenderEl = $(this._getSectionExtenderId(MIDDLE, MIDDLE));
            extenderEl.style.width = '';
            extenderEl.style.height = '';
            if (this._scrollBarMgr) {
                var scrollEl = $(this._getSectionId(MIDDLE, MIDDLE));
                var xScrollable = this._isScrollRequired('x');
                var yScrollable = this._isScrollRequired('y');
                this._fixScrollBar('x', scrollEl, xScrollable, yScrollable);
                this._fixScrollBar('y', scrollEl, yScrollable, xScrollable);
            }
            this._fireScroll();
        },

        /**
         * Fix the scroll bar on one axis.
         * 
         * @param axisType {String} The axis type either 'x' or 'y'
         * @param scrollEl {HtmlElement} The scrollable element
         * @param scrollable {boolean} If the axis is scrollable
         * @param oppositeScrollable {boolean} If the opposite axis is
         *            scrollable
         */
        _fixScrollBar : function(axisType, scrollEl, scrollable, oppositeScrollable) {
            if (scrollable) {
                var constants = AXIS_TYPES[axisType];
                var axisData = this._axisData[axisType];
                var scrollBarPadding = oppositeScrollable ? this._getScrollBarSize(constants.oppositeAxisType) : 0;
                var maxScrollPosition = axisData.middleSize - axisData.viewableSize + scrollBarPadding;
                var currentPosition = scrollEl[constants.scrollPositionType];
                scrollEl[constants.scrollPositionType] = Math.min(maxScrollPosition, currentPosition);
            }
        },

        /**
         * Update the scroll info on the scroll bar manager if exists.
         */
        _updateScrollManager : function() {
            if (this._scrollBarMgr) {
                var dimension = this.getDimension();
                var autoScrollInfo = this.getAutoScroller().getScrollInfo();
                var scrollInfo = {};
                for ( var axisType in AXIS_TYPES) {
                    var axisScrollInfo = autoScrollInfo && autoScrollInfo[axisType];
                    scrollInfo[axisType] = this._getScrollInfoAxis(axisType, axisScrollInfo);
                }
                this._scrollBarMgr.update(this.getDimension(), scrollInfo);
            }
        },

        /**
         * Retrieve the scroll info for the given axis.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param autoScrollInfo {Object} The scroll info from the auto
         *            scroller.
         */
        _getScrollInfoAxis : function(axisType, autoScrollInfo) {
            if (this._isScrollRequired(axisType)) {
                var axisData = this._axisData[axisType];
                if (autoScrollInfo) {
                    autoScrollInfo.size = axisData.middleSize;
                    autoScrollInfo.position = Math.min(axisData.middleSize - autoScrollInfo.scrollArea,
                            autoScrollInfo.position);
                    return autoScrollInfo;
                } else if (this._sizesAvailable) {
                    return {
                        size :axisData.middleSize,
                        scrollArea :axisData.viewableSize,
                        position :0
                    };
                }
            }

            return null;
        },

        /**
         * Called on the fireCode of each of the adjusters upon a mousedown
         * event. This will ensure the mouseup/mousemove events are being
         * listened for.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param cellIndex : The index of the adjuster
         * @param event : The mouse event
         */
        _fireAdjusterMouseDown : function(axisType, cellIndex, event) {
            this._adjusterInfo = {};
            this._adjusterInfo[axisType] = {
                cellIndex :cellIndex
            };
            event = event || window.event;
            YAHOO.util.Event.stopEvent(event);
            SFDragDropMgr.handleMouseDown(event, this, {
                useShim :true,
                clickTimeThreshold :0,
                shimCursor :AXIS_TYPES[axisType].cursorType
            });
        },

        /**
         * Called on the fireCode of adjusters at intersections.
         * 
         * @param rowIndex : The index of the row
         * @param columnIndex : The index of the column
         */
        _fireIntersectionMouseDown : function(rowIndex, columnIndex, event) {
            this._adjusterInfo = {
                x : {
                    cellIndex :columnIndex
                },
                y : {
                    cellIndex :rowIndex
                }
            };
            event = event || window.event;
            YAHOO.util.Event.stopEvent(event);
            SFDragDropMgr.handleMouseDown(event, this, {
                useShim :true,
                shimCursor :'move'
            });
        },

        /**
         * Called on the fireCode for mouse over on adjusters.
         * 
         * @param axisType : The axis type
         * @param cellIndex : The index of the cell
         */
        _fireAdjusterMouseOver : function(axisType, cellIndex) {
            this._setAdjusterHover(axisType, cellIndex, true);
        },

        /**
         * Called on the fireCode for mouse out on adjusters.
         * 
         * @param axisType : The axis type
         * @param cellIndex : The index of the cell
         */
        _fireAdjusterMouseOut : function(axisType, cellIndex) {
            this._setAdjusterHover(axisType, cellIndex, false);
        },

        /**
         * Set (or remove) the adjuster hover class.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param cellIndex {integer} The cell index
         * @param hovering {boolean} If the adjuster is being hovered over
         */
        _setAdjusterHover : function(axisType, cellIndex, hovering, hoverClassName) {
            var otherAxisType = AXIS_TYPES[axisType].oppositeAxisType;
            var otherAxisSize = this._axisData[otherAxisType].size;
            var method = hovering ? 'addClass' : 'removeClass';
            var className = typeof hoverClassName == 'string' ? hoverClassName : 'hover';
            for ( var idx = 0; idx < otherAxisSize; idx++) {
                YAHOO.util.Dom[method](this._getAdjusterId(axisType, cellIndex, idx), className);
                if (this._cellManager.isAdjustable(otherAxisType, idx)) {
                    YAHOO.util.Dom[method](this._getAdjusterId(axisType, cellIndex, idx, true), className);
                }
            }
        },

        /**
         * Handle the mouse down event.
         * 
         * @param event : The mouse event (or null)
         */
        _handleDragStart : function(event) {
            var originPoint = event.origin;
            for ( var axisType in this._adjusterInfo) {
                var axisData = this._axisData[axisType];
                var adjusterInfo = this._adjusterInfo[axisType];
                var cellIndex = adjusterInfo.cellIndex;
                var size = axisData.sizes[cellIndex];
                adjusterInfo.originPoint = originPoint;
                adjusterInfo.destinationPoint = originPoint;

                if (!this._dragByResizing) {
                    this._showHoveringLine(axisType, cellIndex, size);
                } else {
                    this._setAdjusterHover(axisType, adjusterInfo.cellIndex, true, 'adjusting');
                }
            }
        },

        /**
         * Called on the mouse move event after the adjuster has been dragged.
         * This will move the hovering line to the proper place.
         * 
         * @param event : The mouse event
         */
        _handleDrag : function(event) {
            var destinationPoint = event.point;
            this._handleDragAxis('x', destinationPoint);
            this._handleDragAxis('y', destinationPoint);

            if (this._dragByResizing) {
                this._refreshDimensions();
            }
        },

        /**
         * Move the hovering line on an axis to the given point.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param destinationPoint : Where the mouse currently is on the page
         */
        _handleDragAxis : function(axisType, destinationPoint) {
            var adjusterInfo = this._adjusterInfo[axisType];

            if (adjusterInfo) {
                var axisData = this._axisData[axisType];
                var originPoint = adjusterInfo.originPoint;
                var cellIndex = adjusterInfo.cellIndex;
                var delta = destinationPoint[axisType] - originPoint[axisType];
                var spacing = this._cellManager.getSpacingManager(axisType);
                var bounds = spacing.getBounds(cellIndex);
                var extreme = bounds[delta < 0 ? 'minSize' : 'maxSize'];

                adjusterInfo.destinationPoint = destinationPoint;
                var adjustedSize = this._getAdjustedSize(axisType, cellIndex, destinationPoint);

                if (this._dragByResizing) {
                    spacing.setCustomSize(cellIndex, adjustedSize);
                } else {
                    this._moveHoveringLine(axisType, cellIndex, adjustedSize);
                }

                /* Check if we need to start auto scrolling. */
                if (adjustedSize != extreme) {
                    var originPoint = adjusterInfo.originPoint;
                    var destinationPoint = adjusterInfo.destinationPoint;
                    var middle = $(this._getSectionId(MIDDLE, MIDDLE));
                    var region = YAHOO.util.Dom.getRegion(middle);
                    var regionContainsOrigin = regionContainsAxis(region, originPoint, axisType);
                    var regionContainsDestination = regionContainsAxis(region, destinationPoint, axisType);

                    if (regionContainsOrigin && !regionContainsDestination) {
                        if (!this._scrollBarMgr) {
                            middle.style['overflow' + axisType.toUpperCase()] = 'auto';
                        }
                        this.getAutoScroller().autoScrollAxis(destinationPoint, axisType, true);
                    } else {
                        this._stopAutoScroll(axisType);
                    }
                }
            }
        },

        /**
         * Called when on the mouse up event when there is an adjustment of a
         * row/column. This will make the hovering line disappear and make the
         * appropriate adjustment on the column.
         * 
         * @param event : The mouse event
         */
        _handleDragEnd : function(event) {
            var destinationPoint = event.point;

            /* Stop the auto scrolling and hide the line(s). */
            this._stopAutoScroll();

            if (!this._dragByResizing) {
                this._hideHoveringLine();
            } else {
                for ( var axisType in this._adjusterInfo) {
                    var adjusterInfo = this._adjusterInfo[axisType];
                    this._setAdjusterHover(axisType, adjusterInfo.cellIndex, false, 'adjusting');
                }
            }

            /* Adjust the x and y axis. */
            this._adjustAxis('x', destinationPoint);
            this._adjustAxis('y', destinationPoint);
            this._refreshDimensions();
        },

        /**
         * Adjust the given axis to the given mouse point.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param destinationPoint : The point where the mouse current is
         */
        _adjustAxis : function(axisType, destinationPoint) {
            var adjusterInfo = this._adjusterInfo[axisType];
            if (adjusterInfo) {
                var constants = AXIS_TYPES[axisType];
                var cellIndex = adjusterInfo.cellIndex;
                var adjustedSize = this._getAdjustedSize(axisType, cellIndex, destinationPoint);
                this._cellManager.getSpacingManager(axisType).setCustomSize(cellIndex, adjustedSize);
            }
        },

        /**
         * Happens when there is any auto scrolling.
         */
        _onAutoScroll : function() {
            if (this._makingAdjustments) {
                this._onAutoScrollAxis('x');
                this._onAutoScrollAxis('y');
                if (this._dragByResizing) {
                    this._refreshDimensions();
                }
            }
            this._fireScroll();
        },

        /**
         * Handle auto scroll on an individual axis.
         * 
         * @param axisType : Either 'x' or 'y'
         */
        _onAutoScrollAxis : function(axisType) {
            var adjusterInfo = this._adjusterInfo[axisType];
            if (adjusterInfo) {
                var cellIndex = adjusterInfo.cellIndex;
                var destinationPoint = adjusterInfo.destinationPoint;
                var adjustedSize = adjusterInfo.adjustedSize;
                var newAdjustedSize = this._getAdjustedSize(axisType, cellIndex, destinationPoint);
                if (newAdjustedSize != adjustedSize) {
                    if (this._dragByResizing) {
                        this._cellManager.getSpacingManager(axisType).setCustomSize(cellIndex, newAdjustedSize);
                    } else {
                        this._moveHoveringLine(axisType, cellIndex, newAdjustedSize);
                    }
                } else {
                    this._stopAutoScroll(axisType);
                }
            }
        },

        /**
         * Get the cell's adjusted size assuming the mouse is at the given
         * destination point.
         * 
         * @param destinationPoint : The point where the mouse is
         * @return integer : The new size of the given cell
         */
        _getAdjustedSize : function(axisType, cellIndex, destinationPoint) {
            var axisData = this._axisData[axisType];
            var constants = AXIS_TYPES[axisType];

            var middle = this.getSectionName(axisType, cellIndex) == SFMatrixLayout.MIDDLE_SECTION;
            var padding = this._isScrollRequired(constants.oppositeAxisType) ? this._getScrollBarSize(axisType) : 0;
            var outerRegion = YAHOO.util.Dom.getRegion(this.id + 'outer');
            if (middle) {
                outerRegion[constants.endRegionType] -= axisData[SFMatrixLayout.LAST_SECTION + 'Size'];
            }
            var regionStart = outerRegion[constants.startRegionType];
            var regionEnd = outerRegion[constants.endRegionType] - padding - axisData.adjusterSize;

            var adjusterOffset = this._getAdjusterOffset(axisType, cellIndex);
            var adjusterPosition = regionStart + adjusterOffset;
            var destinationPosition = destinationPoint[axisType] - Math.floor(axisData.adjusterSize / 2);
            var safeDestination = applyMinMax(destinationPosition, regionStart, regionEnd);
            var newSize = axisData.sizes[cellIndex] + safeDestination - adjusterPosition;

            var bounds = this._cellManager.getSpacingManager(axisType).getBounds(cellIndex);
            return applyMinMax(newSize, bounds.minSize, bounds.maxSize);
        },

        /**
         * Get how far the adjuster at the given index is offset from the
         * outer-region.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param cellIndex : The index of the cell the adjuster is for
         * @param return integer : The current offset for the adjuster
         */
        _getAdjusterOffset : function(axisType, cellIndex) {
            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var position = axisData.sizes[cellIndex];

            if (this._getSectionIndices(axisType, MIDDLE).contains(cellIndex)) {
                /* Then the position is offset by the scrolling. */
                position -= $(this._getSectionId(MIDDLE, MIDDLE))[constants.scrollPositionType];
            }

            /* Offset the position by each cell before it. */
            for ( var idx = 0; idx < cellIndex; idx++) {
                if (!this._cellManager.isHidden(axisType, idx)) {
                    position += axisData.sizes[idx];
                    if (this._cellManager.isAdjustable(axisType, idx)) {
                        position += axisData.adjusterSize;
                    }
                }
            }

            return position;
        },

        /**
         * Show the hovering line for the given row/column index with the given
         * adjusted size.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param cellIndex : The index of the row/column
         * @param adjustedSize : What the size of the row/column would be after
         *            adjustment
         */
        _showHoveringLine : function(axisType, cellIndex, adjustedSize) {
            this._makingAdjustments = true;
            this._adjusterInfo[axisType].adjustedSize = adjustedSize;

            var constants = AXIS_TYPES[axisType];
            var opposite = AXIS_TYPES[constants.oppositeAxisType];
            var axisData = this._axisData[axisType];

            var adjusterOffset = this._getAdjusterOffset(axisType, cellIndex);
            var delta = adjustedSize - axisData.sizes[cellIndex];
            var position = adjusterOffset + delta;

            if (!this._hoveringLines) {
                this._hoveringLines = {};
            }

            var hoveringLine = $(this.id + 'hoveringLine:' + axisType);

            if (!hoveringLine) {
                /* Init the hovering line. */
                hoveringLine = document.createElement('div');
                hoveringLine.className = constants.cellType + '-adjuster hovering-cell-adjuster';
                hoveringLine.setAttribute('id', this.id + 'hoveringLine:' + axisType);
                hoveringLine.style.display = 'none';
                hoveringLine.style.position = 'absolute';
                hoveringLine.style[constants.dimensionType] = axisData.adjusterSize + 'px';
                hoveringLine.style[opposite.startRegionType] = '0px';
                hoveringLine.style.zIndex = '99999';
                $(this.id + 'adjusters').appendChild(hoveringLine);
                this._hoveringLines[axisType] = hoveringLine;
            }

            var dimension = this.getDimension();
            var size = dimension[opposite.dimensionType];
            hoveringLine.style[opposite.dimensionType] = size + 'px';
            hoveringLine.style[constants.startRegionType] = position + 'px';
            hoveringLine.style.display = '';
        },

        /**
         * Assuming the hovering line is already visible, just update the
         * position. (More efficient than _showHoveringLine)
         * 
         * @param axisType : Either 'x' or 'y'
         * @param cellIndex : The index of the row/column
         * @param adjustedSize : What the size of the row/column would be after
         *            adjustment
         */
        _moveHoveringLine : function(axisType, cellIndex, adjustedSize) {
            var hoveringLine = this._hoveringLines && this._hoveringLines[axisType];
            if (hoveringLine && this._makingAdjustments) {
                this._adjusterInfo[axisType].adjustedSize = adjustedSize;
                var constants = AXIS_TYPES[axisType];
                var axisData = this._axisData[axisType];
                var adjusterOffset = this._getAdjusterOffset(axisType, cellIndex);
                var delta = adjustedSize - axisData.sizes[cellIndex];
                var position = adjusterOffset + delta;
                hoveringLine.style[constants.startRegionType] = position + 'px';
            }
        },

        /**
         * Hide the hovering line.
         */
        _hideHoveringLine : function() {
            this._makingAdjustments = false;
            for ( var axisType in this._hoveringLines) {
                this._hoveringLines[axisType].style.display = 'none';
            }
        },

        /**
         * Call this method to stop any auto scrolling.
         */
        _stopAutoScroll : function(axisType) {
            if (this._autoScroller) {
                this._autoScroller.stopScrolling(axisType);
            }
        },

        /**
         * Method which creates the axisData object. This axisData object will
         * contain pre-processed information regarding each axis in the matrix.
         * This includes the spacingInfo object, the number or length of cells
         * on this axis, the count of adjustable cells on this axis, and each
         * section of indices (first/middle/last). The first and last sections
         * represent frozen sections, and the middle is the scrollable section.
         */
        _createAxisData : function(axisType) {
            var constants = AXIS_TYPES[axisType];
            var size = this._cellManager.size()[constants.dimensionType];
            var axisData = this._axisData[axisType] = {
                size :size
            };
            if (typeof this._adjusterSize != 'number' && this._adjusterSize[axisType]) {
                axisData.adjusterSize = this._adjusterSize[axisType];
            } else {
                axisData.adjusterSize = this._adjusterSize;
            }
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                var section = SECTIONS[idx];
                axisData[section + 'Indices'] = [];
            }
            var firstIndices = this._getSectionIndices(axisType, SFMatrixLayout.FIRST_SECTION);
            var middleIndices = this._getSectionIndices(axisType, MIDDLE);
            var lastIndices = this._getSectionIndices(axisType, SFMatrixLayout.LAST_SECTION);
            var foundNotFrozen = false;
            for ( var idx = 0; idx < size; idx++) {
                if (this._cellManager.isFrozen(axisType, idx)) {
                    this._frozenFlag = true;
                    if (foundNotFrozen) {
                        lastIndices.push(idx);
                    } else {
                        firstIndices.push(idx)
                    }
                } else {
                    assert(lastIndices.length == 0,
                            'Cannot have more than one section of unfrozen ' + constants.cellType + 's');
                    foundNotFrozen = true;
                    middleIndices.push(idx);
                }
            }
            return axisData;
        },

        /**
         * Update all sizes for a single axis.
         * 
         * @param axisType : Either 'x' or 'y'
         * @param withScrollBar {boolean} should we subtract the scrollbar size
         */
        _updateAxisData : function(axisType, withScrollBar) {
            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var viewSize = this._dimension[constants.dimensionType];

            /* Padding will make room for adjusters. */
            var adjustableCount = this._countAdjustableSpacing(axisType, 0, axisData.size, true);
            var scrollBarPadding = withScrollBar ? this._getScrollBarSize(axisType) : 0;
            var padding = scrollBarPadding + axisData.adjusterSize * adjustableCount;
            axisData.sizes = this._cellManager.getSpacingManager(axisType).allocate(viewSize - padding);

            /* Determine section sizing. */
            var viewableSize = viewSize, middleSize;
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                var section = SECTIONS[idx];
                var indices = this._getSectionIndices(axisType, section);
                var totalSize = 0;
                if (indices.length > 0) {
                    totalSize = this._getTotalSize(axisType, indices[0], indices[0] + indices.length);
                }
                axisData[section + 'Size'] = totalSize;
                if (section == MIDDLE) {
                    middleSize = totalSize;
                } else {
                    viewableSize -= totalSize;
                }
            }

            var maxViewableSize = this._minimizeSpace ? middleSize + scrollBarPadding : Number.MAX_VALUE;
            axisData.viewableSize = Math.min(viewableSize, maxViewableSize);
        },

        /**
         * Account for the scroll bar space on the other axis.
         * 
         * @param iAxisType {String} The axis type
         */
        _updateAxisDataScroll : function(iAxisType) {
            var iConstants = AXIS_TYPES[iAxisType];
            var iScroll = this._isScrollRequired(iAxisType);
            var jAxisType = iConstants.oppositeAxisType;
            var jScroll = this._isScrollRequired(jAxisType);
            if (iScroll) {
                if (jScroll) {
                    if (iAxisType == 'x') {
                        this._updateAxisData('x', true);
                        this._updateAxisData('y', true);
                    }
                } else {
                    this._updateAxisData(jAxisType, true);
                    if (this._isScrollRequired(jAxisType)) {
                        this._updateAxisData(iAxisType, true);
                    }
                }
            }
        },

        /**
         * Update all DOM elements to have proper width/height values set.
         */
        _adjustDOM : function() {
            var outer = $(this.id);
            if (outer && this._sizesAvailable) {
                var size = this._cellManager.size();

                updateStyle(outer, getDimensionStyle(this.getDimension()));
                for ( var rowIndex = 0; rowIndex < size.height; rowIndex++) {
                    for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                        var cell = $(this._getCellId(rowIndex, columnIndex));
                        var dimension = this.getCellDimension(rowIndex, columnIndex);
                        updateStyle(cell, getDimensionStyle(dimension));
                    }
                }

                /* Adjust the 'section' divs. */
                for ( var idx = 0; idx < 3; idx++) {
                    var rowSection = SECTIONS[idx];
                    var rowMiddle = rowSection == MIDDLE;
                    for ( var jdx = 0; jdx < 3; jdx++) {
                        var columnSection = SECTIONS[jdx];
                        var columnMiddle = columnSection == MIDDLE;
                        var sectionDimension = this._getSectionDimension(rowSection, columnSection);
                        var sectionEl = $(this._getSectionId(rowSection, columnSection));
                        updateStyle(sectionEl, getDimensionStyle(sectionDimension));
                        if (!rowMiddle || !columnMiddle) {
                            var extender = $(this._getSectionExtenderId(rowSection, columnSection));
                            sectionDimension.width += columnMiddle ? EXTENDER_PADDING : 0;
                            sectionDimension.height += rowMiddle ? EXTENDER_PADDING : 0;
                            updateStyle(extender, getDimensionStyle(sectionDimension));
                        }
                    }
                }

                var sectionEl = $(this._getSectionId(MIDDLE, MIDDLE));
                updateStyle(sectionEl, this._getOverflowStyle(true));
                this._fixScrollBars();
            }
        },

        /**
         * Get the width or height of a section on a single axis.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param section {String} The section
         */
        _getSectionDimensionAxis : function(axisType, section) {
            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var jAxisType = constants.oppositeAxisType;
            var size = axisData[section + 'Size'];
            if (section == MIDDLE) {
                size = axisData.viewableSize;
                if (this._scrollBarMgr && this._isScrollRequired(jAxisType)) {
                    size -= this._getScrollBarSize(jAxisType);
                }
            }
            return size;
        },

        /**
         * Get the total dimension of a single axis.
         * 
         * @param axisType {String} Either 'x' or 'y'
         */
        _getTotalDimensionAxis : function(axisType) {
            var total = 0;
            for ( var idx = 0; idx < SECTIONS.length; idx++) {
                total += this._getSectionDimensionAxis(axisType, SECTIONS[idx]);
            }
            return total;
        },

        /**
         * Helper to abstract getting scroll bar size.
         * 
         * @param axisType {String} Either 'x' or 'y'
         */
        _getScrollBarSize : function(axisType) {
            if (this._scrollBarMgr) {
                return this._scrollBarMgr.get(axisType).getSize();
            }
            return AXIS_TYPES[axisType].scrollBarSize;
        },

        /**
         * Return the dimension for a particular row/column section.
         * 
         * @param rowSection : The row section
         * @param columnSection : The column section
         */
        _getSectionDimension : function(rowSection, columnSection) {
            return {
                width :this._getSectionDimensionAxis('x', columnSection),
                height :this._getSectionDimensionAxis('y', rowSection)
            };
        },

        /**
         * Determine for the given axis type if the scroll is required.
         * 
         * @param axisType {String} Either 'x' or 'y'
         */
        _isScrollRequired : function(axisType) {
            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var adjustableCount = this._countAdjustableSpacing(axisType, 0, axisData.size, true);
            var viewSize = this._dimension[constants.dimensionType] - axisData.adjusterSize * adjustableCount;
            var spacing = this._cellManager.getSpacingManager(axisType);
            var minimumSize = spacing.getActualSize() || spacing.getMinimumSpace();
            return viewSize < minimumSize;
        },

        /**
         * Calculate the total size including adjusters.
         * 
         * @param axisType {String} Either 'x' or 'y'
         * @param index0 {integer} The from index
         * @param index1 {integer} The to index
         * @param excludeLastAdjuster {boolean} Should the size include the last
         *            adjuster?
         */
        _getTotalSize : function(axisType, index0, index1, excludeLastAdjuster) {
            var axisData = this._axisData[axisType];
            var totalSize = 0;
            var first = true;
            for ( var idx = index1 - 1; idx >= index0; idx--) {
                if (!this._cellManager.isHidden(axisType, idx)) {
                    totalSize += axisData.sizes[idx];
                    if (this._cellManager.isAdjustable(axisType, idx) && (!excludeLastAdjuster || !first)) {
                        totalSize += axisData.adjusterSize;
                    }
                    first = false;
                }
            }
            return totalSize;
        },

        /**
         * This method will be called when a child display component wishes to
         * adjust its own dimension. The cell may or may not adjust, the layout
         * will decide.
         * 
         * @param rowIndex {integer} : The row index
         * @param columnIndex {integer} : The column index
         * @param dimension {Dimension} : The requested dimension
         * @param bounds {x: {minSize, maxSize}, y: {minSize, maxSize}}
         */
        _requestAdjust : function(rowIndex, columnIndex, dimension, bounds) {
            var xChange = this._requestAdjustAxis('x', columnIndex, dimension.width, bounds && bounds.x);
            var yChange = this._requestAdjustAxis('y', rowIndex, dimension.height, bounds && bounds.y);

            if (this._handleTimeoutId == null && (xChange || yChange)) {
                this._handleTimeoutId = setTimeout(Util.createCallback(this, '_batchAdjustment'), 0);
            }
        },

        /**
         * Handle the adjustment request on a single axis.
         * 
         * @param axisType {String} : Either 'x' or 'y'
         * @param index {integer} : The row or column index
         * @param size {integer} : The requested size for this row/column
         * @param bounds {minSize, maxSize} : Request adjust bounds
         */
        _requestAdjustAxis : function(axisType, index, size, bounds) {
            var axisData = this._axisData[axisType];
            var currSize = axisData.sizes[index];
            var change = false;

            if (!axisData.requestSizes) {
                axisData.requestSizes = [];
            }
            var currentRequest = axisData.requestSizes[index];
            if (!currentRequest || size > currentRequest) {
                axisData.requestSizes[index] = size;
                change = true;
            }

            if (bounds && (bounds.minSize || bounds.maxSize)) {
                if (!axisData.requestBounds) {
                    axisData.requestBounds = [];
                }
                currentRequest = axisData.requestBounds[index];
                if (!currentRequest) {
                    axisData.requestBounds[index] = bounds;
                    change = true;
                } else {
                    if (currentRequest.minSize == null
                            || (bounds.minSize != null && bounds.minSize > currentRequest.minSize)) {
                        currentRequest.minSize = bounds.minSize;
                        change = true;
                    }
                    if (currentRequest.maxSize == null
                            || (bounds.maxSize != null && bounds.maxSize < currentRequest.maxSize)) {
                        currentRequest.maxSize = bounds.maxSize;
                        change = true;
                    }
                }
            }

            return change;
        },

        /**
         * This method will be called once for all adjustments.
         */
        _batchAdjustment : function() {
            this._handleTimeoutId = null;
            var xChange = this._batchAxisAdjustment('x');
            var yChange = this._batchAxisAdjustment('y');
            if (xChange || yChange) {
                this._refreshDimensions();
            }
        },

        /**
         * Handle the adjustments on a single axis.
         * 
         * @param axisType {String} : Either 'x' or 'y'
         */
        _batchAxisAdjustment : function(axisType) {
            var axisData = this._axisData[axisType];
            var spacing = this._cellManager.getSpacingManager(axisType);
            var requestSizes = axisData.requestSizes;
            var changed = false;

            if (requestSizes && requestSizes.length > 0) {
                axisData.requestSizes = null;
                for ( var idx = 0, len = requestSizes.length; idx < len; idx++) {
                    var size = requestSizes[idx];
                    if (size != null) {
                        spacing.setCustomSize(idx, size);
                        changed = true;
                    }
                }
            }

            var requestBounds = axisData.requestBounds;
            if (requestBounds && requestBounds.length > 0) {
                axisData.requestBounds = null;
                for ( var idx = 0, len = requestBounds.length; idx < len; idx++) {
                    var bounds = requestBounds[idx];
                    if (bounds != null) {
                        spacing.setBounds(idx, bounds);
                        changed = true;
                    }
                }
            }

            return changed;
        }
    });
})();

function SFMatrixCellManager(cells, options) {
    this._init(cells, options);
}

SFMatrixCellManager.prototype = ( function() {
    /**
     * Get or create the spacing manager.
     * 
     * @param spacing {Object[] | SFSpacingManager} The spacing
     * @param spacingOptions {Object} The spacing options
     * @param size {integer} The expected size of this spacing
     */
    function createSpacingManager(spacing, spacingOptions, size) {
        if (spacing instanceof Array) {
            assert(spacing.length == size, 'spacing array has incorrect size');
            return new SFSpacingManager(spacing, spacingOptions);
        } else {
            assert(false, 'spacing object is of incorrect type');
        }
    }

    /**
     * Get or create the spacing array.
     * 
     * @param spacing {Object[]}
     */
    function createSpacing(spacing, size) {
        if (spacing instanceof Array) {
            assert(spacing.length == size, 'spacing array has incorrect size');
            return spacing.concat();
        } else if (spacing == null) {
            spacing = [];
            for ( var idx = 0; idx < size; idx++) {
                spacing.push( {});
            }
            return spacing;
        } else {
            assert(false, 'spacing object is of incorrect type');
        }
    }

    /**
     * A util that abstracts position so that the caller doesn't need to check
     * the axis type and switch.
     * 
     * @param axisTypeFirst {String} which axis type is the first object from?
     * @param first {any} The first object
     * @param second {any} The second object
     */
    function getRowColumn(axisTypeFirst, first, second) {
        var xFirst = axisTypeFirst == 'x';
        return {
            row :xFirst ? second : first,
            column :xFirst ? first : second
        };
    }

    /**
     * Safely add an event listener to the given component.
     * 
     * @param component {EventTarget} The target to add the event listener to
     * @param eventType {String} The event type to add
     * @param handler {EventTarget} The handler for this event
     */
    function addEventListener(component, eventType, handler) {
        if (component && component.addEventListener && handler.handleEvent) {
            if (!component._allowedEvents || component._allowedEvents[eventType]) {
                component.addEventListener(eventType, handler);
            }
        }
    }

    /**
     * Safely remove an event listener to the given component.
     * 
     * @param component {EventTarget} The target to remove the event listener to
     * @param eventType {String} The event type to remove
     * @param handler {EventTarget} The handler for this event
     */
    function removeEventListener(component, eventType, handler) {
        if (component && component.removeEventListener) {
            component.removeEventListener(eventType, handler);
        }
    }

    /* Use these constants to normalize handling of both x and y axis. */
    var AXIS_TYPES = {
        x : {
            axisType :'x',
            oppositeAxisType :'y',
            cellType :'column',
            dimensionType :'width',
            spanType :'colSpan'
        },
        y : {
            axisType :'y',
            oppositeAxisType :'x',
            cellType :'row',
            dimensionType :'height',
            spanType :'rowSpan'
        }
    };

    /**
     * A cell handler to manage an individual cell's properties and cache
     * dimensions.
     * 
     * @param rowIndex {integer} The row index
     * @param columnIndex {integer} The column index
     */
    function CellHandler(rowIndex, columnIndex) {
        this._rowIndex = rowIndex;
        this._columnIndex = columnIndex;
    }

    CellHandler.prototype = ( function() {
        return set(new EventTarget(), {
            handleEvent : function(event) {
                this.dispatch(event.type, {
                    displayEvent :event,
                    rowIndex :this._rowIndex,
                    columnIndex :this._columnIndex
                });
            },

            setDisplayComponent : function(component) {
                if (this._component) {
                    removeEventListener(this, 'resize', this._component);
                    removeEventListener(this._component, 'requestAdjust', this);
                }
                this._dimension = null;
                this._component = component;
                if (this._component) {
                    addEventListener(this, 'resize', this._component);
                    addEventListener(this._component, 'requestAdjust', this);
                }
            },

            getDisplayComponent : function() {
                return this._component;
            },

            setPlaceholder : function(placeholder) {
                this._placeholder = placeholder;
            },

            getPlaceholder : function() {
                return this._placeholder;
            },

            setCellSpan : function(cellSpan) {
                this._cellSpan = cellSpan;
            },

            getCellSpan : function() {
                return this._cellSpan;
            },

            getPosition : function() {
                return {
                    rowIndex :this._rowIndex,
                    columnIndex :this._columnIndex
                };
            },

            setPosition : function(rowIndex, columnIndex) {
                this._rowIndex = rowIndex;
                this._columnIndex = columnIndex;
            },

            getCellProperties : function() {
                return this._properties || {};
            },

            setCellProperties : function(properties) {
                this._properties = properties;
            },

            clearCache : function() {
                this._dimension = null;
            },

            resize : function(dimension) {
                if (!this._dimension || dimension.width != this._dimension.width
                        || dimension.height != this._dimension.height) {
                    this._dimension = dimension;
                    this.dispatch('resize', dimension);
                }
            }
        });
    })();

    return set(new EventTarget(), {
        _init : function(cells, options) {
            assert(cells != null && cells instanceof Array,
                    '[SFMatrixCellManager] requires a 2 dimensional array of cells');

            var columnCount = 0;
            if (cells.length > 0) {
                columnCount = cells[0].length;
            } else if (options && options.columnSpacing) {
                columnCount = options.columnSpacing.length;
            }
            var rowCount = cells.length;

            /* Create axis data. */
            this._axisData = {
                x :this._createAxisData('x',
                        options && options.columnSpacing,
                        options && options.columnOptions,
                        columnCount),
                y :this._createAxisData('y', options && options.rowSpacing, options && options.rowOptions, rowCount)
            };

            /* Create handlers for each cell. */
            var cellSpans = options && options.cellSpans;
            for ( var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                for ( var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    var displayComponent = cells[rowIndex][columnIndex];
                    var cellSpan = cellSpans && cellSpans[rowIndex] && cellSpans[rowIndex][columnIndex];
                    this._updateDisplayComponent(rowIndex, columnIndex, displayComponent, cellSpan);
                }
            }
        },

        handleEvent : function(event) {
            switch (event.type) {
            case 'requestAdjust':
                this.dispatch('requestAdjust', {
                    rowIndex :event.rowIndex,
                    columnIndex :event.columnIndex,
                    bounds : {
                        x : {
                            minSize :event.displayEvent.minWidth,
                            maxSize :event.displayEvent.maxWidth
                        },
                        y : {
                            minSize :event.displayEvent.minHeight,
                            maxSize :event.displayEvent.maxHeight
                        }
                    },
                    dimension : {
                        width :event.displayEvent.width,
                        height :event.displayEvent.height
                    }
                });
                break;
            }
        },

        get : function(rowIndex, columnIndex) {
            this._validateIndices(rowIndex, columnIndex);
            return this._getCellHandler(rowIndex, columnIndex).getDisplayComponent();
        },

        set : function(rowIndex, columnIndex, component) {
            var current = this.get(rowIndex, columnIndex);
            if (current !== component) {
                this._getCellHandler(rowIndex, columnIndex).setDisplayComponent(component);
                this.dispatch('contentsChanged', {
                    rowIndex :rowIndex,
                    columnIndex :columnIndex
                });
            }
        },

        append : function(axisType, components, spaceOptions, cellSpans) {
            this.insertInto(axisType, null, components, spaceOptions, cellSpans);
        },

        appendMultiple : function(axisType, components, spaceOptions, cellSpans) {
            this.insertMultipleInto(axisType, null, components, spaceOptions, cellSpans);
        },

        insertInto : function(axisType, index, components, spaceOptions, cellSpans) {
            this.insertMultipleInto(axisType, index, [ components ], spaceOptions && [ spaceOptions ], cellSpans
                    && [ cellSpans ]);
        },

        insertMultipleInto : function(axisType, index, components, spaceOptions, cellSpans) {
            /* Validate the input. */
            this._validateIndex(axisType, index, true);

            var axisData = this._axisData[axisType];
            var jAxisType = AXIS_TYPES[axisType].oppositeAxisType;
            var jAxisData = this._axisData[jAxisType];

            /* Validate the input. */
            assert(components instanceof Array, 'components must be a 2D array');
            if (components.length == 0) {
                return;
            }
            assert(components[0] instanceof Array && components[0].length == jAxisData.size,
                    'components must have 2nd dimension of size ' + +jAxisData.size);
            index = index == null ? axisData.size : index;

            /* Create empty space options if not passed in. */
            var insertLen = components.length;
            if (!spaceOptions) {
                spaceOptions = [];
                for ( var idx = 0; idx < insertLen; idx++) {
                    spaceOptions.push( {});
                }
            }

            assert(spaceOptions instanceof Array && spaceOptions.length == insertLen,
                    'spaceOptions must be an array of size ' + insertLen);

            /* Create empty cell handlers for the insertion. */
            if (axisType == 'x') {
                var nulls = [];
                for ( var idx = 0; idx < insertLen; idx++) {
                    nulls.push(null);
                }
                nulls.splice(0, 0, index, 0);
                for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                    this._cellHandlers[jdx].splice.apply(this._cellHandlers[jdx], nulls);
                }
            } else {
                if (!this._cellHandlers) {
                    this._cellHandlers = [];
                }
                var nulls = [];
                for ( var idx = 0; idx < insertLen; idx++) {
                    nulls.push( []);
                }
                nulls.splice(0, 0, index, 0);
                this._cellHandlers.splice.apply(this._cellHandlers, nulls);
            }

            /* Insert the space into the spacing manager. */
            axisData.spacingManager.insertMultipleInto(index, spaceOptions);
            var applyArgs = [ index, 0 ].concat(spaceOptions);
            axisData.spacing.splice.apply(axisData.spacing, applyArgs);
            axisData.size += insertLen;

            /* Update existing cell handler positions. */
            this._updateCellHandlerPositions(axisType, index + insertLen, axisData.size);

            /* Insert the new components. */
            for ( var idx = 0; idx < insertLen; idx++) {
                for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                    var component = components[idx][jdx];
                    var cellSpan = cellSpans && cellSpans[idx] && cellSpans[idx][jdx];
                    var indices = getRowColumn(axisType, index + idx, jdx);
                    this._updateDisplayComponent(indices.row, indices.column, component, cellSpan);
                }
            }

            this.dispatch('intervalAdded', {
                axisType :axisType,
                index0 :index,
                index1 :index + insertLen - 1
            });
        },

        remove : function(axisType, index0, count, cleanup) {
            if (count <= 0) {
                return;
            }

            /* Validate the input. */
            count = count || 0;
            var index1 = index0 + count - 1;
            this._validateIndex(axisType, index0);
            this._validateIndex(axisType, index1);
            assert(index1 >= index0, '[SFMatrixCellManager] Invalid indices [' + index0 + ',' + index1 + ']');

            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var jAxisType = constants.oppositeAxisType;
            var jAxisData = this._axisData[jAxisType];

            /* Insert the space into the spacing manager. */
            axisData.spacingManager.remove(index0, count);
            axisData.spacing.splice(index0, count);
            axisData.size -= count;

            /* remove cell handlers. */
            if (axisType == 'x') {
                for ( var jdx = 0; jdx < jAxisData.size; jdx++) {
                    this._cleanupCellHandlers(this._cellHandlers[jdx].splice(index0, count), cleanup);
                }
            } else {
                this._cleanupCellHandlers(this._cellHandlers.splice(index0, count), cleanup);
            }

            this._updateCellHandlerPositions(axisType, index0, axisData.size);

            this.dispatch('intervalRemoved', {
                axisType :axisType,
                index0 :index0,
                index1 :index1
            });
        },

        move : function(axisType, index0, index1, count) {
            /* Validate the input. */
            this._validateIndex(axisType, index0);
            this._validateIndex(axisType, index1);
            count = count || 1;
            this._validateIndex(axisType, index0 + count - 1);
            this._validateIndex(axisType, index1 + count - 1);
            assert(count >= 0, 'count is invalid: ' + count);

            var constants = AXIS_TYPES[axisType];
            var axisData = this._axisData[axisType];
            var jAxisType = constants.oppositeAxisType;
            var jAxisData = this._axisData[jAxisType];

            /* Update the spacing manager. */
            axisData.spacingManager.move(index0, index1, count);

            /* Update the spacing array. */
            var removed = axisData.spacing.splice(index0, count);
            removed.splice(0, 0, index1, 0);
            axisData.spacing.splice.apply(axisData.spacing, removed);

            /* Update the cell handlers. */
            if (axisType == 'x') {
                for ( var idx = 0; idx < jAxisData.size; idx++) {
                    var handler = this._cellHandlers[idx];
                    removed = handler.splice(index0, count);
                    removed.splice(0, 0, index1, 0);
                    handler.splice.apply(handler, removed);
                }
            } else {
                removed = this._cellHandlers.splice(index0, 1);
                removed.splice(0, 0, index1, 0);
                this._cellHandlers.splice.apply(this._cellHandlers, removed);
            }

            var minIndex = Math.min(index0, index1);
            var maxIndex = Math.max(index0, index1, index1 + count - 1);
            this._updateCellHandlerPositions(axisType, minIndex, maxIndex + 1);

            this.dispatch('intervalMoved', {
                axisType :axisType,
                index0 :index0,
                index1 :index1,
                count :count
            });
        },

        getCellSpan : function(rowIndex, columnIndex) {
            return this._getCellHandler(rowIndex, columnIndex).getCellSpan();
        },

        getPlaceholderCell : function(rowIndex, columnIndex) {
            var placeholder = this._getCellHandler(rowIndex, columnIndex).getPlaceholder();
            return placeholder && placeholder.getPosition();
        },

        getCellProperties : function(rowIndex, columnIndex) {
            this._validateIndices(rowIndex, columnIndex);
            return this._getCellHandler(rowIndex, columnIndex).getCellProperties();
        },

        setCellProperties : function(rowIndex, columnIndex, properties) {
            this._validateIndices(rowIndex, columnIndex);
            var cellHandler = this._getCellHandler(rowIndex, columnIndex);
            cellHandler.setCellProperties(properties);
            this.dispatch('propertiesChanged', {
                rowIndex :rowIndex,
                columnIndex :columnIndex
            });
        },

        setCellProperty : function(rowIndex, columnIndex, propertyName, value) {
            assert(propertyName != null, '[SFMatrixCellManager] propertName is required');
            var properties = this.getCellProperties(rowIndex, columnIndex);
            properties[propertyName] = value;
            this.setCellProperties(rowIndex, columnIndex, properties);
        },

        getSpacingOption : function(axisType, index, propertyName) {
            this._validateIndex(axisType, index);
            var axisData = this._axisData[axisType];
            var spaceOptions = axisData.spacing[index];
            return spaceOptions[propertyName];
        },

        setSpacingOption : function(axisType, index, propertyName, value) {
            this._validateIndex(axisType, index);
            var axisData = this._axisData[axisType];
            var updatedProperties = set(new Object(), axisData.spacing[index]);
            updatedProperties[propertyName] = value;
            this.setSpacingOptions(axisType, index, updatedProperties);
        },

        setSpacingOptions : function(axisType, index, spaceOptions) {
            this._validateAxisType(axisType);
            var axisData = this._axisData[axisType];
            var old = axisData.spacing[index];
            axisData.spacing[index] = spaceOptions;
            if (old.hidden != spaceOptions.hidden) {
                axisData.spacingManager.setHidden(index, spaceOptions.hidden);
            }
            this.dispatch('spacingOptionsChanged', {
                axisType :axisType,
                index :index,
                oldOptions :old
            });
        },

        resize : function(rowIndex, columnIndex, dimension) {
            this._validateIndices(rowIndex, columnIndex);
            this._getCellHandler(rowIndex, columnIndex).resize(dimension);
        },

        getSpacingManager : function(axisType) {
            this._validateAxisType(axisType);
            return this._axisData[axisType].spacingManager;
        },

        clearCache : function() {
            var size = this.size();
            for ( var rowIndex = 0; rowIndex < size.height; rowIndex++) {
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    if (this._cellHandlers[rowIndex][columnIndex]) {
                        this._cellHandlers[rowIndex][columnIndex].clearCache();
                    }
                }
            }
        },

        broadcast : function(methodName, args) {
            var size = this.size();
            for ( var row = 0; row < size.height; row++) {
                for ( var column = 0; column < size.width; column++) {
                    var component = this.get(row, column);
                    if (component && component[methodName]) {
                        component[methodName].apply(component, args ? args : []);
                    }
                }
            }
        },

        size : function() {
            return {
                height :this._axisData.y.size,
                width :this._axisData.x.size
            };
        },

        isAdjustable : function(axisType, index) {
            return this.getSpacingOption(axisType, index, 'adjustable');
        },

        isFrozen : function(axisType, index) {
            return this.getSpacingOption(axisType, index, 'frozen');
        },

        isHidden : function(axisType, index) {
            return this.getSpacingOption(axisType, index, 'hidden');
        },

        cleanup : function(cleanupComponents) {
            this._cleanupCellHandlers(this._cellHandlers, cleanupComponents);
            if (this._autoScroller) {
                this._autoScroller.removeEventListener('autoScroll', this);
            }
            if (this._scrollBarMgr) {
                this._scrollBarMgr.cleanup();
            }
            delete this._cellHandlers;
        },

        _updateDisplayComponent : function(rowIndex, columnIndex, displayComponent, cellSpan) {
            cellSpan = {
                rowSpan :Math.max((cellSpan && cellSpan.rowSpan) || 1, 1),
                colSpan :Math.max((cellSpan && cellSpan.colSpan) || 1, 1)
            };
            var handler = this._getCellHandler(rowIndex, columnIndex);
            handler.setDisplayComponent(displayComponent);
            handler.setCellSpan(cellSpan);
            if (cellSpan.rowSpan > 1 || cellSpan.colSpan > 1) {
                for ( var idx = 0; idx < cellSpan.rowSpan; idx++) {
                    for ( var jdx = 0; jdx < cellSpan.colSpan; jdx++) {
                        if (idx != 0 || jdx != 0) {
                            this._getCellHandler(rowIndex + idx, columnIndex + jdx).setPlaceholder(handler);
                        }
                    }
                }
            }
        },

        _createAxisData : function(axisType, spacing, spacingOptions, size) {
            var axisData = {};
            axisData.spacing = createSpacing(spacing, size);
            axisData.spacingManager = createSpacingManager(axisData.spacing, spacingOptions, size);
            axisData.size = size;
            return axisData;
        },

        _updateCellHandlerPositions : function(iAxisType, iMin, iMax, jMin, jMax) {
            var jAxisType = AXIS_TYPES[iAxisType].oppositeAxisType;
            var indices = getRowColumn(iAxisType, {
                min :iMin,
                max :iMax
            }, {
                min :0,
                max :this._axisData[jAxisType].size
            });
            for ( var idx = indices.row.min; idx < indices.row.max; idx++) {
                for ( var jdx = indices.column.min; jdx < indices.column.max; jdx++) {
                    this._cellHandlers[idx][jdx].setPosition(idx, jdx);
                }
            }
            for ( var idx = indices.row.min; idx < indices.row.max; idx++) {
                for ( var jdx = indices.column.min; jdx < indices.column.max; jdx++) {
                    var handler = this._cellHandlers[idx][jdx];
                    var placeholder = handler.getPlaceholder();
                    if (placeholder) {
                        var position = placeholder.getPosition();
                        if (position.rowIndex > idx || position.columnIndex > jdx) {
                            this._cellHandlers[idx][jdx] = placeholder;
                            this._cellHandlers[position.rowIndex][position.columnIndex] = handler;
                            handler.setPosition(position.rowIndex, position.columnIndex);
                            placeholder.setPosition(idx, jdx);
                        }
                    }
                }
            }
        },

        _getCellHandler : function(rowIndex, columnIndex) {
            if (!this._cellHandlers) {
                this._cellHandlers = [];
            }
            if (!this._cellHandlers[rowIndex]) {
                this._cellHandlers[rowIndex] = [];
            }
            var handler = this._cellHandlers[rowIndex][columnIndex];
            if (!handler) {
                handler = new CellHandler(rowIndex, columnIndex);
                handler.addEventListener('requestAdjust', this);
                this._cellHandlers[rowIndex][columnIndex] = handler;
            }
            return handler;
        },

        _cleanupCellHandlers : function(cellHandler, cleanupComponents) {
            if (cellHandler instanceof Array) {
                for ( var idx = 0, len = cellHandler.length; idx < len; idx++) {
                    this._cleanupCellHandlers(cellHandler[idx], cleanupComponents);
                }
            } else {
                if (cleanupComponents) {
                    var component = cellHandler.getDisplayComponent();
                    if (component && component.cleanup) {
                        component.cleanup();
                    }
                }
                cellHandler.setDisplayComponent(null);
                cellHandler.removeEventListener('requestAdjust', this);
            }
        },

        _validateIndex : function(axisType, index, forInsert) {
            this._validateAxisType(axisType);
            var axisData = this._axisData[axisType];
            index = index == null ? axisData.size : index;
            var max = axisData.size - (forInsert ? 0 : 1);
            assert(typeof index == 'number' && index >= 0 && index <= max, 'Invalid index for ' + axisType + ' axis: '
                    + index + ', max = ' + max);
        },

        _validateAxisType : function(axisType) {
            assert(axisType == 'x' || axisType == 'y', 'Invalid axisType: ' + axisType);
        },

        _validateIndices : function(rowIndex, columnIndex) {
            var size = this.size();
            assert(typeof rowIndex == 'number' && typeof columnIndex == 'number' && size.height > rowIndex
                    && size.width > columnIndex, '[SFMatrixCellManager] Invalid [rowIndex, columnIndex] = [' + rowIndex
                    + ', ' + columnIndex + ']');
        }
    });
})();