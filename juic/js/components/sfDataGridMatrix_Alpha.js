//! include /ui/juic/js/components/sfMatrixLayout.js
//! include /ui/juic/js/components/sfDragDropMgr.js
//! include /ui/static/css/components/sfDataGridMatrix.css

/**
 * USE AT YOUR OWN RISK!!
 * 
 * This component is in Alpha status, which means you should not use this
 * component, as its structure is in flux, and will eventually be replaced by
 * the real thing later.
 * 
 * Although this component is planned to be released soon (b1103... not sure),
 * you should not use this component until it has been properly documented and
 * tested.
 */
function SFDataGridMatrix_Alpha() {
    this.register();
    this._init.apply(this, arguments);
}

SFDataGridMatrix_Alpha.prototype = ( function() {
    var HEADER_SPACING = {
        fixedSize :23,
        header :true,
        frozen :true
    };
    var DEFAULT_ROW_SPACING = {
        fixedSize :23
    };
    var DEFAULT_ADJUSTER_SIZE = 3;

    var PROXY_DIV = null;
    function getDragEl() {
        return PROXY_DIV = getOrCreateDiv(PROXY_DIV, '99999');
    }

    var POINTER_DIV = null;
    function getPointerEl() {
        return POINTER_DIV = getOrCreateDiv(POINTER_DIV, '100000');
    }

    /**
     * Get or create an absolutely positioned div.
     * 
     * @param el {HTMLElement} The existing element (if exists)
     * @param zIndex {String} The zIndex to use
     * @return The input el, or a newly created one
     */
    function getOrCreateDiv(el, zIndex) {
        if (!el) {
            el = document.createElement('div');
            if (document.body.firstChild) {
                document.body.insertBefore(el, document.body.firstChild);
            } else {
                document.body.appendChild(el);
            }
            el.onselectstart = function() {
                return false;
            }
            el.unselectable = 'on';
            el.style.display = 'none';
            el.style.position = 'absolute';
            el.style.zIndex = zIndex;
        }
        return el;
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

    function getHeaderIndex(matrixLayout, headerComponent) {
        var cellManager = matrixLayout.getCellManager();
        var size = cellManager.size();
        for ( var idx = 0; idx < size.width; idx++) {
            var component = cellManager.get(0, idx);
            if (component === headerComponent) {
                return idx;
                break;
            }
        }
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

    function CellWrapper() {
        this.register();
        this._init.apply(this, arguments);
    }

    CellWrapper.prototype = ( function() {
        return set(new Component(), {
            _init : function(component, options) {
                this._component = component;
                this._options = options;
                addEventListener(this, 'resize', this._component);
            },

            renderHtml : function(html) {
                html.push('<div id="', this.id, '"');
                var className = this._options && this._options.className;
                var draggable = this._options && this._options.draggable;
                var classNames = [ className ];
                if (draggable) {
                    classNames.push('draggable');
                    html.push(' unselectable="on" onselectstart="return false;" onmousedown="');
                    html.push(this.fireCode('_fireMouseDown'), '"');
                }
                renderClassName(html, classNames.join(' '));
                html.push('><div class="gridCell">');
                if (this._options.sortable) {
                    html.push('<a href="javascript:void(0);" onclick="', this.fireCode('_fireSort'));
                    html.push('return false;">');
                }
                if (this._component && this._component.renderHtml) {
                    this._component.renderHtml(html);
                } else {
                    html.push(this._component ? escapeHTML(this._component.toString()) : '');
                }

                if (this._options.sortable) {
                    var sortClass = this._direction ? 'sort' + this._direction : '';
                    html.push('<span id="', this.id, 'arrow" class="', sortClass, '">&nbsp;</span></a>');
                }
                html.push('</div></div>');
            },

            handleDragEvent : function(event) {
                var dragEl = getDragEl();
                switch (event.type) {
                case 'dragStart': {
                    this._dragging = true;
                    var size = this._cellManager.size();
                    this._originIndex = getHeaderIndex(this._matrixLayout, this);
                    this._originSection = this._matrixLayout.getSectionName('x', this._originIndex);
                    var obj = $(this.id);
                    this._originPosition = {
                        top :this._matrixLayout.getPageOffset('y', 0),
                        left :this._matrixLayout.getPageOffset('x', this._originIndex)
                    };
                    dragEl.className = 'gridHeaderProxy';
                    dragEl.innerHTML = obj.innerHTML;
                    set(dragEl.style, {
                        top :this._originPosition.top + 'px',
                        left :this._originPosition.left + 'px',
                        width :this._dimension.width + 'px',
                        height :this._dimension.height + 'px',
                        display :''
                    });
                    this._lastPoint = event.origin;
                    this._movePointer();
                    break;
                }
                case 'drag':
                    set(dragEl.style, {
                        top :(this._originPosition.top - event.origin.y + event.point.y) + 'px',
                        left :(this._originPosition.left - event.origin.x + event.point.x) + 'px'
                    });
                    if (this._originSection == SFMatrixLayout.MIDDLE_SECTION) {
                        this._autoScroller.autoScrollAxis(event.point, 'x');
                    }
                    this._lastPoint = event.point;
                    this._movePointer();
                    break;
                case 'dragEnd': {
                    var index0 = this._originIndex;
                    var index1 = this._dropPosition;
                    if (this._insertBefore && index1 > index0) {
                        index1--;
                    }
                    var pointerEl = getPointerEl();
                    pointerEl.style.display = 'none';
                    this._cellManager.move('x', index0, index1, 1);
                    var toPoint = new YAHOO.util.Point(this._matrixLayout.getPageOffset('x', index1),
                            this._originPosition.top);
                    var animation = new YAHOO.util.Motion(dragEl, {
                        points : {
                            to :toPoint
                        }
                    }, 0.3, YAHOO.util.Easing.easeOut);
                    this._autoScroller.stopScrolling();
                    animation.onComplete.subscribe( function() {
                        dragEl.style.display = 'none';
                        dragEl.innerHTML = '';
                        dragEl.style.width = '';
                    });
                    animation.animate();
                    this._dragging = false;
                    break;
                }
                }
            },

            handleEvent : function(event) {
                switch (event.type) {
                case 'resize':
                    this.setDimension(event);
                    break;
                case 'autoScroll':
                    this._handleAutoScroll();
                    break;
                }
            },

            adjustDOM : function() {
                var obj = $(this.id);
                if (obj && this._dimension && this._options.autoResize) {
                    if (!this._heightPadding) {
                        this._heightPadding = parseInt(YAHOO.util.Dom.getStyle(obj, 'padding-top'));
                        this._heightPadding += parseInt(YAHOO.util.Dom.getStyle(obj, 'padding-bottom'));
                    }
                    obj.style.height = Math.max(0, this._dimension.height - this._heightPadding) + 'px';
                    var actualHeight = obj.firstChild.offsetHeight + this._heightPadding;
                    var requestAdjust = this._actualHeight && this._actualHeight != actualHeight
                            || actualHeight > this._dimension.height;
                    this._actualHeight = actualHeight;
                    if (requestAdjust) {
                        this.dispatch('adjustHeight');
                    }
                }
            },

            getActualHeight : function() {
                return this._actualHeight;
            },

            setDimension : function(dimension) {
                this._dimension = {
                    width :dimension.width,
                    height :dimension.height
                };
                this.dispatch('resize', this._dimension);
                this.adjustDOM();
            },

            getDirection : function() {
                return this._direction;
            },

            setDirection : function(direction) {
                this._direction = direction;
                var obj = $(this.id + 'arrow');
                if (obj) {
                    obj.className = this._direction ? 'sort' + this._direction : '';
                }
            },

            setMatrixLayout : function(matrixLayout) {
                if (matrixLayout) {
                    this._matrixLayout = matrixLayout;
                    this._cellManager = matrixLayout.getCellManager();
                    if (this._options && this._options.draggable) {
                        this._autoScroller = this._matrixLayout.getAutoScroller();
                        this._autoScroller.addEventListener('autoScroll', this);
                    }
                }
            },

            setRowIndex : function(index) {
                this._rowIndex = index;
            },

            getRowIndex : function() {
                return this._rowIndex;
            },

            getComponent : function() {
                return this._component;
            },

            cleanupComponent : function() {
                if (this._component && this._component.cleanup) {
                    this._component.cleanup();
                }
                delete this._component;
            },

            setOptions : function(options) {
                set(this._options, options);

                var obj = $(this.id);
                if (obj) {
                    obj.className = this._options.className;
                }
            },

            call : function(methodName, args) {
                if (this._component[methodName]) {
                    this._component[methodName].apply(this._component, args ? args : []);
                }
            },

            _fireSort : function() {
                this.setDirection(this._direction == 'up' ? 'down' : 'up');
                this.dispatch('sort', {
                    direction :this._direction
                });
            },

            _movePointer : function() {
                var minOffset = 0;
                var maxOffset = Number.POSITIVE_INFINITY;
                if (this._originSection == SFMatrixLayout.MIDDLE_SECTION) {
                    var scrollEl = this._autoScroller.getScrollEl();
                    minOffset = YAHOO.util.Dom.getX(scrollEl);
                    maxOffset = minOffset + scrollEl.offsetWidth;
                }
                var offsets = this._matrixLayout.getPageOffsets('x');
                var smallestDistance = Number.POSITIVE_INFINITY, lastIndex;
                for ( var idx = 0; idx < offsets.length; idx++) {
                    if (this._originSection == this._matrixLayout.getSectionName('x', idx) && offsets[idx] >= minOffset
                            && offsets[idx] <= maxOffset && !this._cellManager.isHidden('x', idx)) {
                        var distance = Math.abs(offsets[idx] - this._lastPoint.x);
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            this._dropPosition = idx;
                        }
                        var lastIndex = idx;
                    }
                }
                this._pointerOffset = offsets[this._dropPosition];

                /* Check the last offset. */
                var offset = offsets[lastIndex] + this._matrixLayout.getSingleDimension('x', lastIndex);
                if (this._cellManager.isAdjustable('x', this._dropPosition)) {
                    offset += 5;
                }

                if (offset >= minOffset && offset <= maxOffset) {
                    var distance = Math.abs(offset - this._lastPoint.x);
                    if (distance < smallestDistance) {
                        this._insertBefore = false;
                        this._pointerOffset = offset;
                    } else {
                        this._insertBefore = true;
                    }
                }

                var pointerEl = getPointerEl();
                if (pointerEl.style.display == 'none') {
                    pointerEl.className = 'gridDropPointer';
                    pointerEl.innerHTML = '&nbsp;';
                    set(pointerEl.style, {
                        display :'',
                        top :this._originPosition.top + 'px',
                        left :this._pointerOffset + 'px'
                    });
                } else {
                    pointerEl.style.left = this._pointerOffset + 'px';
                }
            },

            _handleAutoScroll : function() {
                if (this._dragging) {
                    this._movePointer();
                }
            },

            _fireMouseDown : function(event) {
                SFDragDropMgr.handleMouseDown(event, this, {
                    useShim :true,
                    shimCursor :'move'
                });
            }
        });
    })();

    return set(new Component(), {
        _init : function(columnDefinitions, options) {
            this._draggableColumns = options && options.draggableColumns;
            this._dimension = options && options.dimension;
            this._autoResize = options && options.autoResize;

            var rows = options && options.rows;
            var rowSpacing = options && options.rowSpacing;
            var columnOptions = (options && options.columnOptions) || {
                adjustmentType :'simple'
            };

            var matrixRowSpacing = [ HEADER_SPACING ];
            var matrixCells = [ [] ];
            for ( var columnIndex = 0; columnIndex < columnDefinitions.length; columnIndex++) {
                matrixCells[0].push(this._createHeaderComponent(columnDefinitions[columnIndex]));
            }

            if (rows) {
                for ( var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    var row = rows[rowIndex] || [];
                    var spacingOption = this._createRowSpacing(rowIndex, rowSpacing && rowSpacing[rowIndex]);
                    var matrixRow = [];
                    for ( var columnIndex = 0; columnIndex < columnDefinitions.length; columnIndex++) {
                        matrixRow[columnIndex] = this._createContentComponent(row[columnIndex], rowIndex);
                    }
                    matrixRowSpacing.push(spacingOption);
                    matrixCells.push(matrixRow);
                }
            }

            this._matrixLayout = new SFMatrixLayout(matrixCells, {
                rowSpacing :matrixRowSpacing,
                columnSpacing :columnDefinitions,
                columnOptions :columnOptions,
                scrollableCells :false,
                dragByResizing :options && options.dragByResizing,
                minimizeSpace :options && options.minimizeSpace,
                dimension :this._dimension,
                scrollBarMgr :options && options.scrollBarMgr,
                adjusterSize :(options && options.adjusterSize) || DEFAULT_ADJUSTER_SIZE,
                className :'gridMatrix'
            });
            this._cellManager = this._matrixLayout.getCellManager();
            var size = this._cellManager.size();
            for ( var rowIndex = 0; rowIndex < size.height; rowIndex++) {
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    this._cellManager.get(rowIndex, columnIndex).setMatrixLayout(this._matrixLayout);
                }
            }
        },

        renderHtml : function(html) {
            this._matrixLayout.renderHtml(html);
        },

        handleEvent : function(event) {
            switch (event.type) {
            case 'adjustHeight':
                this._handleAdjustHeight(event.target);
                break;
            case 'sort':
                var sortedIndex = getHeaderIndex(this._matrixLayout, event.target);
                if (this._sortedHeader != event.target) {
                    if (this._sortedHeader) {
                        this._sortedHeader.setDirection(null);
                        var oldIndex = getHeaderIndex(this._matrixLayout, this._sortedHeader);
                        this._cellManager.setSpacingOption('x', oldIndex, 'className', '');
                    }
                    this._cellManager.setSpacingOption('x', sortedIndex, 'className', 'sort');
                }
                this._sortedHeader = event.target;
                this.dispatch('sort', {
                    column :sortedIndex,
                    direction :event.target.getDirection()
                });
                break;
            }
        },

        appendRow : function(row, spacing) {
            this.insertRow(null, row, spacing);
        },

        appendRows : function(rows, spacing) {
            this.insertRows(null, rows, spacing);
        },

        insertRow : function(index, row, spacing) {
            this.insertRows(index, [ row ], spacing && [ spacing ])
        },

        insertRows : function(index, rows, spacing) {
            var size = this._cellManager.size();
            var matrixRows = [];
            var rowSpacing = [];
            var insertLen = rows.length;
            index = index == null ? size.height - 1 : index;
            for ( var idx = 0; idx < insertLen; idx++) {
                var matrixRow = matrixRows[idx] = [];
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    matrixRow[columnIndex] = this._createContentComponent(rows[idx][columnIndex], index + idx);
                }
                rowSpacing[idx] = this._createRowSpacing(index + idx, spacing && spacing[idx]);
            }
            this._cellManager.insertMultipleInto('y', index + 1, matrixRows, rowSpacing);
            for ( var idx = 0; idx < insertLen; idx++) {
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    matrixRows[idx][columnIndex].adjustDOM();
                }
            }
            this._updateRowIndices(index + insertLen + 1);
        },

        resetRows : function(cleanup) {
            this.removeRows(0, this._cellManager.size().height - 1, cleanup);
        },

        removeRow : function(rowIndex, cleanup) {
            this.removeRows(rowIndex, 1, cleanup);
        },

        removeRows : function(rowIndex, count, cleanup) {
            if (cleanup) {
                var size = this._cellManager.size();
                for ( var idx = 0; idx < count; idx++) {
                    for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                        this._cellManager.get(rowIndex + idx + 1, columnIndex).cleanupComponent();
                    }
                }
            }
            this._cellManager.remove('y', rowIndex + 1, count, true);
            this._updateRowIndices(rowIndex + 1);
        },

        moveRow : function(index0, index1, count) {
            index0++;
            index1++;
            var width = this._cellManager.size().width;
            this._cellManager.move('y', index0, index1, count);
            var minIndex = Math.min(index0, index1);
            var maxIndex = Math.max(index0, index1, index1 + count - 1);
            this._updateRowIndices(minIndex, maxIndex + 1);
        },

        appendColumn : function(column, columnDefinition) {
            this.insertColumn(null, column, columnDefinition);
        },

        insertColumn : function(index, column, columnDefinition) {
            var matrixColumn = [];
            var size = this._cellManager.size();
            index = index == null ? size.width : index;
            matrixColumn.push(this._createHeaderComponent(columnDefinition));
            var height = this._cellManager.size().height - 1;
            for ( var idx = 0; idx < height; idx++) {
                matrixColumn.push(this._createContentComponent(column[idx], idx));
            }
            this._cellManager.insertInto('x', index, matrixColumn, columnDefinition);
        },

        removeColumn : function(columnIndex, cleanup) {
            this.removeColumns(columnIndex, 1, cleanup);
        },

        removeColumns : function(columnIndex, count, cleanup) {
            if (cleanup) {
                var size = this._cellManager.getSize();
                for ( var idx = 0; idx < count; idx++) {
                    for ( var rowIndex = 0; rowIndex < size.height; rowIndex++) {
                        this._cellManager.get(rowIndex, columnIndex + idx).cleanupComponent();
                    }
                }
            }
            this._cellManager.remove('x', index, count, true);
        },

        moveColumn : function(index0, index1, count) {
            this._cellManager.move('x', index0, index1, count);
        },

        setRowClassName : function(index, className) {
            this._cellManager.setSpacingOption('y', index + 1, 'className', this._getRowClassName(index, className));
        },

        setColumnClassName : function(index, className) {
            this._cellManager.setSpacingOption('y', index, 'className', className);
        },

        setRowSize : function(index, size) {
            this._matrixLayout.setSingleDimension('y', index + 1, size);
        },

        getRowSize : function(index) {
            return this._matrixLayout.getSingleDimension('y', index + 1);
        },

        setColumnSize : function(index, size) {
            this._matrixLayout.setSingleDimension('x', index, size);
        },

        getColumnSize : function(index) {
            return this._matrixLayout.getSingleDimension('x', index);
        },

        setDimension : function(dimension) {
            this._dimension = dimension;
            this._matrixLayout.setDimension(dimension);
        },

        adjustDOM : function() {
            if (!this._dimension) {
                this._matrixLayout.adjustDOM();
            }
            if (this._autoResize) {
                this._matrixLayout.broadcast('adjustDOM');
            }
        },

        broadcast : function() {
            this._matrixLayout.broadcast('call', arguments);
        },

        scrollTo : function(rowIndex, columnIndex) {
            this._matrixLayout.scrollTo(rowIndex + 1, columnIndex);
        },

        scrollToAxis : function(axisType, index) {
            this._matrixLayout.scrollToAxis(axisType, index);
        },

        scrollToRow : function(index) {
            this._matrixLayout.scrollToAxis('y', index + 1);
        },

        scrollToColumn : function(index) {
            this._matrixLayout.scrollToAxis('x', index);
        },

        cleanup : function() {
            this._matrixLayout.broadcast('cleanupComponent');
            this._matrixLayout.cleanup(true);
            this.unregister();
        },

        sortedBy : function(column, direction) {
            var oldColumn = null;
            if (this._sortedHeader) {
                oldColumn = getHeaderIndex(this._matrixLayout, this._sortedHeader);
            }
            if (oldColumn != null && oldColumn != column) {
                this._sortedHeader.setDirection(null);
            }
            this._sortedHeader = this._cellManager.get(0, column);
            this._sortedHeader.setDirection(direction);
            this._cellManager.setSpacingOption('x', column, 'className', 'sort');
        },

        getComponent : function(rowIndex, columnIndex) {
            return this._cellManager.get(rowIndex + 1, columnIndex).getComponent();
        },

        getColumnOffsets : function() {
            return this._matrixLayout.getPageOffsets('x');
        },

        getColumnOffset : function(columnIndex) {
            return this._matrixLayout.getPageOffset('x', columnIndex);
        },

        getRowOffsets : function() {
            var offsets = this._matrixLayout.getPageOffsets('y');
            offsets.splice(0, 1);
            return offsets;
        },

        getRowOffset : function(rowIndex) {
            return this._matrixLayout.getPageOffset('y', rowIndex + 1);
        },

        getDimension : function() {
            return this._matrixLayout.getDimension();
        },

        getAutoScroller : function() {
            return this._matrixLayout.getAutoScroller();
        },
        
        getRowCount : function() {
            return this._matrixLayout.getCellManager().size().height - 1;
        },
        
        getRowAt : function(rowIndex) {
            var row = [];
            var cellManager = this._matrixLayout.getCellManager();
            var width = cellManager.size().width;
            for (var colIndex = 0; colIndex < width; colIndex++) {
                row.push(cellManager.get(rowIndex + 1, colIndex).getComponent());
            }
            return row;
        },

        _handleAdjustHeight : function(wrapper) {
            if (!this._adjustRows) {
                this._adjustRows = [];
            }
            var rowIndex = wrapper.getRowIndex();
            if (!this._adjustRows.contains(rowIndex)) {
                this._adjustRows.push(rowIndex);
            }
            if (!this._handleAdjustId) {
                this._handleAdjustId = setTimeout(Util.createCallback(this, '_batchHandleAdjustHeight'), 0);
            }
        },

        _batchHandleAdjustHeight : function() {
            if (this._adjustRows) {
                var size = this._cellManager.size();
                for ( var idx = 0; idx < this._adjustRows.length; idx++) {
                    var rowIndex = this._adjustRows[idx];
                    var maxSize = 0;
                    for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                        var actualHeight = this._cellManager.get(rowIndex, columnIndex).getActualHeight();
                        maxSize = Math.max(maxSize, actualHeight);
                    }
                    var currentSize = this._matrixLayout.getSingleDimension('y', rowIndex);
                    if (maxSize != currentSize) {
                        this._matrixLayout.setSingleDimension('y', rowIndex, maxSize);
                        this._cellManager.getSpacingManager('y').setBounds(rowIndex, {
                            minSize :maxSize
                        });
                    }
                }
            }
            this._adjustRows = [];
            this._handleAdjustId = null;
        },

        _updateRowIndices : function(index0, index1) {
            var size = this._cellManager.size();
            index1 = index1 || size.height;
            for ( var rowIndex = index0; rowIndex < index1; rowIndex++) {
                this._cellManager.setSpacingOption('y', rowIndex, 'className', rowIndex % 2 == 0 ? 'b' : 'a');
                for ( var columnIndex = 0; columnIndex < size.width; columnIndex++) {
                    this._cellManager.get(rowIndex, columnIndex).setRowIndex(rowIndex);
                }
            }
        },

        _createRowSpacing : function(rowIndex, spacing) {
            var spacingOption = set(new Object(), spacing || DEFAULT_ROW_SPACING);
            spacingOption.className = this._getRowClassName(rowIndex, spacing && spacing.className);
            return spacingOption;
        },

        _getRowClassName : function(rowIndex, className) {
            return (rowIndex % 2 ? 'b' : 'a') + (className ? ' ' + className : '');
        },

        _createHeaderComponent : function(columnDefinition) {
            var wrapper = new CellWrapper(columnDefinition.label, {
                className :'gridHeader',
                sortable :columnDefinition.sortable,
                draggable :this._draggableColumns,
                autoResize :this._autoResize
            });
            wrapper.addEventListener('adjustHeight', this);
            wrapper.addEventListener('sort', this);
            wrapper.setMatrixLayout(this._matrixLayout);
            wrapper.setRowIndex(0);
            return wrapper;
        },

        _createContentComponent : function(component, rowIndex) {
            var wrapper = new CellWrapper(component, {
                className :'gridRow',
                autoResize :this._autoResize
            });
            wrapper.addEventListener('adjustHeight', this);
            wrapper.setMatrixLayout(this._matrixLayout);
            wrapper.setRowIndex(rowIndex + 1);
            return wrapper;
        }
    });
})();
