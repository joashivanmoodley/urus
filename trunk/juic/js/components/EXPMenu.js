/**
 List Menu JUIC widget object.

 EXPMenuList: This creates the wrapper of the menu items. User can add an id and classes to the menu list.
           Parameters:
                _menuId: Id of the menu
                _menuClass: class style of the menu
                _menuItems: list of item objects of the menu

           Methods:
                insertItem: TBD (Do we need it?)
                delteItem: TBD (Do we need it?)


 EXPMenuListItems: List of the items of the menu.
            Parameters:
                _label: Text to be shown on the screen
                _objRef: Object to be displayed in the menu. This parameter should be an array with first element being
                         the object Reference and the second element being a JSON object of parameters needed to build
                         the object.
                NOTE: Only one of the two elements aove should be used to construct a menu item.
                _title: Text to be shown when hovering the item
                _state: the state of the item by default is normal, other possible states are "selected" and "greyedOut"
                        each state will determine the CSS style class of the item.
                _click: Function to be invoked on the click event of the item.
                _focus: Function to be invoked on the focus event of the item.
            Methods:
                clickHandler: This is the method that will be fired when there is an onClick event on the item
                focusHandler: This is the method that will be fired when there is an onFocus event on the item

 pillBar: EXPMenuList wrapped in a pill bar style.

 slideListMenu:  slide menu wrapped with simple list class.
                Parameters:
                   _direction
                   _slideType
                   _arrowId
                   _menuId
                   _menuList
                Methods:
                  getSlideStyle: Returns a JSON object of the style classes to be used to build the object.
                  Possible values:
                    list: to create a slider list of items
                    help: to create a help slider.

 slideMenu: Vertical menu with sliding animation
 slideHelpMenu: slide menu wrapped with help class.

 menuNavBar: This is a composed object of horizontal menu list and slider menu.

 slidingAnim: Sliding Animation for list menu.

 */

/**
 * EXPMenuList constructor
 * @param value
 */
function EXPMenuList(value, config) {
    this.register();
    this.setValue(value);
    this._config = config;
    if (config) {
        this._menuClass = this._config.menuClass;
        this._isLinkItems = this._config.isLinkItems;
        this._dispatchEventNames = this._config.dispatchEventNames;
    }
    this._menuItem = new EXPMenuItem(this._value, {isLinkItems:this._isLinkItems, dispatchEventNames:this._dispatchEventNames});
    this._menuItem.addEventListener('click', this);
    if (this._dispatchEventNames) {
    	for (var index=0, len=this._dispatchEventNames.length;index<len;index++) {
    		this._menuItem.addEventListener(this._dispatchEventNames[index], this);
    	}
    }
}

EXPMenuList.prototype = (function() {
     return set(new Component(), {
        setValue: function (value) {
          this._value = value;
        },
        getAllItems: function() {
          return this._menuItem.getAllItems();
        },
        getItem: function(index) {
          return this._menuItem.getItem(index);
        },
        getLastItem: function() {
          return this._menuItem.getLastItem();
        },
        insertItem: function(item) {
           this._menuItem.insert(item);
        },
        deleteItem: function() {
           // TBD
        },
        renderHtml: function(h) {
            h.push('<ul class="menuList'+ (this._menuClass? " "+ this._menuClass : "") + '" id="'+ this.id + '">');
            this._menuItem.renderHtml(h);
            h.push('</ul>');
        },
        reRender: function() {
        	var h = [];
        	this._menuItem.renderHtml(h);
     	   	$(this.id).innerHTML = h.join("");
        },
        handleEvent: function(evt) {
        	switch(evt.type) {
	    	  case 'click':
	    		  this.dispatch("click", {src:evt.obj, param:evt.param});
	    		  break;
        	  default:
        		  this.dispatch(evt.type, arguments[0]);
        	}
        },
        cleanup: function() {
            this._menuItem.cleanup();
            this.unregister();
        }
    });
})();

/**
 * menuRow constructor
 * @param value Can be a simple object or a JUIC object, if it is a JUIC object renderHtml of the object will be invoked to
 * display the HTML representation of the object.
 * possible configuration values:
 *      state: if needed if state is true then a selected css class is applied to the item
 */
function EXPMenuItem(value, config) {
    this.register();
    this.setValue(value);
    this._menuItems = [];
    this._config = config;
    if (config) {
    	this._isLinkItems = config.isLinkItems;
    	this._dispatchEventNames = config.dispatchEventNames;
    }
    this.init();
}

