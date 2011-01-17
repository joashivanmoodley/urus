/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var subject, nick;

window.onload = function() {
	nick = getPageParameter('s', 'anon');
	subject = nick + '_chat';
	enterChat();
	// bind event
	$('#ipt-msg').bind('keypress', sendMsg);
}

function sendMsg() {
	if (arguments[0].keyCode == 13) {
		var val = this.value;
		p_publish(subject, 'action', 'send', 'nick', nick, 'msg', val);
		this.value = '';
		this.focus();
	}
}

function onData() {
	var event = arguments[0];
	var action = event.get('action');
	var msg = event.get('msg');
	var nick = event.get('nick');
	if (action == 'enter') {
		doEnter(nick);
	}
	console.log('event type ==> ' + action + ',' + nick + ',' + msg);
}

function doEnter(nick) {

	var str = "<div id = 'c-" + nick + "' class = 'customer-div'>" + nick
			+ "</div>";
	$('#customer-list').append(str);
}

function enterChat() {
	p_join_listen(subject);
	p_publish(subject, 'action', 'enter', 'nick', nick);
}

function BThumbnail(pNode, cfg) {
	this.pNode = pNode ? $('#' + pNode) : document.body;
	this.cfg = cfg ? cfg : {};
	this.id = 'thumbnail-' + UUID.nextId();
	this.createDom();
	this.root = $('#' + this.id);
	this.bindEvent();
};

BThumbnail.prototype = {
	createDom : function() {
		var _str = "<div id = '{0}' class = 'thumb-wrapper'><span>{1}</span></div>";
		var _innerHtml = String.format(_str, this.id, this.cfg[0]);
		this.pNode.append(_innerHtml);
	},
	bindEvent : function() {
		this.root.bind('click', this.switchSubject);
	},
	switchSubject : function() {
		alert('switch subject');
	}
}
