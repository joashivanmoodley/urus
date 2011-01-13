/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var subject, nick;

window.onload = function() {
	nick = getPageParameter('s', 'anon');
	subject = nick + '_chat';
	enterChat();
	//bind event
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
	if(action == 'enter'){
		doEnter(nick);
	}
	console.log('event type ==> ' + action + ',' + nick + ',' + msg);
}

function doEnter(nick){

	var str = "<div id = 'c-"+nick+"' class = 'customer-div'>"+nick+"</div>";
	$('#customer-list').append(str);
}

function enterChat() {
	p_join_listen(subject);
	p_publish(subject, 'action', 'enter', 'nick', nick);
}

