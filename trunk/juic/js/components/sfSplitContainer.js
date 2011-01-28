//! include /ui/uicore/css/components/sfSplitContainer.css

/**
 * Split Container Component
 * This is a generalized two-region vertical split container component. Used for displaying contents of
 * two components in one screen, separated by a draggable splitter bar.
 *
 * The challenge of this is getting the child components to dynamically size as the "splitter bar" is moved
 * up and down. This is handled by the resizeChildren method that performs various calculations
 * on the container sizes.
 *
 * If you use this component within a hamburger bun, you must add this as a listener to the "resizeEvt"
 * resize event. For instance,
 *
 * this._hambun.addEventListener("resizeEvt", this._splitContainer);
 *
 * @param {integer} defaultBarTop - Defines where the splitter bar will be at instantiation time.
 *                                  Defaults to 150.
 */
function SFSplitContainer(defaultBarTop) {
    this.register();
    this._defaultBarTop = (typeof defaultBarTop != "undefined") ? defaultBarTop : 150;
    this._children = [];
}

SFSplitContainer.prototype = (function() {
	//The following represent component-scope vars and functions
    //for handling the various drag events.
    //Need to expose them at this level because many of the DOM operations
    //employed here will not recognize methods or properties. They have to
    //be vars or functions scoped outside of the methods. The cool thing
    //is that they can be used by the methods since they are visible to all
    //methods at this level, but remain private to the outside world.
    var splitter = null;
    var barTop;

    //The dragBegin initializes many of the internal vars used by resizeChildren
    //and makes the bar "draggable"
    function dragBegin(ths, e) {
        splitter = ths;
        document.onmousemove = drag;
        document.onmouseup = dragEnd;
        return false;
    }

    //Drag handles positioning the splitter bar to be at the current mouse coordinates
    function drag(e) {
        splitter.resizeChildren(e ? e : window.event);
        return false;
    }

    //dragEnd does a final call to resizeChildren to ensure the bar is in place
    //then nullifies the vars and event handlers.
    function dragEnd(e) {
        splitter.resizeChildren(e ? e : window.event);
        document.onmousemove = null;
        document.onmouseup = null;
    }

    //Here is where the actual prototype implementation occurs
    return set(new Component(), {
        addChild : function(childObj) {
            this._children.push(childObj);
        },
        //This component utilizes a delayed rendering and renders child components
        //on the fly here. This avoids an internal post render.
        renderHtml : function(h) {
            h.push("<div id=\"" + this.id + "\" class=\"splitContainer\">");
            h.push("<div id=\"" + this.id + "_bar\" class=\"splitterBar\" unselectable=\"on\" onmousedown=\"" + this.fireCode("_beginDrag") + "\"></div>");
            assert((this._children.length > 0), "Children have not been added. You cannot render without providing children.");
            if (this._children.length > 0) {
                for (var i = 0,len = this._children.length; i < len; ++i) {
                    //Create an outer wrapper for each child so scrollbars show up
                	h.push("<div style=\"overflow:auto;\">");
                    this._children[i].renderHtml(h);
                    h.push("</div>");
                }
            }
            h.push("</div>");
        },
        //Set up to handle the resize event.
        handleEvent : function(e) {
            if (e.type == "resizeEvt")
                this.resizeChildren()
            else
                return false;
        },

        //This is the only method exposed to the outside world through
        //fireCode. But it in turn calls the private function dragBegin.
        _beginDrag : function(evt) {
            dragBegin(this, evt);
        },
        //This method is where all the magic occurs, once a drag or drag end event occurs
        //This is unlike other components in that some direct DOM manipulation is going on.
        resizeChildren : function(evt) {
            //Get references to self and parent.
            var self = $(this.id);
            if (!self) return;
            var prnt = self.parentNode || self.parentElement;
            //For self height, you want the parent container's height
            var selfHeight = prnt.offsetHeight - 1;
            
            //Get a reference to the splitter bar and get its current y-pos.
            var bar = $(self.id + "_bar");
            var barHeight = bar.offsetHeight;
            var maxBarTop = selfHeight - barHeight;

            if (evt) {
               // If there was a mouse event, put the bar top to the y position of the
               // mouse, but account for the offset of the parent and the scroll position
               // of the page
               barTop = evt.clientY - YAHOO.util.Dom.getY(prnt) + document.body.scrollTop;
            }

            if (barTop==null) barTop = this._defaultBarTop;
            if (barTop < 1) barTop = 1;
            if (barTop > maxBarTop) barTop = maxBarTop;
            bar.style.top = barTop + "px";
            
            //Now, resize the children. Each child is rendered within an
            //enclosing div. These divs' heights need to be dynamically
            //set for the scrollbars to appear.
            for (var i = 0,len = this._children.length; i < len; ++i) {
                var ch = $(this._children[i].id);
                var p = ch.parentNode || ch.parentElement;
                //Set first child height
                if (i == 0) {
                    p.style.height = bar.style.top;
                    p.style.marginBottom = (barHeight - 2) + "px";
                } else {
                    var bottomHeight = (selfHeight - barTop - barHeight);
                    p.style.height = (bottomHeight<0 ? 0 : bottomHeight) + "px";
                }
            }
            
            this.dispatch('resizeChildren');
        }
    })
})();