EXPMenuItem.prototype = (function() {
     return set(new Component(), {
        setValue: function (value) {
          this._value = value;
        },
        init: function() {
           for (var i=0,len=this._value.length; i < len; i++) {
        	 this.insert(this._value[i]);
           }
        },
        insert: function(item) {
        	// Both Label and objRef cannot be defined, if simple object then add the value to the array. Otherwise, add the object
        	assert(((item.label !== undefined) === !(item.objRef !== undefined)),"All items of the list must have or a label or an object reference.");
        	if (item.label) {
      		  this._menuItems.push({val:item});
      	  	}
      	  	else {
      	  	  var obj = new item.objRef[0](item,item.objRef[1]);
      	  	  if (this._dispatchEventNames) {
      	  		for (var index=0, len=this._dispatchEventNames.length;index<len;index++) {
      	  		  obj.addEventListener(this._dispatchEventNames[index], this);
      	  		}
      	  	  }
      		  this._menuItems.push({val:item, obj: obj});
      	  	}
        },
        getAllItems: function () {
        	return this._menuItems;
        },
        getItem: function(index) {
        	return this._menuItems[index];
        },
        getLastItem: function() {
        	return this._menuItems[this._menuItems.length-1];
        },
        /* function invoked on the click event of the item */
        clickHandler: function (param) {
            this.dispatch("click", {obj:this, param:param});
        },
        /* function invoked on the focus event of the item */
        focusHandler: function () {
            this.dispatch("focus",this);
        },
        /* get label or render from the object */
        getListItemContent: function(item,h) {
        	if (item.obj) {
        		item.obj.renderHtml(h);
        	}
        	else {
        		h.push(item.val.label);
        	}
        },
        renderHtml: function (h) {
           for (var i=0,len=this._menuItems.length; i < len; i++) {
            h.push('<li class="'+ (this._menuItems[i].val.state ? "selected" : "") +'"><span>');
            if (this._isLinkItems) {
            	var alt = this._menuItems[i].val.title ? this._menuItems[i].val.title : '';
	            h.push('<a href="javascript:void(0);" ' +
	                    'alt="'+ alt + '" '+ (this._menuItems[i].val.click ? 'onclick="'+
	                    this.fireCode("clickHandler", this._menuItems[i].val.param ? this._menuItems[i].val.param : i)
	                    +'"' : "") +' '+ (this._menuItems[i].val.focus ? 'onfocus="'+ this.fireCode("focusHandler") +'"' : "") +
	                    '>');
            }
            this.getListItemContent(this._menuItems[i],h);
            if (this._isLinkItems) {
            	h.push('</a>');
            }
            h.push('</span></li>');
           }
        },
        handleEvent: function(evt) {
        	this.dispatch(evt.type, arguments[0]);
        },
        cleanup: function() {
        	for (var index=0,len=this._menuItems.length; index < len; index++) {
        		if (this._menuItems[index].obj) {
        			this._menuItems[index].obj.cleanup();
        		}
        	}
            this.unregister();
        }
    });
})();


/**
 * pillBar constructor -> Wrapper of menu list
 *
 * @param value
 */
function pillBar(value) {
    this.register();
    this.setValue(value);
    this._menuList = new EXPMenuList(this._value);
    // load config
}

pillBar.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
          this._value = value;
        },
        renderHtml: function (h) {
            h.push('<div class="view_pill"><div class="pill_l"></div><div style="float:left">');
            this._menuList.renderHtml(h);
            h.push('</div><div class="pill_r"></div></div>');

        }
    });
})();

/**
 * slideHelpMenu; object wrapper of slideMenu to show a help menu.
 * @param value
 * @param config
 */
function slideHelpMenu (value, config) {
    this._value = value;
    this._direction = config.menuShowingdirection;
    return  new slideMenu(this._value,{
        slideType: "help",
        slideTitle: "Help",
        menuShowingdirection: this._direction
    });
}

/**
 * slideListMenu: object wrapper of slideMenu to show a list menu.
 * @param value
 * @param config
 */
function slideListMenu (value, config) {
    this._value = value;
    this._direction = config.menuShowingdirection;
    return  new slideMenu(this._value,{
        slideType: "list",
        slideTitle: "List",
        menuShowingdirection: this._direction
    });
}

/**
 * Wrapper of EXPMenuList with slideDown effect attached. This object will display a clickable icon that onclick event will
 * display a list menu.
 * @param value: menu item object
 * @param config:
 *     - menuShowingdirection: position of appearance of the menu
 *              {
 *                  r: right
 *                  l: left
 *                  b: bottom
 *                  bl: bottom left
 *                  br: bottom right
 *              }
 *      - slideType: Preset styles of the list. Possible values are list and help. If a new style is added developper
 *        needs to configure the class as in getSlideStyle. 3 CSS classes need to be determined: the wrapper class of
 *        the menu, a CSS class for the clickable icon and a class for the menu list.
 *      - slideTitle: is optional and will be the hover text on the clickable icon
 *    Example for creation of the object:
 *          new slideMenu(this._value,{
                slideType: "help",
                slideTitle: "Help",
                menuShowingdirection: b
            }
 */

function slideMenu(value, config) {
    this.register();
    this._direction = config.menuShowingdirection;
    this._slideType = this.getSlideStyle(config.slideType);
    this.setValue(value);
    this._title = config.slideTitle;
    this._arrowId = "arrow" + this.id;
    this._menuId = "menu" + this.id;
    this._menuList = new EXPMenuList(this._value, {isLinkItems:true});
    this._menuList.addEventListener('click', this);
}

