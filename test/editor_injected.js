const fs = require("fs");
const remote = require("electron").remote;
console.log("from index");

var content;
var mode;

if (remote.process.argv.length > 2) {
    for (var j = 2; j < remote.process.argv.length; ++j) {
        console.log(remote.process.argv[j]);
        if(remote.process.argv[j].includes(".md") || remote.process.argv[j].includes(".markdown")) {
            document.getElementById('source').value = fs.readFileSync(remote.process.argv[j]);
        }
    }
}

document.addEventListener('keydown', event => {
    if(event.key == "F4") {
        document.getElementById('TAwrap').style.display = 'block';
    } else if(event.key == "Escape") {
        document.getElementById('TAwrap').style.display = 'none';
    } else if(event.ctrlKey && (event.key == "s")) {
        if(document.getElementById('source').value != content) {
            content = document.getElementById('source').value;
            document.getElementById('renderedMD').innerHTML = marked(document.getElementById('source').value);
        }
    } else if(event.key == "F5") {
        editor = window.open("./editor.html");
        
    }
});

document.getElementById('TAwrap').addEventListener('mousedown', function(ev) {
    if(ev.target == ev.currentTarget) {
        var divDim = this.getBoundingClientRect();
        var borderLeft = parseInt(getComputedStyle(this,null).getPropertyValue('border-left-width'));
        var borderTop = parseInt(getComputedStyle(this,null).getPropertyValue('border-top-width'));
        if((divDim.left <= ev.pageX) && (ev.pageX <= divDim.left + borderLeft)) {
            if((divDim.top <= ev.pageY) && (ev.pageY <= divDim.top + borderTop)) {
                mode = 3;
            } else {
                mode = 1;
            }
        } else {
            mode = 2;
        }
        window.addEventListener('mousemove', mouseMoveFunct);
        window.addEventListener('mouseup', mouseUpFunct);
        ev.preventDefault();
    }
});

function mouseMoveFunct(ev) {
    var div = document.getElementById('TAwrap');
    if(mode == 1) {
        div.style.width = window.innerWidth - ev.pageX + 'px';
    } else if(mode == 2) {
        div.style.height = window.innerHeight - ev.pageY + 'px';
    } else {
        div.style.width = window.innerWidth - ev.pageX + 'px';
        div.style.height = window.innerHeight - ev.pageY + 'px';
    }
}

function mouseUpFunct(ev) {
    window.removeEventListener('mousemove', mouseMoveFunct);
    window.removeEventListener('mouseup', mouseUpFunct);
}