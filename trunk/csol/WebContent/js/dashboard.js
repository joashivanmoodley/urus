/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var subject, nick, chatForm;

window.onload = function() {
	nick = getPageParameter('s', 'anon');
	subject = nick + '_chat';
	enterChat();
	var cfg = {
		eventHandle : sendMsg
	};
	chatForm = new BChatForm('chat-main', cfg);
	window.onUnload = leave;
}

function sendMsg() {
	// this --> chatForm instance
	// self --> element dom
	// evt --> element event
	var self = arguments[0], evt = arguments[1];
	if (evt.keyCode == 13) {
		var val = self.value;
		p_publish(subject, 'action', 'send', 'nick', nick, 'msg', val);
		self.value = '';
		self.focus();
		this.moveScroll();
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
	if (action == 'send') {
		var time = parseInt(event.get('p_time'));
		var _msg = {
			from : nick,
			timestamp : time,
			message : msg
		};
		chatForm.updateMsg(_msg);
	}
	if(action == 'exit'){
		
	}

	console.log('event type ==> ' + action + ',' + nick + ',' + msg);
}


function onLeaveAck(){
	var event = arguments[0];
	var action = event.get('action');
	var msg = event.get('msg');
	var nick = event.get('nick');
	console.log('leave event type ==> ' + action + ',' + nick + ',' + msg);
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

function leave() {
	p_publish(subject, 'action', 'exit', 'nick', nick);
	// Stop pushlet session
	p_leave();
	// Give some time to send the leave request to server
	setTimeout(function(){}, 500);
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
