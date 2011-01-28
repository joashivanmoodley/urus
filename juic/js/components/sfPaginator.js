/**
 * @author: jro
 * @revision: $Id: sfPaginator.js 121880 2011-01-14 21:52:02Z svn $
 */
//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfDataGrid.js
//! include /ui/juic/js/components/sfDocumentToolbar.js
//! include /ui/juic/js/components/sfDropDown.js

function SFBoundedRangeModel(minimum, maximum, value, extent) {
	if(!this._isRangeValid(minimum, maximum, value, extent)) {
		assert("[SFBoundedRangeModel] Valid range model is required.");
	}
	this._minimum = minimum;
	this._maximum = maximum;
	this._value = value;
	this._extent = extent;	
}

SFBoundedRangeModel.prototype = (function(){
	return set(new EventTarget(), {
		getMinimum : function() {
			return this._minimum;
		},
		getMaximum : function() {
			return this._maximum;
		},
		getValue : function() {
			return this._value;
		},
		getExtent : function() {
			return this._extent;
		},
		setMinimum : function(min) {
			if(!this._isRangeValid(min, this._maximum, this._value, this._extent)) {
			    assert("[SFBoundedRangeModel] Valid range model is required.");
			}
			this._minimum = min;
			this.dispatch("rangeModelChanged", {minimum : this._minimum});
		},
		setMaximum : function(max) {
			if(!this._isRangeValid(this._minimum, max, this._value, this._extent)) {
			    assert("[SFBoundedRangeModel] Valid range model is required.");
			}
			this._maximum = max;
			this.dispatch("rangeModelChanged", {maximum : this._maximum});
		},
		setValue : function(value) {
			if(!this._isRangeValid(this._minimum, this._maximum, value, this._extent)) {
			    assert("[SFBoundedRangeModel] Valid range model is required.");
			}
			this._value = value;
			this.dispatch("rangeModelChanged", {value : this._value});
		},
		setExtent : function(extent) {
			if(!this._isRangeValid(this._minimum, this._maximum, this._value, extent)) {
			    assert("[SFBoundedRangeModel] Valid range model is required.");
			}
			this._extent = extent;
			this.dispatch("rangeModelChanged", {extent : this._extent});
		},
		setRangeProperties : function(min, max, value, extent) {
			if(!this._isRangeValid(min, max, value, extent)) {
			    assert("[SFBoundedRangeModel] Valid range model is required.");
			}
			this._minimum = min;
			this._maximum = max;
			this._value = value;
			this._extent = extent;
			this.dispatch("rangeModelChanged", {minimum : this._minimum, 
			                               maximum : this._maximum,
			                               value : this._value,
			                               extent : this._extent});
		},
		_isRangeValid : function(min, max, value, extent) {
		    return (min <= value) && (value <= (value + extent)) && ((value + extent) <= max);

		}
	});
})();

function SFAbstractPaginator() {
}

