/* Note that this is a slight departure from our component architecture in that
 * I'm using DOM scripting to create a target container for the actual loading
 * display box, then using some DOM calls to get the height and width of the
 * viewport. To use:
 *
 * 1. Instantiate the SFLoading component:
 * this._myLoading = new SFLoading()
 *
 * 2. Once you have a reference, you need only call its show and hide methods
 * this._myLoading.show()
 *
 * Note that there are no timers or time-based operations. You decide when you
 * want to show and hide the loading box.
 */
function SFLoading(delay) {
    this.register();
    this._loadingBox = new SFLoadingBox(delay);
    this.init();
}

SFLoading.prototype = (function() {
    return set(new Component(),{
        //Inits the baseContainer then renders the loading box inside of it.
        init : function() {
            var body = document.body;
            var baseContainer = document.createElement("div");
            baseContainer.setAttribute("id",this.id);
            body.appendChild(baseContainer);
            this._loadingBox.render(baseContainer.id);
        },
        //Thin wrappers for calling the loading box's show and hide methods
        //Originally had all the logic, but SFLoading only provides the base
        //container. SFLoadingBox should hide and display itself.
        show : function() {
            this._loadingBox.show();
        },
        hide : function() {
            this._loadingBox.hide();
        },
        //shows the loading box, but first gets the viewport width and height so
        //the loading box is centered in the browser. Note that the numbers used
        //are known as the loading box is 200 X 40.
        cleanup : function() {
            this._loadingBox.unregister();
            //clear the DOM
            var me = $(this.id);
            var body = document.body;
            body.removeChild(me);
            //unregister myself
            this.unregister();
        }
    });
})();

/**
 * Creates the actual loading box component and overlay to prevent clicking.
 * Should be called from a "helper" component. See SFLoading above.
 */
function SFLoadingBox(delay) {
    if (delay) this._delay = delay;
    this.register();
}

SFLoadingBox.prototype = (function() {
    return set(new Component(),{
        renderHtml : function(h) {
            h.push("<div id=\"" + this.id + "_ovr\" style=\"display:none;position:absolute;z-index:9999;left:0px;top:0px;width:100%;height:100%;background:#CCC;filter:alpha(opacity=50);-moz-opacity:0.5;-khtml-opacity: 0.5;opacity: 0.5;\"></div>")
            h.push("<div id=\"" + this.id + "_box\" style=\"display:none;position:absolute;z-index:10000;width:200px;height:40px;padding-left:5px;padding-top:4px;background:url(/ui/static/img/sfloading_back.gif) no-repeat;\">")
            h.push("<img src=\"" + IMAGES["/ui/uicore/img/ico_loading_lg_gry_on-wht.gif"] + "\" width=\"32\" height=\"32\" alt=\"\" style=\"float:left;margin-right:5px;\" />");
            h.push("<div style=\"margin-top:6px;font:1.5em bold Tahoma,Arial,Helvetica,sans-serif\">Loading...</div>");
            h.push("</div>");
        },
        //Shows the overlay and loading box with spinning icon.
        //Note that viewport dimensions are calculated every time this
        //executes because the user may have changed the size of their browser
        //window.
        show : function() {
            var ovr = $(this.id + "_ovr");
            var box = $(this.id + "_box");
            var h = this.getViewportHeight();
            var w = this.getViewportWidth();
            box.style.top = (parseInt(h/2)-20) + "px";
            box.style.left = (parseInt(w/2)-100) + "px";
            ovr.style.display = "";
            box.style.display = "";
        },
        //Hides the loading box.
        hide : function() {
            var box = $(this.id + "_box");
            var ovr = $(this.id + "_ovr");
            var tmr;
            function releaseTmr() {
                box.style.display = "none";
                ovr.style.display = "none";
                window.clearTimeout(tmr);
            }
            if (this._delay) {
                tmr = window.setTimeout(function() {
                    releaseTmr();
                },parseInt(this._delay))
            } else {
                box.style.display = "none";
                ovr.style.display = "none";
            }
        },
        //Next two methods get the viewport dimensions
        getViewportHeight : function() {
            var vpHeight = 0;
            vpHeight = self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight);
            return vpHeight;
        },
        getViewportWidth : function() {
            var vpWidth = 0;
            vpWidth = self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth);
            return vpWidth;
        }
    });
})();