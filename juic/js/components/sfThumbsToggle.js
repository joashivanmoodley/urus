//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfAbstractSingleSelect.js
//! include /ui/juic/js/components/sfDefaultListModel.js
//! include /ui/rcminterview/css/thumbsToggle.css

/**
 * Creates an approve/reject thumb-up/thumb-down component with a hidden field with value "approve"|"reject"
 * @param name Required. Name of the hidden field for posting
 * @param defaultApproval True = approval by default, false = reject by default. Allows setting of this
 *                        before rendering
 */
function SFThumbsToggle(name, defaultApproval) {
    this.register();
    SFAbstractSingleSelect.prototype.setModel.call(this, ["approve", "reject"]);
    this._enabled = true;
    if (typeof name != "undefined") {
        this._name = name;
    }
    if (typeof defaultApproval != "undefined") {
        this.setApproval(defaultApproval);
    } else {
        this.setSelectedIndex(null);
    }
}

SFThumbsToggle.prototype = (function() {
    return set(new SFAbstractSingleSelect(), {
        renderHtml : function(h) {
            //render both thumbs unselected at first
            var selectedIndex = this.getSelectedIndex();
            var thumbUpClass,thumbDownClass;

            if (selectedIndex != null) {
                this._oldIndex = selectedIndex;
                thumbUpClass = (selectedIndex == 0) ? "selectedThumbUp" : "unselectedThumbUp";
                thumbDownClass = (selectedIndex == 0) ? "unselectedThumbDown" : "selectedThumbDown";
            } else {
                thumbUpClass = "unselectedThumbUp";
                thumbDownClass = "unselectedThumbDown";
            }

            h.push("<ul class=\"thumbsToggle\" id=\"", this.id, "\">",
                   "<li id=\"", this.id, "_thumbUp\" class=\"",thumbUpClass,"\" onclick=\"", this.fireCode("_setThumb", 0), "\"></li>",
                   "<li id=\"", this.id, "_thumbDown\" class=\"",thumbDownClass,"\" onclick=\"", this.fireCode("_setThumb", 1), "\"></li>");


            h.push("</ul>");

            if (this._name) {
                h.push("<input id=\"", this.id, "_input\" type=\"hidden\" name=\"name\" />");
            }
        },
        handleEvent : function(event) {
            if (event.type == "contentsChanged") {
                if ($(this.id)) {
                    var selectedIndex = this._model.getSelectedIndex();
                    this._selectThumb(selectedIndex);
                }
            }
        },

        /**
         * Sets both thumbs to be unselected
         */
        clearRating : function() {
            this.setSelectedIndex(null);
        },
        /**
         * Public method to set the approval. If true, approve will select thumbs-up and
         * vice-versa
         * @param approve
         */
        setApproval : function(approve) {
            var approval = (approve) ? 0 : 1;
            this.setSelectedIndex(approval);
        },
        /**
         * Private method used by the onclick
         * @param index
         */
        _setThumb : function(index) {
            if (index != this._oldIndex) {
                this.setSelectedIndex(index);
                //change
            } else {
                this.setSelectedIndex(null);
            }
        },
        /**
         * Private method that does the actual interactive work with the DOM.
         * @param index
         */
        _selectThumb : function(index) {
            this._oldIndex = index;
            if ($(this.id)) {
                if (index != null) {
                    $(this.id + "_thumbUp").className = (index == 0) ? "selectedThumbUp" : "unselectedThumbUp";
                    $(this.id + "_thumbDown").className = (index == 0) ? "unselectedThumbDown" : "selectedThumbDown";
                } else {
                    $(this.id + "_thumbUp").className = "unselectedThumbUp";
                    $(this.id + "_thumbDown").className = "unselectedThumbDown";
                }

                var input = $(this.id + "_input");
                if (input)
                    input.value = (index != null) ? this._model.get(index) : "";

                this.dispatch("change", {newIndex : index});
            }
        },
        setModel : function() {
            assert(false, "[SFThumbsToggle] Model cannot be changed.");
        },
        _updateModel : function() {
            this.setSelectedIndex(null);
            this._model.addEventListener("contentsChanged", this);
        },
        /**
         * Future. Need implementation details before coding this.
         */
        _updateEnabled : function() {
        },
        cleanup : function() {
            this._model.removeEventListener("contentsChanged", this);
            this.unregister();
        }
    });
})();
