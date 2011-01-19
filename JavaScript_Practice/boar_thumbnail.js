/** Require boar_utils.js
 *         jquery-1.4.4.js
 *
 * Author: Handle.Huang
 * Version: 0.1 
 * Date:  Fri Jan 14 14:53:04 CST 2011
 */

var Boar = Boar || {};
/**
 * Thumbnail widget
 * @param {Object} cfg {rootEl:xx,width:xx,height:xx,eventHandler:xx}
 *
 */
function BThumbnail(cfg) {
	var defaultCfg = {
		parentNode: $(document.body),
		dispName: 'Thumb',
		width: 20px,
		height: 20px,
		eventHandler: Boar.EmptyFunction,
	};
	this.Id = Boar.NextId();
	this.cfg = Boar.Marge(cfg, defaultCfg);
	this.el = undefined;
	this.init();
}
BThumbnail.prototype = {
	init: function() {
		this.createDom();
		this.bindEvent();
	},
	createDom: function() {
		var _str = "<div id = '{0}' class = 'thumb-wrapper'><span>{1}</span></div>";
		var _innerHtml = Boar.StringFormat(_str, this.id, this.cfg.dispName);
		this.cfg.parentNode.append(_innerHtml);
		this.el = $('#' + this.id);

	},
	removeDom: function() {
		this.el.remove();
	}
	bindEvent: function() {
		var t = this;
		this.el.bind('click', function(evt) {
			t.eventHandler.call(t, this, evt);
		});
	},
	unBindEvent: function() {
		this.el.unbind('click');
	},
	eventHandler: function() {
		this.cfg.eventHandler.call(this, arguments);
	},
	/**
   * clear self.
   */
	remove: function() {
		this.unBindEvent();
		this.removeDom();
	}
}

