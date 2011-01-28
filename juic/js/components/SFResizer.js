/**
 * This is a the container resizing component that is used specifically for hamburger bun.
 * But as it operates at a page-level, it is entirely possible to put place it in a more
 * global scope.
 */
function SFResizer() {
    this.register();
    this._referenceContainers = [];
    this._sizingContainers = [];
    this._subContainers = [];
    this._centerContainers = [];
    this._referenceHeight = 0;
    this.init();
}

SFResizer.prototype = (function() {
    return set(new Component(), {
        init : function() {
            YAHOO.util.Event.addListener(window, "resize", function() {
                this.resize();
                return false;
            }, this, true);
        },
        registerReferenceContainer : function(id) {
            this._referenceContainers.push(id);
        },
        registerSizingContainers : function(id) {
            this._sizingContainers.push(id);
        },
        registerSubContainer : function(id) {
            this._subContainers.push(id);
        },
        registerCenterContainer : function(id) {
            this._centerContainers.push(id);
        },
        getReferenceHeight : function() {
            var referenceHeight = 0;
            for (var i = 0,len = this._referenceContainers.length; i < len; ++i) {
                referenceHeight += parseInt($(this._referenceContainers[i]).offsetHeight);
            }
            return referenceHeight;
        },
        getViewportHeight : function() {
            var vpHeight = 0;
            vpHeight = self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight);
            return vpHeight;
        },
        getViewportWidth : function() {
            var vpWidth = 0;
            vpWidth = self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth);
            return vpWidth;
        },
        centerOnResize : function() {
            for (var i = 0,len = this._centerContainers.length; i < len; ++i) {
                var cont = $(this._centerContainers[i]);
                if (cont) {
                    var wid = cont.offsetWidth;
                    var vpWid = this.getViewportWidth();
                    var vpLeft = (vpWid - wid > 0) ? vpWid - wid : 0;
                    cont.style.left = (Util.browserInfo.ie) ? (parseInt((vpLeft) / 2)) + "px" : (parseInt((vpLeft) / 2) + 1) + "px";
                }
            }
        },
        resize : function() {
            var refHeight = this.getReferenceHeight();
            var viewPortHeight = this.getViewportHeight();
            //Add a fudge factor depending upon the browser. This is NOT
            //optimal, but firefox actually renders quite a bit short.
            var ff = 0; //We can remove this correction now that JavaScript calculates the height of the page component
            // container div      (Util.browserInfo.moz || Util.browserInfo.saf) ? 55 : 0;
            var containerHeight = (viewPortHeight - refHeight) + ff;
            if (containerHeight > 0) {
                for (var i = 0,len = this._sizingContainers.length; i < len; ++i) {
                    if ($(this._sizingContainers[i]))
                        $(this._sizingContainers[i]).style.height = containerHeight + "px";
                }
                for (var i = 0,len = this._subContainers.length; i < len; ++i) {
                    if ($(this._subContainers[i]))
                        $(this._subContainers[i]).style.height = containerHeight + "px";
                }
            }
            this.centerOnResize();
            // dispatch bopdy height to the contained div of hb_pane
            // This is necessary as hb_pane DIV does not have any height and the sub components of the page would need to have
            // a reference height for display.
            var htFixup = 0; ///We seems not needing this value anymore. This section will be removed after some more tests
            // with different resolutions MSIE|Safari/.test(navigator.userAgent) ? 0: 55;
            this.dispatch("resizeEvt", {containerHeight:Math.floor((containerHeight - htFixup))});
        }
    });
})();