SFAbstractPaginator.prototype = (function() {
	return set(new Component(), {
		setPagingModel : function(model) {
	    	if(model) {
	    		if(!this._model) {
	    			assert(false, "[SFAbstractPaginator] Paging model must be instantiated by the subclass.");
	    		}
			    this._model.setRangeProperties(model.getMinimum(),
			                                 model.getMaximum(),
			                                 model.getValue(),
			                                 model.getExtent());
			}
		},
		getMinimum : function() {
			if(!this._model) {
	    	    assert(false, "[SFAbstractPaginator] Paging model must be instantiated by the subclass.");
	    	}
			return this._model.getMinimum();
		},
		getMaximum : function() {
			if(!this._model) {
	    	    assert(false, "[SFAbstractPaginator] Paging model must be instantiated by the subclass.");
	    	}
			return this._model.getMaximum();
		},
		getValue : function() {
			if(!this._model) {
	    	    assert(false, "[SFAbstractPaginator] Paging model must be instantiated by the subclass.");
	    	}
			return this._model.getValue();
		},
		getExtent : function() {
			return this._model.getExtent();
		},
		getPagingModel : function() {
			return this._model;
		},
		getTotalPages : function() {
			var totalPages = 0;
			if(this.getExtent() !== 0) {
				totalPages = Math.ceil((this.getMaximum() - this.getMinimum())/this.getExtent());
			}
			return totalPages;
		},
		getCurrentPageNumber : function() {
			var currentPage = 0;
			if(this.getExtent() !== 0) {
				currentPage = (Math.floor((this.getValue() - this.getMinimum())/this.getExtent())) + 1;
			}
			return currentPage;
		},
		getTotalDataLength : function() {
			return (this.getMaximum() - this.getMinimum());
		},
		//pagination UI must be implemented by the sub-class
		renderHtml : function(h) {
   		    assert("[SFPaginator] renderHtml must be implemented by the subclass.");			
		},
		handleEvent : function(evt) {
			switch(evt.type) {
	    	  case 'rangeModelChanged':
	    		  this.dispatch("rangeModelChanged", {src:evt.obj, param:evt.param});
	    		  break;
        	  default:
        		  this.dispatch(evt.type, arguments[0]);	
		    }
		}
	});
})();

function SFPagination(options) {
	this.register();
	this._init(options);	
}

