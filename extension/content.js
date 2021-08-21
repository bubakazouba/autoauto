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

function getSelectionInfo() {
    function findParentElementOfType(elem, nodeName) {
        while(!!elem) {
            if (elem.nodeName == nodeName) {
                return elem;
            }
            elem = elem.parentElement;
        }
    }
    if (!isTextSelected()) {
        return;
    }
    let elem = document.getSelection().focusNode;
    
    // TODO: Assuming for now that user is always selecting the full text in the node, this will need to change
    // window.getSelection().getRangeAt(0).startContainer.parentNode;
    let listElement = findParentElementOfType(elem, "LI");
    if (!!listElement) {
        return {
            element_node: "LIST",
            item_index: getListItemIndex(listElement),
            element_id: getElementId(listElement.parentElement),
        };
    }
    let tableElement = findParentElementOfType(elem, "TD");
    return {
        element_node: "TABLE",
        item_index: getTableItemIndex(tableElement),
        element_id: getElementId(tableElement.parentElement.parentElement),
    };
}

// TODO(#13): also call this when we user right clicks -> copy
// Call this if user asked to copy text
function getPlaceInClipboardEvent() {
    let selectionInfo = getSelectionInfo();
    if (!selectionInfo) {
        return;
    }
    return {
        type: "PLACE_IN_CLIPBOARD",
        element_id: selectionInfo.element_id,
        element_node: selectionInfo.element_node,
        item_index: selectionInfo.item_index
    };
}

function getClickInfo(e) {
    let elem = e.path[0];
    // TODO: allowlist checkboxes and radio buttons (see how popular implementations make these, bootstrap..etc)
    let elemIsSubmitButton = elem.nodeName == "INPUT" && !!elem.attributes["type"] && elem.attributes["type"].value.toUpperCase() == "SUBMIT";
    if (elemIsSubmitButton || elem.nodeName == "BUTTON") {
        return {
            element_node: "BUTTON",
            element_id: getElementId(elem),
        };
    }
}

document.addEventListener('click', (e) => {
    if (!e.isTrusted) {
        // ignore javascript programmatic clicks
        console.log("click not trusted ignore");
        return;
    }
    let clickInfo = getClickInfo(e);
    if (!clickInfo) {
        return;
    }
    console.log("clickInfo=", clickInfo);
    chrome.runtime.sendMessage({
        event: {
            type: "CLICK",
            element_id: clickInfo.element_id,
            element_node: clickInfo.element_node,
            clickParams: {
                // TODO: maybe fill in later with x,y?
            }
        }
    });
}, true);

document.addEventListener('focusin', function(e) {
    // TODO: i guess we shouldnt be using same function for key presses here
    let elementInfo = getElementInfoForKeyPresses(e);
    if (!elementInfo) {
        return;
    }
    let {element, element_id, element_node} = elementInfo;

    let event = {
        type: "FOCUS",
        element_id: element_id,
        element_node: element_node,
        keyGroupInput: {
            value: element.value,
        }
    };
    console.log(event);

    chrome.runtime.sendMessage({
        event: event
    });
});

document.onkeydown = function(e) {
    let elementInfo = getElementInfoForKeyPresses(e);
    if (!elementInfo) {
        return;
    }
    let {element, element_id, element_node} = elementInfo;

    // If this is a PLACE_IN_CLIPBOARD event (user is copying non text field)
    if (!isElementTextEditable(element) && !areWeInDrive() && keyIsCopy(e)) {
        let event = getPlaceInClipboardEvent();

        if (!!event) {
            chrome.runtime.sendMessage({
                event: event
            });
        }
        return;
    }
    
    // We don't want any text manuvering commands unless we are in drive
    if(textManuveringCommand(e, false) && !areWeInDrive()) {
        return;
    }
    
    let event = getKeyPressEvent(e, element, element_id, element_node);
    
    chrome.runtime.sendMessage({
        event: event
    });
};

function textManuveringCommand(e, isKeyUp) {
    // This captures selections (shift+(alt/cmd)+right/left) and just offset changes (alt/cmd)+right/left
    let c1 = e.key.substring(0,5).toUpperCase() == "ARROW";
    let c2 = e.key == "a" && e.metaKey;
    return c1 || c2;
}

document.addEventListener('selectionchange', (e) => {
    let element = document.activeElement;
    if (!isElementTextEditable(element) || !isTextSelected()) {
        return;
    }

    let event = {
        type: "KEY_GROUP_SELECTION",
        element_id: getElementId(element),
        element_node: element.nodeName,
        keyGroupInput: {
            startOffset: element.selectionStart,
            endOffset: element.selectionEnd,
            value: element.value,
        },
    };
    chrome.runtime.sendMessage({
        event: event
    });
});

function parseList(elementId) {
    let parsedList = [];
    let list = getElementById(elementId);
    for(let li of list.getElementsByTagName('li')) {
        parsedList.push(li.textContent);
    }
    return parsedList;
}

function parseTable(elementId) {
    let table = getElementById(elementId);
    let parsedTable = [];
        let list = getElementById(elementId);
        for(let tr of list.getElementsByTagName('tr')) {
            let parsedRow = [];
            parsedTable.push(parsedRow);
            for(let td of tr.getElementsByTagName('td')) {
                parsedRow.push(td.textContent);
            }
        }
    console.log("i parsed the table=", parsedTable);
    return parsedTable;
}

function putElementInFocus(element_id) {
    let element = getElementById(element_id);
    element.focus();
}

function clickOnElement(element_id) {
    let element = getElementById(element_id);
    element.click();
}
function keyGroupOnElement(element_id, keyGroup) {
    console.log("keyGroupOnElement got called", keyGroup);
    let element = getElementById(element_id);
    let initialValue = element.value;
    let paste = getValueInClipboard();
    let finalValue = "";
    for(let p of keyGroup) {
        if (typeof p == typeof "") {
            console.log("im appending p=", p);
            finalValue += p;
        }
        else {
            let s = "";
            if (p.id == "INITIAL_VALUE") {
                s = initialValue;
            }
            else if (p.id == "PASTE") {
                s = paste;
            }
            let raw_end = p.end == "E" ? s.length : p.end;
            console.log("im appending s=", s, p.start, raw_end, s.substring(p.start, raw_end));
            finalValue += s.substring(p.start, raw_end);
        }
    }
    element.value = finalValue;
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PARSE_LIST") {
        console.log("I was asked to parse list: " + request.params.id);
        parsedList = parseList(request.params.id);
        let index = request.params.index;
        sendResponse({ "text": parsedList[index] });
    } else if (request.action == "PARSE_TABLE") {
        console.log("I was asked to parse table: " + request.params.id);
        parsedTable = parseTable(request.params.id);
        let x = request.params.x;
        let y = request.params.y;
        sendResponse({ "text": parsedTable[y][x] });
    } else if (request.action == "PUT_ELEMENT_IN_FOCUS") {
        console.log("I was asked to put element in focus: " + request.params.id);
        putElementInFocus(request.params.id);
        sendResponse({"event": "DONE"});
    } else if (request.action == "CLICK_ON_ELEMENT") {
        console.log("I was asked to click on element: " + request.params.id);
        clickOnElement(request.params.id);
        sendResponse({"event": "DONE"});
    } else if (request.action == "KEY_GROUP_INPUT") {
        console.log("I was asked to keyGroup on element: " + request.params.id + ", keyGroup=", request.params.keyGroup);
        keyGroupOnElement(request.params.id, request.params.keyGroup);
        sendResponse({"event": "DONE"});
    }
});