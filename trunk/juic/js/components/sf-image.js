//! include /ui/juic/js/core/component.js

/**                                  
 * JUIC Component for creating an img tag
 * @param value: Source of the image
 * @param config:
 *      Possible values for the configuration:
 *      width: Width of the image
 *      height: height of the image
 *      cssClass: CSS class of the image
 */
function SFImage(value, config) {                                   
    this.register();
    this.setValue(value);
    this._config = config;
}

SFImage.prototype = (function() {
     return set(new Component(), {
        setValue: function (value) {
            // this._valuer is the URL of the image
            this._value = value;
        },
        getValue: function (value) {
            return this._value;
        },
        _handleMouseover : function() {
            this.dispatch("mouseover");
        },
        _handleMouseout : function() {
            this.dispatch("mouseout");
        },
        _handleClick : function() {
            this.dispatch("click");
        },
        renderImage: function(h) {
            assert(this._value != "", "There is no source to create the image");
            h.push('<img src="' + this._value + '"'+
                   ' onmouseover="' + this.fireCode ("_handleMouseover") + '"' +
                   ' onmouseout="' + this.fireCode ("_handleMouseout") + '"'+
                   ' onclick="' + this.fireCode ("_handleClick") + '"'+
                   (this._config && this._config.width ? " width='"+ this._config.width +"'" : "")+
                   (this._config && this._config.height ? " height='"+ this._config.height +"'" : "")+
                   (this._config && this._config.cssClass ? " class='"+ this._config.cssClass +"'" : "")+
                                            ' />');
      },
      renderHtml: function(h) {
           h.push('<div id="' + this.id + '" >');
           this.renderImage(h);
           h.push('</div>');
       },
       reRender: function() {
    	   var h = [];
    	   this.renderImage(h);
    	   $(this.id).innerHTML = h.join("");
       }
    });
})();
