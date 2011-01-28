//! include /ui/juic/js/core/component.js

/**
 * Text Model can be used to handle large blocks on content.
 *
 * @param text - String of text to set to the model
 */
function SFTextModel(text) {
    this._text = (text) ? text : '';
}

SFTextModel.prototype = (function() {
    return set(new Component(), {
        /**
         * Returns the length of the text
         */
        getLength: function() {
            return this._text.length;
        },
        /**
         * Returns text of model
         */
        getText: function() {
            return this._text;
        },
        /**
         * Sets text to model
         */
        setText: function(text) {
            this._text = text;
            this.dispatch('contentsChanged');
        }
    });
})();