//! include /ui/juic/js/core/component.js
//! include /ui/static/css/components/sfToggleButton.css

/**
 *
 * This is based upon the snippet: http://uitech.successfactors.com:8080/xidocs/xi/snippets/toggleButtons.xhtml
 *
 * There will be two areas for this component. A right and left one.
 *
 * The format of the left and right component is as follows:
 *
 * 1.  Simple text label.
 *
 *     {
 *       value: 'on',
 *       label: 'On'
 *     }
 * 
 * 2. Image label.
 *
 *     {
 *       value: 'celcius',
 *       label: { type: 'celcius' }
 *     }
 *
 * Please refer to http://confluence/display/ENG/Toggle+Buttons+Tech+Spec for more information.
 *
 */
function SFToggleButton(left, right, selectedValue) {
  assert(arguments.length != 2, 'SFToggleButton: You must have exactly two arguments.');
  this.register();
  this.init(left, right, selectedValue);
}

SFToggleButton.iconClasses = {
  orderAsc : { sel: 'moveUpIcon smallIconPadding', unsel: 'moveUpDisabled smallIconPadding'},
  orderDesc : { sel: 'moveDownIcon smallIconPadding', unsel: 'moveDownDisabled smallIconPadding'}
}

SFToggleButton.prototype = (function() {
    function _getClass(type) {
      assert(SFToggleButton.iconClasses[type],
             "[SFToggleButton] The icon type '" + type + "' specified is not defined");  
      return SFToggleButton.iconClasses[type];
    }
    
    return set(new SFAbstractSingleSelect(), {
        init : function(left, right, selectedValue) {
          this._left = left;
          this._right = right;

          if (selectedValue)
            this._selectedValue = selectedValue;
        },
        
        renderHtml : function(h) {
          h.push('<div id="', this.id, 'tb" class="toggleButtons">');
          this._drawBtn(this._left, 'left', h);
          this._drawBtn(this._right, 'right', h);
          h.push('</div>');
        },

        setSelected : function(value) {
          this._selectedValue = value;

          if ($(this.id + 'tb'))
            this._toggle(this._left.value == this.selectedValue ? 'left' : 'right');
        },

        getSelected : function() {
          return this._selectedValue;
        },
        
        _handleClick : function(type, selection) {
          this._selectedValue = selection;
          this._toggle(type);
          this.dispatch('change', {value: this._selectedValues});
        },

        //DOM
        _toggle : function(type) {
          $(this.id + 'right').className = type == 'right' ? 'selected': '';
          $(this.id + 'left').className =  type == 'right' ? '' : 'selected';
            
          if (type == 'right') {
            if (typeof this._right.label == 'object')
              $(this.id + 'rightonoff').className = _getClass(this._right.label.type).sel;

            if (typeof this._left.label == 'object')
              $(this.id + 'leftonoff').className = _getClass(this._left.label.type).unsel;
          }
          else {
            if (typeof this._right.label == 'object')
              $(this.id + 'rightonoff').className = _getClass(this._right.label.type).unsel;
              
            if (typeof this._left.label == 'object')
              $(this.id + 'leftonoff').className = _getClass(this._left.label.type).sel;
          }
        },

        _drawBtn : function(side, /* left or right component */
                            type, /* 'left' or 'right' */
                            h) {
          h.push('<div id="', this.id, type, '" ');
               h.push('class="', this._selectedValue == side.value ? 'selected' : '', '">',
                   '<a style="text-decoration:none; border:0px;" ',
                      'onclick="', this.fireCode('_handleClick', type, side.value), '">');

            if (typeof side.label == 'string')
                 h.push(side.label);
            else {
              var cls = (typeof side.label == 'object' && this._selectedValue == side.value) ?
                         _getClass(side.label.type).sel :
                         _getClass(side.label.type).unsel;
              h.push('<span id="', this.id, type, 'onoff" style="margin:1px;" class="', cls, '">&#160;</span>');
            }

            h.push('</a>',
                 '</div>');
        }
    });
})();