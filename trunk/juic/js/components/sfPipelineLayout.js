//! include /ui/uicore/js/Util.js
//! include /ui/static/css/components/sfPipelineLayout.css

var LEFT = "left";
var RIGHT = "right";

/*********** SFPipelineLayout ************/
function SFPipelineLayout() {
    //assert(!scrollPos || typeof scrollPos == 'number', "[SFPipelineLayout] : scrollPos must be a number.");    
    this.register();
    
    this._pipeWidth = 0; //Sum of width of all pipeline items and separators    
    this._init();
//    this._initScrollPos = scrollPos;
    this._sections = [];
    this._shiftKeyItem = [[0, 0]];
    //Resize pipeline when window is resized.
    if(window.addEventListener) {
        window.addEventListener("resize", this._setWidth, false);    
    } else if (window.attachEvent) {
        window.attachEvent("onresize", this._setWidth);
    }    
}

SFPipelineLayout.prototype = ( function() {
    var _PIPELINE_INNER = 'pipelineInner';
    var _PIPELINE_OUTER = 'pipelineOuter';
    var _PIPELINE_LIST = 'pipelineList';
    var _PIPELINE_CONTAINER = 'pipelineContainer';
    var _SCROLLERS_WIDTH = 52;
    
    return set(new Component(), {
        _init: function() {
            this._leftScroller = new SFScroller(LEFT);
            this._rightScroller = new SFScroller(RIGHT);
            
            this._leftScroller.addEventListener("action", this);
            this._rightScroller.addEventListener("action", this);
        },
        
        /**
         * Add a section: Update this._sections array and DOM
         */
        addSection: function() {
            var sec = new SFPipelineSection();
            sec.addEventListener("action", this);
            sec.addEventListener("itemRemoved", this);
            this._sections.push(sec);
            this._updateDOM();
        },

        /**
         * Add a component to the layout.
         * @param secIdx (int) - Section index to which the component needs to be added.
         * @param comp (JUIC Obj)- Component being added to the layout. Must be a JUIC component.
         */
        addItem: function(secIdx, comp) {
            //Confirm secIdx is a valid section index
            assert(comp instanceof Component, "SFPipelineLayout: addItem: JUIC Object (of type Component) is expected");
            assert(typeof secIdx == "number" && secIdx < this._sections.length, "SFPipelineLayout: section index: invalid number or out of bounds");
            
            //Make sure that the comp is not already added to the layout
            var iter, itemIdx, secLen = this._sections.length, arrItemPos = [];
            arrItemPos = this._getComponentLocation(comp);

            
            if(arrItemPos[1]!=null && arrItemPos[1]!=undefined) {
                return; //Comp already exists in pipeline, don't add it   
            }
            
            //Add comp to the given section and update pipeWidth
            this._sections[secIdx].addItem(comp);
            this._pipeWidth = this._getWidth();                
        },
        
        addSeparator: function() {
            this._sections[this._sections.length-1].addSeparator();
            this._pipeWidth = this._getWidth();
        },

        getComponentAt: function(secIdx, idx) {
            assert(typeof secIdx == "number" && secIdx < this._sections.length, "SFPipelineLayout: getComponent: section index: invalid number or out of bounds");
            assert(typeof idx == "number", "SFPipelineLayout: getComponentAt: Invalid item index");
            return this._sections[secIdx].getComponentAt(idx);
        },

        removeItem: function(comp) {
            assert(comp instanceof Component, "SFPipelineLayout: removeItem: JUIC Object (of type Component) is expected");
            var iter, secLen = this._sections.length, compId = comp.id;
            var arrItemPos = this._getComponentLocation(comp);
            
//            for(iter=0; iter<secLen; iter++) {
//                idx = this._sections[iter]._getItemIdxContainingComp(compId);
//                if(idx!=null && idx!=undefined) {
//                    break; 
//                }
//            }
//            this.removeItemAt(iter, idx);
            
            this.removeItemAt(arrItemPos[0], arrItemPos[1]);
        },
        
        removeItemAt: function(secIdx, idx) {
            //Confirm secIdx is a valid section index
            assert(typeof secIdx == "number" && secIdx < this._sections.length, "SFPipelineLayout: removeItemAt: section index is invalid number or out of bounds");            
            assert(typeof idx == "number", "SFPipelineLayout: removeItemAt: Invalid item index");
            
            this._sections[secIdx].removeItem(idx);
        },
        
        removeSection: function(secIdx) {
            assert(typeof secIdx == "number" && secIdx < this._sections.length, "SFPipelineLayout: removeSection: section index is invalid number or out of bounds");
            this._sections[secIdx].cleanup();
            this._sections.splice(secIdx, 1);
	    this._updateDOM();
        },
        
        setItemSelection: function(comp, bool) {
            assert(comp instanceof Component, "SFPipelineLayout: setItemSelection: JUIC Object (of type Component) is expected");
            var iter, secLen = this._sections.length;
            for(iter=0; iter<secLen; iter++) {
                this._sections[iter].setItemSelection(comp, bool);
            }
        },
        
        setItemSelectionAt: function(secIdx, idx, bool) {
            //Confirm secIdx is a valid section index
            assert(typeof secIdx == "number" && secIdx < this._sections.length, "SFPipelineLayout: setItemSelectionAt: section index: invalid number or out of bounds");
            assert(typeof idx == "number", "SFPipelineLayout: setItemSelectionAt: Invalid item index");

            this._sections[secIdx].setItemSelectionAt(idx, bool);
        },

        scrollToPos: function(px) {
            assert(typeof idx == "number", "SFPipelineLayout: scrollToPos: Invalid number");

            px = parseInt(px);
            if(px > 0) {
                px = 0;
            }

            var pipeInnerWidth = parseInt($(_PIPELINE_INNER).style.left) - parseInt(px);
            var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            if(this._pipeWidth > (w-_SCROLLERS_WIDTH)) {
                if(pipeInnerWidth < ((w-_SCROLLERS_WIDTH) - this._pipeWidth)) {
                    pipeInnerWidth = (w-_SCROLLERS_WIDTH) - this._pipeWidth;
                }
            }
            $(_PIPELINE_INNER).style.left = pipeInnerWidth + "px";
        },

        scrollToItem: function(comp) {
//            assert(comp instanceof Component, "SFPipelineLayout: scrollToItem: JUIC Object (of type Component) is expected");
            
            var _PIPELINE_INNER = "pipelineInner", compId;
            if(typeof comp == "string") {
                compId = comp;    
            } else if(comp instanceof Component) {
                compId = comp.id;   
            }
            //Get secIdx, idx for comp
            var secIdx, idx, iter, secLen = this._sections.length;
            var arrItemPos = this._getComponentLocation(comp);
            secIdx = arrItemPos[0];
            idx = arrItemPos[1];
//            for(iter=0; iter<secLen; iter++) {
//                idx = this._sections[iter]._getItemIdxContainingComp(compId);
//                if(idx != null && idx != undefined) {
//                    break;    
//                }
//            }
//            
//            var secIdx = iter; 
            
            //Get pipe width until that comp
            var width = 0, width1 = 0;
            for(iter=0; iter<secLen; iter++) {
                if(iter == secIdx) {
                    width += this._sections[iter].getWidth(idx);
                    break;
                } else {
                    width += this._sections[iter].getWidth();    
                }
            }

            for(iter=0; iter<secLen; iter++) {
                if(iter == secIdx) {
                    width1 += this._sections[iter].getWidth(idx+1);
                    break;
                } else {
                    width1 += this._sections[iter].getWidth();    
                }
            }

            var left = 0;
            if($(_PIPELINE_INNER).style.left != "") {
                left = parseInt($(_PIPELINE_INNER).style.left);    
                
            }
            var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            
            if(width < Math.abs(left)) {
                $(_PIPELINE_INNER).style.left = (-1) * (width - 15) + "px";
            } else if(width1 > Math.abs(left) && width1<(Math.abs(left)+(w-_SCROLLERS_WIDTH))) {
//                $(_PIPELINE_INNER).style.left = (-1) * (width - 15) + "px";
            } else if(width1 > (Math.abs(left)+(w-_SCROLLERS_WIDTH))) {
                $(_PIPELINE_INNER).style.left = (-1) * (width1 - (w-_SCROLLERS_WIDTH)) + "px";
            }
        },
        
        scroll: function(dir, px) {
            assert(px==undefined || typeof px == "number", "SFPipelineLayout: scroll: Invalid number");
            if(!px) {
                px = 120;
            }
            this._pipeWidth = this._getWidth();
            if(dir === LEFT) {
                if(isNaN(parseInt($(_PIPELINE_INNER).style.left))) {
                    $(_PIPELINE_INNER).style.left = parseInt(px) + "px";
                
                } else {
                    var pipeInnerWidth = parseInt($(_PIPELINE_INNER).style.left) + parseInt(px);
                    if(pipeInnerWidth > 0) {
                        pipeInnerWidth = 0;
                    }
                    $(_PIPELINE_INNER).style.left = pipeInnerWidth + "px";
                }
                
            } else {
                if(isNaN(parseInt($(_PIPELINE_INNER).style.left))) {
                    $(_PIPELINE_INNER).style.left = -1 * parseInt(px) + "px";
                } else {
                    var pipeInnerWidth = parseInt($(_PIPELINE_INNER).style.left) - parseInt(px);
                    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                    if($('pipelineContainer')) {
                	w = $('pipelineContainer').offsetWidth; 
                    }
                    if(this._pipeWidth > (w-_SCROLLERS_WIDTH)) {
                        if(pipeInnerWidth < ((w-_SCROLLERS_WIDTH) - this._pipeWidth)) {
                            pipeInnerWidth = (w-_SCROLLERS_WIDTH) - this._pipeWidth;
                        }
                    }
                    $(_PIPELINE_INNER).style.left = pipeInnerWidth + "px";
                }
            }
        },
        
        _getComponentLocation: function(comp) {
            assert(comp instanceof Component, "SFPipelineLayout: _getComponentLocation: JUIC Object (of type Component) is expected");

            var iter, itemIdx, secLen = this._sections.length;
            for(iter=0; iter<secLen; iter++) {
                itemIdx = this._sections[iter]._getItemIdxContainingComp(comp.id);
                if(itemIdx!=null && itemIdx!=undefined) {
                    return [iter, itemIdx];   
                }
            }
            return [null, null];
        },
        
        _getWidth: function() {
            var secLen = this._sections.length, iter, width = 0;
            for(iter=0; iter<secLen; iter++) {
                width += this._sections[iter].getWidth();
            }
            
            return width;
        },
        
        adjustDOM: function() {
            this._setWidth();
            this._enableDisableScrolls();
        },
        
        _setWidth: function() {
            if($('pipelineContainer')) {
                var w = $('pipelineContainer').offsetWidth; 
                w -= _SCROLLERS_WIDTH;
                if($(_PIPELINE_OUTER)) {
                    $(_PIPELINE_OUTER).style.width = w + "px";
                }
            }
        },
        
        _updateDOM: function() {
            var h = [], sectionsLen = this._sections.length;
            for(var iter=0; iter<sectionsLen; iter++) {
                this._sections[iter].renderHtml(h);
            }            

            if($('pipelineInner')) {
                $('pipelineInner').innerHTML = h.join('');
            }           
            
        },
        
        handleEvent: function(evt) {
            if(evt.actionCommand === "scroll") {
                if(evt.target.id === this._leftScroller.id) {
                    this.scroll(LEFT);                    
                } else if(evt.target.id === this._rightScroller.id) {                    
                    this.scroll(RIGHT);
                }
                this._enableDisableScrolls();
            } else if(evt.actionCommand === "itemSelected") {
                var secIdx = this._getSectionIndexForComponentId(evt.secId);
                if(!evt.isShiftClick) {
                    this._shiftKeyItem = [[secIdx, evt.idx]];
                } else if (evt.isShiftClick) {
                }
                this.dispatch("action", {actionCommand: "itemSelected", isCtrlClick: evt.isCtrlClick, isShiftClick: evt.isShiftClick, secIdx: secIdx, idx: evt.idx, comp: evt.comp});
            } else if(evt.type === "itemRemoved") {
                this._enableDisableScrolls();
            }

        },
        
        _getSectionIndexForComponentId: function(sectionComponentId) {
            var iter, secLen = this._sections.length;
            for(iter=0; iter<secLen; iter++) {
                if(this._sections[iter].id === sectionComponentId) {
                    return iter;
                }
            }
            return -1;
        },
        
        _enableDisableScrolls: function() {
            var left = 0;
            var pipeWidth = this._getWidth();
            var outerWidth = 0;
            if($(_PIPELINE_INNER)) {
                left = parseInt($(_PIPELINE_INNER).style.left);
            }
            
            if($(_PIPELINE_OUTER)) {
                outerWidth = $(_PIPELINE_OUTER).offsetWidth;
            }
            
            if(pipeWidth < outerWidth) {
                //Disable both scrollers
                
                this._leftScroller.enable(false);
                this._rightScroller.enable(false);
            } else {
                if(left < 0) {//enable left scroller
                    this._leftScroller.enable(true);
                } else if(left >= 0) {//disable left scroller
                    this._leftScroller.enable(false);
                }
                
                if(left <= (outerWidth - pipeWidth)) { //disable right scroller
                    this._rightScroller.enable(false);
                } else { //enable right scroller
                    this._rightScroller.enable(true);
                }
            }
        },
        
        renderHtml: function(h) {
            var sectionsLen = this._sections.length;

            h.push('<div id="' + _PIPELINE_CONTAINER + '" class="pipeContainer">');
            //h.push('<td style="vertical-align: middle;">');
            this._leftScroller.renderHtml(h);
            //h.push('</td>');
           
            h.push('<div id="' + _PIPELINE_OUTER + '"><div  id="' + _PIPELINE_INNER + '">');
            for(var iter=0; iter<sectionsLen; iter++) {
                this._sections[iter].renderHtml(h);
            }
            h.push('</div></div>');
            
            this._rightScroller.renderHtml(h);
            h.push('</div>');            
            
        }
    });
})();

