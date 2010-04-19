// JavaScript Document
Boar.Dom = {};
/**
*this.el   Boar Object
*this.element HTML Object
*/
Boar.Dom.Element = function(elm) {
	this.element = elm;
}

/**
*
*/
Boar.Dom.Element.prototype = {
	constructor: Boar.Dom.Element,

	Interface: function() {
		if (!this['interface']) {
			this['interface'] = [];
			this['interface'].push(this.constructor);
			if (this.superClass != undefined) {
				var pInterface = this.superClass.Interface();
				for (var i = 0; i < pInterface.length; i++) {
					this['interface'].push(pInterface[i]);
				}
			}
		}
		return this['interface'];
	},
	/**
  *@param {Object} interf
  */
	isInterface: function(interf) {
		if (this['interface'] == undefined) {
			this.Interface();
		}
		for (i in this['interface']) {
			if (interf === this['interface'][i]) {
				return true;
			}
		}
		return false;
	},
	/**
  *@param {Object} elm HTMLDomElement or BOar.Dom.Element to append
  */
	append: function(elm) {
		if (elm.constructor === Boar.Dom.Element && elm.element != undefined) {
			this.element.appendChild(elm.element);
		} else {
			this.element.appendChild(elm);
		}
		return this;
	},
	/**
  *@param {String} name Element style name
  *@param {Object} value Elment style value String or Number
  */
	style: function(name, value) {
		if (value == undefined) {
			return eval('this.element.style.' + name);
		}
		if (value.constructor == String) {
			eval('this.element.style.' + name + "='" + value + "'");
		} else {
			eval('this.element.style.' + name + '=' + value);
		}
	},
	/**
  *@return {Boar.Dom.Element} return a new Boar.Dom.Element object
  */
	cloneNode: function() {
		var newEl = this.element.cloneNode(true);
		return new Boar.Dom.Element(newEl);
	},
	render: function() {
		this.el.style('display', '');
	},
	hidden: function() {
		this.el.style('display', 'none');
	}
}

/**
*@param {String} tagName
*@param {Json} attrs element attribute
*@param {Array} childNodes Element child nodes
*/
Boar.Dom.build = function(tagName, attrs, childNodes) {
	var doc = document;
	if (tagName == undefined) {
		return;
	}
	var el = doc.createElement(tagName);
	if (attrs && attrs.constructor == Object) {
		for (attr in attrs) {
			//el[attr]=attrs[attr];
			el.setAttribute(attr, attrs[attr]);
		}
	}
	if (childNodes && childNodes.constructor == Array && childNodes.length > 0) {
		for (child in childNodes) {
			if (childNodes[child].constructor === Boar.Dom.Element) {
				el.appendChild(childNodes[child].element);
			} else {
				el.appendChild(childNodes[child]);
			}

		}
	}
	if (childNodes && childNodes.constructor == String) {
		el.innerHTML = childNodes;
	}
	return new Boar.Dom.Element(el);
};

/**
*@param {String} id
*/
Boar.Dom.Query = function(id) {
	var el = null;
	if (id != null && id.constructor == String) {
		el = document.getElementById(id);
	}
	if (el != null) {
		return new Boar.Dom.Element(el);
	} else {
		return null;
	}
}

var BQuery = Boar.Dom.Query;
var BDom = Boar.Dom;
var BElement = Boar.Dom.Element;

