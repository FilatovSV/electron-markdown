const ipc = require("./utils/ipc-renderer");

var source;  // textarea
var updateId;  // timeout ID

window.addEventListener('message', event => {
	var json = JSON.parse(event.data);
	console.log(json);
	if(json.type == 'source') {
		source.value = json.content;
		if(json.filename != null) document.title = json.filename + " - " + document.title;
	}
});

window.addEventListener('load', event => {
	var msg = JSON.stringify({type: 'source', content: ''});
	window.opener.postMessage(msg,"*");
});
window.addEventListener('beforeunload', ev => {
	var winBounds = {"x": window.screenX, "y": window.screenY, "width": window.outerWidth, "height": window.outerHeight};
	var msg = JSON.stringify({type: 'close', content: winBounds});
	window.opener.postMessage(msg,"*");
});

ipc.addDevShortcuts();

document.addEventListener("DOMContentLoaded", initialize);
function initialize() {
	
	document.addEventListener("keydown", function (ev) {
		switch(ev.code) {
		case "KeyS": if(ev.ctrlKey) saveSource(); break;
		}
	});
		
	source = document.getElementById("source");
	if(source) {
		source.addEventListener('input', function(ev) {
			sourceChange();
		});
		source.addEventListener('keydown', function(ev) {
			if(ev.keyCode === 9) {
				handleTab();
			}
		})
	}
}

function saveSource() {
	var msg = JSON.stringify({type:'save', content: source.value});
    window.opener.postMessage(msg,"*");
}

function handleTab() {
	// get caret position/selection
	var val = source.value,
	start = source.selectionStart,
	end = source.selectionEnd;
	// set textarea value to: text before caret + tab + text after caret
	source.value = val.substring(0, start) + '\t' + val.substring(end);
	// put caret at right position again
	source.selectionStart = source.selectionEnd = start + 1;
	// prevent the focus lose
	return false;
}

function sourceChange() {
	if(updateId !== null) {
		window.clearTimeout(updateId);
		updateId = window.setTimeout(timeoutAction, 350);
	} else {
		updateId = window.setTimeout(timeoutAction, 350);
	}
}
function timeoutAction() {
	var msg = JSON.stringify({type: 'update', content: source.value});
	window.opener.postMessage(msg,"*");
	console.log('msg sent')
	updateId = null;
}