/*********** SFPipelineSection ************/
function SFPipelineSection() {
    this.register();   
    this._items = [];
    this._separators = [];
    this._selItems = new Array();
    this._allItems = [];

}

SFPipelineSection.prototype = ( function() {
    var _SECTION_BEGIN_NOTSEL_CLASS = "leftGrayEnd";
    var _SECTION_BEGIN_SEL_CLASS = "leftBlueEnd";
    var _SECTION_END_NOTSEL_CLASS = "endGray";
    var _SECTION_END_SEL_CLASS = "endBlue";

    var _PIPE_JOINT_NOTSEL_NOTSEL = "rightJoinGray";
    var _PIPE_JOINT_NOTSEL_SEL = "rightJoinGrayBlue";
    var _PIPE_JOINT_SEL_NOTSEL = "rightJoinBlueGray";
    var _PIPE_JOINT_SEL_SEL = "rightJoinBlue";
    
    var _BEGIN_SECTION = 'beginSection_';
    var _END_SECTION = 'endSection_';
    /**
     * Private object for creating a separator between pipeline items 
     */
    function separator() {
        this.register();
    }
    separator.prototype = (function() {
        return set(new Component(), {
           renderHtml : function(h) {
                h.push("<li id=\"",this.id,"\" class=\"", _PIPE_JOINT_NOTSEL_NOTSEL, "\"><div> </div></li>");
            },
            
            updateCSS: function(cssClass) {
                $(this.id).className = cssClass;
            },
            
            getWidth: function() {
                return $(this.id).offsetWidth;    
            }
        });
    })();
    
    return set(new Component(), {
        addItem: function(comp) {
            assert(comp instanceof Component, "SFPipelineSection: addItem: JUIC Object (of type Component) is expected");
            var item = new SFPipelineItem(comp);
            item.addEventListener("action", this);
            this._items.push(item);
            this._allItems.push(item);
            this._updateDOM();
        },
        
        addSeparator: function() {
            var newSeparator = new separator();
            this._separators.push(newSeparator);
            this._allItems.push(newSeparator);
            this._updateDOM();
        },

        getComponentAt: function(idx) {
            assert(typeof idx == "number", "SFPipelineSection: getComponentAt: Invalid item index");
            
            return this._items[idx].getComponent();
        },
            
        getWidth: function(/*optional*/ itemIdx) {
            assert(itemIdx == undefined || typeof itemIdx == "number", "SFPipelineSection: getWidth: Invalid item index");
            var width = 0;
            var itemsLen = 0;
            
            if(itemIdx!=null && itemIdx!=undefined && itemIdx<=(this._items.length-1)) {
                itemsLen = this._getAllItemIdx(itemIdx);
            } else {
                itemsLen = this._allItems.length;   
            }

            if($(_BEGIN_SECTION + this.id)) {
                width += $(_BEGIN_SECTION + this.id).offsetWidth;
            }    
            
            for(iter=0; iter<itemsLen; iter++) {
                if($(this._allItems[iter].id)) {
                    width += this._allItems[iter].getWidth();
                }                
            }
            
            if(!itemIdx) {
                if($(_END_SECTION + this.id)) {
                    width += $(_END_SECTION + this.id).offsetWidth;
                }
            }
            
            return width;          
        },
        
        removeItem: function(idx) {
            assert(this._items.length > 1, "Can not remove last item of the section, please use removeSection method");
            var isFirstItem = (idx === 0) ? true: false;
            var isLastItem = (idx === this._items.length-1) ? true: false;
            
            var itemAtIdx = this._items[idx]; //
            var itemIdx = this._getAllItemIdx(itemAtIdx);
            this._allItems.splice(itemIdx, 1);
            if(isFirstItem) {
                //If fist item clicked, remove separator after it
                this._allItems.splice(0, 1);
            }
            this._items.splice(idx, 1);
            
            //Remove separator:
            if(itemIdx > 1) {
                if(this._allItems[itemIdx-1] instanceof separator) {
                    this._allItems.splice(itemIdx-1, 1);
                }
            }
            
            var iter, selLen = this._selItems.length;
            
            //Update the this._selItems array
            var isEleRemoved;
            for(iter=0; iter<selLen; iter++) {
                if(this._selItems[iter] == idx) {
                    this._selItems.splice(iter, 1);                    
                    break;
                }
            }
            selLen = this._selItems.length;
            
            for(iter=0; iter<selLen; iter++) {            
                if(this._selItems[iter]!=null && this._selItems[iter]!=undefined) {
                    if(this._selItems[iter] > idx) {
                        this._selItems[iter]--;
                    }                        
                }                    
            }            
            
            this._updateDOM();
            
            if(isLastItem && idx!=0) {
                idx--;
            }       
            
            var isPrevSel, isNextSel, isCurSel = this._contains(this._selItems, idx) ? true: false;
            if(idx == 0) { //First item clicked on ==> no prev item
                isPrevSel = null;
            } else {
                isPrevSel = this._contains(this._selItems, (idx - 1)) ? true: false;  
            }

            
            if(idx === this._items.length-1) {
                isNextSel = null;
            } else {
            isNextSel = this._contains(this._selItems, (idx + 1)) ? true: false; 
            }

            this._refreshSeparatorsForItemAt(idx, isPrevSel, isCurSel, isNextSel);
            this.dispatch("itemRemoved", {});
        },
        
        cleanup: function() {
            var allItemsLen = this._allItems.length, iter=0;
            for(iter=0; iter<allItemsLen; iter++) {
                this._allItems[iter].cleanup();
            }
            this.unregister();
        },
    
        _refreshSeparatorsForItemAt: function(idx, isPrevSel, isCurSel, isNextSel) {
            var itemIdx = this._getAllItemIdx(idx);
            var leftSep = this._allItems[itemIdx - 1];
            var rightSep = this._allItems[itemIdx + 1];
            
            var leftSepCss, rightSepCss;
            
            if(isPrevSel) {
                if(isCurSel) {
                    leftSepCss = _PIPE_JOINT_SEL_SEL;
                } else {
                    leftSepCss = _PIPE_JOINT_SEL_NOTSEL;
                }
            } else {
                if(isCurSel) {
                    leftSepCss = _PIPE_JOINT_NOTSEL_SEL;
                } else {
                    leftSepCss = _PIPE_JOINT_NOTSEL_NOTSEL;
                }            
            }
            
            if(isNextSel) {
                if(isCurSel) {
                    rightSepCss = _PIPE_JOINT_SEL_SEL;
                } else {
                    rightSepCss = _PIPE_JOINT_NOTSEL_SEL;    
                }
            } else {
                if(isCurSel) {
                    rightSepCss = _PIPE_JOINT_SEL_NOTSEL;
                
                } else {
                    rightSepCss = _PIPE_JOINT_NOTSEL_NOTSEL;
                }            
            }

            if(itemIdx == 0) {
                if(isCurSel) {
                    $(_BEGIN_SECTION + this.id).className = _SECTION_BEGIN_SEL_CLASS;
                } else {
                    $(_BEGIN_SECTION + this.id).className = _SECTION_BEGIN_NOTSEL_CLASS;
                }
                
                if(itemIdx === this._allItems.length - 1) {
                    if(isCurSel) {
                        $('endSection_' + this.id).className = _SECTION_END_SEL_CLASS;
                    } else {
                        $('endSection_' + this.id).className = _SECTION_END_NOTSEL_CLASS;
                    }
                    
                } else {
                    rightSep.updateCSS(rightSepCss); 
                }

            } else {
                leftSep.updateCSS(leftSepCss);
                if(itemIdx === this._allItems.length - 1) {
                    if(isCurSel) {
                        $('endSection_' + this.id).className = _SECTION_END_SEL_CLASS;
                    } else {
                        $('endSection_' + this.id).className = _SECTION_END_NOTSEL_CLASS;
                    }
                } else {
                    rightSep.updateCSS(rightSepCss); 
                }
            }            
            
        },

        setItem: function(idx, comp) {
            assert(comp instanceof Component, "SFPipelineSection: setItem: JUIC Object (of type Component) is expected");
            assert(typeof idx == "number", "SFPipelineSection: setItem: Invalid item index");
            
            var item = this._items[idx]; 
            var itemIdx = this._getItemIdx(item);

            var newItem =  new SFPipelineItem(comp);
            
            //Update this._items and this._allItems arrays
            this._items[idx] = newItem;
            this._allItems[itemIdx] = newItem;
            
            this._updateDOM();
        },
        
        setItemSelection: function(comp, bool) {
            assert(comp instanceof Component, "SFPipelineSection: setItemSelection: JUIC Object (of type Component) is expected");
            
            var compId = comp.id;
            var itemIdxContainingComp = this._getItemIdxContainingComp(compId);            
            this._setItemSelection(itemIdxContainingComp, bool);
        },
        
        setItemSelectionAt: function(idx, bool) {
            assert(typeof idx == "number", "SFPipelineSection: setItem: Invalid item index");
            this._setItemSelection(idx, bool);
        },
        
        _remove: function(array, item) {
            var iter, len = array.length;
            for(iter=0; iter<len; iter++) {
                if(array[iter] === item) {
                    array.splice(iter, 1);
                }
            }
        },
        
        _setItemSelection: function(idx, bool) {
            this._items[idx].setSelection(bool);
            var isCurSel, isPrevSel, isNextSel;
            if(idx || idx === 0) {
                if(bool) {
                    this._selItems.push(idx);    
                } else {
                    this._remove(this._selItems, idx);
                }
                
                this._items[idx].setSelection(bool);
                
                isCurSel = bool;
                if(idx == 0) { //First item clicked on ==> no prev item
                    isPrevSel = null;
                } else {
                    isPrevSel = this._contains(this._selItems, (idx - 1)) ? true: false;  
                }
                                
                if(idx === this._items.length-1) {
                    isNextSel = null;
                } else {
                    isNextSel = this._contains(this._selItems, (idx + 1)) ? true: false; 
                }

                this._refreshSeparatorsForItemAt(idx, isPrevSel, isCurSel, isNextSel);
            }   
        },
        
        renderHtml: function(h) {
                var itemsLen = this._allItems.length;
                h.push('<ul class="pipe" id="' + this.id + '">');
                if(itemsLen > 0) {
                    h.push('<li id="' + _BEGIN_SECTION + this.id + '" class="' + _SECTION_BEGIN_NOTSEL_CLASS + '"> </li>');
                    for(iter=0; iter<itemsLen; iter++) {
                        this._allItems[iter].renderHtml(h);
                    }
                    h.push('<li id="endSection_', this.id, '" class="', _SECTION_END_NOTSEL_CLASS, '"> </li>');
                }
                h.push('</ul>');
        },
        
        _updateDOM: function() {
            var h = [], itemsLen = this._allItems.length;
            var secBeginClass = this._contains(this._selItems, 0) ? _SECTION_BEGIN_SEL_CLASS: _SECTION_BEGIN_NOTSEL_CLASS; 
            var secEndClass = this._contains(this._selItems, (itemsLen-1)) ? _SECTION_END_SEL_CLASS: _SECTION_END_NOTSEL_CLASS; 
            
            h.push('<li id="beginSection_', this.id, '" class="', secBeginClass, '"> </li>');
            for(var iter=0; iter<itemsLen; iter++) {
                this._allItems[iter].renderHtml(h);
            }
            h.push('<li id="endSection_', this.id, '" class="', secEndClass, '"> </li>');            
            if($(this.id)) {
                $(this.id).innerHTML = h.join('');
            }
        },
        
        _getAllItemIdx: function(item) {
            var allItemsLen = this._allItems.length;
            var iter = 0;
            if(typeof item == "number") {
                for(iter=0; iter<allItemsLen; iter++) {
                    if(this._allItems[iter].id ===  this._items[item].id) {
                        return iter;
                    }
                }
            } else {
                for(iter=0; iter<allItemsLen; iter++) {
                    if(this._allItems[iter].id ===  item.id) {
                       return iter;
                   }
                }
            
            }
            return -1;
        },
        
        _getItemContainingComp: function(compId) {
//            var itemsLen = this._items.length;
//            var iter = 0;
//            for(iter=0; iter<itemsLen; iter++) {
//                if(this._items[iter].getComponent().id ===  compId) {
//                    return this._items[iter];
//                }
//            }
//            return null;
        },

        _getItemIdxContainingComp: function(compId) {
            var itemsLen = this._items.length;
            var iter = 0;
            for(iter=0; iter<itemsLen; iter++) {
                if(this._items[iter].getComponent().id ===  compId) {
                    return iter;
                }
            }
            return null;
        },

        _getItemIdx: function(itemId) {
            var itemsLen = this._items.length;
            var iter = 0;
            for(iter=0; iter<itemsLen; iter++) {
                if(this._items[iter].id ===  itemId) {
                    return iter;
                }
            }
            return -1;        
        },
        
        handleEvent: function(evt) {
            if(evt.actionCommand === "itemSelected") {
                var idx = this._getItemIdx(evt.id);
                this.dispatch("action", {actionCommand: "itemSelected", isCtrlClick: evt.isCtrlClick, isShiftClick: evt.isShiftClick, id: evt.id, idx: idx, secId: this.id, comp: evt.comp});
            }
        },
        
        _contains: function(arr, val) {
            var iter = 0;
            for(iter=0; iter<arr.length; iter++) {
                if(arr[iter] == val) {
                    return true;
                }
            }
            return false;
        }
    });
})();

