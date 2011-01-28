//! include /ui/juic/js/core/component.js
/**
 * Abstract class for boxLayout components.
 */
function SFAbstractBoxLayout() {
    //Do not allow this component to be instantiated.
    assert(this.constructor !== SFAbstractBoxLayout, "[SFAbstractBoxLayout] No implementation available for SFAbstractBoxLayout. You must subclass it.");
}
SFAbstractBoxLayout.prototype = ( function() {
    return set(new Component(), {
        _renderOpenDiv : function(h) {
            h.push("<div class='card clear_all'>")
        },
        _renderCloseDiv : function(h) {
            h.push("</div>")
        },
        renderHtml : function(h) {
            this._renderOpenDiv(h);
            this.component.renderHtml(h);
            this._renderCloseDiv(h);
        }
    });
})();
/**
 * this will render a box with the component from the constructor
 * @param component JUIC component required
 */
function SFBoxLayout(component) {
    this.register();
    assert(component, "[sfBoxLayout] JUIC component required.");
    this.component = component;
}
SFBoxLayout.prototype = ( function() {
    return set(new SFAbstractBoxLayout(), {
    });
})();
/**
 * this will render a staple box with the component from the constructor
 * @param component JUIC component required
 */
function SFStapleBoxLayout(component) {
    this.register();
    assert(component, "[sfBoxLayout] JUIC component required.");
    this.component = component;
}
SFStapleBoxLayout.prototype = ( function() {
    return set(new SFAbstractBoxLayout(), {
        _renderOpenDiv : function(h) {
            h.push("<div class='card clear_all'>");
            h.push(" <div class='staple'></div>")
        }
    });
})();


