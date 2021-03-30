const electron = require('electron');
const {
	ipcRenderer: ipc, webFrame } = electron;


ipc.addDevShortcuts = function () {
	document.addEventListener("keydown", ev => {
		switch(ev.code) {
			//case "F5" : ipc.send("reload", "false"); break;
			case "F5" : location.reload(); break;
			case "F12":  ipc.send("devTools"); break;
		}
	});
};

ipc.getData = function(arg) { 
	return ipc.invoke("getData", arg)
		.catch(err => console.error(err));
};
ipc.setData = function(data, reset) { 
	return ipc.send("setData", data, reset) ;
};

ipc.showSaveDialog = function(opts) {
	return ipc.invoke("showSaveDialog", opts);
}
ipc.showMessageBox = function(opts) {
	var acts = opts.actions;
	delete opts.actions;
	
	if(arguments.length > 1 && !acts) {
		acts = [];
		for(var i=1; i < arguments.length; ++i) acts.push(arguments[i]);
	}
	var result = ipc.invoke("showMessageBox").catch(err => console.error(err));
	
	if(acts) result.then( val => {
		var index = val.response;
		var act = acts[index];
		if(!act) act = opts.buttons && acts[opts.buttons[index]];
		
		if(act) act();
	});
	return result;
};

ipc.showPopupMenu = function(items) {
	let map = {};
	
	function convert(items) {
		var arr = [];
		items.forEach(item=>{
			let {click, ...main} = item;
			arr.push(main);
			
			if(click) map[item.id || item.label] = item;
			if(main.submenu) {
				main.submenu = convert(main.submenu);
			}
		});
		return arr;
	}
	
	ipc.invoke("showMenu", convert(items) ).then(
		id => {
			let item = map[id], click = item && item.click;
			if(click) {
				if(click.substring) {
					webFrame.executeJavaScript(click,true);
				}
				else if(click.call) click(item);
			}
		},
		err => {throw err}
	);
};



module.exports = ipc;