/*********** SFPipelineItem ************/
function SFPipelineItem(comp) {
    //// assert comp
    this._isSel = false;
    this._comp = comp;
    this.register();
}

SFPipelineItem.prototype = ( function() {
    var _ITEM_NOT_SELECTED_CLASS = "middleGray";
    var _ITEM_SELECTED_CLASS = "middleBlue";
    var _DRAG_TARGET_CLASS = "dropTarget";
    return set(new Component(), {
        setComponent: function(comp) {
            //// assert comp
            this._comp = comp;
        },
        
        getComponent: function() {
            return this._comp;
        },
        
        getWidth: function() {
            return $(this.id).offsetWidth;    
        },
        
        setSelection: function(bool) {
            this._isSel = bool;
            if(bool) {
                $(this.id).className = _ITEM_SELECTED_CLASS;
            } else {
                $(this.id).className = _ITEM_NOT_SELECTED_CLASS;
            }
        },
        
        renderHtml: function(h) {
            var cls = this._isSel ? "middleBlue" : "middleGray";
            
            h.push('<li id="', this.id, '" class="', cls, '" ', ' onclick="' + this.fireCode("_click", this.id) + '"> ');
            if(this._comp) { this._comp.renderHtml(h) };
            h.push('</li>');
        },
        
        _click: function(id, evt) {
            var comp = this.getComponent();
            this.setSelection(true);            
            this.dispatch("action", {actionCommand: "itemSelected", isCtrlClick: evt.ctrlKey, isShiftClick: evt.shiftKey, id: this.id, comp: comp});
        }
    });
})();


