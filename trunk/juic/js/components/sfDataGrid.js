//! include /ui/juic/js/components/JUICUtil.js
//! include /ui/uicore/css/components/sfDataGrid.css


/**
 * Object is a data groud layout that will display a table with header fixed and cells
 *
 * This is a layout component. The one and only objective of this component is to draw a table wrapper around JUIC objects.
 * The creation of components of the table is the responsability of the user.
 *
 * The data sent to this object should be in a non normalized format. An array of array of data, with each element of
 * the first array representing each row and each element of the second array data of the column.
 * {[ [row1col1, row1col2] , [row2col1, row2col2] ]}
 *
 * In addition if the grid needs to group data, another element of the
 * array should be the groups index. To determine which is the index the user must indicate which column is the index of
 * data grouping.
 * {[[row1col1, group0, row1col2] , [row2col1, group1, row2col2]]}
 *
 * @param headerDefinitions: containing definition for header:
 *      label (String): Label of the header
 *      sortable (boolean): if true the table can be sorted by the column
 * @param columnDefinitions: attributes of the columns
 *      width: width of the column
 * @param options: Optional characteristic that can be added to the table
 *             heightAutoResize: When set to false the table will not adjust itself to the container height.
 */
function SFDataGridLayout(headerDefinitions, columnDefinitions, options) {
    this.register();
    this._headers = headerDefinitions;
    if (columnDefinitions)
        this._columnDefinitions = columnDefinitions;
    this._rows = [];
    this._groups = [];
    this._rowClass = {};
    this._evenRowStyle = "a";
    this._oddRowStyle = "b";    
    // Records index of the first row of the table that contains the data
    this._firstBodyRowIndex = null;
    this._heightAutoResize = true;
    if (options) {
        this.setOptions(options);
    }
    
    this._SCROLL_BAR_WIDTH = 17;
}

function numericCompareAscending(a, b) {
    return (a - b);
}

