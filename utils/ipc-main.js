const electron = require('electron');
const {
	ipcMain, 
	dialog, 
	Menu, 
	BrowserWindow} = electron;
	
ipcMain

.on("devTools", ev => {
	if(!ev.sender.isDevToolsOpened()) ev.sender.openDevTools();
	else ev.sender.devToolsWebContents.focus();
})
.on("reload", (ev, ignoreCache) => {
	if(ignoreCache) {
		ev.sender.reloadIgnoringCache();
	} else {
		ev.sender.reload();
	} 
})
.on("close", ev => {
	BrowserWindow.fromWebContents(ev.sender).destroy();
})
.on("setData", (ev,arg,reset)=> {
	if(reset) ev.sender.data = {};
	try {
		Object.assign(ev.sender.data, arg);
	}
	catch(err) { process.onError(err); }
});
	
ipcMain.handle("getData", (ev, arg) => {
	var data = ev.sender.data;
	if(arg) {
		if(arg.constructor !== Array) arg = [arg];
		
		var subs = {};
		arg.forEach(key=> subs[key] = data[key]);
		data = subs;
	}
	return data;
});
	
ipcMain.handle("showMessageBox", (ev,opts) => {
	return dialog.showMessageBox(BrowserWindow.fromWebContents(ev.sender),opts);
});
ipcMain.handle("showSaveDialog", (ev, opts) => {
	return dialog.showSaveDialogSync(BrowserWindow.fromWebContents(ev.sender), opts);
});
	
ipcMain.handle("showMenu", (ev, items) => {
	
	var result;
	
	function addClick(items) {
		
		items.forEach(itm => { 
			itm.click = t => { result = t.id || t.label; };
			if(itm.submenu) {
				addClick(itm.submenu);
			}
		});
	}
	return new Promise((resolve, reject) => {
		try {
			var ok, act = ()=> { 
				if(!ok) { ok = true; resolve(result); }
			};
			addClick(items);
			Menu.buildFromTemplate(items).popup({ 
				callback: act	
			});
			setTimeout(act, 5000);
		}
		catch(err) { reject(err) }
	});
});


async function closeRequest(win, reload) {
	try {
		var result = await win.webContents.executeJavaScript(
			win.canCloseScript.replace("$reload",reload)
		);
		if(typeof result === 'string') result = {
			message: result,
			title: win.getTitle() || "Confirm",
			buttons: ['Yes', 'No']
		};
		if(result && result.constructor === Object) {
		
			var index = dialog.showMessageBoxSync(win, result);
			var acts = result.actions, btns = result.buttons;
			var act = acts &&  btns && (acts[index] || acts[btns[index]]);
			if(act) {
				await win.webContents.executeJavaScript(act);
			}
			if(index+1 < btns.length) result = true;
		}
		if(result === true) {
			if(reload) win.reload(); else win.destroy();
		}
	}
	catch(ex) { process.onError(ex) }
}


module.exports = Object.assign(ipcMain, {
	
	handleClose: (win, script) => {
		
		win.canCloseScript = script || "canClose($reload)";
		
		win.on("close", ev => {
			ev.preventDefault();
			closeRequest(BrowserWindow.fromWebContents(ev.sender), false);
		});
		
		win.webContents.on("will-navigate", (ev,url) => {
			if(ev.sender.getURL() == url) {
				ev.preventDefault();
				closeRequest(BrowserWindow.fromWebContents(ev.sender), true);
			}
		});
	}
});