slideMenu.prototype = (function() {
    return set(new Component(), {
        setValue: function (value) {
            this._value = value;
        },
        refresh: function(value) {  // refreshes the object with new values
            this.setValue(value);
            return this;
        },
        getSlideStyle: function (typeName) {
          switch(typeName){
            case "list":
              return {
                  slideMenuWrapperClass: "menu_arrow_wrapper",
                  slideMenuIconClass: "menu_arrow",
                  slideMenuClass: " list"};
              break;
            case "help":
              return {
                  slideMenuWrapperClass: "help_link_wrapper",
                  slideMenuIconClass: "help_link",
                  slideMenuClass: " help select-free"};
              break;
            default:
              return {
                  slideMenuWrapperClass: typeName.wrapperClass,
                  slideMenuIconClass: typeName.iconClass,
                  slideMenuClass: typeName.menuClass
              };
            }
        },
        postRender: function () {
            this._slidingAnim = new slidingAnim(this);
            var that = this;
            this._slidingAnim.dispatch = (function() {
                that.postRenderMenu();
            })
        },
        postRenderMenu: function() {},
        renderHtml: function (h) {
        	var title = this._title ? this._title : '';
            h.push('<div id="arrow' + this.id + '" name="arrow' + this.id + '" '+ (this._slideType.slideMenuWrapperClass ? 'class="' + this._slideType.slideMenuWrapperClass + '"' : "") + '>' +
                    '<a title="'+title+'" '+ (this._slideType.slideMenuIconClass ? 'class="' + this._slideType.slideMenuIconClass + '"' : "") + ' name="'+this._title+'_menu_anchor" '+
                    'id="'+this._title+'_menu_anchor" onclick="return false;" href="javascript:void(0);"></a><div ' +
                    'id="menu' + this.id + '" name="menu' + this.id + '" class="x-menu' + (this._slideType.slideMenuClass ? ' '+this._slideType.slideMenuClass : "") + '" ' +
                    'style="position:absolute;">');
            this._menuList.renderHtml(h);
            h.push('<iframe id="iframearrow' + this.id + '" name="iframearrow' + this.id + '" style="height:1px;width:1px;z-index:3" src="javascript:false;"></iframe></div></div>')

        },
        cleanup: function() {
            this._menuList.cleanup();
            this.unregister();
        },
        handleEvent: function(evt) {
        	switch(evt.type) {
	    	  case 'click':
	    		  this.dispatch("click", {src:evt.obj, param:evt.param});
	    		  break;
	    	  }
        }
    });
})();

/**
 * Effect to be attached to EXPMenuList
 * @param obj
 */
function slidingAnim(obj) {
    this._id = obj._arrowId;
    this.htmlRoot = $(this._id);
    this.container = obj._menuId;
    this.flag = "closed";
    this._direction = obj._direction;
    this.currheight = 0;
    var that = this;
    this.onClick = function(){
        var anim = "";
        this.containerHeight = this.getFirstNodeChild($(this.container)).offsetHeight;
		if (this.flag === "closed") {
            this.attributes = {
                height: { from: 0, to: this.containerHeight }
            };
            anim = new YAHOO.util.Motion(this.container, this.attributes, .5, YAHOO.util.Easing.easeOut);
            anim.animate();
        } else  {
            this.attributes = {
                height: { from: this.containerHeight, to: 0 }
            };
            anim = new YAHOO.util.Motion(this.container, this.attributes, .5, YAHOO.util.Easing.easeIn);
            anim.animate();
        }
        this.flag = (this.flag === "closed" ? this.flag = "opened" : this.flag = "closed");
        if ($("helpIframe"+ this._id)) $("helpIframe"+ this._id).style.display = "none";
    };
    YAHOO.util.Event.on(this._id, 'click', function() {
            that.onClick();
    });
    YAHOO.util.Event.addListener(window, "resize", function() {
            that.loadresize();
    });

    this.loadresize = function() {
	    if(this.currheight != document.documentElement.clientHeight)
	    {
		    this.dispatch();
	    }
	    this.currheight = document.documentElement.clientHeight;
    }
    //need to be moved to DomUtil
    //this is to get the first child of the given node
    this.getFirstNodeChild = function(node) {
    	var child;
  	    var children = node.childNodes;
  	    for(var i = 0; i < children.length; i++){
  	    	child = children[i];
	  	    if(child.nodeType == 1) return child;
	  	}
	  	return null;
    },
    /* Place the sliding menu next to its point of origin */
    this.positionMenu = function() {
        switch(this._direction){
            case "r":
              $(this.container).style.left = this.htmlRoot.offsetWidth + "px";
              break;
            case "l":
              $(this.container).style.left = ($(this.container).offsetLeft - $(this.container).offsetWidth) + "px";
              break;
            case "b":
              $(this.container).style.top = this.htmlRoot.offsetHeight + "px";
              break;
            case "bl":
              $(this.container).style.top = this.htmlRoot.offsetHeight+ "px";
              $(this.container).style.left = ($(this.container).offsetLeft - $(this.container).offsetWidth) + "px";
              break;
            case "br":
              $(this.container).style.top = this.htmlRoot.offsetHeight + "px";
              $(this.container).style.left = this.htmlRoot.offsetWidth + "px";
              break;
            default:
              return null;
            }
    }
    this.positionMenu();
}


