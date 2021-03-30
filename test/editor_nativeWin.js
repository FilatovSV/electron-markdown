//const {remote} = require("electron");

var source;  // textarea
var updateId;  // timeout ID

window.addEventListener('message', event => {
	var json = JSON.parse(event.data);
	//console.log(json);
	if(json.type == 'source') {
		source.value = json.content;
		document.title = json.filename + " - " + document.title;
	}
});

window.addEventListener('load', event => {
	console.log(window.opener);
	var msg = JSON.stringify({type: 'source', content: ''});
	window.opener.postMessage(msg,"*");
});

window.addEventListener('blur', ev => {
	var winBounds = {"x": window.screenX, "y": window.screenY, "width": window.outerWidth, "height": window.outerHeight};
	var msg = JSON.stringify({type: 'close', content: winBounds});
	window.opener.postMessage(msg,"*");
});

window.addEventListener('beforeunload', ev => {
	//console.log(getBounds());
	window.opener.setEBounds(getBounds());
	/*
	var winBounds = {"x": window.screenX, "y": window.screenY, "width": window.outerWidth, "height": window.outerHeight};
	var msg = JSON.stringify({type: 'close', content: winBounds});
	window.opener.postMessage(msg,"*");
	*/
});


document.addEventListener("DOMContentLoaded", initialize);
function initialize() {

	window.opener.addListeners();
	document.addEventListener("keydown", function (ev) {
		switch(ev.code) {
		//case "F5" : location.reload(); break;
		//case "F12": remote.getCurrentWindow().toggleDevTools(); break;
		case "KeyS": if(ev.ctrlKey) window.opener.writeContent(); break;
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
function aaa() {
	window.addEventListener("keydown", ev => {
		console.log(ev);
		opener.bbb();
	});
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
	window.opener.setContent(source.value);
	updateId = null;
}

function getBounds() {
	return {
		"x": window.screenX,
		"y": window.screenY,
		"width": window.outerWidth,
		"height": window.outerHeight
	};
}
