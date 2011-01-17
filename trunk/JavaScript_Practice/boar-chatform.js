/**
 * Require boar_utils.js
 *         jquery-1.4.4.js
 *         boar_chatform.css
 *
 * Author: Handle.Huang
 * Version: 0.1 
 * Date:  Fri Jan 14 14:53:04 CST 2011
 */

/**
 * Chat form widget constructure.
 * @param {String} pNode the parent node's Id, if null the document.body will be used.
 *
 */
function BChatForm(pNode, cfg) {
	this.pNode = pNode ? $('#' + pNode) : $(document.body);
	this.prefix = 'chatform';
	this.id = Boar.NextId(this.prefix);
	this.cfg = cfg ? cfg: {};
  this.rootMsg = undefined;
	this.createDom();
	this.bindEvent();
}

BChatForm.prototype = {
	/**
   * Create chat form base DOM structure.
   */
	createDom: function() {
		var _str = " <div id = '{0}' class = 'chat-form-wrapper'> <div class = 'chat-form-title'></div> <div class = 'chat-form-msg-display-area'><ul></ul></div> <div class = 'chat-form-msg-ipt-area'> <input id = '{1}'></input> </div> </div>";
		var _innerHTML = Boar.StringFormat(_str, this.id, this.id + '-ipt');
		this.pNode.append(_innerHTML);
    this.rootMsg = $('.chat-form-msg-display-area ul');

	},
	/**
   * Binding Events
   */
	bindEvent: function() {
		//hahah
		var t = this;
		$('#' + this.id + '-ipt').bind('keypress', function(evt) {
			var _t = this;
			t.sendMsgHandler.call(t, _t, evt);
		});
	},
	sendMsgHandler: function() {
		var _self = arguments[0];
		if (arguments[1].keyCode == 13) {
			this.updateMsg(_self.value);
			_self.value = '';
			_self.focus();
		}
	},
	updateMsg: function(msg) {
		//do 
    var _s = document.createElement('li');
    _s.innerHTML ='<span>'+ msg+'</span>';
    this.rootMsg.append(_s);
    this._afterUpdateMsg();
	},
	_afterUpdateMsg: function() {
	}
}

