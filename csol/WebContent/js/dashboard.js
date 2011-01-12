/**
 * @author Handle
 * @version 0.1 Wed Jan 12 14:18:33 CST 2011
 */
var chatFrame,subject,nick;

window.onload = function() {
	if(window.frames && window.frames["chatContents"]) { //IE 5 (Win/Mac), Konqueror, Safari
		chatFrame = window.frames["chatContents"];
	} else if (document.getElementById("chatContents").contentWindow) { //IE 5.5+, Mozilla 0.9+, Opera
		chatFrame = document.getElementById("chatContents").contentWindow;
	} else { //Moz < 0.9 (Netscape 6.0)
		chatFrame = document.getElementById("chatContents");
	}
	if (chatFrame.document) //Moz 0.9+, Konq, Safari, IE, Opera
	chatDoc = chatFrame.document;
	else //Moz < 0.9 (Netscape 6.0)
	chatDoc = chatFrame.contentDocument;
	nick = getPageParameter('s','anon');
	subject = nick+'_chat';
	enterChat();
	//bind event
	$('#ipt-msg').bind('keypress', sendMsg);
}

function sendMsg() {
	if(arguments[0].keyCode == 13){
		var val = this.value;
		p_publish(subject, 'action', 'send', 'nick', nick, 'msg', val);
		this.value = '';
		this.focus();
	}
}

function onData(){
	var event = arguments[0];
	var action =  event.get('action');
	var msg = event.get('msg');
	var nick = event.get('nick');
	console.log('event type ==> '+action + ','+nick+','+msg);

}

function enterChat() {
	p_join_listen(subject);
	p_publish(subject, 'action', 'enter', 'nick', nick);
}

