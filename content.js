function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    return chrome.tabs.query(queryOptions);
}

function getListItemIndex(li) {
    let list = li.parentElement;
    let listItems = list.getElementsByTagName("li");
    for (let i = 0; i < listItems.length; i++) {
        if (listItems[i] == li) {
            return i;
        }
    }
}

function getTableItemIndex(td) {
    let tableRow = td.parentElement;
    let tableRowCells = tableRow.getElementsByTagName("td");
    let x;
    for (let i = 0; i < tableRowCells.length; i++) {
        if (tableRowCells[i] == td) {
            x = i;
            break;
        }
    }
    let table = tableRow.parentElement;
    let tableRows = table.getElementsByTagName("tr");
    let y;
    for (let i = 0; i < tableRows.length; i++) {
        if (tableRows[i] == tableRow) {
            y = i;
            break;
        }
    }
    return [x, y];
}

function generateId() {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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

// TODO: this will need to be changed in the future if we are opening new pages (e.g coarse grained user clicks on nth button in page after loading)
// simple way to do it is to traverse DOM by indices, obviously websites are prone to change in ordering so we would require some smarter matching (e.g text/attributes/class name/id..etc)
function getElementById(id) {
    return window.elements[id];
}

function getSelectionInfo(e) {
    // TODO: Assuming for now that user is always selecting the full text in the node, this will need to change
    // window.getSelection().getRangeAt(0).startContainer.parentNode;
    for (let elem of e.path) {
        if (elem.nodeName == "LI") {
            return {
                element_type: "LIST",
                item_index: getListItemIndex(elem),
                element_id: getElementId(elem.parentElement)
            };
        }
    }

    for (let elem of e.path) {
        if (elem.nodeName == "TD") {
            return {
                element_type: "TABLE",
                item_index: getTableItemIndex(elem),
                element_id: getElementId(elem.parentElement.parentElement)
            };
        }
    }
}

document.addEventListener('mouseup', (e) => {
    // Make sure text was selected
    if (!isTextSelected()) {
        return;
    }
    let selectionInfo = getSelectionInfo(e);
    if (!selectionInfo) {
        return;
    }
    console.log("selectionInfo=", selectionInfo);
    chrome.runtime.sendMessage({
        event: {
            type: "SELECTION",
            element_id: selectionInfo.element_id,
            element_type: selectionInfo.element_type,
            item_index: selectionInfo.item_index,
            selectionParams: {
                // TODO: fill with information around selection offsets
            },
        }
    });
}, true);

function getClickInfo(e) {
    let elem = e.path[0];
    // TODO: allowlist checkboxes and radio buttons (see how popular implementations make these, bootstrap..etc)
    let elemIsSubmitButton = elem.nodeName == "INPUT" && !!elem.attributes["type"] && elem.attributes["type"].value.toUpperCase() == "SUBMIT";
    if (elemIsSubmitButton || elem.nodeName == "BUTTON") {
        return {
            element_type: "BUTTON",
            element_id: getElementId(elem),
        };
    }
}

document.addEventListener('click', (e) => {
    let clickInfo = getClickInfo(e);
    if (!clickInfo) {
        return;
    }
    console.log("clickInfo=", clickInfo);
    chrome.runtime.sendMessage({
        event: {
            type: "CLICK",
            element_id: clickInfo.element_id,
            element_type: clickInfo.element_type,
            clickParams: {
                // TODO: maybe fill in later with x,y?
            }
        }
    });
}, true);

document.onkeydown = function(e) {
    const FIELDS = ["code", "key", "keyCode", "shiftKey", "ctrlKey", "metaKey", "altKey", "which"];
    if (!e.isTrusted) {
        // ignore javascript programmatic key presses
        console.log("not trusted ignore");
        return;
    }
    let keyParams = {};
    for (f of FIELDS) {
        keyParams[f] = e[f];
    }
    console.log(e);

    chrome.runtime.sendMessage({
        event: {
            type: "KEY_PRESSED",
            element_id: getElementId(e.path[0]),
            element_type: e.path[0].nodeName,
            keyParams: keyParams
        }
    });
};

function parseList(listId) {
    let list = getElementById(listId);
    return ["1.", "2.", "3.", "4.", "5.", "6."];
}

function parseTable(tableId) {
    let table = getElementById(tableId);
    return [
        ["(0,0)", "(1,0)", "(2,0)", "(3,0)"],
        ["(0,1)", "(1,1)", "(2,1)", "(3,1)"],
        ["(0,2)", "(1,2)", "(2,2)", "(3,2)"],
        ["(0,3)", "(1,3)", "(2,3)", "(3,3)"],
        ["(0,4)", "(1,4)", "(2,4)", "(3,4)"]
    ];
}

chrome.runtime.onMessage.addListener(function(request, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PARSE_LIST") {
        console.log("I was asked to parse list:" + request.id);
        parsedList = parseList(request.id);
        sendResponse({ "parsedList": parsedList });
    } else if (request.action == "PARSE_TABLE") {
        console.log("I was asked to parse table:" + request.id);
        parsedTable = parseTable(request.id);
        sendResponse({ "parsedTable": parsedTable });
    }
});

function isTextSelected(input) {
    var selecttxt = '';
    if (window.getSelection) {
        selecttxt = window.getSelection();
    } else if (document.getSelection) {
        selecttxt = document.getSelection();
    } else if (document.selection) {
        selecttxt = document.selection.createRange().text;
    }
 
    if (selecttxt == '') {
        return false;
    }
    return true;
 
}