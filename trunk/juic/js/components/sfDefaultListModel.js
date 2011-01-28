/**
 * Implements the SFListModel Interface
 * @param items
 */
function SFDefaultListModel(items) {
    this._items = [];
    if (typeof items != "undefined") {
        this.setItems(items);
    }
}
SFDefaultListModel.prototype = (function() {
    return set(new EventTarget(), {
        /**
         * Adds a new item to the end of the list
         * Dispatches intervalAdded with the last item's index for index0 and index1
         * @param newItem
         */
        add : function(newItem) {
            this._items.push(newItem);
            var lastIndex = (this._items.length > 0) ? this.size() - 1 : 0;
            this.dispatch("intervalAdded", {index0 : lastIndex, index1 : lastIndex});
            this.intervalAdded(lastIndex, lastIndex);
        },
        getlength : function(){
            return this._items.length;
        },
        /**
         * Inserts a new item into a specific position on the list.
         * Dispatches intervalAdded. index0 and index1 are the index passed
         * @param index
         * @param newItem
         */
        insertItemAt : function(index, newItem) {
            assert(this._items[index], "ERROR: Invalid index passed to insertItemAt. Index is out of range.");
            this._items.splice(index, 0, newItem);
            this.dispatch("intervalAdded", {index0: index, index1: index});
            this.intervalAdded(index, index);
        },
        /**
         * Clears the entire list.
         */
        clear : function() {
            var lastIndex = this._items.length - 1;
            this._items.length = 0;
            this.intervalRemoved(0, lastIndex);
            this.dispatch("intervalRemoved", {index0 : 0, index1 : lastIndex});
        },
        /**
         * Returns the index of an object in the list.
         * @param item
         */
        indexOf : function(item) {
            var index = this._items.length;
            while (index) {
                if (this._items[(index - 1)] === item) {
                    return index - 1;
                }
                index--;
            }
            return -1;
        },
        /**
         * Copies the contents of the items list into an array. The array must be a valid array
         * as the reference is worked on directly.
         * @param array
         */
        copyInto : function(array) {
            assert((array.constructor == Array), "[SFDefaultListModel] Invalid object passed into copyInto. Must be an array.");
            array.concat(this._items);
        },
        /**
         * Returns the item specified at the particular reference.
         * @param index
         */
        get : function(index) {
            return this._items[index];
        },
        /**
         * Returns the first item of the list
         */
        getFirstItem : function() {
            return this.get(0);
        },
        /**
         * Returns the last item in the list
         */
        getLastItem : function() {
            return this.get(this.size() - 1);
        },
        /**
         * Returns the size of the list
         */
        size : function() {
            return this._items.length;
        },
        /**
         * Returns the empty state of the list
         */
        isEmpty : function() {
            return (this.size() == 0);
        },
        /**
         * Removes the last item in the list
         */
        remove : function() {
            this._items.length.pop();
            var lastIndex = this._items.length - 1;
            this.intervalRemoved(lastIndex, lastIndex);
            this.dispatch("intervalRemoved", {index0: lastIndex, index1 : lastIndex});
        },
        /**
         * Removes the item at the particular index.
         * @param index
         */
        removeItemAt : function(index) {
            assert(this._items[index], "ERROR: Invalid index passed to removeItemAt. Index is out of range.");
            var retVal = this._items.splice(index, 1);
            this.dispatch("intervalRemoved", {index0:index, index1:index});
            this.intervalRemoved(index, index);
            return retVal;
        },
        /**
         * Removes items fromIndex and toIndex
         * @param fromIndex
         * @param toIndex
         */
        removeRange : function(fromIndex, toIndex) {
            assert(this._items[fromIndex] && this._items[toIndex], "ERROR: Invalid indices passed to removeRange. Either fromIndex or toIndex is out of range.");
            var deleteCount = (toIndex - fromIndex) + 1;
            var retVal = this._items.splice(fromIndex, deleteCount);
            this.dispatch("intervalRemoved", {index0: fromIndex, index1: toIndex});
            this.intervalRemoved(fromIndex, toIndex);
            return retVal;
        },
        /**
         * Replaces the item at specified index with a new item.
         * @param index
         * @param newItem
         */
        set : function(index, newItem) {
            this._items[index] = newItem;
            this.dispatch("contentsChanged", {index0:index, index1:index});
        },
        setItems : function(items) {
            //Need to check if stuff is in there first
            if (this._items.length > 0) {
                this._items.length = 0;
                this.dispatch("intervalRemoved",{index0 : 0,index1 : this.size() - 1});
            }

            this._items = (items.constructor == Array) ? items : [];
            if (items.constructor == Array) {
                this._items = items;
            } else {
                //if items is passed as a JSON, then loop through the
                //JSON and push each item onto the items stack.
                for (var item in items) {
                    this._items.push(item);
                }
            }
            this.dispatch("intervalAdded",{index0 : 0,index1 : this.size() - 1});
            this.intervalAdded(0, this.size() - 1);
        },

        /**
         * Returns backing item list.
         */
        getItems : function() {
            return this._items;
        },

        /**
         * Internally handle intervals being removed. This should be overridden by child classes when
         * some processing logic must be done. For example indices must be kept in tact.
         */
        intervalRemoved : function(index0, index1) {
        },

        /**
         * Internally handle intervals being added. This should be overridden by child classes when
         * some processing logic must be done. For example indices must be kept in tact.
         */
        intervalAdded : function(index0, index1) {
        }
    });
})();

