/**
 * Renders a button that consists of left and right parts
 *
 * @param value - label
 * @param config
 * 		leftCss - use btn_left by default
 * 		rightCss - use btn_right by default
 * 		onClick - the event name to dispatch when the button is clicked
 * @return button
 */
function SFButton(value, config) {
	this.register();
	this._config = config;
    this._leftCss = (this._config && this._config.leftCss) ? this._config.leftCss : 'btn_left';
    this._rightCss = (this._config && this._config.rightCss) ? this._config.rightCss : 'btn_right';
    this._onClick = (this._config ? this._config.onClick : false);
    this._mask = (this._config ? this._config.mask : false);
    this.setValue(value);
}

SFButton.prototype = (function() {
    return set(new Component(), {
       setValue: function (value) {
           this._value = value;
       },
       _getButtonLabel: function(value,h) {
           if (typeof value != "object") return h.push(Util.escapeHTML(value));
           else value.renderHtml(h);
       },
       setLeftCss: function(leftCss) {
    	   this._leftCss = leftCss;
       },
       setRightCss: function(rightCss) {
    	   this._rightCss = rightCss;
       },
       setOnClick: function(onClick) {
    	   this._onClick = onClick;
       },
       setMask: function(mask) {
    	   this._mask = mask;
       },
       renderHtml: function(h) {
           h.push('<div id="' + this.id + '_w">');
           this.renderButton(h);
           h.push('</div>');
       },
       renderButton: function(h) {
    	   h.push('<div id="' + this.id + '"');
           if (this._onClick) {
        	   h.push('style="cursor:pointer;" onclick="' + this.fireCode('_handleOnClick') + 'return false;"');
           }
           h.push('>');
           if (this._mask) h.push('<div style="cursor:default;width:100%,height:100%;filter:alpha(opacity=30);' +
                                  'opacity:0.3">');
           h.push('<ul class="flat_list"><li class="' + this._leftCss + '"><div class="');
           h.push(this._rightCss + '"><span>');
           this._getButtonLabel(this._value,h);
           h.push('</span></div></li></ul>');
           if (this._mask) h.push('</div>');
           h.push('</div>');
       },
       reRender: function() {
    	 var h = [];
    	 this.renderButton(h);
    	 $(this.id + '_w').innerHTML = h.join("");
       },
       /*
        * Supports onClick that dispatches the event name that is passed in
        */
       _handleOnClick: function() {
    	   if (this._onClick) {
    		   this.dispatch(this._onClick);
    	   }
       }
   });
})();
