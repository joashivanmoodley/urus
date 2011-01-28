//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfAbstractSingleSelect.js
//! include /ui/juic/js/components/sfDefaultListModel.js

/**
 * This is a simple drop-down component that is completely model driven
 * and derived from the SFAbstractSingleSelect component. Note also that this
 * component makes use of a "helper" object (listed below) called simpleSelectObject,
 * as an element of the input array.
 * 
 * @param modelOrArray
 * @param name
 */
function SFDropDown(modelOrArray, name) {
    this.register();
    if (name)
        this._name = name;
    // Not sure how to get around this other than copying the _init of
    // SFAbstractSingleSelect into a local _init() method.
    SFAbstractSingleSelect.prototype._init.call(this, modelOrArray);
}

SFDropDown.prototype = (function() {
    return set(new SFAbstractSingleSelect(), {
        /**
         * Returns the value of component. Gets the selected item
         * from the model, then either returns with the item's getValue()
         * or returns the toString() if getValue() doesn't exist.
         */
        getValue : function() {
            var item = this._model.get(this._model.getSelectedIndex()); 
            return (item.getValue) ? item.getValue() : (item.value) ? item.value : item.toString();
        },
        /**
         * The important thing to note here is that there is no DOM operation here. If
         * the value passed is a valid value, then the model will dispatch at "contentsChanged"
         * to which the component will respond, then set its selected index. That will cause
         * an automatic value change on the DOM.
         * @param value
         */
        setValue : function(value) {
            for (var index=0,len=this._model.getlength();index<len;index++) {
                var item = this._model.get(index);
                var itemValue = (item.getValue) ? item.getValue() : (item.value) ? item.value : item.toString();
                if (itemValue == value) {
                    this._model.setSelectedIndex(index);
                    return true;
                }
            }
            return false;
        },
        setEnabled:function(enabled){
	        var select = $(this.id);
	        if(select){
	            select.disabled = !enabled;
	        }
        },
        renderHtml : function(h) {
            h.push("<select id=\"",this.id,"\" onchange=\"",this.fireCode("_onChange"),"\"");

            if (this._name)
                h.push(" name=\"",this._name,"\"");


            h.push(">");
            var selectedIndex = this._model.getSelectedIndex();
            for (var idx = 0, len = this._model.size(); idx < len; ++idx) {
                h.push("<option");
                var item = this._model.get(idx);
                var itemValue = (item.getValue) ? item.getValue() : (item.value) ? item.value : item.toString();
                if (itemValue)
                    h.push(" value=\"", itemValue, "\"");
                if(idx === selectedIndex)
                    h.push(" selected");
                h.push(">", escapeHTML(item.toString()));
                h.push("</option>");
            }

            h.push("</select>");
        },
        /**
         * An important thing to note with this onchange handler is that
         * there is nothing acted upon within the component itself. This is because
         * the indexes of the model AND the component should match up.
         */
        _onChange : function() {
            this._model.setSelectedIndex($(this.id).selectedIndex);
        },
        handleEvent : function(event) {
            var select = $(this.id);
            var option;
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
                            $(this.id).selectedIndex = this._model.getSelectedIndex();
                        } else {
                            var item = this._model.get(event.index0);
                            option = $(this.id).options[$(this.id).selectedIndex];
                            option.firstChild.innerHTML = item.toString();
                            var itemValue = (item.getValue) ? item.getValue() : (item.value) ? item.value : item.toString();
                            if (itemValue) option.firstChild.setAttribute("value", itemValue);
                        }
                    }
                    if ($(this.id)) {
                        //Also need to dispatch the component-level change event so other components
                        //can respond to the change.
                        this.dispatch("change",{newIndex : this._model.getSelectedIndex()});
                    }

                break;
                case "intervalAdded" :
                    //This is a little tricky here because the last index of the model's list is actually
                    //one greater than the physical options list, so you have to set lastIndex
                    //to the length of the options list.
                    if ($(this.id)) {
                        var lastIndex = select.options.length;
                        if (lastIndex == parseInt(event.index0)) {
                            this._addOption();
                        } else {
                            this._insertOptionAt(event.index0);
                        }
                    }
                break;
                case "intervalRemoved" :
                    if ($(this.id)) {
                        var index0 = parseInt(event.index0);
                        var index1 = parseInt(event.index1); 
                        var upperLimit = (index1 > index0) ? index1 : index0;
                        for(var i=index0; i<=upperLimit; i++){
                            option = select.childNodes[0];
                            select.removeChild(option);
                        }
                    }
            }                    
        },
        _createOption : function(index) {
            var newOption = document.createElement("option");
            var item = this._model.get(index);
            newOption.innerHTML = escapeHTML(item.toString());
            var itemValue = (item.getValue) ? item.getValue() : (item.value) ? item.value : item.toString();
            if (itemValue) newOption.setAttribute("value", itemValue);
            return newOption;
        },
        _addOption : function() {
            var select = $(this.id);
            var newOption = this._createOption(this._model.size() - 1);
            select.appendChild(newOption);
        },
        _insertOptionAt : function(fromIndex) {
            var select = $(this.id);
            //Do the insertBefore on the next item after index0
            //as the item at index0 will take its place.
            var referenceIndex = fromIndex + 1;

            //Create a new option
            var newOption = this._createOption(fromIndex);

            var referenceOption = select.childNodes[referenceIndex];
            select.insertBefore(newOption, referenceOption);
        },
        /**
         * Protected method invoked by SFAbstractSingleSelect after setting the enabled flag
         */
        _updateEnabled : function() {
            $(this.id).disabled = !($(this.id).disabled);
        },
        /**
         * Protected method invoked by SFAbstractSingleSelect after setModel is called. As with
         * _updateEnabled, allows a developer to add functionality to setModel.
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