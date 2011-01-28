//! include /ui/juic/js/core/component.js
//! include /ui/uicore/js/Util.js

if ("undefined" == typeof window.SFDOMEvent) {

    /**
     * Global publisher object that posts global browser based events list window resize.
     *
     */
    window.SFDOMEvent = (function() {
        /**
         * Adapted from Util.createCallback. 
         * @param contextObj
         * @param handlerFunc
         * @param args
         */
        function createEventHandler(contextObj, handlerFunc, args){
            return (function(result){
                return (typeof args != "undefined") ? contextObj[handlerFunc](result, args, this)
                                                    : contextObj[handlerFunc](result, this); 
            });
        };

        return set(new EventTarget(), {
            /**
             * Usable, but deprecated
             * @param elem
             * @param event
             * @param handler
             * @param capture
             */
            addEventListener : function(elem, event, handler, capture) {
                if (window.addEventListener) {
                    //assert(elem == window || elem == document, "_addEventListener can only be used with the window or document objects");
                    elem.addEventListener(event, handler, (capture));
                } else if (window.attachEvent) {
                    assert(elem == window || elem == document, "_addEventListener can only be used with the window or document objects");
                    elem.attachEvent("on" + event, handler);
                }
            },
            /**
             * Usable but deprecated
             * @param elem
             * @param event
             * @param handler
             * @param capture
             */
            removeEventListener : function(elem, event, handler, capture) {
                if (window.removeEventListener) {
                    elem.removeEventListener(event, handler, (capture));
                } else
                    elem.detachEvent("on" + event, handler);
            },
            /**
             * Appends a listener to the DOM with optional execution context
             * @param elOrId        {String | Element}  If String, then will be converted to object with $()
             * @param event         {String}            The event we want to add a listener to
             * @param handler       {function}          Handler function to execute when event fires
             * @param contextObj    {object}            Optional - Execution context of the handler.
             * @param bCapture      {boolean}           Optional - Default false to prevent bubbling
             */
            addListener : function(elOrId, event, handler, contextObj, bCapture) {
                //Specify object to which DOM event is attached
                var obj = (typeof elOrId == "string") ? $(elOrId) : elOrId;
                var fn = handler;
                if (typeof contextObj != "undefined") {
                    fn = createEventHandler(contextObj, handler);
                }
                if (window.addEventListener) {
                    obj.addEventListener(event, fn, bCapture);
                } else {
                    obj.attachEvent("on" + event, fn);
                }
            },
            /**
             * Removes an event listener from an object
             * @param elOrId    {String | Element } If string, a $(elOrId) will be performed
             * @param event     {String}            Do NOT use "on" with the event
             * @param handler   {function}          Function that acts as the handler
             * @param capture   {boolean}           Optional - Defaults to false.
             */
            removeListener : function(elOrId, event, handler, capture) {
                var obj = (typeof elOrId == "String") ? ($(elOrId)) : elOrId;
                var fn = handler;
                if (window.removeEventListener) {
                    obj.removeEventListener(event, fn, (capture))
                } else {
                    obj.detachEvent("on" + event, fn);
                }
            }
        });

    })();

}

