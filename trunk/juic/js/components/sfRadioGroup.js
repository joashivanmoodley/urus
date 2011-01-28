//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfDefaultListModel.js
//! include /ui/juic/js/components/sfAbstractSingleSelect.js

function SFRadioGroup(modelOrArray, radioGroupName, options) {
    this.register();
    assert(radioGroupName, "[SFRadioGroup] Name param required.");
    this._radioGroupName = radioGroupName;
    this._options = (options) ? options : {vertical : true};
    SFAbstractSingleSelect.prototype._init.call(this, modelOrArray);
}

SFRadioGroup.prototype = (function() {
    return set(new SFAbstractSingleSelect(), {
        /**
         * Invoke renderHtml as usual if you want to render the radio buttons together
         * @param h
         */
        renderHtml : function(h) {
            var listClass = (this._options.vertical) ? "nodisc" : "flatten";
            h.push("<div id=\"", this.id, "\"><ul class=\"", listClass, "\" id=\"", this.id, "_list\">");
            for (var index = 0,len = this._model.size(); index < len; index++) {
                var item = this._model.get(index);
                h.push("<li style=\"padding-right:1em\">");
                this.renderRadioButton(h,index);
                h.push("</li>");
            }
            h.push("</ul></div>");
        },
        /**
         * Renders an individual radio button. This is useful for rendering radio
         * buttons that are not arranged in a contiguous fashion in a layout.
         * @param h
         * @param index - must be a valid index in the model.
         */
        renderRadioButton : function(h, index) {
            var item = this._model.get(index);
            var valueString = (item.getValue) ? "value=\"" + item.getValue() + "\" " : "value=\"" + index + "\" ";
            var id = this.id + "_item_" + index;
            var checked = (index == this._model.getSelectedIndex()) ? "checked" : "";
            h.push("<input type=\"radio\" id=\"", id, "\" name=\"", this._radioGroupName, "\" ",
                    valueString, " onclick=\"", this.fireCode("_changeSelection", index), "\" ",checked," />");
            if (item.toString && item.toString() != "")
                h.push("&#160;<label style=\"cursor:pointer;\" for=\"", this.id, "_item_", index, "\">", item.toString(), "</label>");
        },
        _updateModel : function() {
            this._model.addEventListener("contentsChanged", this);
            this._model.addEventListener("intervalAdded", this);
            this._model.addEventListener("intervalRemoved", this);
        },
        _changeSelection : function(index) {
            //only set the selected index if the button isn't checked already
            if (index != this._model.getSelectedIndex()) {
                this.setSelectedIndex(index);
            }
        },
        setItemLabel : function(index, text) {
            this._model.setItemText(index, text);
        },
        
        handleEvent : function(event) {
            var radioButton = $(this.id + "_item_" + this._model.getSelectedIndex());
            if (radioButton) {
                switch (event.type) {
                    case "contentsChanged" :
                        if (event.index0 == -1) {
                            //new radio button clicked, now select it
                            radioButton.checked = true;
                            var index = this._model.getSelectedIndex();
                            var item = this._model.get(index);
                            var newVal = (item.getValue) ? item.getValue() : item.toString();
                            this.dispatch("change", {newIndex : index, newValue : newVal});
                        } else {
                            //Text was changed
                            $(this.id + "_label_" + event.index0).innerHTML = this._model.get(event.index0);
                        }
                        break;
                    case "intervalAdded" :
                        break;
                    case "intervalRemoved" :
                }
            }
        },
        setValue : function(value) {
            for (var index=0, len=this._model.size(); index<len; index++) {
                if (value == $(this.id + "_item_" + index).value) {
                    this.setSelectedIndex(index);
                }
            }
        },
        getValue : function() {
            return $(this.id + "_item_" + this._model.getSelectedIndex()).value;
        },
        cleanup : function() {
            this._model.removeEventListener("contentsChanged", this);
            this._model.removeEventListener("intervalAdded", this);
            this._model.removeEventListener("intervalRemoved", this);
            this.unregister();
        }
    });
})();

function SFRadioGroupTest() {
    this.register();
    this.init();
}

SFRadioGroupTest.prototype = (function() {
    return set(new Component(), {
        init : function() {
            this._items = ["", "", "", "", ""];
            this._model = new SFDefaultSingleSelectModel(this._items);
            this._model.setSelectedIndex(999);
            this._rg = new SFRadioGroup(this._model, "mygroup", {vertical:false});
            this._rg.addEventListener("change", this);
        },
        renderHtml : function(h) {
            h.push("<table style=\"border-left:1px solid grey;border-top:1px solid grey;border-collapse:true;\">");
            for (var idx=0, len=this._model.size();idx<len;idx++) {
                h.push("<tr>");
                h.push("<td style=\"padding:.5em;border-right:1px solid grey;border-bottom:1px solid grey;\">This is just some test text</td>");
                h.push("<td style=\"padding:.5em;border-right:1px solid grey;border-bottom:1px solid grey;\">");
                this._rg.renderRadioButton(h, idx);
                h.push("</td>");
                h.push("</tr>");
            }
            h.push("<tr><td colspan=\"2\" id=\"",this.id,"_message\" style=\"padding:.5em;border-right:1px solid grey;border-bottom:1px solid grey;\"></td></tr>")
            h.push("<table>");
        },
        handleEvent : function(event) {
            if (event.type == "change") {
                $(this.id + "_message").innerHTML = "You clicked on: " + event.newIndex;
            }
        },
        setNewText : function(index, text) {
            this._model.setItemText(index, text + index);
        }
    });
})();
