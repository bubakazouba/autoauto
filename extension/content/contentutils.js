function getElementInfoForKeyPresses(e) {
    if (!e.isTrusted) {
        // ignore javascript programmatic key presses
        console.log("key event not trusted ignore");
        return;
    }
    let element = e.path[0];
    let element_id = getElementId(element);
    let element_node = element.nodeName;
    // TODO: hack to avoid complexity of determining patterns for copy and paste actions
    // we are just assuming here that the keyup is some keyboard shortcut to act on the selected text
    // lets check that element type isnt input because then we would be fine
    // Reason we do this is cmd+c over non-editable nodes can trigger randomly on <body> or some other element
    if (isTextSelected() && !isElementTextEditable(element)) {
        element_id = "";
        element_node = "";
    }
    // Non editable fields are only allowed cmd+c, unless this is google drive
    if (!isElementTextEditable(element) && !areWeInSpreadsheets()) {
        if (!keyIsCopy(e)) {
            return;
        }
    }
    // TODO: reconcile key ignoring logic (rn its fragmented here,backgorund.js and actionsgrouper.py)
    // User is just switching tabs, unfortunately key gets reported on a text editable element if its active
    if(!!e.code && e.code.startsWith("Digit") && getModifierKey(e)) {
        return;
    }
    return {
        element: element,
        element_id: element_id,
        element_node: element_node,
    };
}

function getKeyPressEvent(e, element, element_id, element_node) {
    let event = {
        element_id: element_id,
        element_node: element_node,
    };
    if (isElementTextEditable(element)) {
        event.type = "KEY_GROUP_INPUT";
        event.keyGroupInput = {
            startOffset: element.selectionStart,
            value: element.value,
        };
    }
    else {
        event.type = "KEYBOARD";
    }
    event.keyParams = {};
    const FIELDS = ["code", "key", "keyCode", "shiftKey", "ctrlKey", "metaKey", "altKey", "which"];
    for (let f of FIELDS) {
        event.keyParams[f] = e[f];
    }
    
    return event;
}

// TODO: this should accept textareas too
function isElementTextEditable(element) {
    return element.nodeName == "INPUT";
}

function keyIsCopy(e) {
    if (!e.key) {
        return false;
    }
    return e.key.toUpperCase() == "C" && getModifierKey(e);
}

function keyIsPaste(e) {
    if (!e.key) {
        return false;
    }
    return e.key.toUpperCase() == "V" && getModifierKey(e);
}

function getValueInClipboard() {
    let request = {
        type: "GET_CLIPBOARD",
    };
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            request: request
        }, response => {
            resolve(response);
        });
    });
}

function getElementId(element) {
    function getElementIndex(elem) {
        if (!elem.parentElement) {
            return "0";
        }
        // TODO: evaluate children vs childNodes
        for(let i = 0; i < elem.parentElement.childNodes.length; i++) {
            if (elem.parentElement.childNodes[i] == elem) {
                return getElementIndex(elem.parentElement) + "." + i;
            }
        }
    }
    if (!window.elements) {
        window.elements = {};
    }
    let id = getElementIndex(element);
    window.elements[id] = element;
    return id;
}

function isTextSelected() {
    if (isElementTextEditable(document.activeElement)) {
        return document.activeElement.selectionStart != document.activeElement.selectionEnd;
    }
    let selecttxt = '';
    if (window.getSelection) {
        if (!window.getSelection().isCollapsed) {
            selecttxt = window.getSelection().baseNode.textContent;
        }
    }
    else if (document.getSelection) {
        if (!document.getSelection().isCollapsed) {
            selecttxt = document.getSelection().baseNode.textContent;
        }
    }
    else if (document.selection) {
        selecttxt = document.selection.createRange().text;
    }
 
    if (selecttxt == '') {
        return false;
    }
    return true;
}

function areWeInSpreadsheets() {
    return window.location.origin == "https://docs.google.com" && window.location.pathname.split("/")[1] == "spreadsheets";
}

// Should be able to copy images/links/formatting too
function copy(text) {
    return new Promise(resolve => {
        let request = {
            type: "PLACE_IN_CLIPBOARD",
            text: text,
        };
        chrome.runtime.sendMessage({
            request: request
        }, response => {
            resolve(response);
        });
    });
}

// TODO: this will need to be changed in the future if we are opening new pages (e.g coarse grained user clicks on nth button in page after loading)
// simple way to do it is to traverse DOM by indices, obviously websites are prone to change in ordering so we would require some smarter matching (e.g text/attributes/class name/id..etc)
function getElementById(id) {
    function _getElementById(node, id) {
        let i = id.indexOf(".");
        let x;
        if (i==-1) {
            x = parseInt(id);
            return node.childNodes[x];
        }
        else {
            let x = parseInt(id.substr(0, i));
            return _getElementById(node.childNodes[x], id.substr(i+1));
        }
    }
    let root = document.documentElement;
    let i = id.indexOf(".");
    if (i == -1) {
        return null;
    }
    return _getElementById(root, id.substr(i + 1));
    // TODO: only do this if element still exists on the page. this way its more stable incase page changed over time.
    // Maybe i need to way to identify elements? one with indices the other without. static vs dynamic element addressing
    // return window.elements[id];
}

function cellToColAndRow(cell) {
    // basically a base 26 calculation
    function _colToNum(col) {
        let num = 0;
        for (let i in col) {
            let charCode = col[i].charCodeAt(0);
            const A_CODE = "A".charCodeAt(0);
            num += Math.pow(26, col.length - i - 1) * (1 + charCode - A_CODE);
        }
        return num;
    }
    let col = cell.match(/([A-Z]+)/)[0];
    let row = cell.match(/([0-9]+)/)[0];
    let col_in_num = _colToNum(col);
    return col_in_num+"."+row;
}

function colNumAndRowToCell(colNumAndRow) {
    // TODO: this only works for A->Z
    function _numToCol(colNum) {
        let columnString = "";
        while (colNum > 0) {
            let currentLetterNumber = (colNum - 1) % 26;
            let currentLetter = String.fromCharCode(currentLetterNumber + 65);
            columnString = currentLetter + columnString;
            colNum = (colNum - (currentLetterNumber + 1)) / 26;
        }
        return columnString;
    }
    let colNum = parseInt(colNumAndRow[0]);
    let row = parseInt(colNumAndRow[1]);
    return _numToCol(colNum)+row;
}

function getModifierKey(e) {
    if(navigator.appVersion.indexOf("Win") != -1 || navigator.appVersion.indexOf("X11") != -1 || navigator.appVersion.indexOf("Linux") != -1) {
        return e.ctrlKey;
    }
    else if(navigator.appVersion.indexOf("Mac") != -1) {
        return e.metaKey;
    }
    return null;
}

module.exports = {
    getElementInfoForKeyPresses: getElementInfoForKeyPresses,
    getKeyPressEvent: getKeyPressEvent,
    isElementTextEditable: isElementTextEditable,
    keyIsCopy: keyIsCopy,
    keyIsPaste: keyIsPaste,
    getValueInClipboard: getValueInClipboard,
    getElementId: getElementId,
    isTextSelected: isTextSelected,
    areWeInSpreadsheets: areWeInSpreadsheets,
    copy: copy,
    getElementById: getElementById,
    cellToColAndRow: cellToColAndRow,
    colNumAndRowToCell: colNumAndRowToCell,
    getModifierKey: getModifierKey,
};