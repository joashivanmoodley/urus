//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/SFTextModel.js

/**
 * Text truncate component that handles rendering of truncated content.
 *
 * @param limit         - (int) Number of characters to count before truncate starts
 * @param textOrModel   - (string or SFTextModel) Text to truncate
 */
function SFTextTruncate(limit, textOrModel) {
    this.register();
    assert(limit, '[SFTextTruncate] A limit(int) is required!');
    this._limit = limit; // Character count for model to start truncating the text
    this._displayText = ''; // Local variable used to display truncated or full text to page
    this._collapsed = true; // Boolean to keep track of truncated state
    this._init(textOrModel);
}

SFTextTruncate.prototype = (function() {
    return set(new Component(), {
        _init: function(textOrModel) {
            textOrModel = (typeof textOrModel == "undefined") ? '' : textOrModel;
            this._setModel(textOrModel);
        },
        /**
         * Sets this._model to SFTextModel. Default action is to
         * truncate text so the _truncateText method is called
         * after setting this._model. Adds the "contentsChanged"
         * event listener to keep track of text the SFTextModel is
         * storing.
         *
         * @param textOrModel - String or SFTextModel
         */
        _setModel: function(textOrModel) {
            this._model = (textOrModel.constructor == Object) ? textOrModel : new SFTextModel(textOrModel);
            this._truncateText();
            this._model.addEventListener('contentsChanged', this);
        },
        /**
         * Truncates text that is sent in to defined character limit.
         *
         * @param text - String of text to truncate
         */
        _truncateText: function() {
            this._displayText = this._model.getText().substring(0, this._limit);
            this._displayText = this._displayText.replace(/\w+$/, '');
        },
        /**
         * Checks whether the text on the page is truncated or not
         * then either replaces content with full text or truncated
         * text. Also keeps track of truncated state.
         */
        _handleTruncate: function() {
            if(this._collapsed == true) { // Text is already truncated, get full text
                this._displayText = this._model.getText();
                $(this.id + "_link").innerHTML = '[Read Less]';
            }
            else { // Text is not truncated get full text and truncate it
                this._truncateText();
                $(this.id + "_link").innerHTML = '...';
            }
            $(this.id + "_display").innerHTML = this._displayText;
            
            (this._collapsed == true) ? this._collapsed = false : this._collapsed = true;
        },
        /**
         * Wrapper for SFTextModel.setText().
         */
        setText: function(text) {
            this._model.setText(text);
        },
        renderHtml: function(h) {
            h.push('<span id="', this.id, '" class="truncated-text">',
            '<span id="', this.id, '_display">', this._displayText, '</span>',
            '<a id="', this.id, '_link" href="javascript:void(0);" onclick="', this.fireCode('_handleTruncate'), ' return false;">...</a>',
            '</span>');
        },
        handleEvent: function(event) {
            if(event.type == 'contentsChanged') {
                this._collapsed = false;
                this._truncateText();
                this._handleTruncate();
            }
        }
    });
})();