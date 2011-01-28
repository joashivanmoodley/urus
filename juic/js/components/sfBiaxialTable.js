/**
 *  SFTable is a self contained client-side JavaScript reusable object. This object is a compound object composed of
 *  several row objects and for each row objects several cell (column) objects.
 *  The object’s purpose is to display and edit 2 dimensional tables on a page. The object will have different facilities
 *  to allow the user to customize the table, but also provides a default state to facilitate the programming
 *
 *  Every table object uses a table model (sfTableModel) object to manage the actual table data.
 *
 *  sfTableLayout is a JUIC component rendering a table of data in a webpage, optionally allowing the user to edit, sort
 *  or delete the data. A table object is compound object of one or several tableRow Objects. Each of the tableRow objects
 *  represents one of the rows of the table.
 *
 *  Example of creation of a table:
 *
 *  tableMetaData: {
        tableDefinitions: {
            tableClass: "main"
        },
        columns: [
            {
                width: "245px",
                cssClass: "",
                objectType: "employeeInfo"
            },
            {
                width: "670px",
                cssClass: "",
                objectType: "number"
            }
        ],
        headerDefinitions: [
            {
                width: "479px",
                objectType: "string",
                label: jsSFMessages.COMMON_Name + " and " + jsSFMessages.COMMON_Description,
                sortable: "goalName"  // sorting column Key
            },
            {
                width: "122px",
                objectType: "string",
                label: jsSFMessages.COMMON_Status,
                sortable: "goalStatusId" // sorting column Key
            }
        ]
    }
   Data:
    {
        {
            id:   "empId1",
            name: "Edward Employee",
            profileLink: "/src/empProfile1.html",
            title: "Sales Manager",
            imageSrc:"empId",
            imageLink:"/src/empProfile1.html",
            quickCardId:"quickcard_1",
            numberOfBadges: 2
         },
         {
            id:   "empId2",
            name: "Carla Grant",
            profileLink: "/src/empProfile2.html",
            title: "Sales Manager",
            imageSrc:"empId",
            imageLink:"/src/empProfile2.html",
            quickCardId:"quickcard_2",
            numberOfBadges: 4
        }
    }

 * colType defines the type of the object nested in a cell of the table. This can be a simple structure such as image (sfImage)
 * string (sfString) or a complex JUIC structure. Note that even the simple objects must have a JUIC structure to be used
 * in the table.
 */

var CELL_TYPE_IMAGE = 'image';
var CELL_TYPE_TABLE = 'table';
var CELL_TYPE_EMPLOYEE_INFO = 'employeeInfo';
var CELL_TYPE_BULLET_POINT = 'bulletPoint';
var CELL_TYPE_PARAGRAPH = 'paragraph';
var CELL_TYPE_TRASH = 'trash';
var CELL_TYPE_STRING = 'string';
var CELL_TYPE_GOAL_STATUS = 'goalStatus';
var CELL_TYPE_EMP_LAST_MODIFIED_INFO = 'empLastModifiedInfo';
var CELL_TYPE_EMP_LAST_MODIFIED_INFO_WITH_BREAK = 'empLastModifiedInfoWithBreak';


/**
 * Creation of the table dataModel.
 *
 * @param metaData: metaData of the structure of the table.
 * @param data: data to be rendered in the table.
 */
function sfBiaxialTableModel(metaData, data) {
    this._tableMetaData = metaData;
    this.data = data;
    for (var n in this._tableMetaData) {
        switch(n) { // populate private data of the model.
            case "tableDefinitions":
              this.tableClass = this._tableMetaData[n].tableClass;
              this.headerFixed = this._tableMetaData[n].headerFixed;
              this.leftFixed = this._tableMetaData[n].leftFixed;
              this.dynamicHeader = this._tableMetaData[n].dynamicHeader;
              this.alternateRow = this._tableMetaData[n].alternateRow;
              break;
            case "headerDefinitions":
              this.headerDefinitions = this._tableMetaData[n];
              break;
            case "rowsClass":
              this.rowsClass = this._tableMetaData[n];
              break;
            case "columns":
              this.columnInfo = this._tableMetaData[n];
              break;
            case "rowsDefinition":
              this.rowsDefinition = this._tableMetaData[n];
              break;
            case "firstColumnDefinition":
              this.firstColumnDefinition = this._tableMetaData[n];
              break;
            default:
              //this.rows.push(this._tableModel[n]);
              break;
        }
    }
}

