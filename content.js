const FIELDS = ["code", "key", "keyCode", "shiftKey", "ctrlKey", "metaKey", "altKey", "which"];

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
            return "";
        }
        // TODO: evaluate children vs childNodes
        for(let i = 0; i < elem.parentElement.childNodes.length; i++) {
            if (elem.parentElement.childNodes[i] == elem) {
                return getElementIndex(elem.parentElement) + "" + i;
            }
        }
    }
    return getElementIndex(element);
}
function getClickParams(e) {
    for (let elem of e.path) {
        if (elem.nodeName == "LI") {
            return {
                "type": "click",
                "element_type": "LIST",
                "item_index": getListItemIndex(elem),
                "element_id": getElementId(elem.parentElement)
            };
        }
    }

    for (let elem of e.path) {
        if (elem.nodeName == "TD") {
            return {
                "type": "click",
                "element_type": "TABLE",
                "item_index": getTableItemIndex(elem),
                "element_id": getElementId(elem.parentElement.parentElement)
            };
        }
    }

    let elem = e.path[0];
    let elemIsSubmitButton = elem.nodeName == "INPUT" && !!elem.attributes["type"] && elem.attributes["type"].value.toUpperCase() == "SUBMIT";
    if (elemIsSubmitButton || elem.nodeName == "BUTTON") {
        return {
            "type": "click",
            "element_type": "BUTTON",
            "element_id": getElementId(elem),
        };
    }
}
document.addEventListener('click', (e) => {
    let clickParams = getClickParams(e);
    if (!clickParams) {
        return;
    }
    console.log("clickParams=", clickParams);
    chrome.runtime.sendMessage({
        event: {
            type: "MOUSE_CLICK",
            clickParams: clickParams,
        }
    });
}, true);

document.onkeydown = function(e) {
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
            keyParams: keyParams
        }
    });
};

function parseList(listId) {
    let list = getElementId(listId);
    return ["1.", "2.", "3.", "4.", "5.", "6."];
}

function parseTable(tableId) {
    let table = getElementId(tableId);
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