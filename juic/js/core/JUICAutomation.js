//! include /ui/juic/js/core/component.js

/****************************************####
 component registory that holds the relation between the generated component ID with the class name of the component
 the structure of the registry is
 Component._automationRegistry = {
 "componentName" : ["array", "of", "component", "id"],
 "sfDialog" : ["2:", "5:"].....
 }
 ####***************************************************/
Component._automationRegistry = {};

// bellow are the new methods that will be added to the component object to enable the component to register to the automation registory
set(Component.prototype, {
    // copying the default register method to another method so that any changes in the register method of the component will be available in the automation script also
    _copiedRegister : Component.prototype.register,
    // new register method to register the component to the automation registry.
    register : function() {
        this._copiedRegister()
        // get the component's class name and set it as the components constructor.
        this.constructor = this._getConstructorName(arguments.callee.caller.toString())
        // check if there is already a key value for the constructor in the automationregistry and create it if it dose not exist
        if (!Component._automationRegistry[this.constructor]) {
            Component._automationRegistry[this.constructor] = []
        }
        // push the component id to the array of IDs in the component id array
        Component._automationRegistry[this.constructor].push(this.id);
    },
    // strip the constructor from the function code
    _getConstructorName : function(funcString) {
        var funcNameRegex = /function (.{1,})\((.{1,})\{/;
        return (results && results.length > 1) ? results[1] : "noClassName";
    },
    // copying the default unregister method to another method so that any changes in the unregister method of the component will be available in the automation script also
    _copiedUnregister : Component.prototype.unregister,
    // new unregister method to unregister the component in the automation registry.
    unregister : function() {
        var automationRegistry = Component._automationRegistry[this.constructor]
        assert(automationRegistry, "Component not registered in automation registry! \nComponent:: " + this.constructor);
        var foundObject = false
        // if number of items in the registry is only one then we remove the key from the registry
        if (automationRegistry.length == 1) {
            if (this.id == automationRegistry[0]) {
                foundObject = true;
                delete Component._automationRegistry[this.constructor]
            }
        }
        // if there are more items in the registry then we remove only the item that matches the id of the component that is unregistered
        else if (automationRegistry.length > 1) {
            for (var i = 0, length = automationRegistry.length; i < length; i++) {
                if (this.id == automationRegistry[i]) {
                    foundObject = true;
                    automationRegistry.splice(i, 1)
                }
            }
        }
        assert(foundObject, "Component not registered in automation registry! \nComponent:: " + this.constructor + "\nID:: " + this.id);
        this._copiedUnregister()
    }
});
// automation object that has the util methods for seting the component ID with the given class name of the component.
var JUICAutomation = (function() {
    return {
        // this method will add another an HTML attribute to the html element which the class name of the component that created it
        showAutomationIds : function() {
            var noDomObject = [];
            for (var automationId in Component._automationRegistry) {
                var itemIdArray = Component._automationRegistry[automationId];
                for (var itemIndex = 0,itemLength = itemIdArray.length; itemIndex < itemLength; itemIndex++) {
                    //            assert($(itemIdArray[itemIndex]), "Item do not have a Dom element, Pls add atleast one item with the Id")
                    if ($(itemIdArray[itemIndex])) {
                        $(itemIdArray[itemIndex]).setAttribute('juiccomponentname', automationId);
                        $(itemIdArray[itemIndex]).style.border = "1px solid red"
                    }
                }
            }
        },
        // returns a , seperated string of all JUIC ID of a perticular components class name
        getJUICObjId : function(automationId) {
            var itemIdArray = Component._automationRegistry[automationId];
            return itemIdArray.join(",")
        },
        // returns the JUIC ID of at the given index of perticular components class name
        getJUICObjIdAt : function(automationId, itemAt) {
            var itemIdArray = Component._automationRegistry[automationId];
            return itemIdArray[itemAt]
        },
        // returns the collection of DOM element of a perticular componets class Name
        // this function will not be used by QA.
        getAutomationObject: function(automationId) {
            var itemIdArray = Component._automationRegistry[automationId];
            //            assert(itemIdArray, "no component for the automation Id")
            var automationComponents = [];
            for (var itemIndex = 0,itemLength = itemIdArray.length; itemIndex < itemLength; itemIndex++) {
                if ($(itemIdArray[itemIndex])) {
                    automationComponents.push($(itemIdArray[itemIndex]));
                    $(itemIdArray[itemIndex]).style.border = "1px solid green"
                }
            }
            return automationComponents;
        }
    }
})();




