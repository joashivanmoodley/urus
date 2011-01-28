//! include /ui/uicore/js/Util.js
//! include /ui/juic/js/core/component.js

/**
 * This is an activity monitor implemented in JUIC.  This monitor object keeps track of when a mouse or keyboard action
 * performed.  It then updates the time the last interaction occured.
 *
 * Usage:
 * . DO NOT INSTANTIATE!!! SFActivityMonitor is a singleton that is directly accessible. When you
 *   include this file, it will automagically be available to you.
 *
 * Refer to http://confluence/display/ENG/Activity+Monitor+Component for more information.
 */

if (typeof SFActivityMonitor == "undefined") {

  //hide implementation from global namespace
  window.SFActivityMonitor = (function() {

    return set(new EventTarget(), {

      /** Set up handlers to listen to keydown and onclick events. */
      init : function() {
        this.lastInteractionTime = new Date().getTime();

        var me = this;
        Util.chain(document, "onkeydown", function() { me.lastInteractionTime = new Date().getTime() });
        Util.chain(document, "onclick", function() { me.lastInteractionTime = new Date().getTime() });
        Util.chain(document, "onmousemove", function() { me.lastInteractionTime = new Date().getTime() });
      }

    });
  })();

  SFActivityMonitor.init();
}