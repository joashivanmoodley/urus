var yUTIL = YAHOO.util;
var DOM = YAHOO.util.Dom;
var EVT = YAHOO.util.Event;
var DDM = YAHOO.util.DragDropMgr;

/**
 * YUI Drag and Drop Constructor.
 */
function EXPDD() {
  EXPDD.superclass.constructor.apply(this, arguments);
}
  
YAHOO.extend(EXPDD, YAHOO.util.DD, {
  startDrag : function(e) {
      alert('ggg')
  },
  onDragDrop : function(e, id) {
    alert("hello")
  },
  onInvalidDrop : function(e) {
    alert("invalid");
  }
});

/**
 * Drag and Drop Manager
 */
var EXPDDMgr = {
  //List of registered drop targets
  _dropTargets : [],

  //Registers a single drop target in YUI and adds to the _dropTargets collection
  registerDropTarget : function(targetId) {
    this._dropTargets.push(
    {
      id: targetId,
      obj: new YAHOO.util.DDTarget(targetId)
    });
  },

  setDDConstraints : function(dd,regionId) {
    var el = DOM.get(dd.id);
    var region = DOM.getRegion(regionId);
    var xy = DOM.getXY(dd.id);
    var width = parseInt(DOM.getStyle(el, 'width'), 10);
    var height = parseInt(DOM.getStyle(el, 'height'), 10);
    var left = xy[0] - region.left;
    var right = region.right - xy[0] - width;
    var top = xy[1] - region.top;
    var bottom = region.bottom - xy[1] - height;
    dd.setXConstraint(left, right);
    dd.setYConstraint(top, bottom);
  }
}

/**
 * Drag and Drop Manager
 */
var EXPDDMgrSPC = {
  //List of registered drop targets
  _dropTargets : [],

  //Registers a single drop target in YUI and adds to the _dropTargets collection
  registerDropTarget : function(targetId) {
    this._dropTargets.push(
    {
      id: targetId,
      obj: new YAHOO.util.DDTarget(targetId)
    });
  },

  setDDConstraints : function(dd,regionId) {
    var el = DOM.get(dd.id);
    var region = DOM.getRegion(regionId);
    var xy = DOM.getXY(dd.id);
    var width = parseInt(DOM.getStyle(el, 'width'), 10);
    var height = parseInt(DOM.getStyle(el, 'height'), 10);
    var left = xy[0] - region.left;
    var right = region.right - xy[0] - width;
    var top = xy[1] - region.top;
    var bottom = region.bottom - xy[1] - height;
    dd.setXConstraint(left, right);
    dd.setYConstraint(top, bottom);
  }
}

/**
 * Base class for draggable object
 */
function EXPDraggable() {
  this.register();
}

EXPDraggable.prototype = (function() {
  return set(new Component(), {
    //setValue and getValue are handled by Component(). They must be overridden at the subclass level.
    startDrag : function(evt) {
      assert(false, "ERROR: the subclasses must override the startDrag event handler");
    },
    endDrag : function(evt) {
      assert(false, "ERROR: the subclasses must override the endDrag event handler");
    },
    invalidDrag : function(evt) {
      assert(false, "ERROR: the subclasses must override the startDrag event handler");
    },
    dragOver: function(evt) {
      assert(false, "ERROR: the subclasses must override the startDrag event handler");
    },
    dragOut: function(evt) {
      assert(false, "ERROR: the subclasses must override the dragOut event handler");
    },
    lockToTarget: function(dtId,correction) {
      this.curTargetId = dtId;
      if (dtId) {
         XY = DOM.getXY(dtId)
          // display the object with optional position correction
          //DOM.setXY(DOM.get(this.id),[XY[0]+correction.x,XY[1]+correction.y]);
          var attributes = {
            points: { to: [XY[0]+correction.x,XY[1]+correction.y] }
          };
          var anim = new YAHOO.util.Motion(this.id, attributes,0.2);
          that = this;
          var animComplete = function()
          {
             that.updateLabel(Component._registry[dtId]);
          }
              /*  _obj: this,
                updateLabel: function() {

                }  */
          /*function() {
              this.updateLabel(Component._registry[dtId]);
          }*/

          anim.onComplete.subscribe(animComplete);

          anim.animate();
      }
      //this.updateLabel(Component._registry[dtId]);
      //if (true) DOM.setX(DOM.get(this.id),0);
    },
      /**
       * Auto-scroll the window if the dragged object has been moved beyond the
       * visible window boundary.
       * @method autoScroll
       * @param {int} x the drag element's x position
       * @param {int} y the drag element's y position
       * @param {int} h the height of the drag element
       * @param {int} w the width of the drag element
       * @private
       */
      autoScroll: function(x, y, h, w) {
          if (this.scroll) {
              // The client height
              var clientH = DDM.getClientHeight();

              // The client width
              var clientW = DDM.getClientWidth();

              // The amt scrolled down
              var st = DDM.getScrollTop();

              // The amt scrolled right
              var sl = DDM.getScrollLeft();

              // Location of the bottom of the element
              var bot = h + y;

              // Location of the right of the element
              var right = w + x;

              // The distance from the cursor to the bottom of the visible area,
              // adjusted so that we don't scroll if the cursor is beyond the
              // element drag constraints
              var toBot = (clientH + st - y - this.deltaY);

              // The distance from the cursor to the right of the visible area
              var toRight = (clientW + sl - x - this.deltaX);

              // this.logger.log( " x: " + x + " y: " + y + " h: " + h +
              // " clientH: " + clientH + " clientW: " + clientW +
              // " st: " + st + " sl: " + sl + " bot: " + bot +
              // " right: " + right + " toBot: " + toBot + " toRight: " + toRight);

              // How close to the edge the cursor must be before we scroll
              // var thresh = (document.all) ? 100 : 40;
              var thresh = 40;

              // How many pixels to scroll per autoscroll op.  This helps to reduce
              // clunky scrolling. IE is more sensitive about this ... it needs this
              // value to be higher.
              var scrAmt = (document.all) ? 80 : 30;

              // Scroll down if we are near the bottom of the visible page and the
              // obj extends below the crease

              if ($('rt_content').clientHeight < $('1:').offsetTop + 15) $('rt_content').scrollTop = $('rt_content').clientHeight; //(this._y - e.pageY) * mod;


              if ( bot > clientH && toBot < thresh ) {
                  $('rt_content_menu').scrollTo(sl, st + scrAmt);
              }

              // Scroll up if the window is scrolled down and the top of the object
              // goes above the top border
              if ( y < st && st > 0 && y - st < thresh ) {
                  $('rt_content_menu').scrollTo(sl, st - scrAmt);
              }

              // Scroll right if the obj is beyond the right border and the cursor is
              // near the border.
              if ( right > clientW && toRight < thresh ) {
                  $('rt_content_menu').scrollTo(sl + scrAmt, st);
              }

              // Scroll left if the window has been scrolled to the right and the obj
              // extends past the left border
              if ( x < sl && sl > 0 && x - sl < thresh ) {
                  $('rt_content_menu').scrollTo(sl - scrAmt, st);
              }
          }
      }
  });
})();