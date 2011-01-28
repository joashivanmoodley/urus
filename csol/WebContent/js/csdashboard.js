/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var chatFrame, subject, nick, chatForm;

window.onload = function() {
	nick = getPageParameter('s', 'anon');
	subject = getSubject();
	enterChat();
	var cfg = {
		eventHandle : sendMsg
	};
	chatForm = new BChatForm('chat-main', cfg);
	window.onunload = leave;

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


function getSubject() {
	var sSubject = undefined;
	$.ajax({
		url : "/csol/ServiceSvr?s_act=1",
		async : false,
		context : document.body,
		success : function() {
			sSubject = window.subject = arguments[0];
		}
	});
	return sSubject;
}

function onData() {
	var event = arguments[0];
	var action = event.get('action');
	var msg = event.get('msg');
	var nick = event.get('nick');
	if (action == 'send') {
		var time = parseInt(event.get('p_time'));
		var _msg = {
			from : nick,
			timestamp : time,
			message : msg
		};
		chatForm.updateMsg(_msg);
	}
	console.log('event type ==> ' + action + ',' + nick + ',' + msg);
}

function enterChat() {
	alert("join chart " + subject);
	p_join_listen(window.subject);

	p_publish(window.subject, 'action', 'enter', 'nick', nick);
}

function leave() {
	p_publish(subject, 'action', 'exit', 'nick', nick);
	// Stop pushlet session
	p_leave();
	// Give some time to send the leave request to server
	setTimeout(function(){}, 500);
}
