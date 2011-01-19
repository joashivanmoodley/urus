/** Require boar_utils.js
 *         jquery-1.4.4.js
 *
 * Author: Handle.Huang
 * Version: 0.1 
 * Date:  Fri Jan 14 14:53:04 CST 2011
 */

var Boar = Boar || {};
/**
 * Gallery widget.
 */
function BGallery(cfg) {
	var defaultCfg = {
		parentNode: $(document.body),
		width: 300px;
		height: 200px;
	};
	this.widgets = {};
	this.cfg = Boar.Marge(cfg, defaultCfg);
	this.Id = Boar.NextId();
	this.init();
}
BGallery.prototype = {
	init: function() {
		this.createDom();
		this.bindEvent();
		this.el = $('#' + this.id);
	},
	createDom: function() {
		var _str = "<div id = '{0}' class = 'gallery-wrapper'></div>";
		var _innerHtml = Boar.StringFormat(_str, this.id);
		this.cfg.parentNode.append(_innerHtml);
	},
	bindEvent: function() {},
	/**
   * Add widget into the gallery.
   * @param {Object} thumb
   */
	addWidget: function(thumb) {
		if (!thumb) {
			return;
		}
		this.widgets[thumb.Id] = thumb;
		this.el.append(thumb.el);
	},
  /**
   * Remove widget and also remove it's dom structure from the DOM.
   * @param {String} widgetId
   */
	removeWidget: function(widgetId) {
    var widget = this.widgets[widgetId];
		if (!widget) {
			return;
		}
    delete this.widgets[widgetId];
    widget.remove();
	}
}

