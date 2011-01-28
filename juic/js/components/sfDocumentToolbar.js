//! include /ui/juic/js/components/sfDocumentToolbarButton.js
//! include /ui/juic/js/core/component.js
//! include /ui/jsfcore/css/menuBar.css

/**
 * Creates a toolbar layout as specified by: http://ui/awong/bento/snippets_toolbar.html 
 */
function SFDocumentToolbarLayout() {
    this.register();
    this._toolbarItems = [];
    this._separators = [];
}

SFDocumentToolbarLayout.prototype = (function() {
    /**
     * Private object for creating a separator between buttons or groups of buttons
     */
    function separator() {
        this.register();
    }
    separator.prototype = (function() {
        return set(new Component(), {
            renderHtml : function(h) {
                h.push("<span id=\"",this.id,"\" class=\"sep\">&nbsp;</span>");
            }
        });
    })();

    return set(new Component(), {
        /**
         * Main entry point for adding a toolbar button to the layout
         * @param component - must be of type SFToolbarButton
         */
        add : function(component) {
            assert((component instanceof SFToolbarButton) || (component instanceof separator),
                   "[SFToolbarLayout] The toolbar layout only accepts SFToolbarButton components as valid buttons")
            this._toolbarItems.push(component);
            this._renderButtons();
        },
        /**
         * Adds a separator to the _toolbarItems collection and is displayed as a vertical line
         * between buttons.
         */
        addSeparator : function() {
            var sep = new separator();
            this._separators.push(sep);
            this._toolbarItems.push(sep);
            this._renderButtons();
        },
        /**
         * Removes a button from collection and forces a rendering of the _toolbarItems collection
         * @param component
         */
        removeButton : function(component) {
            for (var idx=0,len=this._toolbarItems.length;idx<len;idx++) {
                if (this._toolbarItems[idx] === component) {
                    this._toolbarItems.splice(idx,1);
                    break;
                }
            }
            this._renderButtons();
        },
        setButtonVisible : function(buttonIndex, visible) {
            this._toolbarItems[buttonIndex].setVisible(visible);
        },
        /**
         * Notice that unlike with removeButton, a component reference isn't passed here. This is
         * because there is no public interface into separator instances. Therefore, a separate
         * separator collection is created. Calling component simply passes the index of the separator remove
         * (zero-based, left to right), to remove a separator. The proper separator instance reference is located
         * in the separator collection, then passed to removeButton to remove from the toolbarItems collection.
         * @param index
         */
        removeSeparator : function(index) {
            assert(this._separators[index],
                    "[SFToolbarLayout] Separator does not exist with index provided (Remember: indexes are zero-based)");
            var sep = this._separators[index];
            this.removeButton(sep);
        },
        renderHtml : function(h) {
            h.push("<span id=\"",this.id,"\">")
            this._getItemsHtml(h);
            h.push("</span>");
        },
        _getItemsHtml : function(h) {
            for (var idx=0,len=this._toolbarItems.length;idx<len;idx++) {
                this._toolbarItems[idx].renderHtml(h);
            }
        },
        _renderButtons : function() {
            if ($(this.id)) {
                var h = [];
                this._getItemsHtml(h);
                $(this.id).innerHTML = h.join("");
            }
        }
    });
})();