/**
 * Require boar_util.js
 *         jquery-1.4.4.js
 *         boar_chatform.css
 *
 * Author: Handle.Huang
 * Version: 0.1 
 * Date:  Fri Jan 14 14:53:04 CST 2011
 */

/**
 * Chat form widget constructure.
 * 
 * @param {String}
 *            pNode the parent node's Id, if null the document.body will be
 *            used.
 * 
 */
function BChatForm(pNode, cfg) {
	this.pNode = pNode ? $('#' + pNode) : $(document.body);
	this.prefix = 'chatform';
	this.id = Boar.NextId(this.prefix);
	this.cfg = cfg ? cfg : {};
	this.rootMsg = undefined;
	this.msgDispDiv = undefined;
	this.lastUpdater = '';
	this.createDom();
	this.bindEvent();
}

BChatForm.prototype = {
	/**
	 * Create chat form base DOM structure.
	 */
	createDom : function() {
		var _str = " <div id = '{0}' class = 'chat-form-wrapper'> <div class = 'chat-form-title'></div> <div class = 'chat-form-msg-display-area'><ul></ul></div> <div class = 'chat-form-msg-ipt-area'> <input id = '{1}'></input> </div> </div>";
		var _innerHTML = Boar.StringFormat(_str, this.id, this.id + '-ipt');
		this.pNode.append(_innerHTML);
		this.rootMsg = $('.chat-form-msg-display-area ul');
		this.msgDispDiv = $('.chat-form-msg-display-area');

	},
	/**
	 * Binding Events
	 */
	bindEvent : function() {
		// hahah
		var t = this;
		$('#' + this.id + '-ipt').bind('keypress', function(evt) {
			var _self = this;
			if (t.cfg.eventHandle) {
				t.cfg.eventHandle.call(t, _self, evt);
			} else {
				t.sendMsgHandler.call(t, _self, evt);
			}
		});
	},
	sendMsgHandler : function() {
		var _self = arguments[0];
		if (arguments[1].keyCode == 13) {
			this.updateMsg(_self.value);
			_self.value = '';
			_self.focus();
			this.moveScroll();

		}
	},
	moveScroll : function() {
		this.msgDispDiv[0].scrollTop = this.msgDispDiv[0].scrollHeight;
	},
	updateMsg : function(msg) {
		// do
		var _str='';
		if(this.lastUpdater != msg.from){
			this.lastUpdater = msg.from;
			_str = "<li class='disp-info'>{0} : {1}</li><li class='disp-msg'>{2}</li>";
			var _date = new Date(parseInt(msg.timestamp)*1000);
			var _dispTime = _date.getHours()+':'+_date.getMinutes()+":"+_date.getSeconds();
			_str = Boar.StringFormat(_str,msg.from,_dispTime,msg.message);
		}else{
			_str = "<li class='disp-msg'>{0}</li>";
			_str = Boar.StringFormat(_str,msg.message);
		}
		this.rootMsg.append(_str);
		this._afterUpdateMsg();
	},
	_afterUpdateMsg : function() {
	}
}
