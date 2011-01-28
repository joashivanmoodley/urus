//! include /ui/uicore/js/Util.js
//
// Start of $Id: component.js 121244 2011-01-08 20:52:15Z jminnich $
//
//

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

var undoManager = (function() {
    var events = [];
    var position = 0;
    var okayToAdd = true;

    return {
        add : function(evt) {
            if (okayToAdd) {
                events.splice(position, events.length - position, evt);
                position++;
            }
        },

        undo : function() {
            if (position > 0) {
                okayToAdd = false;

                try {
                    events[--position].undo();
                }
                finally {
                    okayToAdd = true;
                }
            }
        },

        redo : function() {
            if (position < events.length) {
                okayToAdd = false;

                try {
                    events[position++].redo();
                }
                finally {
                    okayToAdd = true;
                }
            }
        }
    };

})();


function dump(obj) {

    function quote(str) {
        return '"' + str.replace(/([\"\\])/g, '\\$1').replace(/\r\n?|\n/g, '\\n') + '"';
    }


    switch (typeof obj) {
        case 'object':
            if (obj) {
                switch (obj.constructor) {
                    case Array:
                        var tmp = [];

                        for (var i = 0; i < obj.length; ++i) {
                            tmp[i] = dump(obj[i]);
                        }

                        return '[' + tmp.join() + ']';

                    case Date:
                        return 'new Date(' + obj.getFullYear() + "," + obj.getMonth() + "," + obj.getDate() + ")";

                    default:
                        var tmp = [];

                        for (var i in obj) {
                            tmp.push(quote(i) + ":" + dump(obj[i]));
                        }

                        return "{" + tmp.sort().join() + "}";
                }
            } else {
                return 'null';
            }

        case 'unknown':
        case 'undefined':
            return 'undefined';
        case 'number':
            return obj;
        case 'string':
            return quote(obj);
        case 'function':
            return 'function';


        default:
            return String(obj);
    }
}


function assert(cond, msg) {
    if (!cond) {
        alert('Assertion failed: ' + msg);
        eval("debugger;");
    }
}

function $(id) {
    return ("string" == typeof id) ? document.getElementById(id) : id;
}

/**
 * This is the inheritance mechanism. It essentially takes the first argument
 * obj and adds to it all the properties of the second argument, vals.
 *
 * @param obj  the base class instance
 * @param vals the additional properties to be added to the base class
 *
 * @return the same base class instance but with the additional properties added.
 */
function set(obj, vals) {

    for (var f in vals) {
        var o = obj[f], v = vals[f];

        if (("object" == typeof v) && o) {
            set(o, v);
        }
        else {
            obj[f] = v;
        }
    }

    return obj;
}


function escapeHTML(text,nl,empty) {
  if (typeof nl != 'string') nl = "\n";
  if (typeof empty != 'string') empty = "";

  return ((text||"").toString().
    replace(/&/g,'&amp;').
    replace(/</g,'&lt;').
    replace(/>/g,'&gt;').
    replace(/\"/g,'&quot;').
    replace(/\'/g,'&#39;').
    replace(/\n|\r\n?/g, nl)) || empty;
}

/**
 * EventTarget is an object that can have event listeners and dispatch
 * events to those listeners.  It is the base class of Component.
 * This method is safe to call at each prototype level to allow for
 * sub-componenents to add additional events to the list of allowed
 * ones.
 *
 * Example usage:
 * <pre>
 * var example = new EventTarget(["change", "action"]);
 * example.addEventListener("change", listener); // OK
 * example.addEventListener("action", listener); // OK
 * example.addEventListener("other", listener); // Assertion Failure!
 * </pre>
 *
 * Note: if the "eventTypes" argument is null or not present, then
 * there will not be any restrictions on the event types dispatched by
 * this object. (This is primarily for backwards compatibility)
 *
 * @param eventTypes an optional array of strings that specifies what
 * types of events this EventTarget will dispatch.
 */
function EventTarget(eventTypes) {
    assert(arguments.length <= 1, "Too many arguments to EventTarget");
    assert("null" == typeof eventTypes || "undefined" == typeof eventTypes || eventTypes.constructor == Array,
           "eventTypes argument to EventTarget must be an array or null");

    if (eventTypes) {
        // if we are adding new event type restrictions, we always
        // have to make a copy of the existing _allowedEvents object
        // and replace it.  This is because the object could be on the
        // prototype, and we want to avoid overriding functionality
        // shared in another event target.

        var allowedEvents = {};
        if (this._allowedEvents) {
            set(allowedEvents, this._allowedEvents);
        }

        for (var i=0, n=eventTypes.length ; i<n ; i++) {
            assert(EventTarget.isValidEventType(eventTypes[i]), "Invalid event type name: "+eventTypes[i]);
            allowedEvents[eventTypes[i]] = 1;
        }

        // replace the existing (or mask the prototype) with the new
        // events type cache.
        this._allowedEvents = allowedEvents;
    }
}

EventTarget.isValidEventType = function(type) {
    return ("string" == typeof type) && !/^on/.test(type);
};

EventTarget.Event = function(type, data) {
    set(this, data).type = type;
};

EventTarget.prototype = (function() {
    function validEvents(obj) {
        var list = [];
        for (var name in obj._allowedEvents) {
            list.push(name);
        }
        return list.join(", ");
    }

    return {
        addEventListener : function(type, handler) {
            assert(EventTarget.isValidEventType(type), "Invalid event type name: "+type);
            assert(!this._allowedEvents || this._allowedEvents[type], "Event type '"+type+"' is not dispatched by this object, valid events are: "+validEvents(this));
            assert(handler, "handler is null");
            assert(handler.handleEvent && "function" == typeof handler.handleEvent,
                    "Event handler does not provide handleEvent function");

            // Each component has a lazily constructed associative array
            // called "_events" that maps event types to an array of
            // handlers for that type.  The "_events" array is NOT part of
            // the public or protected API and should not be accessed
            // directly.

            // Get or create the _events object
            var evts = this._events || (this._events = {});

            // Get or create the event array, and append the new handler.
            (evts[type] || (evts[type] = [])).push(handler);
        },
        /**
         * Removes a previously added event handler added through
         * addEventListener.
         *
         * @param type (string) the type of the event
         * @param handler (object) the handler to remove
         * @return void
         */
        removeEventListener : function(type, handler) {
            var allEvts = this._events, evts;
            if (allEvts && (evts = allEvts[type])) {
                for (var i = evts.length; --i >= 0;) {
                    if (evts[i] === handler) {
                        evts.splice(i, 1);
                    }
                }
                if (!evts.length) {
                    delete allEvts[type];
                }
            }
        },
        /**
         * Dispatches an event to all registered event listeners of the
         * event's type.  This method is normally only called by the
         * implemenation of the component itself, but it is part of the
         * public API, and may be used to simulate an event being fired by
         * the component.
         *
         * @param evt (Event) the event to fire.  This should be
         * constructed using the Event constructor, and the "type" field
         * must be defined and valid.
         * @return void
         */
        dispatchEvent : function(evt) {
            assert(evt && evt.constructor == EventTarget.Event, "Attempt to dispatch non-Event: " + evt);
            assert(EventTarget.isValidEventType(evt.type), "Invalid event type name: "+evt.type);
            assert(!this._allowedEvents || this._allowedEvents[evt.type], "Event type '"+evt.type+"' is not dispatched by this object, valid events are: "+validEvents(this));

            evt.target = this;

            var evts = this._events;
            if (evts && (evts = evts[evt.type])) {

                // iterate over a copy of the events array.  This allows
                // removeEventListener to be called by the event handler without
                // disrupting the dispatch.
                var tmp = evts.slice(0);
                var ex;

                for (var i = 0; i < tmp.length; ++i) {
                    try {
                        tmp[i].handleEvent(evt);
                    } catch (e) {
                        ex = e;
                    }
                }

                if (ex) throw ex;
            }
        },

        /**
         * This is shorthand for this.dispatchEvent(new Component.Event(type, data))
         *
         * @param type (string) the event type to dispatch
         * @param data (object) additional name/value pairs to attach to the event
         */
        dispatch : function(type, data) {
            this.dispatchEvent(new EventTarget.Event(type, data));
        }

    };
})();

/**
 * The constructor for JUIC Component prototype objects.
 *
 * @param eventType an optional argument to restrict what types of
 * events this object will dispatch.  It is recommended that this
 * argument be provided.  See EventTarget for a more complete
 * description.
 */
function Component(eventTypes) {
    EventTarget.call(this, eventTypes);
}

Component.prototype = (function() {
    var seqNo = 0;

    return set(new EventTarget(), {

        _required : false,

        _showModified : true,

        _modified : false,

        render : function(id) {
            var html = [];
            this.renderHtml(html);
            $(id).innerHTML = html.join('');
        },

        renderHtml : function(html) {
            assert(false, "ERROR: the subclasses must override renderHtml(): " + html);
        },

        renderOnLoad : function(id) {
            var idtemp = id, comp = this;

            window.onload = function() {
                comp.render(idtemp);
                comp = null;
            };
        },

        register : function() {
            assert(!this.id || !Component._registry[this.id], "Component already registered!");
            this.id = ++seqNo + ":";
            Component._registry[this.id] = this;
        },

        /**
         * This method needs to be unique and should NOT be overridden.
         */
        unregister : function() {
            assert(Component._registry[this.id], "Component not registered! " + this.id);
            // remove the event array and then remove the object from the registry array
            delete this._events;
            delete Component._registry[this.id];
        },
        /**
         * This method needs to be overridden by each sub component.
         *
         * Each Sub-component needs to implement a cleanup method:
         * If any component has sub-components, it will have to first call the cleanup method on its children and then
         * unregister itself from the component registry. If no children the object will only unregister from the
         * registry.
         *
         * Please make sure to NOT to overwrite unregister when you create a components.
         */
        cleanup: function() {
          this.unregister();
        },
        /**
         * API for an external process to pass in an id for this component to be un registered.
         * Should not be used by the component.
         * @param {String} id The id to unregister this component.
         */
        externalUnregister : function(id) {
            delete Component._registry[id];
        },

        /**
         * API for an external process to pass in an id for this component to register with.
         * Should not be used by the component.
         * @param {String} id The id to register this component as.
         */
        externalRegister : function(id) {
            assert(!Component._registry[id], "Component already registered!");
            this.id = id;
            Component._registry[id] = this;
        },

        setValue : function(arg) {
            assert(false, "ERROR: the subclasses must override setValue(): " + arg);
        },

        getValue : function() {
            return null;
        },

        //Determines whether this component acts upon the value of the _modified field.
        setShowModified : function(bool) {
            this._showModified = bool;
        },

        isShowModified : function() {
            return this._showModified;
        },

        setRequired : function(bool) {
            this._required = bool;
        },

        isRequired : function() {
            return this._required;
        },

        /**
         * isValid - base class only tests for required
         */
        isValid : function (text) {
            var out = true;
            if (this._required) {
                out = (/[^ \t\r\n]/.test(text));
            }
            return out;
        },

        getLastValidationError : function () {
            return sfMessageFormat.format(jsSFMessages["COMMON_ERR_DATA_REQUIRED"], arguments[0]);
        },

        getErrorId : function() {
            return this.id + "_error";
        },

        clearError: function() {
            if ($(this.getErrorId())) {
                $(this.getErrorId()).style.display = 'none';
            }
        },

        appendErrorIcon : function(errText) {
            return '<img src="'+IMAGES['/ui/uicore/img/icon_error.gif']+'" class="nudge-down" />&#160;' + errText;
        },

        /**
         * serializeState ==> Serialize State of this component, ie, get the state of this
         *              component
         */
        serializeState : function() {
            assert(false, "ERROR: the subclasses must override serializeState(): ");
        },

        /**
         * deserializeState ==> Deserialize State for this component, ie, set the component's
         *              properties to the passed-in serialized form
         *
         * @param : newState : The new state of this component.
         */
        deserializeState : function(newState) {
            assert(false, "ERROR: the subclasses must override deserializeState(): " + newState);
        },

        /**
         * IMPORTANT NOTE: this method is used by renderHtml
         * implementations to send DOM events back to the component.  It
         * should not be called by anything that uses component.  The
         * addEventListener, removeEventListener and dispatchEvent methods
         * are for the users of the component.
         *
         * Generates a string that if evaluated will call the named method
         * in this component.  This is used to generate callbacks from DOM
         * events into the component.
         *
         * Example:
         * MyComponent.prototype.renderHtml = function(h) {
         *   for (var i=0 ; i<10 ; i++) {
         *     h.push("a href='javascript:" + this.fireCode("addItem", i) + "'...");
         *   }
         * };
         * MyComponent.prototype.addItem = function(index) { ... };
         *
         * NOTE: this method's internals should not be relied upon, though
         * some parts are publically accessible, the implementation is not
         * guaranteed to be stable.
         *
         * @param name (string) the name of a function on this component
         * that will be called
         * @param ... additional parameters will be passed into the
         * function when called.  These parameters must be of simple types
         * that can be converted to JSON (string, number, object, or
         * array).  Objects and arrays, must contain only simpled types.
         */
        fireCode : function(name) {
            assert(this.id, "Component not registered!");
            assert("function" == typeof this[name], "Not a function: " + name);

            var code = "fire(\"" + this.id + "\",\"" + name + "\"";

            for (var i = 1; i < arguments.length; ++i) {
                code += "," + dump(arguments[i]);
            }
             //Note that the addition of "event" to the argument list is experimental.
             //DO NOT RELY ON THIS!
            return escapeHTML(code + ",event);");
        }
    });
})();

Component._registry = {};

/**
 * This method is used by fireCode.  It is subject to change and
 * should not be called directly.
 */
function fire(compId, funcName) {
    var comp = Component._registry[compId];

    assert(comp, "Component " + compId + " not registered");

    var args = [];

    for (var i = 2; i < arguments.length; ++i) {
        args.push(arguments[i]);
    }

    return comp[funcName].apply(comp, args);
}


//
// End of $Id: component.js 121244 2011-01-08 20:52:15Z jminnich $
//




