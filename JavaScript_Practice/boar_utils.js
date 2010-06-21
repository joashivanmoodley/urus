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