/**
 * Implements the SFSingleSelectModel Interface.
 * This is a direct descendant of SFDefaultListModel, and adds two methods for item selection.
 */
function SFDefaultSingleSelectModel(items) {
    assert(items, "[SFDefaultSingleSelectModel] No items were passed");
    //Call the constructor of SFDefaultListModel to initialize the items list
    SFDefaultListModel.call(this,items);
    //initialize with a default selection
    if (this.size() > 0)
        this._selectedIndex = 0;
}
SFDefaultSingleSelectModel.prototype = (function() {
    return set(new SFDefaultListModel(), {
        /**
         * Sets the selected currently selected index of the single select. This dispatches
         * a contents changed. Note the values of index0 and index1. This provides
         * differentiation from other contents changed events
         * @param index
         */
        setSelectedIndex : function(index) {
            this._selectedIndex = index;
            this.dispatch("contentsChanged", {index0:-1, index1:-1});
        },
        /**
         * Returns the currently selected index
         */
        getSelectedIndex : function() {
            return this._selectedIndex;
        },

        intervalAdded : function(index0, index1) {
            if (this._selectedIndex >= index0) {
                this._selectedIndex += index1 - index0 + 1;
                if (this._selectedIndex >= this.size()) {
                    this._selectedIndex = this.size() - 1;
                }
            }
        },

        intervalRemoved : function(index0, index1) {
            if (this._selectedIndex >= index0) {
                if (this._selectedIndex <= index1) {
                    // We are removing the current item so goto default
                    this._selectedIndex = 0;
                } else {
                    this._selectedIndex -= index1 - index0 + 1;
                }
                this.dispatch("contentsChanged", {index0:-1, index1:-1});
            }
        }
    });
})();

function SFDefaultMultiSelectModel(items) {
    assert(items, "[SFDefaultSingleSelectModel] No items were passed");
    //initialize with a default selection
    this._selectedIndices = [];
    //Call the constructor of SFDefaultListModel to initialize the items list
    SFDefaultListModel.call(this,items);
}


SFDefaultMultiSelectModel.prototype = (function() {
    return set(new SFDefaultListModel(), {
        addSelectedIndex : function(index) {
            assert(index >= 0 && index < this.size(), "[SFDefaultMultiSelectModel] Invalid index: " + index);
            if (!this._selectedIndices.contains(index)) {
                this._selectedIndices.push(index);
            }
            this.dispatch("selectionChanged");
        },

        removeSelectedIndex : function(index) {
            for (var idx=0, len=this._selectedIndices.length; idx<len; idx++) {
                if (this._selectedIndices[idx] === index) {
                    this._selectedIndices.splice(idx, 1);
                    this.dispatch("selectionChanged");
                    break;
                }
            }
        },

        setSelectedIndices : function(indices) {
            this._selectedIndices.length = 0;
            if(indices && indices.length > 0) {
                for (var idx=0, len=indices.length; idx<len; idx++) {
                    assert(indices[idx] >= 0 && indices[idx] < this.size(), "[SFDefaultMultiSelectModel] Invalid index: " + indices[idx] + " max " + (this.size() - 1));
                    this._selectedIndices.push(indices[idx]);
                }
            }
            this.dispatch("selectionChanged");
        },

        isIndexSelected : function(index) {
            return this._selectedIndices.contains(index);
        },

        getSelectedIndices : function() {
            return this._selectedIndices.concat();
        },

        intervalAdded : function(index0, index1) {
            for (var idx=0, len=this._selectedIndices.length; idx<len; idx++) {
                if (this._selectedIndices[idx] >= index0) {
                    this._selectedIndices[idx] += index1 - index0 + 1;
                }
            }
        },

        intervalRemoved : function(index0, index1) {
            var idx = 0;
            var removed = false;
            while (idx < this._selectedIndices.length) {
                if (this._selectedIndices[idx] >= index0) {
                    if (this._selectedIndices[idx] <= index1) {
                        removed = true;
                        this._selectedIndices.splice(idx, 1);
                        idx--;
                    } else {
                        this._selectedIndices[idx] += index1 - index0 + 1;
                    }
                }
                idx++;
            }
            if (removed) {
                this.dispatch("selectionChanged");
            }
        }
    });
})();