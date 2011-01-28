//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfActivityMonitor.js

/**
 * This is an activity tracker implemented in JUIC. A timer checks if there was an action against the last time an
 * action was performed (from SFActivityMonitor).  If so, it then dispatches an event notification.
 *
 * Usage:
 * . Call SFActivityTracker.start().  This causes a timer to check regularly whether there has be any user interaction
 *   lately with the current page.  If there has been interaction since the last check an "interacted" event will
 *   be dispatched.
 *
 * . Call SFActivityTracker.stop() to cancel the timer.
 *
 * Refer to http://confluence/display/ENG/Activity+Tracker+Component for more information.
 */

function SFActivityTracker(interval) {
  this.init(interval);
}

SFActivityTracker.prototype = (function() {

  return set(new EventTarget(), {

    /** The interval (in milliseconds) to check whether user interaction has occurred. **/
    CHECK_INTERVAL : 60000,  // default 1 minute

    init : function(interval) {
      if (interval)
        setInterval(interval);

      this.lastCheckTime = new Date().getTime();
    },

    start : function() {
      if (this.intervalId)
        clearTimeout(this.intervalId);

      var me = this;
      this.intervalId = setInterval(function() { me.checkInteractionTime(); }, this.CHECK_INTERVAL);
    },

    stop : function() {
      if (this.intervalId)
        clearTimeout(this.intervalId);
    },

    setInterval : function(interval) {
      assert(interval > 0, 'SFActivityTracker.setInterval(): interval parameter must be greater than 0.');
      this.CHECK_INTERVAL = interval;
    },

    checkInteractionTime : function() {
      if (SFActivityMonitor.lastInteractionTime > this.lastCheckTime) {
        this.dispatch('interacted', { lastInteracted: SFActivityMonitor.lastInteractionTime });
        this.lastCheckTime = new Date().getTime();
      }
    }

  });
})();