SFPagination.prototype = (function(){ 
	return set(new SFAbstractPaginator(), {
		renderHtml: function(h) {
			h.push('<div id="', this.id, '">');
		    	this._renderPaginationHtml(h);
		    	h.push("</div>");
		    	this._rendered = true;
		},
		handleEvent : function(evt) {
		    switch(evt.type) {
		  	  case 'rangeModelChanged' :
		  	      this._handleRangeModelChanged(evt);
		  	      break;
		  	  case 'change' :
		  	  	  this._changePageSize(evt);
		  	  	  break;
		    }
		},
		getHideItemsPerPage : function() {
			return this._hideItemsPerPage;
		},
		setHideItemsPerPage : function(flag) {
			if(typeof flag != 'boolean') {
	    	    assert(false, "[SFPagination] setHideItemsPerPage can only accept boolean value.");
	    	}
			this._hideItemsPerPage = flag;
		},
		getHideFirstLast : function() {
			return this._hideFirstLast;
		},
		setHideFirstLast : function(flag) {
			if(typeof flag != 'boolean') {
	    	    assert(false, "[SFPagination] setHideFirstLast can only accept boolean value.");
	    	}
			this._hideFirstLast = flag;
		},
		getAlignRight : function() {
			return this._alignRight;
		},
		setAlignRight : function(flag) {
			if(typeof flag != 'boolean') {
	    	    assert(false, "[SFPagination] setAlignRight can only accept boolean value.");
	    	}
			this._alignRight = flag;
		},
		getHidePaginatorOnTop : function() {
			return this._hidePaginatorOnTop;
		},
		setHidePaginatorOnTop : function(flag) {
			if(typeof flag != 'boolean') {
	    	    assert(false, "[SFPagination] setHidePaginatorOnTop can only accept boolean value.");
	    	}
			this._hidePaginatorOnTop = flag;
		},
        cleanup : function() {
            if(this._itemsPerPageSelect) {
                this._itemsPerPageSelect.removeEventListener('change', this);
                this._itemsPerPageSelect.cleanup();
                this._itemsPerPageSelect = null;
            }
            if(this._model) {
                this._model.removeEventListener('rangeModelChanged', this);
                this._model = null;
            }
            this.unregister();
        },
		_renderPaginationHtml : function(h) {
		    h.push('<ul class="flatten pagination', (this._noFloat?"":" floatright"), '">');
			
			if (!this._hideItemsPerPage && this._itemsPerPageSelect) {
			    h.push('<li class="per_page"><label>');
			    h.push(jsSFMessages.COMMON_PAGINATOR_Items_Per_Page);
			    h.push('</label>');

			    this._itemsPerPageSelect.renderHtml(h);
			    h.push('</li>');
			}
			
			var inputBox = [];
			inputBox.push('</label><input id="', this.id, 'index" size="2" maxLength="3"');
			inputBox.push(' onchange="', this.fireCode('_switchToPage'), '"');
			inputBox.push(' onkeydown="', this.fireCode('_validateNumberKeyDown'), '"');
			if (this._disabled || this.getTotalPages() == 1) {
			    inputBox.push(' disabled="disabled"');
			}
			inputBox.push(' value="', this.getCurrentPageNumber(), '"><label>');
			inputBox = sfMessageFormat.format(jsSFMessages.COMMON_PAGINATOR_Page_X_of_Y,
			      inputBox.join(''),
			       this.getTotalPages());
			
			var leftDisabled = this.getCurrentPageNumber() <= 1 || this._disabled;
			var rightDisabled = this.getCurrentPageNumber() >= this.getTotalPages() || this._disabled;
	
			this._renderPaginationArrow(h, jsSFMessages.COMMON_PAGINATOR_First_Page, 'first', '_first', leftDisabled);
			this._renderPaginationArrow(h, jsSFMessages.COMMON_PAGINATOR_Previous_Page, 'prev', '_previous', leftDisabled);
			h.push('<li><label>', inputBox, '</label></li>');
			this._renderPaginationArrow(h, jsSFMessages.COMMON_PAGINATOR_Next_Page, 'next', '_next', rightDisabled);
			this._renderPaginationArrow(h, jsSFMessages.COMMON_PAGINATOR_Last_Page, 'last', '_last', rightDisabled);
			
			h.push('</ul>');			
		},
		_renderPaginationArrow : function(h, altText, styleClass, onclick, disabled) {
		    h.push('<li title="', altText, '" class="', styleClass, disabled ? '_disabled' : '', '"');
			if (!disabled) {
			   h.push('onclick="', this.fireCode(onclick), '"');
			}
			h.push('><span class="alt">', escapeHTML(altText), '</span></li> ');			
		},
		_init : function(options) {
			if(options) {
			    if(options.model) {
				    this._model = options.model;
			    }else{
				    this._model = new SFBoundedRangeModel(0,0,0,0);
			    }
				this._hideItemsPerPage = options.hideItemsPerPage?true:false;
				this._hideFirstLast = options.hideFirstLast?true:false;
				this._alignRight = options.alignRight?true:false;
				this._hidePaginatorOnTop = options.hidePaginatorOnTop?true:false;
                this._noFloat = options.noFloat?options.noFloat:false;
			}else{
				this._model = new SFBoundedRangeModel(0,0,0,0);
				this._hideItemsPerPage = false;
				this._hideFirstLast = false;
				this._alignRight = false;
				this._hidePaginatorOnTop = false;
                this._noFloat = false;
			}
			this._model.addEventListener('rangeModelChanged', this);
			this._rendered = false;
            //create the items per page select drop down with the initial model data
            var optionsArray = this._covertToSelectItemList(this._getPageSizeOptions(this.getTotalDataLength()));
		    this._itemsPerPageSelect = new SFDropDown(optionsArray);
		    this._itemsPerPageSelect.addEventListener('change', this);
            //if the extent is specified, get the correct page size and set itemsPerPageSelect.
            if(this._model.getExtent() > 0) {
                var extentArray = this._getPageSizeOptions(this._model.getExtent());
                if(extentArray && extentArray.length >0) {
                  this._itemsPerPageSelect.getModel().setSelectedIndex(extentArray.length-1);    
                }
            }
		},
        _disableClickedPaginationArrow : function(evt) {
            var target = (evt && evt.target) || (evt && evt.srcElement);
            if(target.className && target.className.indexOf("_disabled") === -1) {
                target.className += "_disabled";
            }
        },        
        _first : function(evt) {            
            this._disableClickedPaginationArrow(evt);
            this._goToPage(1);
        },
        _previous : function(evt) {
            this._disableClickedPaginationArrow(evt);
            this._goToPage(this.getCurrentPageNumber() - 1);    
        },
        _next : function(evt) {
            this._disableClickedPaginationArrow(evt);
            this._goToPage(this.getCurrentPageNumber() + 1);
        },
        _last : function(evt) {
            this._disableClickedPaginationArrow(evt);
            this._goToPage(this.getTotalPages());   
        },
		_goToPage : function(page) {
			assert(page <= this.getTotalPages(), "[SFPaginatingDataGridLayout] Requested page is out of range");
			var requestInfo = { 
				oldPage: this.getCurrentPageNumber(),
				newPage: page,
				oldModel: this.getPagingModel(),
				actionCommand: 'pageAdjust'
			};
			this.dispatch('action', requestInfo);
		},
		_switchToPage : function() {
			var index = $(this.id + 'index').value;
	        var reset = true;
	        if (this._isValidNumber(index)) {
	           var newPageIndex = parseInt(index);
	           if (newPageIndex >= 1 && newPageIndex <= this.getTotalPages()) {
	               this._goToPage(newPageIndex);
	               reset = false;
	           }
	        }
	
	        if (reset) {
	            this._updatePaginatorDOM();
	        }
		},
		_updatePaginatorDOM: function() {
		  var objId = this.id;
		  var obj = $(objId);
	      if (obj) {
	      	var h = [];
	      	this._renderPaginationHtml(h);
	      	obj.innerHTML = h.join('');
	   	  }	
		},		
		_handleRangeModelChanged : function(evt) {
          //first update the paginator options list
          var selectedOption = 0;
          if(this._itemsPerPageSelect) {
              selectedOption = this._itemsPerPageSelect.getModel().getSelectedIndex();
              this._itemsPerPageSelect.cleanup();
          }
		  var optionsArray = this._covertToSelectItemList(this._getPageSizeOptions(this.getTotalDataLength()));			  
		  this._itemsPerPageSelect = new SFDropDown(optionsArray);
		  this._itemsPerPageSelect.addEventListener('change', this);
          this._itemsPerPageSelect.getModel().setSelectedIndex(selectedOption);

		  this._updatePaginatorDOM();	
		},
		_getPageSizeOptions : function(dataLength) {
			var optionsArray = new Array();
			optionsArray.push({ key : '10' , value : 10 });
			if(dataLength > 10) {
				optionsArray.push({ key : '25' , value : 25 });
			}
			if(dataLength > 25) {
				optionsArray.push({ key : '50' , value : 50 });
			}
			if(dataLength > 50) {
				optionsArray.push({ key : '100' , value : 100 });
			}
			if(dataLength > 100) {
				optionsArray.push({ key : '150' , value : 150 });
			}
			return optionsArray;
		},
        _covertToSelectItemList : function(options) {
            var itemsList = [];
            if(options && options.length) {
               for (var idx = 0;idx < options.length;idx++) {
                 itemsList.push(new SFSimpleSelectItem(options[idx].key, options[idx].value));
               }
            }
            return itemsList;
        },
		_isValidNumber : function(value) {
          return value && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(value);
		},
		_validateNumberKeyDown : function(evt) {
		  var obj = evt.srcElement;
          var charCode = (evt.which) ? evt.which : evt.keyCode;
          if (charCode == 190 || charCode == 110) {
             return obj.value.indexOf('.') == -1;
          }
          if (charCode == 13) {
             this._switchToPage();
          }
          return charCode <= 31 || (charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)
                  || (charCode >= 37 && charCode <= 40);

		},
		_changePageSize : function(evt) {
           var selObj = evt.target;
           if (selObj) {
             var size = selObj.getValue();
             
             var requestInfo = { 
				oldPage: this.getCurrentPageNumber(),
				newPageSize: size,
				oldModel: this.getPagingModel(),
				actionCommand: 'pageAdjust'
			};
			this.dispatch('action', requestInfo);
			
           }
		}		
	});
})();

