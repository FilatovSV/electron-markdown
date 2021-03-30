
//Required modules
const electron = require("electron")
const {app, BrowserWindow} = electron;
const path = require("path");
const url = require("url");
const fs = require("fs");
//Custom modules
const search = require("./utils/search");
const ipc = require("./utils/ipc-main");
//App-related utility constants 
const MACOS = process.platform === 'darwin';
const lock = app.requestSingleInstanceLock();
const DATA_PATH = app.getPath("userData");
const SETTINGS_PATH = DATA_PATH + "\\settings.json";

let wins = [], settings = {};

//TODO:
//1) + Menu implementation via IPC
//2) Context menu bug: disappears with no click after elongated hover => freezes app
//3) [optional] Code restructuring, comments for:
//-- index.js
//-- editor.js
//-- finish code scheme in main.js

//App instantiation
if(!lock) {
	app.quit();
} else {
	app
	.on('open-file', (event, path) => {
		console.log(event);
		console.log(path);
	})
	.on('ready', startApp)
	.on('second-instance', secondInstance)
	.on('activate', () => { if (!wins || wins.length == 0) createWindow() })
	.on("window-all-closed", () => {
		if(!MACOS) app.quit();
	});
}

//Settings preload (window bounds)
if(fs.existsSync(SETTINGS_PATH)) {
	settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
}
//Removes app menu
app.applicationMenu = null;
//Error handling
process.on('uncaughtException', process.onError = onError);

//// -- Main body-- \\\\

// AppStart(1st time)-->|				|TODO:
//						|ArgsHandling-->|finish schema
// AppStart(2nd time)-->|				|


//App starter (first instance)
function startApp() {
	if(process.argv.length > 1){
		var args = process.argv.slice(1);
		handleAppArgs(args);
	}
	if(wins == null || wins.length == 0){
		createWindow();
	}
}

//App starter (second instance)
function secondInstance(ev, args, workingDir) {
	try {
		var mds;
		if(args) mds = findMD(args);
		if(mds && mds.length) {
			handleAppArgs(args);
		} else {
			if(wins) wins.forEach(win => {
				if (win.isMinimized()) win.restore();
				win.focus();
			});
		}
	}
	catch(ex) {
		console.error(ex);
	}
}

//Creates one window for every .md file
function handleAppArgs(args) {
	if (args.length) {
		for (var j = 0; j < args.length; ++j) {
			if(args[j].startsWith('@')) {
				//If .md files are supplied via list in a text file
				handleArgsFromArgFile(args[j].substring(1));
			} else if(args[j].endsWith(".md") || args[j].endsWith(".markdown")) {
				createWindow(args[j]);
			}
		}
	}
}

//Creates window (main function)
function createWindow(mdfile) {
	//Duplicate check
	var win = getWinByPath(mdfile);
	if(win) {
		if (win.isMinimized()) win.restore();
		win.focus();
		return;
	};
	//Creates a single viewer window for mdfile
	var opts = {
		webPreferences: { 
			nodeIntegration: true,
			contextIsolation: false
		},
		icon: path.join(__dirname, 'md.png')
	};
	//Viewer specs
	if(settings.viewerWidth) {
		opts.x = settings.viewerX;
		opts.y = settings.viewerY;
		opts.width = settings.viewerWidth;
		opts.height = settings.viewerHeight;
		
	}
	//Viewer creation, Editor specs transfer
	win = new BrowserWindow(opts);
	//win.webContents.openDevTools();
	win.webContents.data = {
		paths: { 
			mdpath: mdfile, 
		},
		eBounds: settings.editorWidth ? {
				"x": settings.editorX,
				"y": settings.editorY,
				"width": settings.editorWidth,
				"height": settings.editorHeight
		} : {}
	};
	win.loadURL(url.format({
		pathname:path.join(__dirname, 'index.html'),
		protocol: 'file',
		slashes: true
	}));
	win.on('close', () => {
		var eBounds;
		var editor;
		if(win.webContents.data.editorID) editor = BrowserWindow.fromId(win.webContents.data.editorID);
		eBounds = editor ? editor.getBounds() : win.webContents.data.eBounds;		
		//Close search windows
		if(editor) search.getSearchWindow(editor).close();
		search.getSearchWindow(win).close();
		
		var {x, y, width, height} = win.getBounds();
		var specs = eBounds.width ? {
			"viewerX": x, "viewerY": y, 
			"viewerWidth": width, "viewerHeight": height,
			"editorX": eBounds.x, "editorY": eBounds.y,
			"editorWidth": eBounds.width, "editorHeight": eBounds.height
		} : {
			"viewerX": x, "viewerY": y, 
			"viewerWidth": width, "viewerHeight": height,
		};
		
		fs.writeFileSync(SETTINGS_PATH, JSON.stringify(specs), 'utf8');
	});
	win.webContents.on('will-navigate', (ev,url) => {
		if(url.startsWith("http")) {
			ev.preventDefault();
			electron.shell.openExternal(url); 
		}
	});

	//Editor creation tweaks: search module, connection to viewer
	win.webContents.on('new-window', (ev, url, frameName, disposition, options) => {
		ev.preventDefault();
		options.show = false;
		//Creates editor
		var newWin = new BrowserWindow(options);
		newWin.once('ready-to-show', () => newWin.show());
		if(!options.webContents) newWin.loadURL(url); //load editor script
		if(win.webContents.data) win.webContents.data.editorID = newWin.id; //identifier for editor
		search.attachTo(newWin); //attach search module to editor
		ev.newGuest = newWin;
	});
	ipc.handleClose(win,null); // create close dialog for unsaved changes
	wins.push(win);
	search.attachTo(win); // attach search module to viewer
}


//Utility functions
function getWinByPath(mdfile) {
	if(wins && wins.length) {
		for(var i=0; i<wins.length; ++i) {
			if(wins[i].webContents.data.paths.mdpath && wins[i].webContents.data.paths.mdpath == mdfile) {
				return wins[i];
			}
		}
	}
	return null;
}

function findMD(args) {
	if(args.length) {
		for(var i=args.length-1;i>=0;--i) {
			if(!args[i].endsWith(".md") && !args[i].endsWith(".markdown") && !args[i].startsWith("@")) {
				args.splice(i,1);
			}
		}
		return args;
	} else {
		return null;
	}
}

function handleArgsFromArgFile(argFile) {
	if(fs.existsSync(argFile)) {
		var fileArgs = fs.readFileSync(argFile, 'utf8').split(/\r?\n/g);
		for(var i=0; i<fileArgs.length; ++i) {
			if(fileArgs[i].endsWith('.md') || fileArgs[i].endsWith('.markdown')) {
				createWindow(fileArgs[i]);			
			}
		}
	}
}

function onError(err, title) {
	try {
		dialog.showMessageBoxSync(null,{
			type: "error",
			title: title || "ERROR",
			buttons: ["OK"],
			message: (err && err.stack) ? err.stack : ""+err
		});
	}
	catch(ex) {
		console.error(err);
	}
}