SFDataGridLayout.prototype = (function() {
    return set(new Component(), {
        // Inserts a row at an indicated position
        insertRowAt: function(row, index, group) {

        },
        setOptions: function(options) {
            if (options) {
                if (typeof options.heightAutoResize == "boolean") this._heightAutoResize = options.heightAutoResize;
                if (options.rowStyles) {
                    this._evenRowStyle = options.rowStyles.even;
                    this._oddRowStyle = options.rowStyles.odd;
                }
                if (options.canHoverRow) {
                    this.canHoverRow = true;
                    this.hoverCss = "hovered";
                    this._lastHoveredRow = null;
                }
                if (options.canSelectRow) {
                    this.canSelectRow = true;
                    this.selectedCss = "selected";
                    this._lastSeletedRow = null;
                }
            }
        },
        // removes a row from the data grid
        removeRow: function(row, group) {
            this._rows.splice(row, 1);

            if ($(this.id)) {
                var html = [];
                this._renderTable(html);
                $(this.id).innerHTML = html.join("");
                this.adjustDOM();
            }

        },

        removeRows: function(rows /* array of row indices */) {
            rows.sort(numericCompareAscending);

            for (var idx = rows.length - 1; idx >= 0; idx--)
                this.removeRow(rows[idx]);
        },
        // returns the row object for an index
        getRowAt: function(rowIndex, group) {
            return this._rows[rowIndex];
        },
        // returns number of columns
        getColumnCount: function() {
            return this._headers.length;
        },
        // returns number of rows
        getRowCount: function() {
            return this._rows.length;
        },
        resetRows: function() {
            this._rows.length = 0;
            this._rowClass = {};

            if ($(this.id)) {
                var html = [];
                this._renderTable(html);
                $(this.id).innerHTML = html.join("");
                this.adjustDOM();
            }
        },
        // adds a row to the rows array of datagrid. If the DOM is ready, it will refresh it immediatly.
        appendRow: function(row, group) {
            var colObj;
            if (group !== undefined) this._groups[group].rows.push(row);
            else this._rows.push(row);
            if ($(this.id)) {
                var newRow = document.createElement('tr');
                newRow.setAttribute("id", (group ? "gr" + group : "") + "row" + (this._rows.length - 1));
                newRow.className = ((this._rows.length - 1) % 2 !== 0 ? this._evenRowStyle : this._oddRowStyle);

                if (this.canSelectRow) {
                  var me = this;
                  var rowIdx = this._rows.length - 1;
                  newRow.onclick = function() {
                    me._handleTrClick( {rowIndex:rowIdx} );
                    return false;
                  }
                }

                if (this.canHoverRow) {
                  var me = this;
                  var rowIdx = this._rows.length - 1;

                  newRow.onmouseover = function() {
                    me._handleTrHover( {rowIndex:rowIdx} );
                    return false;
                  }

                  newRow.onmouseout = function() {
                    me._handleTrOut( {rowIndex:rowIdx} );
                    return false;
                  }  
                }
                
                var td = "";
                for (var idx = 0,len = row.length; idx < len; idx++) {
                    td = document.createElement("td");
                    if (row[idx] instanceof Array) {
                        colObj = row[idx][0];
                        td.setAttribute("colspan", row[idx][1]);
                    } else {
                        colObj = row[idx];
                        if (this._firstBodyRowIndex === null) this._firstBodyRowIndex = idx;
                    }
                    // Set width attributes if cached.
                    if (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width) {
                        td.setAttribute("style", "width:" + this._columnDefinitions[idx].width);
                        td.setAttribute("fixedWidth", true);
                    }
                    if(this._sortedCol === idx){
                    	td.className= (td.className||'') + " sort";
                    }

                    var html = [];
                    if (colObj.renderHtml) colObj.renderHtml(html);
                    td.innerHTML = html.join('');
                    newRow.appendChild(td);
                }
                $("tableBody_" + this.id).childNodes[1].appendChild(newRow);
                this.adjustDOM();
            }
        },

        appendRows : function(data /* array of array */) {
          assert(typeof data == 'object', 'SFDataGrid: data argument should be an array of arrays');
            
          if ($(this.id + 'bodyInnerDiv')) {
            var html = [];

            html.push('<table id="tableBody_', this.id, '" class="dataGrid" style="margin-bottom:0px;">');
            this._displayColGroups(html, "body");
              html.push('<tbody id="tbody_', this.id, '">');
                      
              this.renderRows(data, html);

              html.push('</tbody>',
                      '</table>');

            $(this.id + 'bodyInnerDiv').innerHTML = html.join('');
            this.adjustDOM();
          }
        },
        
        // adds a group to the object
        addGroup: function(groupName, groupObj) {
            var group = {};
            group.name = groupName;
            group.obj = groupObj;
            group.displayStyle = "";
            group.rows = [];
            this._groups.push(group);
        },
        // returns a group
        getGroup: function(index) {
            return this._groups[index];
        },
        // This is the header label of the grid
        setGridLabel: function(label) {
            this._gridLabel = label;

            if (typeof this._gridLabel === 'string') {
                if ($(this.id + 'gLbl'))
                    $(this.id + 'gLbl').innerHTML = this._gridLabel;
            }
            else {
                if ($(this.id + 'gLbl'))
                    this._gridLabel.render(this.id + 'gLbl');
            }
        },
        // renders the rows of the grid
        renderRows: function(rows, h, groupIndex) {
            var trId;
            var rowInfo = {};
            var colObj;
            var colSpan = null;
            var hasColSpan = false;
            for (var idx = 0,len = rows.length; idx < len; idx++) {
                trId = (groupIndex ? "gr" + groupIndex : "") + "row" + idx;
                rowInfo.rowIndex = idx;
                if (groupIndex) rowInfo.groupIndex = groupIndex;
                if (this._rowClass[trId]) {
                    if (this._rowClass[trId].indexOf(this._evenRowStyle) < 0 && this._rowClass[trId].indexOf(this._oddRowStyle) < 0) {
                        this._rowClass[trId] = ' ' + (idx % 2 !== 0 ? this._evenRowStyle : this._oddRowStyle);
                    }
                } else {
                    this._rowClass[trId] = (idx % 2 !== 0 ? this._evenRowStyle : this._oddRowStyle);
                }
                h.push("<tr id=\"" + trId + "\" class=\"", this._rowClass[trId], "\"");
                if (this.canSelectRow) {
                    h.push('onclick="' + this.fireCode("_handleTrClick", rowInfo) + '"');
                }
                if (this.canHoverRow) {
                    h.push('onmouseover="' + this.fireCode("_handleTrHover", rowInfo) + '" onmouseout="' + this.fireCode("_handleTrOut", rowInfo) + '"');
                }
                h.push(">");
                for (var index = 0,lent = rows[idx].length; index < lent; index++) {
                    if (rows[idx][index] instanceof Array) {
                        colObj = rows[idx][index][0];
                        colSpan = rows[idx][index][1];
                        hasColSpan = true;
                    } else {
                        colObj = rows[idx][index];
                        colSpan = null;
                    }

                    if (this._columnDefinitions) {
                        h.push("<td id=\"column_", this.id, idx, index, (groupIndex >= 0 ? groupIndex : ""), "\" ",
                                (this._sortedCol === index ? "class=\"sort\"" : ""),
                                (colSpan ? " colspan=\""+ colSpan + "\"" : "") ,
                                (!colSpan && this._columnDefinitions[index] && this._columnDefinitions[index].width ? " fixedWidth=\"true\"" : ""), ">");
                    } else {
                        h.push("<td id=\"column_", this.id, idx, index, (groupIndex >= 0 ? groupIndex : ""), "\" ", (this._sortedCol === index ? "class=\"sort\"" : ""), ">");
                    }
                    // If the column does not exist, then we show an empty cell.
                    if (colObj && colObj.renderHtml) colObj.renderHtml(h);
                    h.push("</td>")
                }
                if (this._firstBodyRowIndex === null && !hasColSpan) this._firstBodyRowIndex = idx;
                h.push("</tr>")
            }
        },
        // opens or closes a group
        toggleGroup: function (evt) {
            this._groups[evt.groupIndex].displayStyle = (this._groups[evt.groupIndex].displayStyle === "" ? "none" : "")
            $("group" + this.id + evt.groupIndex).style.display = this._groups[evt.groupIndex].displayStyle;
            $("anchor" + this.id + evt.groupIndex).className = "section_arrow_" + (this._groups[evt.groupIndex].displayStyle === "none" ? "close" : "open");
            $("anchor" + this.id + evt.groupIndex).title = ($("anchor" + this.id + evt.groupIndex).title === "Collapse" ? "Expand" : "Collapse");
            $("tableBody_" + this.id).style.width = this._getOffsetWidth($("tableHeader_" + this.id));
        },
        //Event handler
        _handleTrClick: function(rowInfo) {
            if (this.selectedCss && this.canSelectRow) {
                if (this._lastSeletedRow && (this._lastSeletedRow.rowIndex === rowInfo.rowIndex)) {
                    return;
                }
                if (this._lastSeletedRow) {
                    this.removeRowClass(this.selectedCss, this._lastSeletedRow.rowIndex, this._lastSeletedRow.rowIndex.groupIndex);
                }
                this.setRowClass(this.selectedCss, rowInfo.rowIndex, rowInfo.groupIndex);
                this._lastSeletedRow = rowInfo;
            }
            this.dispatch('action', {
                actionCommand : "rowSelected",
                actionData : rowInfo
            });
        },
        _handleTrHover: function (rowInfo) {
            if (this.hoverCss && this.canHoverRow) {
                if (this._lastSeletedRow && (this._lastSeletedRow.rowIndex === rowInfo.rowIndex)) return;
                this.setRowClass(this.hoverCss, rowInfo.rowIndex, rowInfo.groupIndex);
                this._lastHoveredRow = rowInfo;
            }
        },
        _handleTrOut: function (rowInfo) {
            if (this.hoverCss && this.canHoverRow) {
                this.removeRowClass(this.hoverCss, rowInfo.rowIndex, rowInfo.groupIndex);
                if (this._lastHoveredRow) this.removeRowClass(this.hoverCss, this._lastHoveredRow.rowIndex, this._lastHoveredRow.groupIndex);
            }
        },
        renderHtml: function(h) {
            h.push("<div id=\"" + this.id + "\" class=\"dgTblContainer" + (this._heightAutoResize ? " dgHeightAutoresize" : "") + "\" style=\"overflow:hidden;\">");
            this._renderTable(h);
            h.push("</div>");
        },
        sortedBy: function(column, direction) {
            this._sortedCol = column;
            this._direction = direction;
        },
        _sort: function(evt) {
            if ((typeof this._sortedCol !== "undefined") && (this._sortedCol !== evt.col)) {
                $("header_" + this.id + this._sortedCol).className = "";
                var headerLink = $("header_" + this.id + this._sortedCol).getElementsByTagName("span");
                if (headerLink[0] != null) {
                    headerLink[0].className = "";
                }
            }
            if (this._sortedCol === evt.col) {
                this._direction = (this._direction === "up" ? "down" : "up");
            } else if (typeof this._sortedCol === "undefined") {
                this._direction = "up";
            }
            this._sortedCol = evt.col;
            $("header_" + this.id + this._sortedCol).className = "sort";
            headerLink = $("header_" + this.id + this._sortedCol).getElementsByTagName("span");
            headerLink[0].className = "sort" + this._direction;
            this.dispatch("sort", {column:this._sortedCol,direction:this._direction});
        },
        _scroll: function() {
            $(this.id + '_headerContainer').scrollLeft = $(this.id + '_tableBodyContainer').scrollLeft;
        },
        /*
         Check for all the input checkBoxes with id starting with identificator "RowCB_".
         */
        _setCheckedAll: function() {
            var checked = $("checkAll_" + this.id).checked;
            var allCheckBoxes = document.getElementsByTagName("input");
            for (var idx = 0,len = allCheckBoxes.length; idx < len; idx++) {
                var input = allCheckBoxes[idx];
                if (input.type == 'checkbox' && (input.id.indexOf("RowCB_" + this.id) != -1)) {
                    input.checked = checked;
                }
            }
        },
        setRowClass: function (cssClass, rowIndex, groupIndex) {
            var rowId = (groupIndex ? "gr" + groupIndex : "") + "row" + rowIndex;
            if (this._rowClass[rowId]) this._rowClass[rowId] += " " + cssClass;
            else this._rowClass[rowId] = cssClass;
            if ($(rowId)) $(rowId).className = this._rowClass[rowId];
        },
        removeRowClass: function (cssClass, rowIndex, groupIndex) {
            var rowId = (groupIndex ? "gr" + groupIndex : "") + "row" + rowIndex;
            if (this._rowClass[rowId]) this._rowClass[rowId] = this._rowClass[rowId].replace(cssClass, "");
            if ($(rowId)) $(rowId).className = this._rowClass[rowId];
        },
        displayGridLabel: function(h) {
            if (typeof this._gridLabel === 'string') {
                h.push("<tr><th id=\"" + this.id + "gLbl\" class=\"table_header\" colspan=\"", this._headers.length + "\">" + escapeHTML(this._gridLabel) + "</th></tr>");
            } else {
                h.push("<tr><th id=\"" + this.id + "gLbl\" class=\"table_header\" colspan=\"", this._headers.length + "\">");
                this._gridLabel.renderHtml(h);
                h.push("</th></tr>");
            }
        },
        // renders the datagrid
        _renderTable: function(h) {
            if (this._gridLabel) {
                h.push("<div id='", this.id, "_labelContainer' ><table id=\"", this.id, "gridLabel\" class=\"dataGrid\" style=\"width:100%;margin-bottom:0px;\"><thead>")
                this.displayGridLabel(h);
                h.push("</thead></table></div>");
            }
            h.push('<div id="', this.id, '_headerContainer" class="dgHeaderContainer">',
                    '<div id="', this.id, 'headerInnerDiv">' +
                    "<table id=\"tableHeader_", this.id, "\" class=\"dataGrid\" style=\"margin-bottom:0px;\">");
            this._displayColGroups(h, "header");
            h.push("<thead id=\"thead_", this.id, "\"><tr id=\"header_", this.id, "\">");
            for (var idx = 0,len = this._headers.length; idx < len; idx++) {
                h.push("<th id=\"header_" + this.id + idx + "\"");
                if (this._sortedCol === idx) {
                    h.push("class=\"sort\"");
                }
                h.push(" ", (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width ? "fixedWidth=\"true\" " : "") + ">");
                if (this._headers[idx].sortable) {
                    h.push("<a href=\"javascript:void(0);\" onclick=\"", this.fireCode("_sort", {col:idx}), "return false;\"");
                    h.push(">");
                }
                if (typeof this._headers[idx].label === "string") h.push(escapeHTML(this._headers[idx].label));
                else this._headers[idx].label.renderHtml(h);
                if (this._headers[idx].sortable) h.push("<span ");
                if (this._headers[idx].sortable && this._sortedCol === idx) {
                    h.push(" class=\"sort", this._direction, "\"");
                }
                if (this._headers[idx].sortable) {
                    h.push(">&nbsp;</span></a>");
                }
                h.push("</th>");
            }
            h.push("</tr></thead>");
            h.push("</table></div></div>", "<div onscroll='", this.fireCode("_scroll"), "' id='", this.id,
                    "_tableBodyContainer' class='dgTableBodyContainer'><div id=\"fixScroll_",this.id,"\" style=\"overflow:hidden\"><div id='", this.id, "bodyInnerDiv'><table id=\"tableBody_",
                    this.id, "\" class=\"dataGrid\" style=\"margin-bottom:0px;\">");
            this._displayColGroups(h, "body");
            h.push("<tbody id=\"tbody_", this.id, "\">");
            if (this._groups.length > 0) {
                for (var index = 0,lent = this._groups.length; index < lent; index++) {
                    h.push("<tr class=\"group_headerAlt\"><th colspan=\"", this.getColumnCount(), "\" class=\"table_headerAlt\">",
                            "<a id=\"anchor", this.id, index, "\" href=\"javascript:void(0);\" class=\"section_arrow_open\" onclick=\"",
                            this.fireCode("toggleGroup", {groupIndex:index}), "return false;\" ",
                            "title=\"Collapse\">");
                    var groupName = this._groups[index].name;
                    var groupObj = this._groups[index].obj;
                    if (groupName) {
                        if (typeof groupName === "string") {
                            h.push(groupName);
                        } else {
                            groupName.renderHtml(h);
                        }
                    }
                    h.push('</a>');
                    if (groupObj) {
                        if (typeof groupObj === "string") {
                            h.push(groupObj);
                        } else {
                            groupObj.renderHtml(h);
                        }
                    }
                    h.push("</th></tr><tbody id=\"group", this.id, index, "\" style=\"display:\"",
                            this._groups[index].displayStyle, "\"\">");
                    this.renderRows(this._groups[index].rows, h, index);
                    h.push("</tbody>");
                }
            } else this.renderRows(this._rows, h);
            h.push("</tbody></table></div></div></div>");
        },
        _displayColGroups: function(h, prefix) {
            h.push("<colgroup id=\"colgroup_", prefix, this.id, "\">");
            for (var idx = 0,len = this.getColumnCount(); idx < len; idx++) {
                var colWidth = "";
                var fixedWidth = false;
                if (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width) {
                    colWidth = this._columnDefinitions[idx].width;
                    fixedWidth = true;
                }
                h.push("<col style=\"width:", colWidth, "\" fixedWidth=", fixedWidth, " id=\"col_", prefix, this.id, idx, "\">");
            }
            h.push("</colgroup>");
        },
        _resetCols: function(prefix, obj) {
            if (obj) {
                for (var idx = 0,len = obj.length; idx < len; idx++) {
                    if (obj[idx].getAttribute("fixedWidth") == "false") {
                        obj[idx].style.width = "";
                    } else {
                        obj[idx].style.width = (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width ? this._columnDefinitions[idx].width : "");
                    }
                }

            } else {
                for (var idx = 0,len = this.getColumnCount(); idx < len; idx++) {
                    if ($("col_" + prefix + this.id + idx).getAttribute("fixedWidth") == "false") {
                        $("col_" + prefix + this.id + idx).style.width = "";
                    } else {
                        $("col_" + prefix + this.id + idx).style.width = (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width ? this._columnDefinitions[idx].width : "");
                    }
                }
            }
        },
        setHeight: function(height) {
            if ($(this.id)) {
                $(this.id).style.height = height + "px";
            }
        },
        _getFirstRows: function() {
            var firstrow;
            if (!this._groups[0]) {
                    var tbodies = $("tbody_" + this.id);
                    firstrow = tbodies.getElementsByTagName('tr')[this._firstBodyRowIndex].cells;
                } else {
                    var tbodies = $("tableBody_" + this.id).getElementsByTagName('tbody');
                    for (var idx = 0,len = tbodies.length; idx < len; idx++) {
                        var tbody = tbodies[idx];
                        if (tbody.id && (tbody.id.indexOf("group") !== -1) && (tbody.getElementsByTagName('tr'))) {
                            firstrow = tbody.getElementsByTagName('tr')[0].cells;
                            break;
                        }
                    }

                }
            return firstrow;
        },
        _getHeaderColls: function() {
            return $("thead_" + this.id).getElementsByTagName('tr')[0].cells;
        },
        /**
         * Should be called once the grid's DOM is ready. This will readjust the headers with the grid cells.
         * First step is to fix the width of the header and once the header fixed apply the same width to the body.
         * The reason this process is done in two steps is that I noticed that IE6 redraws the whole table every time
         * that a cell's width is changed. This will not make the width calculations very accurate.
         * BodyInnerDiv is for creating a scrolling area for the body.
         * Then the height needs also to be readjusted to assure that the horizontal scrollbar is shown in the view port.
         */
        adjustDOM: function() {
            var innerPadding = 0;
            $(this.id + 'headerInnerDiv').style.width = "";
            $(this.id + 'bodyInnerDiv').style.width = "";
            var fixScroll = $("fixScroll_"+this.id);
            // Creating local DOM Object variables for the scope.
            var dataGridContainer = $(this.id);
            var bodyContainer = $(this.id + "_tableBodyContainer");
            fixScroll.style.width="";
            var tableHeader = $("tableHeader_" + this.id);
            var tableBody = $("tableBody_" + this.id);
            tableHeader.style.width = "";
            dataGridContainer.style.width = "";
            dataGridContainer.style.height = "";

            bodyContainer.style.height = "";
            bodyContainer.style.width = "";

            if (this._rows[0] || this._groups[0]) {
                var firstrow = this._getFirstRows();
            }                                    
            var headerCells = this._getHeaderColls();

            this._resetCols("body",(Util.ieVersion() === "8.0" || Util.isChrome() ? firstrow : ""));

            this._resetCols("header",(Util.ieVersion() === "8.0" || Util.isChrome() ? headerCells : ""));


            var dataGridParentNode = dataGridContainer.parentNode;

            var parentNodeWidth = dataGridContainer.parentNode.style.width;
            var parentNodeHeight = dataGridContainer.parentNode.style.height;

            var tableContainerWidth = Math.floor((parentNodeWidth && parentNodeWidth.indexOf("%") === -1 ? parseInt(parentNodeWidth) : this._getNoPadWidth(dataGridParentNode)));

            // extending the datagrid container to the maximum width of its parent.
            bodyContainer.style.width = dataGridContainer.style.width = tableContainerWidth + "px";


            var labelContainer = $(this.id + "_labelContainer");

            if (labelContainer) {
                var labelContainerWidth = this._getOffsetWidth(labelContainer);
                var labelContainerHeight = this._getOffsetHeight(labelContainer);
            }

            var headerContainer = $(this.id + "_headerContainer");


            var tableBodyWidth = this._getOffsetWidth(tableBody);
            var tableHeaderWidth = this._getOffsetWidth(tableHeader);

            if (this._rows[0] || this._groups[0]) {
                var colpaddings = [];
                if (Util.ieVersion() === "8.0" || Util.isChrome()) {
                    var bodyCols = firstrow;
                    var headerCols = headerCells;
                } else {
                    var bodyCols = $("colgroup_body" + this.id).getElementsByTagName("col");
                    var headerCols = $("colgroup_header" + this.id).getElementsByTagName("col");
                }
                var bodyWidth = null;
                var headerWidth = null;
                var pLeft = 0;
                var pBottom = 0;
                var pRight = 0;
                var pTop = 0;
                var totalWidth = 0;
                var fixedWidthRows = 0;
                var rowWidth = [];

                // List of the First row of the table



                $(this.id + 'headerInnerDiv').style.width = "4000px";
                var maxBodyWidth = Math.max(tableContainerWidth, tableBodyWidth);
                var maxHeaderWidth = Math.max(tableContainerWidth, tableHeaderWidth);
                // Fixing the width of the cells
                for (var idx = 0,len = bodyCols.length; idx < len; idx++) {
                    var el = firstrow[idx];

                    if (el.getAttribute("fixedWidth")) fixedWidthRows++;
                    // assuming that padding for header and body are identical
                    if (el.currentStyle) {
                        pLeft = el.currentStyle["paddingLeft"];
                        pRight = el.currentStyle["paddingRight"];
                        pTop = el.currentStyle["paddingTop"];
                        pBottom = el.currentStyle["paddingBottom"];
                    } else if (window.getComputedStyle) {
                        pLeft = document.defaultView.getComputedStyle(el, null).getPropertyValue("padding-left");
                        pRight = document.defaultView.getComputedStyle(el, null).getPropertyValue("padding-right");
                        pTop = document.defaultView.getComputedStyle(el, null).getPropertyValue("padding-top");
                        pBottom = document.defaultView.getComputedStyle(el, null).getPropertyValue("padding-bottom");
                    }

                    colpaddings.push({top:pTop,right:pRight,bottom:pBottom,left:pLeft});
                    this._setPaddings(bodyCols[idx], colpaddings[idx]);
                    this._setPaddings(headerCols[idx], colpaddings[idx]);

                    bodyWidth = bodyCols[idx].style.width;
                    bodyWidth = (bodyCols[idx].getAttribute("fixedWidth") == "true" ? (bodyWidth.indexOf("%") === -1 ?
                            this._getWidth(bodyCols[idx]) :
                            this._getPercentWidth(maxBodyWidth,bodyCols[idx])) :
                            this._getWidth(bodyCols[idx]));

                    headerWidth = headerCols[idx].style.width;
                    headerWidth = (headerCols[idx].getAttribute("fixedWidth") == "true" ? (headerWidth.indexOf("%") === -1 ?
                            this._getWidth(headerCols[idx]) :
                            this._getPercentWidth(maxHeaderWidth,headerCols[idx])) :
                            this._getWidth(headerCols[idx]));

                    rowWidth.push((Math.max(Math.floor(bodyWidth), Math.floor(headerWidth))));
                    totalWidth += rowWidth[idx];
                }

                for (var idx = 0,len = headerCols.length; idx < len; idx++) {
                    headerCols[idx].style.width = rowWidth[idx] + "px";
                }

//                var verticalScrollPadding = (this._isWithVScrollBar(bodyContainer, tableBody) ? this._SCROLL_BAR_WIDTH  : 0);
                var verticalScrollPadding = (bodyContainer.clientHeight < tableBody.offsetHeight) ? this._SCROLL_BAR_WIDTH  : 0;
                tableHeaderWidth = this._getWidth(tableHeader);
                var cellsAutoWidth = this._headers.length - fixedWidthRows;
                var lastColWidth;
                var origDifWidth = tableContainerWidth - tableHeaderWidth;
            	origDifWidth = (origDifWidth < 0) ? 0 : origDifWidth;
            	difWidth = origDifWidth - verticalScrollPadding;

                var isHeadersResizeNeeded = ((tableContainerWidth - verticalScrollPadding) > tableHeaderWidth) && (cellsAutoWidth > 0);
                if (((tableContainerWidth - verticalScrollPadding) > tableHeaderWidth) && (cellsAutoWidth > 0)) {
                    var totalWidth = 0;
                    
                    var pxlPerCell = parseInt(difWidth / cellsAutoWidth);
                    var remainingPX = difWidth % cellsAutoWidth;
                    // This is the value to reduce from each cell of the body if there is a vertical scrollbar
                    var width = [];

                    for (var idx = 0, len = this._headers.length; idx < len; idx++) {
                        if (!firstrow[idx].getAttribute("fixedWidth")) {
                            width.push(rowWidth[idx] + pxlPerCell + (idx === (len - 1) ? remainingPX : 0));
                        } else {
                            width.push(this._getWidth(headerCols[idx]));
                        }
                        headerCols[idx].style.width = width[idx] + (idx === (len - 1) ? verticalScrollPadding : 0) + "px";
                        if(idx === (len - 1)) {
                        	lastColWidth = width[idx] + "px";
                        }
                        totalWidth += width[idx];
                    }


                } else {
                    if (this._isWithVScrollBar(bodyContainer, tableBody)) {
                        headerCols[(this._headers.length - 1)].style.width = this._getWidth(headerCols[(this._headers.length - 1)])  + verticalScrollPadding + "px";
                    }
               }
                $(this.id + "bodyInnerDiv").style.width = this._getWidth(tableHeader) + "px";

                if (isHeadersResizeNeeded) {
                	for (var idx = 0,len = bodyCols.length; idx < len; idx++) {
                		if(lastColWidth) {
                			bodyCols[idx].style.width = (idx == (len - 1)) ? lastColWidth : headerCols[idx].style.width;
                		} else {
                			bodyCols[idx].style.width = headerCols[idx].style.width;	
                		}
                	}
                } else {
                	for (var idx = 0,len = bodyCols.length; idx < len; idx++) {
                		bodyCols[idx].style.width = headerCols[idx].style.width;	
                	}
                }
                fixScroll.style.width =  this._getWidth(tableHeader) + "px";

                $(this.id + "bodyInnerDiv").style.width = this._getWidth(tableHeader) + "px";

                bodyContainer.style.width = dataGridContainer.style.width = tableContainerWidth + "px";

                var tableContainerHeight = Math.floor((parentNodeHeight && parentNodeHeight.indexOf("%") === -1 ? parseInt(parentNodeHeight) : this._getNoPadHeight(dataGridParentNode)));
                tableContainerWidth = Math.floor((parentNodeWidth && parentNodeWidth.indexOf("%") === -1 ? parseInt(parentNodeWidth) : this._getNoPadWidth(dataGridParentNode)));

                headerContainerHeight = this._getOffsetHeight(headerContainer);

                var availableHeight = tableContainerHeight - headerContainerHeight - (labelContainer ? labelContainerHeight : 0);
                // Fixing the height of the body
                var tableBodyHeight = this._getOffsetHeight(tableBody);

                var horizScrollPadding = (this._isWithHScrollBar(bodyContainer, tableBody) ? this._SCROLL_BAR_WIDTH  : 0);

                dataGridContainer.style.height = tableContainerHeight + (availableHeight - this._SCROLL_BAR_WIDTH  < 0 ? horizScrollPadding : 0) + "px";
 
                if (this._heightAutoResize && (availableHeight <= tableBodyHeight)) {
                    bodyContainer.style.height = availableHeight + "px"; // + (Util.browserInfo.ie ? 0 : horizScrollPadding) + "px";
                } else if (this._heightAutoResize && (availableHeight > tableBodyHeight) && (bodyContainer.scrollWidth > bodyContainer.offsetWidth)) {
                	if ((availableHeight - tableBodyHeight) >= horizScrollPadding) {
                		bodyContainer.style.height = tableBodyHeight + horizScrollPadding + "px";
                	} else if ((availableHeight - tableBodyHeight) < horizScrollPadding) {
                		bodyContainer.style.height = availableHeight + "px";	
                	}                    
                } else if ((availableHeight > tableBodyHeight) && Util.browserInfo.ie) {
                    bodyContainer.style.height = tableBodyHeight + "px";
                } else if (!this._heightAutoResize) {
                    bodyContainer.style.height = "auto";
                    dataGridContainer.style.height = "auto";
                }
                /******* Adjusting cols after scroll bars appear **********/
                
                var oldVerticalScrollPadding = verticalScrollPadding;
                var oldIsVerScrollPresent = this._isVerScrollPresent;
                var oldIsHorScrollPresent = this._isHorScrollPresent;
//                verticalScrollPadding = (this._isWithVScrollBar(bodyContainer, tableBody) ? this._SCROLL_BAR_WIDTH  : 0);
                verticalScrollPadding = (bodyContainer.clientHeight < tableBody.offsetHeight) ? this._SCROLL_BAR_WIDTH  : 0;
	            if(verticalScrollPadding > 0) {
	            	this._isVerScrollPresent = true;
	            }
	            //vertical scroll bar messes up col widths ... so resize header/body cols
	            isHeadersResizeNeeded = isHeadersResizeNeeded || (verticalScrollPadding > 0);
	            
                tableHeaderWidth = this._getWidth(tableHeader);
                cellsAutoWidth = this._headers.length - fixedWidthRows;
                if(oldVerticalScrollPadding !== verticalScrollPadding) {
	                if (isHeadersResizeNeeded) {
	                	origDifWidth = (origDifWidth < 0) ? 0 : origDifWidth;
	                	difWidth = origDifWidth - verticalScrollPadding;
	                    var pxlPerCell = parseInt(difWidth / cellsAutoWidth);
	                    var remainingPX = difWidth % cellsAutoWidth;
	                    // This is the value to reduce from each cell of the body if there is a vertical scrollbar
	                    var width = [];
	                    for (var idx = 0, len = this._headers.length; idx < len; idx++) {
	                        if (!firstrow[idx].getAttribute("fixedWidth")) {
	                            width.push(rowWidth[idx] + pxlPerCell + (idx === (len - 1) ? remainingPX : 0));
	
	                        } else {
	                            width.push(this._getWidth(headerCols[idx]));
	                        }
	                        headerCols[idx].style.width = width[idx] + (idx === (len - 1) ? verticalScrollPadding : 0) + "px";
	                        if(idx === (len - 1)) {
	                        	lastColWidth = width[idx] + "px";
	                        }
	                    }
	                    fixScroll.style.width =  this._getWidth(tableHeader) - verticalScrollPadding + "px";
	
	                    $(this.id + "bodyInnerDiv").style.width = this._getWidth(tableHeader) - verticalScrollPadding + "px";
	                    
	                } else {
	                    if (this._isWithVScrollBar(bodyContainer, tableBody)) {
	                        headerCols[(this._headers.length - 1)].style.width = this._getWidth(headerCols[(this._headers.length - 1)])  + verticalScrollPadding + "px";
	                    }
	                } 
	                if (isHeadersResizeNeeded) {
	                	for (var idx = 0,len = bodyCols.length; idx < len; idx++) {
	                		if(lastColWidth) {
	                			bodyCols[idx].style.width = (idx == (len - 1)) ? lastColWidth : headerCols[idx].style.width;
	                		} else {
	                			bodyCols[idx].style.width = headerCols[idx].style.width;	
	                		}
	                	}
	                } else {
	                	for (var idx = 0,len = bodyCols.length; idx < len; idx++) {
	                		bodyCols[idx].style.width = headerCols[idx].style.width;	
	                	}
	                }
	                bodyContainer.style.width = dataGridContainer.style.width = tableContainerWidth + "px";
	                tableContainerHeight = Math.floor((parentNodeHeight && parentNodeHeight.indexOf("%") === -1 ? parseInt(parentNodeHeight) : this._getNoPadHeight(dataGridParentNode)));
	                tableContainerWidth = Math.floor((parentNodeWidth && parentNodeWidth.indexOf("%") === -1 ? parseInt(parentNodeWidth) : this._getNoPadWidth(dataGridParentNode)));
	                headerContainerHeight = this._getOffsetHeight(headerContainer);
	
	                availableHeight = tableContainerHeight - headerContainerHeight - (labelContainer ? labelContainerHeight : 0);
	                // Fixing the height of the body
	                tableBodyHeight = this._getOffsetHeight(tableBody);
		            horizScrollPadding = (this._isWithHScrollBar(bodyContainer, tableBody) ? this._SCROLL_BAR_WIDTH  : 0);
	                dataGridContainer.style.height = tableContainerHeight + (availableHeight - this._SCROLL_BAR_WIDTH  < 0 ? horizScrollPadding : 0) + "px";
	                if (this._heightAutoResize && (availableHeight <= tableBodyHeight)) {
	                    bodyContainer.style.height = availableHeight + "px"; //(Util.browserInfo.ie ? 0 : horizScrollPadding) + "px";
	                } else if (this._heightAutoResize && (availableHeight > tableBodyHeight) && (bodyContainer.scrollWidth > bodyContainer.offsetWidth)) {
	                	if ((availableHeight - tableBodyHeight) >= horizScrollPadding) {
	                		bodyContainer.style.height = tableBodyHeight + horizScrollPadding + "px";
	                	} else if ((availableHeight - tableBodyHeight) < horizScrollPadding) {
	                		bodyContainer.style.height = availableHeight + "px";	
	                	}                    
	                } else if ((availableHeight > tableBodyHeight) && Util.browserInfo.ie) {
	                    bodyContainer.style.height = tableBodyHeight + "px";
	                } else if (!this._heightAutoResize) {
	                    bodyContainer.style.height = "auto";
	                    dataGridContainer.style.height = "auto";
	                }
            	}
                /*****************/
                bodyContainer.style.width = dataGridContainer.style.width = tableContainerWidth + "px";

            } else {
                // No rows, we need to make sure toffsethat the header will extend to its maximum size.
                tableHeader.style.width = "100%";
                //$(this.id + 'bodyInnerDiv').style.width = tableContainerWidth + "px";
            }
        },
        _totalRowWidth: function(DOMObj) {
            var total = 0;
            for (var idx = 0, len = DOMObj.length; idx < len; idx++) {
                total += this._getOffsetWidth(DOMObj[idx]);
            }
            return total;
        },
        _setPaddings: function(obj, paddings) {
            obj.style.paddingTop = paddings.top;
            obj.style.paddingRight = paddings.right;
            obj.style.paddingBottom = paddings.bottom;
            obj.style.paddingLeft = paddings.left;
        },
        /**
         * Should be called once the grid's DOM is ready. This will readjust the headers with the grid cells.
         * First step is to fix the width and height of the container of the table.
         * Then calculate the max of the header column and first row of the table and apply on both header column and
         * columns of first row.
         * Then we need to give headerInnerDiv container an arbitrary (very long) width, this is for simulating the
         * horizontal scrolling.
         * Last we need to make sure that header and table containers have the same width and height.
         */

        _isWithVScrollBar: function(container, content) {
            return this._getOffsetHeight(content) > this._getOffsetHeight(container);
        },
        _isWithHScrollBar: function(container, content) {
            return this._getOffsetWidth(content) > this._getOffsetWidth(container);
        },
        _getHeight : function (DOMObj) {
            return DOMObj.offsetHeight;
        },
        // To get the "usable" space we need to deduct the padding on right and left.
        _getNoPadWidth : function (DOMObj) {
            var paddingLeft = 0;
            var paddingRight = 0;
            if (DOMObj.currentStyle) {
                paddingLeft = DOMObj.currentStyle["paddingLeft"];
                paddingRight = DOMObj.currentStyle["paddingRight"];
            } else if (window.getComputedStyle) {
                paddingLeft = document.defaultView.getComputedStyle(DOMObj, null).getPropertyValue("padding-left");
                paddingRight = document.defaultView.getComputedStyle(DOMObj, null).getPropertyValue("padding-right");
            }
            return DOMObj.offsetWidth - parseInt(paddingLeft) - parseInt(paddingRight);
        },
        _getOffsetWidth: function (DOMObj) {
            return DOMObj.offsetWidth;
        },
        _getWidth : function (DOMObj) {
            return (Util.browserInfo.ie ? this._getNoPadWidth(DOMObj) : this._getOffsetWidth(DOMObj));
        },
        _getPercentWidth: function(maxWidth, item) {
            var width = (maxWidth * (parseInt(item.style.width)) / 100);
            if (Util.browserInfo.ie) {
                paddingLeft = item.currentStyle["paddingLeft"];
                paddingRight = item.currentStyle["paddingRight"];
                width = width -  parseInt(paddingLeft) - parseInt(paddingRight);
            }
            return width;
        },
        _getNoPadHeight: function(DOMObj) {
            var paddingTop = 0;
            var paddingBottom = 0;
            if (DOMObj.currentStyle) {
                paddingTop = DOMObj.currentStyle["paddingTop"];
                paddingBottom = DOMObj.currentStyle["paddingBottom"];
            } else if (window.getComputedStyle) {
                paddingTop = document.defaultView.getComputedStyle(DOMObj, null).getPropertyValue("padding-top");
                paddingBottom = document.defaultView.getComputedStyle(DOMObj, null).getPropertyValue("padding-bottom");
            }
            return DOMObj.offsetHeight - parseInt(paddingTop) - parseInt(paddingBottom);
        },
        _getOffsetHeight: function(DOMObj) {
          return DOMObj.offsetHeight;

        },
        // removes all the objects from the memory.
        cleanup: function() {
            if (this._groups.length > 0) {
                for (var index = 0,lent = this._groups.length; index < lent; index++) {
                    var rows = this._groups[index].rows;
                    for (var ind = 0,len = rows.length; ind < len; ind++) {
                        var columns = rows[ind];
                        for (var idx = 0,lengt = columns.length; idx < lengt; idx++) {
                            if (columns[idx]) columns[idx].cleanup();
                        }
                    }
                }
            } else {
                for (var ind = 0,len = this._rows.length; ind < len; ind++) {
                    var columns = this._rows[ind];
                    for (var idx = 0,lengt = columns.length; idx < lengt; idx++) {
                        if (columns[idx]) columns[idx].cleanup();
                    }
                }
            }
        },
        scrollToRow: function(rowIndex) {
            assert((typeof rowIndex == 'number') && (rowIndex >= 0), "Row index needs to be a non-negative number");
            assert(rowIndex < this.getRowCount(), "Row index is out of bounds");
            var dgContainer = $(this.id + '_tableBodyContainer'), dgTbody = $('tbody_' + this.id),
                    tblRows = dgTbody.childNodes;

            var curRow = tblRows[rowIndex];
            dgContainer.scrollTop = curRow.offsetTop;
        }
    });
})();


