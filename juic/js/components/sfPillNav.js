//! include /ui/juic/js/components/sfAbstractSingleSelect.js
//! include /ui/juic/js/components/sfDefaultListModel.js
//! include /ui/uicore/css/section_pills.css

/**
 * Version 1.0
 *
 * This is based upon the snippet: http://uitech.successfactors.com:8080/xidocs/xi/snippets/pills.xhtml
 * For version 1.0, the pill nav will have non-functional end caps. However, the extent parameter
 * is provided as a future enhancement. Building it this way so I can get the simple version out asap.
 *
 * @param modelOrArray
 * @param extent - Set the number of "pills" to display at once. If number of items exceeds this
 *                 arrows will be added to the end caps.
 */
function SFPillNav(modelOrArray, extent) {
    this.register();
    if (typeof extent != "undefined") {
        this.setExtent(parseInt(extent));
    }
    // Not sure how to get around this other than copying the _init of
    // SFAbstractSingleSelect into a local _init() method.
    SFAbstractSingleSelect.prototype._init.call(this, modelOrArray);
}

SFPillNav.prototype = (function() {
    return set(new SFAbstractSingleSelect(), {
        setExtent : function(extent) {
            this._extent = extent;
        },
        renderHtml : function(h) {
            h.push("<div class=\"section_pills_wrapper\" id=\"" + this.id + "\"><div class=\"section_pills\"><ul id=\"" + this.id + "_pillList\">");
            h.push("<li class=\"p_prev\"><span class=\"alt\">Previous</span></li>");

            //Get the model's selected index to compare to when setting the active pill.
            var modelIndex = this._model.getSelectedIndex();
            for (var idx = 0, len = this._model.size(); idx < len; ++idx) {
                var item = this._model.get(idx);
                h.push((idx == modelIndex) ? "<li class=\"pill_active\">" : "<li>");
                h.push("<a href=\"javascript:void(0);\" onclick=\"" + this.fireCode("changePill",idx) + ";return false;\">", item.toString(), "</a></li>");
            }

            /**
             * This next statement will be changed with an upcoming version if extent < items
             */
            h.push("<li class=\"p_next\"><span  class=\"alt\">Next</span></li>");
            h.push("</ul></div></div>");

        },
        /**
         * Public method to change the pill.
         * @param index
         */
        changePill : function(index) {
            if (index != this._model.getSelectedIndex())
                this._model.setSelectedIndex(index);
        },
        handleEvent : function(event) {
            switch (event.type) {
                /**
                 * Notice the branching in contentsChanged. Based upon the Swing method
                 * contentsChanged is fired when the selectedIndex changes OR when a specific item is
                 * changed in the model. When a selectedIndex is changed, the value passed to index0
                 * (the range designation) is -1. This allows us to tell the difference between the two
                 * actions.
                 */
                case "contentsChanged" :
                    if ($(this.id)) {
                        if (event.index0 == -1) {
                            //Also need to dispatch the component-level change event so other components
                            //can respond to the change.
                            this._selectPill(this._model.getSelectedIndex());
                        } else {
                            this._changePillText(event.index0);
                        }
                    }
                break;
            //The following are to be added...
                case "intervalAdded" :
                break;
                case "intervalRemoved" :
            }
        },
        setPillText : function(index, text) {
            this._model.setItemText(index, text);
        },
        _changePillText : function(index) {
            var item = this._model.get(index);
            var pillList = $(this.id + "_pillList");
            var pills = pillList.getElementsByTagName("li");
            pills[index].innderHTML = item.toString();
        },
        //set the selected pill on the DOM
        _selectPill : function(index) {
            var pillList = $(this.id + "_pillList");
            var pills = pillList.getElementsByTagName("li");
            //When parsing the li's, we have to ignore the first and last li's because those
            //are the endcaps
            for (var idx=1,len=pills.length-1,refIdx=0;idx<len;idx++) {
                var pill = pills[idx];
                pill.className = (refIdx == index) ? "pill_active" : "";
                refIdx++;
            }
            this.dispatch("change", {newIndex : index});
        },
        /**
         * Protected method invoked by SFAbstractSingleSelect after setModel is called.
         */
        _updateModel : function() {
            this._model.addEventListener("contentsChanged", this);
            this._model.addEventListener("intervalAdded", this);
            this._model.addEventListener("intervalRemoved", this);
        },
        cleanup : function() {
            this._model.removeEventListener("contentsChanged", this);
            this._model.removeEventListener("intervalAdded", this);
            this._model.removeEventListener("intervalRemoved", this);
            this.unregister();
        }
    });
})();

/**
 * This is a helper object for the drop down
 * @param value
 * @param text
 */
function SFSimpleSelectItem(value, text) {
    this.setValue(value);
    this.setText(text);
}

SFSimpleSelectItem.prototype = (function() {
    return {
        setValue : function(value) {
            this._value = value;
        },
        getValue : function() {
            return this._value;
        },
        setText : function(text) {
            this._text = text;
        },
        toString : function() {
            return this._text;
        }
    };
})();
/*

function SFPillNavTest(containerId) {
    this.register();
    this._containerId = containerId;
    this._init();
}

SFPillNavTest.prototype = (function() {
    return set(new Component(),{
        _init : function() {
            this._itemsList = {
                item0 : new SFSimpleSelectItem("value0", "Select Item 0"),
                item1 : new SFSimpleSelectItem("value1", "Select Item 1"),
                item2 : new SFSimpleSelectItem("value2", "Select Item 2"),
                item3 : new SFSimpleSelectItem("value3", "Select Item 3"),
                item4 : new SFSimpleSelectItem("value4", "Select Item 4")
            };

*/
/*
            for (var idx = 0;idx < 4;idx++) {
                this._itemsList.push(new SFSimpleSelectItem("value" + idx, "Select Item " + idx));
            }
*/
/*
            this._model = new SFDefaultSingleSelectModel(this._itemsList);
            this._model.setSelectedIndex(2);
            this._pillNav = new SFPillNav(this._model);
            this._pillNav.addEventListener("change", {
                handleEvent : function(event) {
                    //alert(event.newIndex);
                }
            });
            this._pillNav.render(this._containerId);
        }
    });
})();
*/
