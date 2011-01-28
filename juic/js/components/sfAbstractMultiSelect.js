//! include /ui/juic/js/core/component.js
//! include /ui/juic/js/components/sfDefaultListModel.js
/**
 * Abstract class for all multi select components.
 * Note that no setValue, getValue, or renderHtml methods are present in the declaration.
 * The asserts will be handled by Component() in these cases.
 */
function SFAbstractMultiSelect(modelOrArray) {
    //Do not allow this component to be instantiated.
    assert(this.constructor !== SFAbstractMultiSelect, "[SFAbstractMultiSelect] No implementation available for SFAbstractMultiSelect. You must subclass it.");
    assert(typeof modelOrArray == "undefined","[SFAbstractMultiSelect] Model or array required.");
    this._init(modelOrArray);
}

SFAbstractMultiSelect.prototype = (function() {
    return set(new Component(), {
        _init : function(modelOrArray) {
            if (typeof modelOrArray != "undefined")
                this.setModel(modelOrArray);
            this._enabled = true;
        },
        addSelectedIndex : function(index) {
            this._model.addSelectedIndex(index);
        },
        removeSelectedIndex : function(index) {
            this._model.removeSelectedIndex(index);
        },
        setSelectedIndices : function(index) {
            this._model.setSelectedIndices(index);
        },
        getSelectedIndices : function() {
            return this._model.getSelectedIndices();
        },
        isIndexSelected : function(index) {
            return this._model.isIndexSelected(index);
        },
        /**
         * Sets the model of the single select
         * @param modelOrArray
         */
        setModel : function(modelOrArray) {
            this._model = (modelOrArray.constructor == Array) ? new SFDefaultMultiSelectModel(modelOrArray) : modelOrArray;
            this._updateModel();
        },
        /**
         * Method that returns a reference to the backing model. This is
         * useful for controllers that may need to get a model reference, but
         * instantiated the single select with an array. This will enable it to access,
         * as in the case of this type of component, this._model.setSelectedIndex to change
         * the selected index of the model.
         */
        getModel : function() {
            return this._model;
        },
        /**
         * Protected Method - Only subclasses can override
         * Note that this should be overridden in the subclasses. _updateModel
         * should be the place where you add the listeners to the model
         *
         */
        _updateModel : function() {
            //The following are for illustration purposes ONLY.
            //this._model.addEventListener("contentsChanged", this);
            //this._model.addEventListener("intervalAdded", this);
            //this._model.addEventListener("intervalRemoved", this);
        },
        /**
         * Clears out the current set of options, then replaces them with
         * this new set
         * @param options
         */
        setOptions : function(options) {
            assert(options.constructor == Array, "[SFAbstractMultiSelect] New options must be an array.");
            this._model.clear();
            for (var index = 0,len = options.length; index < len; ++index) {
                this.addOption(options[index]);
            }
        },
        /**
         * Adds an option to the model which will in turn dispatch an interval added.
         * Descendant classes will respond to the event and update their DOMs.
         * @param option
         */
        addOption : function(option) {
            this._model.add(option);
        },
        /**
         * Same thing as above, but inserts the new option. Descendant classes are responsible for checking
         * the type.
         * @param index
         * @param option
         */
        insertOptionAt : function(index, option) {
            this._model.addItemAt(index, option);
        },
        /**
         * Removes an option from the end of the model. Model will dispatch
         * an intervalRemoved event
         */
        removeOption : function() {
            this._model.remove();
        },
        /**
         * Removes an option at the specified index.
         * @param index
         */
        removeOptionAt : function(index) {
            this._model.removeItemAt(index);
        },
        /**
         * Sets the enabled property of the select, then calls _updateEnabled for descendant classes
         * to act further.
         * @param enabled
         */
        setEnabled : function(enabled) {
            this._enabled = !!enabled;
            this._updateEnabled();
        },
        /**
         * Protected method stub. Descendant classes override this method to act on their DOMs.
         */
        _updateEnabled : function() {

        },
        isEnabled : function() {
            return this._enabled;
        }
    });
})();