/*********** SFPipelineScroller ************/
function SFScroller(dir) {
    //// assert boolean or string
    this.register();
    this._dir = dir;
}

SFScroller.prototype = ( function() {
    var LEFT_SCROLL_DISABLED = "leftScrollDisabled";
    var RIGHT_SCROLL_DISABLED = "rightScrollDisabled";
    var LEFT_SCROLL_ENABLED = "leftScrollEnabled";
    var RIGHT_SCROLL_ENABLED = "rightScrollEnabled";
    return set(new Component(), {
        renderHtml: function(h) {
            if(this._dir == LEFT) {
                h.push('<div class="' + LEFT_SCROLL_ENABLED + '" id="' + this.id  + '" onclick="' + this.fireCode("_scroll") + '"></div>');
            } else if(this._dir == RIGHT) {
                h.push('<div class="' + RIGHT_SCROLL_ENABLED + '" id="' + this.id + '" onclick="' + this.fireCode("_scroll") + '"></div>');
            }
        },
        
        _scroll: function(dir) {
            if($(this.id)) {
                if($(this.id).className.indexOf("Enabled") != -1) {
                    this.dispatch("action", {actionCommand: "scroll", dir: dir});    
                }
            }            
        },
        
        enable: function(boolEnable) {
            if($(this.id)) {
                if(boolEnable) {
                    if($(this.id).className.indexOf("Disabled") !=- -1) {
                        $(this.id).className = $(this.id).className.replace("Disabled", "Enabled");
                    }
                } else {
                    if($(this.id).className.indexOf("Enabled") !=- -1) {
            $(this.id).className = $(this.id).className.replace("Enabled", "Disabled");
                    }                    
                }                
            }
        }
    });
})();

