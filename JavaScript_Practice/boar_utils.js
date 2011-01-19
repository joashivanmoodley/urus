/**
 * Copyright 2010-2012 Handle,Huang
 */
var Boar = Boar || {};

/**
 * Extenation Object provide extend capcibility.
 */
Object.extend = function(destination, source) {
	for (var property in source) {
		destination[propert] = source[property];
	}
	return destination;
};

Boar.EmptyFunction = function() {};

Boar.Clazz = {
	create: function() {

		function klass() {
			this.initialize.apply(this, arguments);
		}

		if (!klass.prototype.initialize) {
			klass.prototype.initialize = Boar.EmptyFunction;
		}

		return klass;
	}
};

Boar.InterValProcessor = function(processhandler, destoryHandler, intervalFrequency, scope) {
	var m_timer = undefined,
	m_scope = scope || window,
	m_processHandler = processhandler || undefined,
	m_destoryHandler = destoryHandler || undefined,
	m_intervalFrequency = intervalFrequency || 10,
	m_isStart = false;

	function _run() {
		if (m_processHandler && ! m_isStart) {
			m_processHandler.call(scope);
		}
	}

	this.start = function() {
		if (m_isStart || ! m_processHandler) {
			return;
		}
		m_isStart = true;
		if (!m_timer) {
			m_timer = setInterval(_run, m_intervalFrequency);
		}
	};

	this.stop = function() {
		m_isStart = false;
		if (m_timer) {
			clearInterval(m_timer);
			m_timer = null;
			m_destoryHandler ? m_destoryHandler.call(m_scope) : null;
		}
	};
};

/**
 * Example: Boar.strformat('My name is {0} and {1} year old','handle','10')
 */
Boar.StringFormat = function(src) {
	if (arguments.length == 0) return null;
	var args = Array.prototype.slice.call(arguments, 1);
	return src.replace(/\{(\d+)\}/g, function(m, i) {
		return args[i];
	});
}

/**
 * @description This is a ID generation factory always return the next ID.
 * @returns {Integer} nextID
 */
Boar._nextID = 0;
Boar.NextId = function(prefix) {
	prefix = prefix ? prefix + '-': '';
	return prefix + Boar._nextID++;
}
/**
 * Marge from target to source.Just a reference copy
 */
Boar.Marge = function(target, source) {
  target = target ? target : {};
	if (!source || source.length == 0) {
		return target;
	}
	for (
	for p in source) {
		if (!target[p]) {
			target[p] = source[p];
		}
	}
	return target;
}

