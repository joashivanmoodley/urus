//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfAbstractMultiSelect.js
//! include /ui/juic/js/components/sfDefaultListModel.js

/**
 * This is a checkbox list component that is completely model driven
 * and derived from the SFAbstractMultiSelect component.
 * 
 * @param modelOrArray
 */
function SFCheckboxMultiSelect(modelOrArray) {
    this.register();
    // Not sure how to get around this other than copying the _init of
    // SFAbstractSingleSelect into a local _init() method.
    this._disabledIndices = [];
    SFAbstractSingleSelect.prototype._init.call(this, modelOrArray);
}

SFCheckboxMultiSelect.prototype = (function() {
    function getValue(item) {
        return item.getValue ? item.getValue() : item.value ? item.value : item.toString();
    }
    
    return set(new SFAbstractMultiSelect(), {
        renderHtml : function(html) {
            html.push('<ul id="', this.id, '" class="ckrbList">');
            this._renderContent(html);
            html.push('</ul>');
        },
        getSelectedValues : function() {
            var values = [];
            for (var idx=0, len=this._model.size(); idx<len; idx++) {
                if (this.isIndexSelected(idx)) {
                    var item = this._model.get(idx);
                    values.push(getValue(item));
                }
            }
            return values;
        },
        setSelectedValues : function(values) {
            var indices = [];
            assert(values.constructor == Array, "[SFCheckboxMultiSelect] selected indices must be an array");
            for (var idx=0, len=this._model.size(); idx<len; idx++) {
                var value = getValue(this._model.get(idx));
                if (values.contains(value)) {
                    indices.push(idx);
                }
            }
            this.setSelectedIndices(indices);
        },
        _renderContent : function(html) {
            for (var idx=0, len=this._model.size(); idx<len; idx++) {
                var item = this._model.get(idx);
                html.push('<li><input id="', this.id, idx, '" type="checkbox" onclick="');
                html.push(this.fireCode('_onClick', idx), '"');
                if(this._model.isIndexSelected(idx)) {
                    html.push(' checked="checked"');
                }
                if(!this.isIndexEnabled(idx)) {
                    htmltml.push(' disabled="disabled"');
                }
                html.push('><label id="', this.id, idx, 'label" for="', this.id, idx, '">');
                html.push(escapeHTML(item.toString()));
                html.push('</label></li>');
            }
        },
        _updateContent : function() {
            var obj = $(this.id);
            if(obj) {
                var html = [];
                this._renderContent(html);
                obj.innerHTML = html.join('');
            }
        },
        _onClick : function(index) {
            var checked = $(this.id + index).checked;
            if (checked) {
                this._model.addSelectedIndex(index);
            } else {
                this._model.removeSelectedIndex(index);
            }
        },
        handleEvent : function(event) {
            var select = $(this.id);
            switch (event.type) {
                case "contentsChanged" :
                    if (select) {
                        for (var idx=event.index0; idx<=event.index1; idx++) {
                            var item = this._model.get(idx);
                            $(this.id + idx + 'label').innerHTML = escapeHTML(item.toString());
                        } 
                    }
                    break;
                case "selectionChanged" :
                    if (select) {
                        for (var idx=0, len=this._model.size(); idx<len; idx++) {
                            $(this.id + idx).checked = this.isIndexSelected(idx);
                        }
                    }
                    break;
                case "intervalAdded" :
                    this._intervalAdded(event.index0, event.index1);
                    break;
                case "intervalRemoved" :
                    this._intervalRemoved(event.index0, event.index1);
                    break;
            }
        },
        _intervalAdded : function(index0, index1) {
            for (var idx=0, len=this._disabledIndices.length; idx<len; idx++) {
                if (this._disabledIndices[idx] >= index0) {
                    this._disabledIndices[idx] += index1 - index0 + 1;
                }
            }
        
            this._updateContent();
        },
        _intervalRemoved : function(index0, index1) {
            var idx = 0;
            while (idx < this._disabledIndices.length) {
                if (this._disabledIndices[idx] >= index0) {
                    if (this._disabledIndices[idx] <= index1) {
                        this._disabledIndices.splice(idx, 1);
                        idx--;
                    } else {
                        this._disabledIndices[idx] += index1 - index0 + 1;
                    }
                }
                idx++;
            }
            this._updateContent();
        },
        setIndexEnabled : function(index, enabled) {
            if (enabled) {
                this._disabledIndices.remove(index);
            } else if (!this._disabledIndices.contains(index)){
                this._disabledIndices.push(index);
            }
        },
        isIndexEnabled : function(index) {
            return !this._disabledIndices.contains(index);
        },
        /**
         * Protected method invoked by SFAbstractSingleSelect after setting the enabled flag
         */
        _updateEnabled : function() {
            for (var idx=0, len=this._model.size(); idx<len; idx++) {
                $(this.id + idx).disabled = !this.isIndexEnabled(idx);
            }
        },
        /**
         * Protected method invoked by SFAbstractSingleSelect after setModel is called. As with
         * _updateEnabled, allows a developer to add functionality to setModel.
         */
        _updateModel : function() {
            this._model.addEventListener("contentsChanged", this);
            this._model.addEventListener("selectionChanged", this);
            this._model.addEventListener("intervalAdded", this);
            this._model.addEventListener("intervalRemoved", this);
        },
        cleanup : function() {
            this._model.removeEventListener("contentsChanged", this);
            this._model.removeEventListener("selectionChanged", this);
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