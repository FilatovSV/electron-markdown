const fs = require("fs");
const electron = require("electron");
const ipc = require("./utils/ipc-renderer");
const path = require("path");
const {remote} = electron;
const iconv = require("iconv-lite");
const SYSTEM_ENCODING = "windows-1251";


var content, editor, enc, changesSaved = true;

let mdpath, mdname, eBounds;
ipc.getData().then(
	data => {
		mdpath = data.paths.mdpath;
		mdname = path.parse(mdpath).base;
		eBounds = data.eBounds;
		init();
	}
);

//test-->
function getIPC() {
	return ipc;
}
function getContent() {
	return content;
}
function setContent(newContent) {
	content = newContent;
	compileMD(content);
	changesSaved = false;
}
function setEBounds(bounds) {
	//eBounds.x = bounds.x;
	//eBounds.y = bounds.y;
	//eBounds.width = bounds.width;
	//eBounds.height = bounds.height;
	//ipc.setData({"eBounds": eBounds}, false);
	console.log(window);
}
/*
function getEBounds() {
	return (editor && !editor.closed) ? editor.getBounds() : eBounds;
}
*/
//<--
function addListeners() {
	editor.window.addEventListener("keydown", ev =>{
		console.log("key pressed");
	});
}
function bbb() {
	console.log("Got it!")
}


//Loads content from mdfile
function init() {
	
	if(fs.existsSync(mdpath)) {
		content = readContent();
		compileMD(content);
		document.title = mdname + " - " + document.title;
	}
}

//Utility functions
function readContent() {
	var data = fs.readFileSync(mdpath);
	enc = detectEncoding(data);
	try {	
	    return decode( 
	    	enc.bom ? data.slice(enc.bom) : data, 
	    	enc.encoding || SYSTEM_ENCODING);
	} catch (error) {
		return alert(error);
	}
}
function writeContent() {
	try {
		var encoding = enc.encoding || SYSTEM_ENCODING;
		
		if(! encoding.startsWith("utf")) {
			if(content != iconv.decode(iconv.encode(content,encoding), encoding)) {
				alert("Warning: has changed to utf8");
				encoding = enc.encoding = "utf8";
			}
		}

		//Encodes content
		var data = encode(content, encoding);
		
		if(enc.bom) data = Buffer.concat([encBOM(enc.encoding), data]);
		
		fs.writeFileSync(mdpath, data);	
		changesSaved = true;
	}
	catch (error) {
		alert(error);
	}   
}

function compileMD(mdText) {
    document.getElementById('renderedMD').innerHTML = marked(mdText);
    
    // for all links attach 'title' attribute if needed
    // (title attr is shown as tip)
    setTimeout(function(){
    	var links = document.body.getElementsByTagName("A");
    	for(var i=0; i < links.length; ++i) {
    		var a = links[i], href = a.getAttribute("href");
			if(!a.title && href != a.innerHTML)
    			a.title = href;
    	}
    }, 500);
}

document.addEventListener("contextmenu", showContextMenu);

function showContextMenu() {
	var menu = remote.Menu.buildFromTemplate([
		
		{ label: "Copy", click: document.execCommand("copy") },
		{ type: "separator" },
		{ label: "Save as HTML...", click: saveAsHtml }
	]);
	menu.popup({ window: remote.getCurrentWindow() });
}
function saveAsHtml() {
	
	var path = remote.dialog.showSaveDialogSync(
		remote.getCurrentWindow(), 
		{defaultPath: mdpath.replace(/\.(md|markdown)$/,".html") }
	);
	if(path) {
		const join = require("path").join;
		
		var html = fs.readFileSync(join(__dirname,"index.html"), "utf8");
		var css = fs.readFileSync(join(__dirname,"markdown.css"), "utf8");
		
		// remove scripts
		html = html.replace(/<script.*\/script>/g,"");
		// embed markdown css
		html = html.replace(
			'<link rel="stylesheet" href="markdown.css">',
			"<style>"+css+"</style>");
		// embed content html
		html = html.replace(
			'<div id="renderedMD"></div>',
			'<div id="renderedMD">'+document.getElementById('renderedMD').innerHTML+'</div>');

		fs.writeFileSync(path, html, "utf8");	
	}
}


ipc.addDevShortcuts();

document.addEventListener("keydown", function (ev) {
	switch(ev.code) {
	//case "F5" : window.location.reload(); break;
	//case "F12": remote.getCurrentWindow().toggleDevTools(); break;
    case "F4": if(!ev.altKey) toggleEditor(); break;
    case "KeyS": if(ev.ctrlKey) writeContent(); break;
	}
});



