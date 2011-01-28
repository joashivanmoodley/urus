//! include /ui/juic/js/core/component.js
//! include /ui/uicore/js/Util.js
//! include /ui/uicore/css/bun_folder.css
//! include /ui/juic/js/components/sfDOMEvent.js

/**
 * Hambun that has a fixed header,footer and a resizing body.
 *
 *
 */
function SFHamBun() {
    this.register();
    this.init();
}

SFHamBun.prototype = (function() {
    var MIN_HEIGHT = 25;
    var PAGE_PADDING_BOTTOM = 8;
    var SCROLL_PADDING = 9;

    /**
     * Inner ham bun top object.
     */
    function HamBunTop() {
        this.register();
        this.init();
    }

    HamBunTop.prototype = (function() {
        return set(new Component(), {
            init : function() {
            this._component;
        },
        renderHtml : function(h) {
            h.push('<span class="ct"><span class="cl">&nbsp;</span></span>');
            h.push('<div class="hd" id="' , this.id , '">');
            if(this._component) {
                this._component.renderHtml(h);
            }
            h.push('</div>');
        },
        setComponent : function(component) {
            this._component = component;

      if ($(this.id))
        this._component.render(this.id);
    }
        });
    })();

    /**
     * Inner ham bun bottom object that renders the footer.
     */
    function HamBunBottom() {
        this.register();
        this.init();
    }

    HamBunBottom.prototype = (function() {
        return set(new Component(), {
            init : function() {
            this._component;
        },
        renderHtml : function(h) {
            h.push('<div class="button_row">');
            h.push('<div class="right" id="' , this.id , '">');
            if (this._component) {
                this._component.renderHtml(h);
            }
            h.push('</div>');
            h.push('</div>');

            h.push('<span class="cb" id="', this.id ,'cb"><span class="cl">&nbsp;</span></span>');
        },
        setComponent : function(component) {
            this._component = component;

            if ($(this.id))
              this._component.render(this.id);
            }
        });
    })();



    /**
     * Ham bun filling object to handle rendering the middle of hambun.
     */
    function HamBunFilling() {
        this.register();

        this.init();
    }

    HamBunFilling.prototype = (function() {
        return set(new Component(), {
            init : function() {
            this._content = "";
            this._scrollable = true;
        },
        setScrollable : function(bool) {
            this._scrollable = bool;
        },

        renderHtml : function(h) {
            // all meat patty
            h.push('<div class="bd', this._scrollable == true ? ' scrollable' : '' ,'" id="' , this.id , '">');
            if(this._component) {
                this._component.renderHtml(h);
            }
            h.push('</div>');
        },
        setComponent : function(component) {
            this._component = component;
            if ($(this.id))
                this._component.render(this.id);
        },
        clearBunFilling : function() {
            this._component = null;
            $(this.id).innerHTML = "";
        }
        });
    })();
    
    function getPadding(domObj) {
        var padding = 0;
        if (domObj) {
            var pTop = 0;
            var pBottom = 0;
            if (domObj.currentStyle) {
                pTop = domObj.currentStyle.paddingTop;
                pBottom = domObj.currentStyle.paddingBottom;
            } else if (window.getComputedStyle) {
                pTop = document.defaultView.getComputedStyle(domObj, null).getPropertyValue("padding-top");
                pBottom = document.defaultView.getComputedStyle(domObj, null).getPropertyValue("padding-bottom");
            }
            padding += (parseInt(pTop) || 0) + (parseInt(pBottom) || 0);
        }
        return padding;
    }
    
    function getActualHeight(domObj) {
        var height = 0;
        if (domObj) {
            height += domObj.offsetHeight;
            height += getPadding(domObj);
        }
        return height;
    }
    
    function getViewportHeight() {
        var vpHeight = 0;
        vpHeight = self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight);
        return vpHeight;
    }

    return set(new Component(), {
        _scrollable : true,
        
        _hasTopBar : false,

        _hasBottomBar : false,

        /**
         * Initializes hambun.
         */
        init : function() {

        this._hbHead = new HamBunTop();
        this._hbBody = new HamBunFilling();
        this._hbFoot = new HamBunBottom();

        // TODO fix on IE 6 does execute for some reason
        if((typeof TopNavBar != "undefined") && TopNavBar.showEvent) {
            TopNavBar.hideEvent.subscribe(Util.createCallback(this,'resize'));
            TopNavBar.showEvent.subscribe(Util.createCallback(this,'resize'));
        }

        SFDOMEvent.addListener(window,"resize","resize",this,true);

    },
    /**
     * Handles resizing event.
     */
    handleEvent: function(evt) {
        this.resize();
    },

    /**
     * Resizes the hambun to the current window.
     *
     */
    resize: function () {
        var body = $(this._hbBody.id);
        
        if (body) {
            var height = getViewportHeight() - PAGE_PADDING_BOTTOM;
            height -= Util.getAbsPos(body).y;
            height -= getPadding(body);
            height -= getActualHeight($(this._hbFoot.id + 'cb'));
            if (this._hasBottomBar){
                height -= getActualHeight($(this._hbFoot.id));
            }
            height = Math.max(height, MIN_HEIGHT);
            body.style.height = height + 'px';
            
            var childHeight = height;
            if (this._scrollable) {
                childHeight -= SCROLL_PADDING;
            }
            
            this.dispatch("action", {
                actionCommand :"HBResize",
                height :childHeight
            });
        }
    },

    cleanup: function() {
        SFDOMEvent.removeEventListener(window,"resize",this,true);
        this._hbHead.cleanup();
        this._hbBody.cleanup();
        this._hbFoot.cleanup();
        this.unregister();
    },
    _getSingleBunStyle : function(){
        if(this._hasTopBar && this._hasBottomBar){
            return ""
        }  else if(this._hasTopBar){
            return " topbar_only"
        } else if(this._hasBottomBar){
            return " bottombar_only"
        }
        return "";
    },
    _resetBunStyle : function() {
        var obj = $(this.id);
        if (obj) {
            var bunStyle = 'round bun' + this._getSingleBunStyle()
            if (obj.className != bunStyle) {
                obj.className = bunStyle;
                this.resize();
            }
        }
    },
    /**
     * Renders out html code.
     */
    renderHtml : function(html) {
        var singleBunStyle = this._getSingleBunStyle();
        html.push('<div id="' , this.id , '" class=\"round bun', singleBunStyle,' ">');
        this._hbHead.renderHtml(html);
        this._hbBody.renderHtml(html);
        this._hbFoot.renderHtml(html);
        html.push('</div>');
    },

    /**
     * Sets the bun top (header).
     * @param {Object} component A juic component to place in the header.
     */
    setBunTop : function(component) {
        this._hasTopBar = true;
        this._hbHead.setComponent(component);
    },

    /**
     * Sets the bun filling(body).
     * @param {Object} component A juic component to place in the body.
     */
    setBunFilling : function(component) {
        if(!component){
            this._hbBody.clearBunFilling();
        } else {
            this._hbBody.setComponent(component);
        }
    },
    
    /**
     * Sets the bun filling to be scrollable (or not).
     * @param {boolean} bool If you want the contents to be scrollable
     */
    setScrollable : function(bool) {
        this._scrollable = bool;
        this._hbBody.setScrollable(bool);
    },
    /**
     * Sets the bun bottom(footer).
     * @param {Object} component A juic component to place in the footer.
     */
    setBunBottom : function(component) {
        this._hasBottomBar = true;
        this._hbFoot.setComponent(component);
        this._resetBunStyle();
    }

    });
})();