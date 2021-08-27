function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    return chrome.tabs.query(queryOptions);
}

function getSelectionInfo() {
    if (!isTextSelected()) {
        return;
    }
    // TODO: this doesnt work on text input
    let elem = window.getSelection().anchorNode.parentElement;
    return {
        element_id: getElementId(elem),
        element_node: elem.nodeName,
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
        element_node: selectionInfo.element_node
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
document.addEventListener("change", (e) => {
    if (!e.isTrusted) {
        // ignore javascript programmatic clicks
        console.log("click not trusted ignore");
        return;
    }
    let element = e.path[0];
    if (element.nodeName != "INPUT" || element.type.toLowerCase() != "checkbox") {
        return;
    }
    let event = {
        type: "CLICK",
        element_id: getElementId(element),
        element_node: "CHECKBOX",
    };
    console.log("checkInfo=", event);
    chrome.runtime.sendMessage({
        event: event
    });
});
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
    if(isTextManuveringCommand(e, false) && !areWeInDrive()) {
        return;
    }

    if (areWeInDrive()) {
        return handleDriveKeyDown(e, element_id, element_node);
    }
    
    let event = getKeyPressEvent(e, element, element_id, element_node);
    
    chrome.runtime.sendMessage({
        event: event
    });
};

function handleDriveKeyDown(e, element_id, element_node) {
    console.log("we are in handleDriveKeyDown");
    if (!areWeInSpreadsheets()) {
        return;
    }
    let isCopy = e.key == "c" && e.metaKey;
    let isPaste = e.key == "v" && e.metaKey;
    if (!isCopy && !isPaste) {
        console.log("not copy and not paste");
        return;
    }
    let activeCell = document.getElementById("t-name-box").value;
    let element_id_with_cell_info = element_id + "." + cellToColAndRow(activeCell);

    let event = {
        type: isCopy ? "PLACE_IN_CLIPBOARD" : "SHEETS_PASTE",
        element_id: element_id_with_cell_info,
        element_node: element_node,
    };

    chrome.runtime.sendMessage({
        event: event
    });
}

function isTextManuveringCommand(e, isKeyUp) {
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PLACE_IN_CLIPBOARD") {
        console.log("I was asked to place element in clipboard element_id: " + request.params.id);
        let text = placeElementInClipboard(request.params.id);
        sendResponse({ "text": text });
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
    } else if (request.action == "SHEETS_PASTE") {
        console.log("I was asked to paste on element: " + request.params.id);
        handleSheetsPaste(request.params.id, request.params.cell);
        sendResponse({"event": "DONE"});
    }
});