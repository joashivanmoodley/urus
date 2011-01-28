//! include /ui/juic/js/components/sfPositionManager.js
//! include /ui/uicore/css/components/sfPopMenu.css

/**
 * Hover Menu creates a floating menu
 * Menu will auto hide on-mouse-out unless there is a selected item
 * @param originatorId            - string     - R  - id of the object to which the menu has to stick on
 * @param menuItems               - JSONArray  - R  -  
 *							                            label      - string - R  - label to be displayed 
 *							                            value      - string - R  - value to be returned on select 
 *							                            styleClass - string - NR - style to be applied 
 * @param styleClass              - string     - NR - style class for the menu item defaulted to "sf-actionMenu"
 * @param autoHide                - bool       - NR - weather or not to hide the menu after one second
 * @param title                   - string       - NR - html title string
 */
function sfPopMenu(originatorId, menuItems, styleClass, autoHide){
  this.register();
  assert(menuItems,"[SFXIPOPMenu] :Menu Items JSON required")
  assert(originatorId,"[SFXIPOPMenu] : originatorId String required")
  this.menuItems = menuItems;
  this.openOriginId = originatorId;
  this.styleClass = styleClass  ?  styleClass: "sf-PopMenu";
  this.autoHide = autoHide ? autoHide : false; 
  this.init();
}

sfPopMenu.prototype = (function() {
  return set(new Component(), {
	  init : function(){
	  		this.selectedIndex = -1;
	  		this.hideTimeout;
  	  },
	  renderHtml : function(h) {
        h.push('<div id="' , this.id , '" class="' , this.styleClass , '" ><ul  class="' , this.styleClass , '" >');
        for(var index = 0,len=this.menuItems.length; index < len; index++) {
          var item = this.menuItems[index];
          if (item.title) {
            h.push('<li title="', escapeHTML(item.title), '">');
          } else {
            h.push('<li>');
          }
          if (item.styleClass == "disabled") {
            h.push('<span class="disabled" id="hm_', this.id, '_', index, '">', item.label, '</span>'); 
          } else {
            h.push(	'<a class="' , item.styleClass , '" href="javascript:void(0);" ')
            if(this.autoHide){
              h.push(      'onmouseover="' , this.fireCode('_hideTimer',false) , 'return false;" ' , 
                         'onmouseout="' , this.fireCode('_hideTimer',true) , 'return false;" ')
            }
            h.push(		   'onclick="' , this.fireCode('_fetchItem',index) , 'return false;">'  , 
                      '<span id="hm_' , this.id , '_' , index , '">'  ,  item.label  ,  '</span>'  , 
                  '</a>');
          }
          h.push('</li>');		  
        }
        h.push('</ul></div>');
      },
      _hideTimer:function(isShow){
		  if(isShow){
				  var self = this
				  this.hideTimeout = setTimeout(function(){self.hide()}, 1000);
		  }
		  else
		  {
			  clearTimeout(this.hideTimeout);
		  }
      },
      _hideCallbackFn : function(e, obj){
    	  obj.hide();
      },
      show: function(){
    	  var self = this;
    	  SFPositionManager.showMenu(this, this.openOriginId);
    	  if(this.autoHide){
    		  this._hideTimer(true);
    	  }
    	  setTimeout( function() {YAHOO.util.Event.addListener(window.document, 'click', self._hideCallbackFn, self)}, 10);    	  
      },
      hideAfterPass:function(){
    	  this._hideTimer(true)
      },
      hide : function(){
    	  this.selectedIndex = -1;
    	  var self = this;
	      YAHOO.util.Event.removeListener(window.document, "click", self._hideCallbackFn);
	      this.dispatch("hide"); 
      },
      _fetch : function(){
    	  var item = this.menuItems[this.selectedIndex];
    	  return {value:item.value,label:item.label};
      },
      _fetchItem: function (itemIndex){
    	  this.hide();
          this.selectedIndex = itemIndex;
          this.dispatch("menuSelected", this._fetch());
      },
      handleEvent : function(evt){
    	  switch(evt.type){
    	  	case "menuActionComplete":
	  	        this.hide();
	  	        break;
	  		default :
	  			alert("unknown event!! :: HoverMenu");
	  		    break;
	  		}
      }
    
  });
})();