/* Grid with No Sorting possibility, and no header fixed */
function SFSimpleDataGridLayout(nbCol) {
    this.register();
    this._init();
    if (nbCol) this._nbCol = nbCol;
}
SFSimpleDataGridLayout.prototype = (function() {
    return set(new Component(), {
        _init: function() {
            this._rows = [];
            this._headers = [];
            this._nbCol = 0;
        },
        setNbCol: function(nbCol) {
            this._nbCol = nbCol;
        },
        setHeader: function(headers) {
            this._headers.push(headers);
        },
        setHeaders: function(headers) {
            this._headers = headers;
        },
        _addNewColumn: function(elem) {
            var col = new Array();
            col.push(elem);
            this._rows.push(col);
        },
        setColumnDefinitions: function(colDefs) {
            this._columnDefinitions = colDefs;
        },
        addColumnElement: function(elem) {
            assert(this._nbCol, "Please indicate the number of column of this table by calling setNbCol before adding elements to the table");
            if (this._rows.length === 0) {
                this._addNewColumn(elem);
            } else {
                var lastCol = this._rows[this._rows.length - 1];
                if (lastCol.length === this._nbCol) {
                    this._addNewColumn(elem);
                } else {
                    this._rows[this._rows.length - 1].push(elem);
                }
            }
        },

        removeRows: function(rows /* array of row indices */) {
          rows.sort(numericCompareAscending);

          for (var idx = rows.length - 1; idx >= 0; idx--)
            this.removeRow(rows[idx]);
        },

        removeRow: function(row) {
          this._rows.splice(row, 1);

          if ($(this.id + 'tbod')) {
            var targetRow = $(this.id + 'tbod').childNodes[row];
            targetRow.parentNode.removeChild(targetRow);  
          }
        },
        resetRows: function() {
            if ($(this.id + 'tbod')) {
                for (var idx = this._rows.length - 1; idx >= 0; idx--){
                    var targetRow = $(this.id + 'tbod').childNodes[idx];
                    targetRow.parentNode.removeChild(targetRow);
                }
            }
            this._rows.length = 0;
        },
        setAlternateRows: function(rows) {
           this._alternateRows = rows;
        },
        appendRow: function(col) {
            assert(this._nbCol, "Please indicate the number of column of this table by calling setNbCol before adding elements to the table");
            assert(col instanceof Array, "argument must be an Array.");
            assert(col.length === this._nbCol, "Number of elements of the column array must be equal to number of set columns.");
            this._rows.push(col);

          if ($(this.id + 'tbod')) {
            var newRow = document.createElement('tr');
            var cls = (this._alternateRows ? ((this._rows.length - 1) % 2 !== 0 ? this._alternateRows[0] : this._alternateRows[1]) : "");
            newRow.setAttribute('class', cls);

            var tdObj;
            for (var idx = 0; idx < col.length; idx++) {
              tdObj = document.createElement('td');

              // Set width attributes if cached.
              if (this._columnDefinitions && this._columnDefinitions[idx] && this._columnDefinitions[idx].width) {
                tdObj.setAttribute("style", "width:" + this._columnDefinitions[idx].width);
                tdObj.setAttribute("fixedWidth", true);
              }

              var html = [];
              if (col[idx].renderHtml) col[idx].renderHtml(html);
              tdObj.innerHTML = html.join('');
                
              newRow.appendChild(tdObj);  
            }

            $(this.id + 'tbod').appendChild(newRow);
          }
        },
        renderHtml: function(h) {
            h.push("<table class=\"grid\"><thead><tr>");
            for (var idx = 0,len = this._headers.length; idx < len; idx++) {
                h.push("<th>");
                if (this._headers[idx]) {
                    if (typeof this._headers[idx].label === "string") h.push(this._headers[idx].label);
                    else this._headers[idx].renderHtml(h);
                }
                else h.push(" ");
                h.push("</th>");
            }
            h.push("</tr></thead><tbody id=\"", this.id, "tbod\">")
            for (var idx = 0,len = this._rows.length; idx < len; idx++) {
                h.push("<tr class=\""+ (this._alternateRows ? (idx % 2 !== 0 ? this._alternateRows[0] : this._alternateRows[1]) : "") +"\">");
                this._renderRow(this._rows[idx], h);
                h.push("</tr>");
            }
            h.push("</tbody></table>");
        },

        _renderRow : function(row, h) {
          for (var indx = 0,lent = row.length; indx < lent; indx++) {
            h.push("<td ",(this._columnDefinitions && this._columnDefinitions[indx] && this._columnDefinitions[indx].width ? "style=\"width:"+this._columnDefinitions[indx].width+"\"" : "") ,">");
            if (row[indx]) {
              if (row[indx] instanceof String)
                h.push(row[indx]);
              else
                row[indx].renderHtml(h);
            }
            else h.push(" ");
            h.push("</td>");
          }
        }
    });
})();