sfBiaxialTableModel.prototype = (function() {
    return set(new Component(), {
        // returns number of columns of the table
        getColCount: function() {
            return (this.dynamicHeader ? this.data.length : this.columnInfo.length);
        },
        unregister: function() {
            Component.prototype.unregister.apply(this, arguments);
        },
        // returns number of rows of the table
        getRowCount: function() {
            return (this.dynamicHeader ? this.rowsDefinition[0].dataObject.length : this.data.length);
        },
        // Returns the cell value at row and column
        getValueAt: function(row,col) {
            return this.data[col][row];
        },
        // returns width of a column
        getColWidth: function(col,withoutUnit) {
           if (withoutUnit) return (!this.dynamicHeader ? this.columnInfo[col].width.substring(0,this.columnInfo[col].width.length-2) : this.rowsDefinition[0].width.substring(0,this.rowsDefinition[0].width.length-2));
           else return  this.columnInfo[col].width;
        },
        // returns class of a table
        getTableClass: function() {
            return this.tableClass;
        },
        // returns column deifnition (header information)
        getHeaderDefinitions: function() {
            return this.headerDefinitions;
        },
        getTableWidth: function() {
           var width = 0
           for (var i=0,len=this.getColCount();i<len;i++) width += Math.floor(this.getColWidth(i,true)) + 5;
           return width;
        }
    });
})();

/**
 *  The sfTableLayout is used to display and edit regular two-dimensional tables of cells.
 *
 * @param tableMetaData: MetaData of the table
 */
function sfBiaxialTableLayout(tableMetaData, config) {
    //alert("dd   "+arguments.callee)
    this._metaData = tableMetaData
    this.register();
    this.setValue(tableMetaData.data);
    this._columnInfo = tableMetaData.columnInfo;
    this._headerDefinitions = tableMetaData.headerDefinitions;
    this._rowsDefinition = tableMetaData.rowsDefinition;
    this._firstColumnDefinition = tableMetaData.firstColumnDefinition;
    this._tableClass = (tableMetaData.tableClass ? tableMetaData.tableClass : "");
    this._rows = [];
    this._headerFixed = (tableMetaData.headerFixed ? tableMetaData.headerFixed : false);
    this._leftFixed = (tableMetaData.leftFixed ? tableMetaData.leftFixed : false);
    this._alternateRow = (tableMetaData.alternateRow ? tableMetaData.alternateRow : false);
    this._dynamicHeader = (tableMetaData.dynamicHeader ? tableMetaData.dynamicHeader : false);
    this._config = config;
    this._direction = (this._config && this._config.sortDirection ? this._config.sortDirection : "");
    this.columnSorted = (this._config && this._config.columnSorted ? this._config.columnSorted : "");
    this._rowCnt = this._metaData.getRowCount();
    this._colCnt = this._metaData.getColCount();
    this._tableWidth = this._metaData.getTableWidth()
    this.init();
}

