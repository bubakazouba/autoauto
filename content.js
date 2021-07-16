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
        if (tableRows[i] == td) {
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
    if (!window.elementsMap) {
        window.elementsMap = {};
    }
    for (let [id, storedElement] of Object.entries(window.elementsMap)) {
        if (storedElement == element) {
            return id;
        }
    }
    let id = generateId();
    window.elementsMap[id] = element;
    return id;
}
function getClickParams(e) {
    for (let elem of e.path) {
        if (elem.nodeName == "LI") {
            return {
                "type": "click",
                "list_item_index": getListItemIndex(elem),
                "list": getElementId(elem.parentElement)
            };
        }
    }

    for (let elem of e.path) {
        if (elem.nodeName == "TD") {
            return {
                "type": "click",
                "table_item_index": getTableItemIndex(elem),
                "table": getElementId(elem.parentElement.parentElement)
            };
        }
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