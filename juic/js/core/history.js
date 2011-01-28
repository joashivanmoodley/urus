//! include /ui/juic/js/core/component.js
//
// $Id: history.js 121244 2011-01-08 20:52:15Z jminnich $
//

if ("undefined" == typeof window.HistoryManager) {

    /**
     * The history manager allows single-page web applications to
     * manipulate and react to the browser's history stack.
     *
     * For this to work on IE, the page this history manager appears
     * upon must have an iframe with an id of "juic_history" already
     * on it.  Specifically:
     * <pre>
     * &lt;iframe src="javascript:''" id="juic_history" style="position:absolute;width:0;height:0;border:0;"&gt;&lt;/iframe&gt;
     * </pre>
     *
     * In order to receive notification of changes to to the current
     * history item, add an event listener for the "history" event.
     * For example:
     * <pre>
     * HistoryManager.addEventListener("history", {handleEvent:function(evt) {
     *     alert("History changed to: "+evt.token);
     * }});
     * </pre>
     */
    window.HistoryManager = (function() {
        var historyToken = "";
        var isMSIE = /MSIE/.test(navigator.userAgent);
        var HISTORY_FRAME_ID = "juic_history";

        /** encodes a token to a URL fragment in case it has any characters not safe for a URL */
        function decodeFragment(token) {
            // decodeURI does not decode the '#' character
            return decodeURI(token.replace("%23","#"));
        }

        /** decodes URL fragment to reverse encodeFragment */
        function encodeFragment(token) {
            // encodeURI does not encode the '#' character
            return encodeURI(token).replace("#", "%23");
        }

        /** FF/Safari/URL-hash-based browser history navigation */
        function hashCheckTimer() {
            var token = '';
            var hash = location.hash;
            if (hash.length > 0) {
                token = decodeFragment(hash.substring(1));
            }

            if (token != historyToken) {
                historyToken = token;
                window.HistoryManager.dispatch("history", {token:historyToken});
            }
        }

        /**
         * For IE frame-based navigation, we still have to monitor the
         * URL hash incase the user changes the address using a
         * bookmark or some otherwise unanticipated change.
         */
        function checkIEUrl() {
            // only check every .5s, no need to spin as often in this
            // solution since this is event is expected to be
            // relatively infrequent.  We're also using a repeating
            // setTimeout instead of a setInterval to avoid issues on
            // older IEs.
            setTimeout(checkIEUrl, 500);
            
            var hash = getLocationHash();

            if (hash.length > 0) {
                try {
                    var token = decodeFragment(hash.substring(1));

                    if (historyToken && token != historyToken) {
                        if (/MSIE\s6/.test(navigator.userAgent)) {
                            // IE 6 has a bug that causes the history
                            // buttons in the browser to stop working
                            // (e.g. turn and stay grayed out), if the
                            // user navigates to a bookmarked URL.
                            // The only appearent way to clear this
                            // problem is to force reload the page.
                            // (Even the browser's reload button
                            // doesn't fix it)
                            location.reload();
                        } else {
                            // IE 7 does not have the above problem.
                            // In this case, we simply need to update
                            // the frame to keep everything in sync.
                            //
                            // Also, since we are not setting the
                            // historyToken here, the frame's onload
                            // event will trigger the history event to
                            // the attached listener.
                            navigateFrame(token);
                        }
                    }

                } catch (e) {
                    // bad hash... possible corrective action would be
                    // to reload the page, for now though, we'll just
                    // correct it to our current "good" token.
                    location.hash = encodeFragment(historyToken);
                }
            }
        }

        /**
         * IE Frame-based history navigation helper.  This function navigats
         * the history frame to the specified token.  It assumed that
         * the caller has insure that we are not inserting a duplicate
         * token.
         * @param token (string) the token to inject into the iframe
         */
        function navigateFrame(/*String*/ token) {
            var doc = $(HISTORY_FRAME_ID).contentWindow.document;
            doc.open();
            doc.write('<html><body onload="parent.HistoryManager._onFrameLoad(token.innerText)"><div id="token">'+
                      escapeHTML(token)+'</div></body></html>');
            doc.close();
        }

        /**
         * Method needed by IE implementation to get the hash from the
         * URL since location.href drops part of the fragment if it
         * contains a '?'
         */
        function getLocationHash() {
            var href = location.href;
            var index = href.indexOf('#');
            return index > 0 ? href.substring(index) : "";
        }

        function initIE() {
            // cleanup since we don't trust IE's garbage collector
            window.detachEvent("onload", initIE);

            var historyFrame = $(HISTORY_FRAME_ID);

            assert(historyFrame, "history frame is not present, please see the history manager's documentation");

            // try to fetch the location from the URL hash.  This
            // handles direct navigation to a bookmarked link
            var hash = getLocationHash();
            if (hash.length > 0) {
                try {
                    historyToken = decodeFragment(hash.substring(1));
                } catch (e) {
                    // clear the bad hash
                    location.hash = '';
                }
            }

            var tokenDiv = (historyFrame.contentWindow) ?
                historyFrame.contentWindow.document.getElementById("token") : null;

            if (tokenDiv) {
                // If a token element already exists, don't create a
                // new item.  This is probably an indication of the
                // user navigating back into the app or refreshing the
                // page.

                historyToken = tokenDiv.innerText;
            } else {
                // Initialize the history frame
                navigateFrame(historyToken);
            }

            // initialize URL hash checking.
            checkIEUrl();
        }

        if (isMSIE) {
            window.attachEvent("onload", initIE);
        } else {
            // Firefox/Safari solution
            (function() {
                var hash = location.hash;
                if (hash.length > 0) {
                    historyToken = decodeFragment(hash.substring(1));
                }

                // check the hash every 1/4 second
                setInterval(hashCheckTimer, 250);
            })();
        }

        return set(new EventTarget(), {
            /**
             * IE Frame-based navigation callback.  This method is
             * called by the history frame on a history navigation.
             */
            _onFrameLoad : function(token) {
                location.hash = encodeFragment(token);

                if (token != historyToken) {
                    historyToken = token;
                    this.dispatch("history", {token:historyToken});
                }
            },

            /**
             * Returns the current history token.
             *
             * @return the initial token or "" if not present.
             */
            getToken : function() {
                assert(arguments.length == 0, "no arguments expected");
                return historyToken;
            },

            /**
             * Goes 1 event back in history
             */
            back : function () {
                assert(arguments.length == 0, "no arguments expected");
                history.back();
            },

            /**
             * Goes 1 event forward in the history
             */
            forward : function () {
                assert(arguments.length == 0, "no arguments expected");
                history.forward();
            },

            /**
             * Append the specified token to the history stack and navigate to it.
             *
             * @param token (String) the location to navigate to
             * @param issueEvent (boolean, optional) determines
             * whether or not to fire an event when navigating.  The
             * default it true.
             */
            newItem : function (token /*String*/, issueEvent /* (optional) boolean*/) {
                assert("string" == typeof token, "Token must be a string");
                assert(arguments.length == 1 || "boolean" == typeof issueEvent, "issueEvent argument must be a boolean if present");

                if (token != historyToken) {
                    historyToken = token;

                    location.hash = encodeFragment(token);

                    if (isMSIE) {
                        // For IE, changing the .hash on a url does
                        // not add to the history stack.  We get
                        // around this by changing the contents of a
                        // hidden IFRAME that contains a onload
                        // handler that will trigger a history event.
                        navigateFrame(token);
                    }

                    if (arguments.length == 1 || issueEvent) {
                        this.dispatch("history", {token:historyToken});
                    }
                }
            }
            
        });
    })();
}

// TODO:
// [ ] Test and verify in Safari
// [ ] Document/Write up.