function SFPaginatingDataGridLayout(headerDefinitions, columnDefinitions, options) {
    this.register();
    this._paginator = new SFPagination(options);
    if(headerDefinitions) {
        this._dataGrid = new SFDataGridLayout(headerDefinitions, columnDefinitions, options);
    }
    if (options && options.heightAutoResize) {
      this._heightAutoResize = options.heightAutoResize;
    }
    this._init();
}

SFPaginatingDataGridLayout.prototype = (function(){
	return set(new Component(), {

	renderHtml: function(h) {
	    h.push("<div id=\"", this.id, "\" class=\"",(this._heightAutoResize ? "dgHeightAutoresize" : ""),"\">");
	    if(!this._paginator._hidePaginatorOnTop) {
	        h.push("<div class=\"clear_all\" style=\"margin:5px;\">");
	  	this._paginator.renderHtml(h);
	        h.push("</div><div",(this._heightAutoResize ? " style=\"height:93%\"" : ""),">");
		}
	    
	    this._dataGrid.renderHtml(h);
        if(!this._paginator._hidePaginatorOnTop) {
            h.push("</div>");
        }
	    h.push("</div>");
	},
	handleEvent : function(evt) {
		switch(evt.type) {
			case 'action' :
		  		if(evt.actionCommand == 'pageAdjust') {
		  			this.dispatchEvent(evt);
		  		}
		  	  break;
      	default:
			    this.dispatchEvent(evt);
			    break;
    	}
	},
	getPaginator : function() {
		if(!this.getHidePaginatorOnTop()) {
			assert(false, "[SFPaginatingDataGridLayout] Set hidePaginatorOnTop to true to turn off default rendering.");
		}
		return this._paginator;	
	},
	setDataGrid : function(grid) {
		if(grid) {
			this._dataGrid = grid;
		}
	},
	setPagingModel : function(model) {
		this._paginator.setPagingModel(model);
	},
	getHideItemsPerPage : function() {
		return this._paginator.getHideItemsPerPage();
	},
	setHideItemsPerPage : function(flag) {
		this._paginator.setHideItemsPerPage(flag);
	},
	getHideFirstLast : function() {
		return this._paginator.getHideFirstLast();
	},
	setHideFirstLast : function(flag) {
		this._paginator.setHideFirstLast(flag);
	},
	getAlignRight : function() {
		return this._paginator.getAlignRight();
	},
	setAlignRight : function(flag) {
		this._paginator.setAlignRight(flag);
	},
	getHidePaginatorOnTop : function() {
		return this._paginator.getHidePaginatorOnTop();
	},
	setHidePaginatorOnTop : function(flag) {
		this._paginator.setHidePaginatorOnTop(flag);
	},
	insertRowAt: function(row, index, group) {
		this._dataGrid.insertRowAt(row, index, group);
	},
	setOptions: function(options) {
	    this._dataGrid.setOptions(options);
	},
	removeRow: function(row, group) {
	    this._dataGrid.removeRow(row, group);
	},
	removeRows: function(rows) {
	    this._dataGrid.removeRows(rows);
	},
	getRowAt: function(rowIndex, group) {
	    return this._dataGrid.getRowAt(rowIndex, group);
	},
	getColumnCount: function() {
	    return this._dataGrid.getColumnCount();
	},
	getRowCount: function() {
	    return this._dataGrid.getRowCount();
	},
	resetRows: function() {
	    this._dataGrid.resetRows();
	},
	appendRow: function(row, group) {
	    this._dataGrid.appendRow(row, group);
	},
	addGroup: function(groupName) {
	    this._dataGrid.addGroup(groupName);
	},
	getGroup: function(index) {
	    return this._dataGrid.getGroup();
	},
	setGridLabel: function(label) {
	    this._dataGrid.setGridLabel(label);
	},
	renderRows: function(rows, h, groupIndex) {
	    this._dataGrid.renderRows(rows, h, groupIndex);
	},
	// opens or closes a group
	toggleGroup: function (evt) {
	    this._dataGrid.toggleGroup(evt);
	},
	sortedBy: function(column, direction) {
	    this._dataGrid.sortedBy(column, direction);
	},
	setRowClass: function (cssClass, rowIndex, groupIndex) {
	    this._dataGrid.setRowClass(cssClass, rowIndex, groupIndex);
	},
	displayGridLabel: function(h) {
	    this._dataGrid.displayGridLabel(h);
	},
	setHeight: function(height) {
	    this._dataGrid.setHeight(height);
	},
	adjustDOM: function() {
        this._dataGrid.adjustDOM();
	},
	cleanup: function() {
        this._paginator.removeEventListener('action', this);
        this._paginator.cleanup();
        this._paginator = null;
        this._dataGrid.removeEventListener('sort', this);
	    this._dataGrid.cleanup();
        this.unregister();
	},
	_init : function() {
   	this._disabled = false;
		this._paginator.addEventListener('action', this);
    if(this._dataGrid){
		    this._dataGrid.addEventListener('sort', this);
		}
  }
	});
})();

