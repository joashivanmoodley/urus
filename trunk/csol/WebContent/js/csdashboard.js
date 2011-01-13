/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var chatFrame, subject, nick;

window.onload = function() {
	nick = getPageParameter('s', 'anon');
	subject = getSubject();
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
	console.log('event type ==> ' + action + ',' + nick + ',' + msg);
}

function enterChat() {
	alert("join chart "+ subject);
	p_join_listen(window.subject);
	
	p_publish(window.subject, 'action', 'enter', 'nick', nick);
}