sfBiaxialTableLayout.prototype = (function() {
    return set(new Component(), {
        typeName: "sfTableLayout",
        setValue: function (value) {
            this._value = value;
        },
        // Create list of children and add Event Listeners to the children
        init: function() {
            if (!this._dynamicHeader) {
                for (var k=0,len=this._value.length; k < len; k++ ) {
                       var row = new sfBiaxialTableRow(this._value[k], {colInfo:this._columnInfo, rowClass:this._rowsClass, alternateRow:this._alternateRow[k%2]});
                       this._rows.push(row);
                       row.addEventListener('deleteRow',
                            {
                                _rowObj : row,
                                _obj: this,
                                _rowData: this._value[k],
                                handleEvent : function() {
                                    this._obj._rows.remove(this._rowObj);
                                    this._obj._value.remove(this._rowData);
                                    this._rowObj.dispatchDataChange({objId:this._rowObj.id,action:"deleteRow"});
                                    this._rowObj.unregister();
                                }
                              });
                        row.addEventListener('dataChange',
                            {
                                _obj : this,
                                handleEvent : function() {
                                    this._obj.dispatchDataChange(arguments[0]);
                                }
                              });
                    row.addEventListener('click',
                            {
                                _obj : this,
                                handleEvent : function() {
                                    this._obj.handleClick(arguments[0]);
                                }
                              });
                }
            } else {
                for (var k=0,len=this._rowsDefinition[0].dataObject.length; k < len; k++ ) {
                      var row = new sfBiaxialTableRow(this._value, {colInfo:this._rowsDefinition, rowClass:this._rowsClass, colCount:this._colCnt, dynamicHeader:true, rowDataDefinition:this._rowsDefinition[0].dataObject[k], alternateRow:this._alternateRow[k%2]});
                      this._rows.push(row);
                      row.addEventListener('dataChange',
                          {
                            _obj : this,
                            handleEvent : function() {
                            this._obj.dispatchDataChange(arguments[0]);
                          }
                     });
                     row.addEventListener('click',
                        {
                            _obj : this,
                            handleEvent : function() {
                            this._obj.handleClick(arguments[0]);
                        }
                    });
                }
            }
           /* if (this._leftFixed) {
               for (var k=0,len=this._firstColumnDefinition.length; k < len; k++ ) {
                       var row = new sfBiaxialTableRow(this._firstColumnDefinition[k], {colInfo:this._columnInfo, rowClass:this._rowsClass, alternateRow:this._alternateRow[k%2]});
                       this._rows.push(row);
                       /*row.addEventListener('deleteRow',
                            {
                                _objRow : row,
                                _obj: this,
                                _tableData: this._value,
                                _rowData: value,
                                handleEvent : function() {
                                    this._obj._rows.remove(this._objRow);
                                    this._tableData.remove(this._rowData);
                                    this._objRow.dispatchDataChange({objId:this._objRow.id,action:"deleteRow"});
                                    this._objRow.unregister();
                                }
                              });*/
               /*         row.addEventListener('dataChange',
                            {
                                _obj : this,
                                handleEvent : function() {
                                    this._obj.dispatchDataChange(arguments[0]);
                                }
                              });
                   row.addEventListener('click',
                    {
                        _obj : _newRow,
                        handleEvent : function() {
                            this._obj.handleClick(arguments[0]);
                        }
                      });
                }
            }*/
        },
        // function called to sort the table on a row.
        sortTable: function() {
           this._direction = (this._direction ==  "desc" ? "asc" :  "desc");
           this.columnSorted = arguments[0].sortKey;
           this._rows = sortJData(this._rows, arguments[0].sortKey, this._direction);
           var html = [];
           this.renderTable(html);
           $(this.id).innerHTML = html.join('');
           this.dispatch("sort", this);
        },
        // add a row to the top of the table.
        addRow: function(value) {
          var _newRow = new sfBiaxialTableRow(value, {colInfo:this._columnInfo, rowClass:this._rowsClass});
          _newRow.addEventListener('deleteRow',
                    {
                        _obj : this,
                        handleEvent : function() {
                            this._obj._rows.remove(this._obj);
                            this._obj.dispatchDataChange({objId:this._obj.id,action:"deleteRow"});
                            this._obj.unregister();
                        }
                      });
          _newRow.addEventListener('dataChange',
                    {
                        _obj : _newRow,
                        handleEvent : function() {
                            this._obj.dispatchDataChange(arguments[0]);
                        }
                      });
            _newRow.addEventListener('click',
                    {
                        _obj : _newRow,
                        handleEvent : function() {
                            this._obj.handleClick(arguments[0]);
                        }
                      });
          this._rows.unshift(_newRow);
          var html = [];
          this.renderTable(html);
          $(this.id).innerHTML = html.join('');
        },
        unregister : function() {
          for (var index = 0; index < this._rows.length; index++) {
            this._rows[index].unregister();
          }
          Component.prototype.unregister.apply(this, arguments);
        },
        dispatchDataChange: function() {
          this.dispatch("dataChange",arguments[0]);
        },
        handleClick: function() {
          this.dispatch("click",arguments[0]);
        },
        getValue: function() {
          return this._value;
        },
        // create the header of the table. Header can be simple or a nested table.
        setHeader: function(colDef,h) {
            var len = (this._dynamicHeader ? this._colCnt : colDef.length);
            for (var m=0; m < len; m++) {
              var _cell = (this._dynamicHeader ? colDef[0] : colDef[m]);
              switch(_cell.cellObject) {
                case "string":
                       h.push('<th '+ (_cell.sortable || _cell.cssClass ? 'class="' + (_cell.sortable ? " sortable"  : "") +
                                (_cell.cssClass ? " "+ _cell.cssClass  : "") +'"' : "") +' width="'+ _cell.width +'">');
                       if (_cell.sortable) h.push('<div style="float:left"><a href="javascript:void(0);" ' +
                          'onclick=\"' + this.fireCode("sortTable", {sortKey:_cell.sortable})+ ';return false;\">');
                       h.push(_cell.label);
                       if (_cell.sortable) h.push('</a></div><div' +
                       (_cell.sortable == this.columnSorted ? " class='sort_"+this._direction+"'" : "") +
                       '></div></th>');
                    break;
                case "image":
                        var img = new sfImage(this._value);
                        h.push('<th '+ (_cell.cssClass ? 'class="' + _cell.cssClass +'"' : "")
                               +' width="'+ _cell.width +'">');
                        img.renderHtml(h);
                        h.push('</th>');
                    break;
                case "table":
                        h.push('<th '+ (_cell.cssClass ? 'class="'+ _cell.cssClass +'"' : "") +' width="'+ _cell.width +'">' +
                               '<table style="width:100%" class="ContainedTH"><tr>');
                        this.setHeader (_cell.metaData,h,m);
                        h.push('</tr></table></th>');
                    break;
                default:
                        /*if (this._dynamicHeader && m === 0) {
                           h.push('<th '+ (_cell.cssClass ? 'class="' + _cell.cssClass +'"' : "")
                                   +' width="'+ _cell.width +'">&nbsp;</th>');
                        }  */
                        if (this._dynamicHeader) var obj = new _cell.cellObject[0](this._value[m],_cell.cellObject[1]);
                        else  var obj = new _cell.cellObject[0](this._rows[m].getValue());
                        h.push('<th '+ (_cell.cssClass ? 'class="' + _cell.cssClass +'"' : "")
                            +' width="'+ _cell.width +'">');
                        obj.renderHtml(h);
                        h.push('</th>');
                    break;
              }
          }
        },
        setLeftColumn: function(rowDef,h) {
           for (var m=0; m < this._rowCnt; m++) {
              var _cell = rowDef[0];
              h.push('<tr id="fixedLeft_'+ m +'">');
              switch(_cell.cellObject) {
                case "string":
                    h.push('<td width="'+ _cell.width +'">');
                           if (_cell.sortable) h.push('<a href="javascript:void(0);" ' +
                              (_cell.sortable == this.columnSorted ? "class='sort_"+this._direction+"'" : "") + 'onclick=\"' +
                             this.fireCode("sortTable", {sortKey:_cell.sortable})+ ';return false;\">');
                           h.push(_cell.label);
                           if (_cell.sortable) h.push('</a>');
                           h.push('</td>');
                    break;
                case "image":
                    var img = new sfImage(this._value);
                    h.push('<td width="'+ _cell.width +'">');
                    img.renderHtml(h);
                    h.push('</td>');
                    break;
                case "table":
                    h.push('<td width="'+ _cell.width +'">' +
                           '<table style="width:100%" class="ContainedTH"><tr>');
                    this.setHeader (_cell.metaData,h,m);
                    h.push('</tr></table></td>');
                    break;
                default:
                    var obj = new _cell.cellObject[0](_cell.dataObject[m],_cell.cellObject[1]);
                    h.push('<td style="vertical-align:middle;" width="'+ _cell.width +'">');
                    obj.renderHtml(h);
                    h.push('</td>');
                    break;
              }
              h.push('</tr>')
          }
        },
        resizeBodyContainer: function(containerHeight) {
          if ($('tableBodyContainer')) $('tableBodyContainer').style.height = containerHeight;
          this.adjustHeights();
        },
        scrollDiv: function () {
          var scrollY = $('tableBodyContainerHorizScroll').scrollTop;
          var scrollX = $('tableBodyContainerHorizScroll').scrollLeft;
          var firstColumn = $('leftContainer');
          var staticHeader = $('headerContainer');
          firstColumn.style.top = eval((-scrollY) + 18) + "px";
          staticHeader.style.left = eval((-scrollX) + 250) + "px";

        },
        /*
            Function to return the html structure of the table. This function is necessary to workaounf IE's behavior of
            not allowing an innerHtml of a table; so to refresh the table, renderTable's result should refresh content
            of the wrapping div.
        */
        renderTable: function (h) {


            if (this._leftFixed) {  //z-index:1;overflow:hidden;padding:3pt;position:relative;
                h.push('<div id="leftContainer" style="float:left;overflow:hidden;position:absolute;;">' +
            			'<div style="margin:0pt;padding:0pt;"><table width="' + this._firstColumnDefinition[0].width + '">');
                this.setLeftColumn(this._firstColumnDefinition, h);
                h.push('</table></div></div>');
            }
            if (this._headerDefinitions) {
                h.push('<div class="headerContainer" id="headerContainer" style="width:' + this._tableWidth + 'px;z-index: -1;"><div id="innerDiv" class="innerDiv"><table><tbody><tr class="header">');
                this.setHeader(this._headerDefinitions, h);
                h.push('</tr></tbody></table></div></div>');
            }
            if (this._headerFixed) {
                h.push('<div id="tableBodyContainerHorizScroll" class="tableBodyContainerHorizScroll" onscroll="' + this.fireCode("scrollDiv") + '">');
            }
            h.push('<div id="tableBodyContainer" class="tableBodyContainer" style="width:' + this._tableWidth + 'px">');
            h.push('<div style="float:left"><table id="tableBody" ' + (this._tableClass ? 'class="'+ this._tableClass +'"' : "")+'>' +
            		'<tbody>');
            for (var k=0, len=this._rows.length; k < len; k++ ) {
                this._rows[k].renderHtml(h);
            }
            h.push('</tbody></table></div>');
            if (this._headerFixed) h.push('</div><div style="clear:both;" /></div>');
        },
        // creates the wrapping div of the table and calls renderTable to create HTML DOM representation of the object
        renderHtml: function(h) {
            h.push('<div id="'+this.id+'" '+(this._tableClass != "" ? "class='tblContainer'" : "")+'>');
            this.renderTable(h);
            h.push('</div>');
        },
        getOffsetHeight: function() {
            return $("tableBody").offsetHeight;
        },
        adjustHeights: function() {
            if ($("tableBody")) {
              var _tblRows = $("tableBody").rows;
              if (this._leftFixed) {
                  $('tableBodyContainerHorizScroll').style.position = 'absolute';
                  $('tableBodyContainerHorizScroll').style.top = ($("headerContainer").clientHeight || $("headerContainer").offsetHeight)+ "px";;
                  $('tableBodyContainerHorizScroll').style.left = ($("leftContainer").clientWidth || $("leftContainer").offsetWidth) + "px";
                  $('headerContainer').style.position = 'absolute';
                  $('headerContainer').style.top = 0;
                  $('headerContainer').style.left = ($("leftContainer").clientWidth || $("leftContainer").offsetWidth) + "px";
                  $("leftContainer").style.top = ($("innerDiv").clientHeight || $("innerDiv").offsetHeight)+ "px";
                  $("tableBodyContainer").style.height = ($("tableBody").clientHeight || $("tableBody").offsetHeight)+ "px";
                  $(this.id).style.width = (($("leftContainer").clientWidth || $("leftContainer").offsetWidth) + ($("tableBodyContainerHorizScroll").clientWidth || $("tableBodyContainerHorizScroll").offsetWidth) + 20 )+ "px";
                  for (var i=0,len=this._rowCnt;i < len; i++) {
                      $("fixedLeft_"+ i).style.height = (_tblRows[i].clientHeight + "px" || _tblRows[i].offsetHeight + "px");
                  }
                  //$("leftContainer").style.height = ($("tableBodyContainerHorizScroll").clientHeight || $("tableBodyContainerHorizScroll").offsetHeight)+ "px";
              }
            }
        }
    });
})();

