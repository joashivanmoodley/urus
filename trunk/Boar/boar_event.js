Boar.Event = {
	isBindleKeyBoradEvent: false,
	AddEventListener: function(obj, type, fn) {
		if (arguments.length < 3) {
			return
		}
		if (obj.attachEvent) {
			obj['e' + type + fn] = fn;
			obj[type + fn] = function() {
				obj['e' + type + fn](window.event);
			}
			obj.attachEvent('on' + type, obj[type + fn]);
		} else if (obj.addEventListener) {
			//for fire fox
			obj.addEventListener(type, fn, false);
		} else {
			// the last choice
			obj['on' + type] = fn;
		}
	},
	RemoveEventListener: function(obj, type, fn) {
		if (arguments.length < 3) {
			return
		}
		if (obj.detachEvent) {
			obj.detachEvent('on' + type, obj[type + fn]);
			obj[type + fn] = null;
		} else if (obj.removeEventListener) {
			//for firefox
			obj.removeEventListener(type, fn, false);
		} else {
			// the last choice
			obj['on' + type] = function() {};
		}
	},
	RegisterKeyBoradEvent: function() {
		if (!this.isBindleKeyBoradEvent) {
			this.AddEventListener(document, 'keydown', this._keyDownEvent);
			this.AddEventListener(document, 'keyup', this._keyUpEvent);
			this.isBindleKeyBoradEvent = true;
		}
	},
	keyPool: {},
	passedKey: [],
	_keyDownEvent: function() {
		var ev = window.event || arguments[0],
		t = Boar.Event,
		k = ev.keyCode || ev.which;
		if (!t.keyPool[k]) {
			t.keyPool[(t.passedKey[t.passedKey.length] = k)] = true;
		}
	},
	_keyUpEvent: function() {
		var ev = window.event || arguments[0],
		t = Boar.Event,
		k = ev.keyCode || ev.which;
		for (var i = 0; i < t.passedKey.length; i++) {
			if (k == t.passedKey[i]) {
				t.passedKey.splice(i, 1);
			}
		}
		Boar.Core.dwn(k+' up');
		delete t.keyPool[k];
	}
};
var BEvent = Boar.Event;

