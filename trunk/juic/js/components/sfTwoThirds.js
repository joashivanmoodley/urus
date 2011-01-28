//! include /ui/juic/js/core/component.js
//! include /ui/extlib/yui/css/grids/grids.css

/**
 * JUIC expression of the Two-Thirds layout UI element as defined by the UI team.
 * This is specifically a "layout" component.
 *
 * See
 * - http://ui/awong/bento/snippets_layout_twothirds.html
 *
 * 
 * @param left           The left component of the layout.
 * @param right          The right component of the layout.
 * @param orientation    The "orientation" of the layout.  The orientation is defined by which side the 2/3 container
 *                       is located. Either left or right. By default, this value is SFTwoThirds.ORIENT_LEFT;
 * @param table          Flag that uses a table layout for the render.
 */
function SFTwoThirds(left, right, orientation, table) {
  this.register();

  this._left = left;
  this._right = right;

  if (orientation &&
      (orientation == SFTwoThirds.ORIENT_LEFT || orientation == SFTwoThirds.ORIENT_RIGHT))
    this._orientation = orientation;
  else
    this._orientation = SFTwoThirds.ORIENT_LEFT;

  this._table = table;
}

SFTwoThirds.ORIENT_LEFT = 0;
SFTwoThirds.ORIENT_RIGHT = 1;

SFTwoThirds.prototype = (function() {

  function getGridClass(orientation) {
    return orientation === SFTwoThirds.ORIENT_LEFT ? 'yui-gc': 'yui-gd'
  }

  return set(new Component(), {

    renderHtml: function(h) {
        if (this._table) {
            this._renderTableHtml(h);
        } else {
            this._renderDivHtml(h);
        }
    },

    _renderDivHtml: function(h) {
      h.push('<div id="', this.id, 'twothirds" class="', getGridClass(this._orientation) , '">',
               '<!-- BEGIN 2/3 column -->',
               '<div id="', this.id, 'zero" class="yui-u first">');

      if (this._left) this._left.renderHtml(h);

        h.push('</div>',
               '<div id="', this.id, 'one" class="yui-u">');

      if (this._right) this._right.renderHtml(h);

        h.push('</div>',
             '</div>');
    },

    _renderTableHtml: function(h) {
        h.push('<div id="', this.id, 'twothirds" class="', getGridClass(this._orientation) ,
               '"><table style=\"width:100%;\"><tr>','<!-- BEGIN 2/3 column -->',
               '<td style=\"width:',(getGridClass(this._orientation) === "yui-gc" ? "62%" : "32%"),'; padding-right:10px;\">');

        if (this._left) this._left.renderHtml(h);

        h.push('</td>',
               '<td style=\"width:',(getGridClass(this._orientation) === "yui-gc" ? "32%" : "62%"),';\">');

        if (this._right) this._right.renderHtml(h);

        h.push('</td></tr></table>','</div>');
    },

    flip : function() {
      if (this._orientation == SFTwoThirds.ORIENT_LEFT)
        this.setOrientation(SFTwoThirds.ORIENT_RIGHT);
      else
        this.setOrientation(SFTwoThirds.ORIENT_LEFT);
    },

    setOrientation : function(orientation) {
      assert(orientation == SFTwoThirds.ORIENT_LEFT || orientation == SFTwoThirds.ORIENT_RIGHT, 'SFTwoThirds: Invalid Orientation value.')

      this._orientation = orientation;

      if ($(this.id + 'twothirds'))
        $(this.id + 'twothirds').className = getGridClass(this._orientation);  
    },

    setLeft : function(component) {
      this._left = component;

      if ($(this.id + 'twothirds'))
        this._left.render(this.id + 'zero');
    },

    setRight : function(component) {
      this._right = component;

      if ($(this.id + 'twothirds'))
        this._right.render(this.id + 'one');
    },

    handleEvent : function(evt) {
      if (evt.type === 'resize') {
        if (this._left && this._left.handleResize)  this._left.handleResize();
        if (this._right && this._right.handleResize)  this._right.handleResize();
      }
    },

    cleanup : function() {
      this._left.cleanup();
      this._right.cleanup();  
    },

    postProcess : function() {
    }

  });
})();