function toggleEditor() {
	if(editor && !editor.closed) {
        editor.focus();
	} else {
        if(eBounds) {
            var params = "left=" + eBounds.x +
                     ",top=" + eBounds.y +
                     ",width=" + eBounds.width +
					 ",height=" + eBounds.height;
			editor = window.open("./editor.html","",params);
        } else {
			editor = window.open("./editor.html",);
        }
	}
	console.log(editor);
}


window.addEventListener('beforeunload', ev => {
	if(editor) editor.close();
	return;
});

window.addEventListener('message', event => {
	var json = JSON.parse(event.data);
	switch(json.type) {
    case 'source': 
        var msg = JSON.stringify({type: 'source', content: content, filename: mdname});
        editor.postMessage(msg, "*");
        break;
    case 'update':
        content = json.content;
		compileMD(content);
		changesSaved = false;
        break;
    case 'save':
        //(?) Is it extra to additionally render content before saving to file?
        content = json.content;
        compileMD(content);
		writeContent();
        break;
    case 'close':
		eBounds = json.content;
		ipc.setData({"eBounds": eBounds}, false);
        break;
	}
});

//Utility functions
function canClose(reload) {
	return changesSaved || 
	{
		title: document.title,
		message: 'Document has been changed. Do you want to save changes?',
		buttons: ['Yes', 'No', 'Cancel'],
		actions: { 
			'Yes': 'writeContent();',
			'No':  reload ? 
					`if(editor) {
						content = readContent();
						var msg = JSON.stringify({type: 'source', content: content, filename: mdname});
						editor.postMessage(msg, "*");
					}` : '',
			'Cancel': ''
		}
		// or
		// actions: ["script on Yes", "script on No"]
	};
}

function detectEncoding(data) {
	
	var len = data ? data.length : 0; if(!len) return {};

	/* http://www.w3.org/TR/REC-xml/#sec-guessing
	
	00 00 FE FF 	UCS-4, big-endian machine (1234 order)
	FF FE 00 00 	UCS-4, little-endian machine (4321 order)
	00 00 FF FE 	UCS-4, unusual octet order (2143)
	FE FF 00 00 	UCS-4, unusual octet order (3412)
	FE FF ## ## 	UTF-16, big-endian
	FF FE ## ## 	UTF-16, little-endian
	EF BB BF		UTF-8 
	
	*/
	var i, m, s, max = 256;

	switch(data[0]) {
	case 0:
		break;
	case 0xFF:
		if(0xFE === data[1]) return {encoding: "utf16le", bom: 2};
		break;
	case 0xFE:
		if(0xFF === data[1]) return {encoding: "utf16be", bom: 2};
		break;
	case 0xEF:
		if(0xBB === data[1] && 0xBF === data[2]) return {encoding:"utf8",bom:3};
		break;
	}
	
	// count bin and utf-8 characters 
	
	var bin = 0, utf8 = 0; max = Math.min(len, 8*1024);
	
	for(i=0; i < max; ++i) {
		var b = data[i];
		if(b < 32) {
			if(b != 9 && b != 10 && b != 13) ++bin;
		}
		else if( b > 127 && utf8 >= 0) {
			var un = utf8len(b)-1;
			if(un < 0 || i+un >= len) utf8 = -1;
			else {
				for(var n=1; n <= un; ++n) {
					if((data[i+n] & 0b11000000) != 0b10000000) {
						utf8 = -1;
						break;
					}
				}
				if(utf8 != -1) {
					i += un;
					utf8 += un+1;
				}
			}
		}
	}
	if( bin*100/max > 5 ) return { binary: true };
	if( utf8 > 0) return { encoding: "utf8" };
	return {};
}
function utf8len(b) {
	// 'b' is expected > 127, so 1 is not possible.
	// if((b & 0b10000000) == 0b00000000) return 1;

	if ((b & 0b11100000) == 0b11000000) return 2;
	if ((b & 0b11110000) == 0b11100000) return 3;
	if ((b & 0b11111000) == 0b11110000) return 4;
	if ((b & 0b11111100) == 0b11111000) return 5;
	if ((b & 0b11111110) == 0b11111100) return 6;
	return 0;
}
function encBOM(enc) {
	switch(enc) {
	case "utf8": return Buffer.from([0xEF,0xBB,0xBF]);
	case "utf16le": return Buffer.from([0xFF,0xFE]);
	case "utf16be": return Buffer.from([0xFE,0xFF]);
	default: return Buffer.alloc(0);
	}
}
function decode(data,enc) {
	if(Buffer.isEncoding(enc)) return data.toString(enc);
	if(iconv.encodingExists(enc)) return iconv.decode(data,enc);
	
	throw "Unsupported Charset: "+enc;
}
function encode(text,enc) {
	if(Buffer.isEncoding(enc)) return Buffer.from(text,enc);
	if(iconv.encodingExists(enc)) return iconv.encode(text,enc);
	
	throw "Unsupported Charset: "+enc;
}