/**
 * Object representing row of a table.
 * @param value: Value of the data to be siplayed in each column of the row.
 * @param colMetaData: MetaData of each column of the row.
 * @param rowClass: class of a row.
 */
function sfBiaxialTableRow(value, config) {
    this.register();
    this.setValue(value);
    this._colInfo = config.colInfo;
    this._cssClass = config.rowClass;
    this._colCount = config.colCount;
    this._dynamicHeader = config.dynamicHeader;
    this._rowDataDefinition = config.rowDataDefinition;
    this._alternateRow = config.alternateRow;
    this._cells = [];
    this.isModified = false;
    this.init();
}

sfBiaxialTableRow.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
          this._value = value;
        },
        getValue: function () {
          return this._value;
        },
        // Create list of children and add Event Listeners to the children
        init: function() {
            if (!this._dynamicHeader) {
                for (var i=0, lent=this._colInfo.length; i < lent; i++ ) {
                   var cell = new sfBiaxialTableCell(this._value, this._colInfo[i]);
                   this._cells.push(cell);
                   if (this._colInfo[i].cellObject[0] == sfTrashRow) {
                        cell.addEventListener('deleteRow',
                          {
                            _obj : this,
                            handleEvent : function() {
                                var DOMObj = $(this._obj.id);
                                DOMObj.parentNode.removeChild(DOMObj);
                                this._obj.setModified(true);
                                this._obj.dispatch("deleteRow");
                            }
                          });
                   }
                        cell.addEventListener('dataChange',
                        {
                            _obj : this,
                            handleEvent : function() {
                                this._obj.dispatchDataChange(arguments[0]);
                            }
                          });
                       cell.addEventListener('click',
                        {
                            _obj : this,
                            handleEvent : function() {
                                this._obj.handleClick(arguments[0]);
                            }
                          });
               }
            } else {
                for (var i=0; i < this._colCount; i++ ) {
                   var cell = new sfBiaxialTableCell(this._value[i], this._colInfo[0], this._rowDataDefinition);
                   this._cells.push(cell);
                   if (this._colInfo[0].cellObject[0] == sfTrashRow) {
                        cell.addEventListener('deleteRow',
                          {
                            _obj : this,
                            handleEvent : function() {
                                var DOMObj = $(this._obj.id);
                                DOMObj.parentNode.removeChild(DOMObj);
                                this._obj.setModified(true);
                                this._obj.dispatch("deleteRow");
                            }
                          });
                    }
                    cell.addEventListener('dataChange',
                        {
                            _obj : this,
                            handleEvent : function() {
                                this._obj.dispatchDataChange(arguments[0]);
                            }
                          });
                       cell.addEventListener('click',
                        {
                            _obj : this,
                            handleEvent : function() {
                                this._obj.handleClick(arguments[0]);
                            }
                          });
               }
            }
        },
        handleClick: function() {
            this.dispatch("click", arguments[0]);
        },
        // turn on or off modified flag of a row.
        setModified: function(bool) {
          this.isModified = bool;
        },
        dispatchDataChange: function() {
          this.dispatch("dataChange",arguments[0]);
        },
        unregister : function() {
          for (var index = 0; index < this._cells.length; index++) {
            this._cells[index].unregister();
          }
          Component.prototype.unregister.apply(this, arguments);
        },
        getAlternateRow: function() {
          return (this._alternateRow  ? '" ' +this._alternateRow +'"' : "");
        },
        // create DOM representation of the row
        renderHtml: function(h) {
          h.push('<tr id="' + this.id + '"'+
                 (this._cssClass ? ' class="'+ this._cssClass +'"' : "") +  this.getAlternateRow() +
                   '>');
          for (var i=0, lent=this._cells.length; i < lent; i++ ) {
               this._cells[i].renderHtml(h,i);
           }
          h.push('</tr>');
        }
    });
})();

