//! include /ui/juic/js/components/JUICCommon.js
//! include /ui/uicore/css/components/sfPopMenu.css
function SFList(type) {
    this.register();
    this._init(type)
}
SFList.prototype = ( function() {
    function SFListItem(actionItem) {
        this.actionItem = actionItem;
    }

    SFListItem.prototype = ( function() {
        return set(new Component(), {
            renderHtml : function(h) {
                h.push('<li>');
                if (this.actionItem)
                    this.actionItem.renderHtml(h)
                h.push('</li>');
            }
        });
    })();
    function SFListSeparator() {
    }

    SFListSeparator.prototype = ( function() {
        return set(new Component(), {
            renderHtml : function(h) {
                h.push('<li class="separator"><div>&nbsp;</div></li>');
            }
        });
    })();
    function switchType(type) {
        var returnType;
        switch (type) {
            case "CheckBoxList" :
            case "RadioButtonList" :
                returnType = 'ckrbList';
                break;
            case "comboDropDown":
                returnType = 'comboField';
                break;
            default:
                returnType = 'sf-PopMenu';
                break;
        }
        return returnType;
    }

    return set( new Component(),
    {
        _scrollBarWidth : 18,
        _fixedHeight : false,
        /**
         * this method will append a new menu item at the bottom of the list
         * @param JUICObj Component/array of components
         */
        add : function(JUICObj) {
            // check if the obj is a array and push it to the list item array
            if (JUICObj.length) {
                for (var objIndex = 0, objLength = JUICObj.length; objIndex < objLength; objIndex++) {
                    this._listItems.push(new SFListItem(JUICObj[objIndex]))
                }
            } else {
                this._listItems.push(new SFListItem(JUICObj))
            }
            this._drawList();
        },
        /**
         * this method will append a Separator line to the menu list
         */
        addSeparator : function() {
            this._listItems.push(new SFListSeparator())
            this._drawList();
        },
        /**
         * this method will remove an item with a specific index
         * @param JUICObj  Component
         */
        remove : function(JUICObj) {
            // fid the object from the array an remove it
            for (var listItmIndex = 0, listItmLength = this._listItems.length; listItmIndex < listItmLength; listItmIndex++) {
                if (this._listItems[listItmIndex].actionItem === JUICObj) {
                    this._listItems.splice(listItmIndex, 1)
                }
            }
            this._drawList()
        },
        _init : function(type) {
            this._styleClass = switchType(type);
            this._listItems = [];
            this._domReady = false;
        },
        _drawListItems : function(h) {
            h.push('<ul class="', this._styleClass, '">');
            for (var listIndex = 0, listLength = this._listItems.length; listIndex < listLength; listIndex++) {
                this._listItems[listIndex].renderHtml(h);
            }
            h.push('</ul>');
        },
        _drawList : function() {
            if (!this._domReady) {
                return false
            }
            var h = []
            this._drawListItems(h)
            $(this.id).innerHTML = h.join("");
        },
        /*
             this will set a fixed height to the list.
             and this method should be called after the object is rendered in the page
         */
        setFixedHeight : function(height){
            assert(!height || typeof height == 'number' || height == "auto", "[SFList] : innerWidth parameter must be a number or auto.");
            var wrapperDiv = $(this.id)
            if(height != "auto" && wrapperDiv && wrapperDiv.offsetHeight > height){
                wrapperDiv.style.height = height + "px";
                wrapperDiv.style.overflow = "auto";
                this._fixedHeight = true;
                wrapperDiv.style.width = wrapperDiv.offsetWidth + this._scrollBarWidth + "px"; // hardcoding the width so that in ie iw will render the scrollbar outside the content
            }else{
                this._fixedHeight = false;
            }
        },
        hasFixedHeight : function(){
               return this._fixedHeight;
        },
        renderHtml : function(h) {
            h.push('<div id="', this.id, '" class="', this._styleClass, '">');
            this._drawListItems(h);
            h.push('</div>');
            this._domReady = true;
        }
    });
})();
/*
 function testObject() {
 this.register();
 this.init()
 }
 testObject.prototype = ( function() {
 return set(new Component(), {
 init : function() {
 this.listObj = new SFList();
 this.link = []
 for ( var iIndex = 0, iLength = 2; iIndex < iLength; iIndex++) {
 var link = new SFLink('ListItem' + iIndex, {
 clickParam : 'ListItem' + iIndex
 });
 this.link.push(link)
 this.link[iIndex].addEventListener('click', this);
 }

 this.listObj.add(this.link);
 this.listObj.addSeparator()
 var link = new SFLink('ListItemitem', {
 clickParam : 'remove'
 });
 link.addEventListener('click', this);
 this.listObj.add(link);

 },
 renderHtml : function(h) {
 this.listObj.renderHtml(h);
 },
 handleEvent : function(evt) {
 switch (evt.type) {
 case 'click':
 alert(arguments[0].param)
 if("remove" == arguments[0].param) {
 this.listObj.remove(evt.target)
 }
 break;
 default:
 alert("unknown event!!" + evt.type);
 break;
 }
 }
 });
 })();
 function testList() {
 var testObjec = new testObject();
 testObjec.render('ListItemDIV')
 }
 */