/**
 * Creates a toolbar layout with paginator on the right 
 */
function PaginatorToolbarLayout() {
    this.register();
    this._toolbarItems = [];
    this._separators = [];
}

PaginatorToolbarLayout.prototype = (function() {
    /**
     * Private object for creating a separator between buttons or groups of buttons
     */
    function separator() {
        this.register();
    }
    separator.prototype = (function() {
        return set(new Component(), {
            renderHtml : function(h) {
                h.push("<span id=\"",this.id,"\" class=\"sep\">&nbsp;</span>");
            }
        });
    })();

    return set(new Component(), {
        /**
         * Main entry point for adding a toolbar button to the layout
         * @param component - must be of type SFToolbarButton
         */
        add : function(component) {
            assert((component instanceof SFToolbarButton) || (component instanceof separator) || (component instanceof SFPagination),
                    "[PaginatorToolbarLayout] This toolbar layout only accepts SFToolbarButton and SFPagination components as valid buttons");
            this._toolbarItems.push(component);
            this._renderButtons();
        },
        /**
         * Adds a separator to the _toolbarItems collection and is displayed as a vertical line
         * between buttons.
         */
        addSeparator : function() {
            var sep = new separator();
            this._separators.push(sep);
            this._toolbarItems.push(sep);
            this._renderButtons();
        },
        /**
         * Removes a button from collection and forces a rendering of the _toolbarItems collection
         * @param component
         */
        removeButton : function(component) {
            for (var idx=0,len=this._toolbarItems.length;idx<len;idx++) {
                if (this._toolbarItems[idx] === component) {
                    this._toolbarItems.splice(idx,1);
                    break;
                }
            }
            this._renderButtons();
        },
        /**
         * Notice that unlike with removeButton, a component reference isn't passed here. This is
         * because there is no public interface into separator instances. Therefore, a separate
         * separator collection is created. Calling component simply passes the index of the separator remove
         * (zero-based, left to right), to remove a separator. The proper separator instance reference is located
         * in the separator collection, then passed to removeButton to remove from the toolbarItems collection.
         * @param index
         */
        removeSeparator : function(index) {
            assert(this._separators[index],
                    "[PaginatorToolbarLayout] Separator does not exist with index provided (Remember: indexes are zero-based)");
            var sep = this._separators[index];
            this.removeButton(sep);
        },
        renderHtml : function(h) {
            h.push("<span id=\"", this.id, "\">");
            this._getItemsHtml(h);
            h.push("</span>");
        },
        _getItemsHtml : function(h) {
            for (var idx=0,len=this._toolbarItems.length;idx<len;idx++) {
                this._toolbarItems[idx].renderHtml(h);
            }
        },
        _renderButtons : function() {
            if ($(this.id)) {
                var h = [];
                this._getItemsHtml(h);
                $(this.id).innerHTML = h.join("");
            }
        }
    });
})();