/**
 *  This object is used to hold cell data for a Table object.
 *
 * @param value: Value of the cell.
 * @param config: Each cell needs some configuration. This configuration is passed in form of an JSON object.
 * Configs possible:
 *      colMetaData: MetaData of the column of the cell
 *      colWidth: Width of the column
 *      colClass: CSS Class of the column
 */
function sfBiaxialTableCell(value,config,rowDataDefinition) {
    this.register();
    this.setValue(value);
    if (config) {
        this._colMetaData = config.metaData;
        this._width = config.width
        this._class = config.cssClass;
        this._JUICObject =  config.cellObject;
        this._rowDataDefinition = rowDataDefinition;
        this._field = this.objectPicker(this._JUICObject);
    }
    // selection for the object displayed in a cell/
    this.init();
}

sfBiaxialTableCell.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
          this._value = value;
        },
        // Create list of children and add Event Listeners to the children
        init: function() {
            if (this._JUICObject[0] == sfTrashRow) {
                this._field.addEventListener('deleteRow',
                  {
                    _obj : this,
                    handleEvent : function(evt) {
                        this._obj.deleteRow(evt);
                    }
                  });
            }
            this._field.addEventListener('click',
                  {
                    _obj : this,
                    handleEvent : function(evt) {
                        this._obj.handleClick(evt);
                    }
                  });
        },
        objectPicker: function(obj) {
            if (this._JUICObject[0] == sfBiaxialTableLayout) {
                return new obj[0](new sfTBiaxialableModel(obj[1],this._value[obj[2]]));
            }  else {
                return new obj[0](this._value,obj[1],this._rowDataDefinition);
            }
        },
        dispatchDataChange: function() {
          this.dispatch("dataChange",arguments[0]);
        },
        getValue: function() {
          return this._value;
        },
        getField: function() {
          return this._field;
        },
        setField: function(obj) {
          this._field = obj;
        },
        unregister: function() {
         this._field.unregister();
         Component.prototype.unregister.apply(this, arguments);
        },
        deleteRow: function() {
            this.dispatch("deleteRow");
        },
        handleClick: function() {
            this.dispatch("click", arguments[0]);
        },
        updateContent: function(field) {
            field.render(this.id);
        },
        renderHtml: function(h,ind) {
            h.push('<td id="'+ this.id +'" '+(this._class ? ' class="' + this._class + '"' : "")+' width="'+ this._width +'">');
            this._field.renderHtml(h);
            h.push('</td>');
        }
    });
})();