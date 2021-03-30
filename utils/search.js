const electron = require("electron");
const {BrowserWindow, ipcMain} = electron;
const path = require("path");
const url = require("url");

const keydownListener = 
`document.addEventListener("keydown", function (ev) {
    switch(ev.code) {
        case "KeyF" : if(ev.ctrlKey) require("electron").ipcRenderer.send('show-search-window'); break;
        case "Escape" : require("electron").ipcRenderer.send('hide-search-window'); break;
    }
});`;

function init(mainWin) {
    if(mainWin) {
        //Adds functionality to main window
        mainWin.search_windowType = 'main-window';
        //(?) .on(...) or .addEventListener(...) ?
        mainWin.on('move', function(ev) {
            setWinPosition(searchWin);
        });
        mainWin.on('resize', function(ev) {
            setWinPosition(searchWin);
        });
        mainWin.webContents.executeJavaScript(keydownListener).catch(err => {
            console.log("Failed to execute JS: "+ keydownListener);
        });

        //Initiates search window for main window
        var searchWin = new BrowserWindow({width: 330, height: 65,
            webPreferences: { nodeIntegration: true, contextIsolation: false},
            show: false,
            frame: false,
            resizable: false,
            skipTaskbar: true,
            transparent: true,
            parent: mainWin});
        searchWin.hidden = true;
        searchWin.search_windowType = 'search-window';    
        searchWin.textToFind = '';
        searchWin.loadURL(url.format({
            pathname:path.join(__dirname, 'search.html'),
            protocol: 'file',
            slashes: true
        }));
        searchWin.on('hide', ev => {
            searchWin.hidden = true;
        });
        searchWin.on('show', ev => {
            searchWin.hidden = false;
        });
        searchWin.once('ready-to-show', () => {
            setWinPosition(searchWin);
        });
        mainWin.webContents.on('found-in-page', (ev,result) => {
            searchWin.webContents.send('search-result', JSON.stringify({matches: result.matches, current: result.activeMatchOrdinal}));
        });
    }
}

//Utility functions
//-->
function setWinPosition(searchWin) {
	if(searchWin) {
        var mainWin = searchWin.getParentWindow();
        var scrollBarX = 25;
        if(mainWin) {
            var searchWinX = mainWin.getBounds().x + mainWin.getContentSize()[0] - searchWin.getBounds().width - scrollBarX;
            var searchWinY = mainWin.getBounds().y + mainWin.getBounds().height - mainWin.getContentSize()[1];
            searchWin.setBounds({x: searchWinX, y: searchWinY});
        }
	}
}

function getChildWindowOfType(win, type) {
	if(win && win.getChildWindows()) {
		var childWins = win.getChildWindows();
		for(let i=0; i<childWins.length; ++i) {
			if(childWins[i].search_windowType == type) {
				return childWins[i];
			} else {
				return null;
			}
		}
	} else {
		return null;
	}
}

function hideSearchWin(searchWin, mainWin) {
    if(mainWin && searchWin && !searchWin.hidden) {
        mainWin.webContents.stopFindInPage('keepSelection');
        searchWin.hide();
        mainWin.focus();
        searchWin.textToFind = null;
    }
}
//<--

//IPC messaging handlers
ipcMain.on('show-search-window', ev => {
    var win = BrowserWindow.fromWebContents(ev.sender);
    if(win.search_windowType == 'main-window') {
        var searchWin = getChildWindowOfType(win, 'search-window');
        if(searchWin) {
            searchWin.hidden ? searchWin.show() : searchWin.focus();
        }
    }
});
ipcMain.on('hide-search-window', ev => {
    var win = BrowserWindow.fromWebContents(ev.sender);
    if(win.search_windowType == 'main-window') {
        var searchWin = getChildWindowOfType(win, 'search-window');
        hideSearchWin(searchWin, win);
    } else if(win.search_windowType == 'search-window') {
        var mainWin = win.getParentWindow();
        hideSearchWin(win, mainWin);
    }
});
ipcMain.on('find-text', (ev,data) => {
    if(data) {
        var json = JSON.parse(data);
        var win = BrowserWindow.fromWebContents(ev.sender);
        if(win.search_windowType == 'search-window') {
            var mainWin = win.getParentWindow();
            if(mainWin) {
                if(win.textToFind && json.data && (win.textToFind == json.data)) {
                    mainWin.webContents.findInPage(win.textToFind, {forward: json.forward, findNext: true});
                } else {
                    win.textToFind = json.data;
                    mainWin.webContents.findInPage(win.textToFind, {forward: json.forward});
                }
            }
        }
    }
});
ipcMain.on('cancel-search', ev => {
    var win = BrowserWindow.fromWebContents(ev.sender);
    if(win.search_windowType == 'search-window') {
        var mainWin = win.getParentWindow();
        if(mainWin) {
            mainWin.webContents.stopFindInPage('clearSelection');
            win.textToFind = null;
        }
    }
});
ipcMain.on('close-window', ev => {
    var win = BrowserWindow.fromWebContents(ev.sender);
    if(win.search_windowType == 'search-window') {
        var mainWin = win.getParentWindow();
        if(mainWin) mainWin.close();
    }
});


var api = {attachTo: init, getSearchWindow: (win) => getChildWindowOfType(win, 'search-window')};
module.exports = api;