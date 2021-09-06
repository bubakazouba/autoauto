const contentutils = require("./contentutils.js");
const automation = require("./automation.js");

const SHEET_ELEM_NODE = "SHEET";
const SHEET_ELEM_ID = "0"; // It has to be a number

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
        element_id: contentutils.getElementId(element),
        element_node: "CHECKBOX",
    };
    console.log("clickEvent=", event);
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
    let elem = e.path[0];
    // TODO: allowlist checkboxes and radio buttons (see how popular implementations make these, bootstrap..etc)
    let elemIsSubmitButton = elem.nodeName == "INPUT" && !!elem.attributes["type"] && elem.attributes["type"].value.toUpperCase() == "SUBMIT";
    let elemIsAnyTypeOfButton = elemIsSubmitButton || elem.nodeName == "BUTTON";
    
    if (elemIsAnyTypeOfButton) {
        chrome.runtime.sendMessage({
            event: {
                type: "CLICK",
                element_id: contentutils.getElementId(elem),
                element_node: "BUTTON",
            }
        });
    }

    if (contentutils.areWeInSpreadsheets()) {
        const PASTE_TEXT = "PASTE⌘V";
        const RAW_PASTE_TEXT = "PASTE⌘+SHIFT+V";
        const _getText = function(elem) {
            if (["goog-menuitem apps-menuitem", "goog-menuitem-content"].indexOf(elem.className) != -1) {
                return elem.textContent;
            }
            else if (["goog-menuitem-label", "goog-menuitem-accel", "docs-icon goog-inline-block goog-menuitem-icon"].indexOf(elem.className) != -1) {
                return elem.parentElement.textContent;
            }
            else if (["docs-icon-img-container docs-icon-img docs-icon-paste"].indexOf(elem.className) != -1) {
                return PASTE_TEXT;
            }
        };
        let elemText = _getText(e.path[0]);
        if (!!elemText) {
            let actionType;
            if (elemText.toUpperCase() == PASTE_TEXT || elemText.toUpperCase() == RAW_PASTE_TEXT) {
                actionType = "SHEETS_PASTE";
            }
            if (!!actionType) {
                chrome.runtime.sendMessage({
                    event: {
                        type: actionType,
                        element_id: getElementIdWithCellInfo(),
                        element_node: SHEET_ELEM_NODE,
                    }
                });
            }
        }
    }
}, true);

document.addEventListener('focusin', function(e) {
    // TODO: i guess we shouldnt be using same function for key presses here
    let elementInfo = contentutils.getElementInfoForKeyPresses(e);
    if (!elementInfo) {
        return;
    }
    let { element, element_id, element_node } = elementInfo;

    let event = {
        type: "FOCUS",
        element_id: element_id,
        element_node: element_node,
        keyGroupInput: {
            value: element.value,
        }
    };
    console.log();

    chrome.runtime.sendMessage({
        event: event
    });
});

document.addEventListener("keydown", e => {
    let elementInfo = contentutils.getElementInfoForKeyPresses(e);
    if (!elementInfo) {
        return;
    }
    let { element, element_id, element_node } = elementInfo;
    if (contentutils.areWeInSpreadsheets()) {
        return handleSheetsKeyDown(e);
    }

    // Copy and Pastes are handled in 'copy' and 'paste' event listeners
    if (contentutils.keyIsCopy(e) || contentutils.keyIsPaste(e)) {
        return;
    }
    
    // We are not interesting in  any text manuvering commands
    if(isTextManuveringCommand(e, false)) {
        return;
    }
    
    let event = contentutils.getKeyPressEvent(e, element, element_id, element_node);
    
    chrome.runtime.sendMessage({
        event: event
    });
});

function getElementIdWithCellInfo() {
    let element_id = SHEET_ELEM_ID;
    let activeCell = document.getElementById("t-name-box").value;
    return element_id + "." + contentutils.cellToColAndRow(activeCell);
}

function handleSheetsKeyDown(e) {
    let isPaste = (e.key == "v" && contentutils.getModifierKey(e)) || (e.key == "v" && contentutils.getModifierKey(e) && e.shiftKey);
    if (!isPaste) {
        return;
    }

    let event = {
        type: "SHEETS_PASTE",
        element_id: getElementIdWithCellInfo(),
        element_node: SHEET_ELEM_NODE,
    };

    chrome.runtime.sendMessage({
        event: event
    });
}

function isTextManuveringCommand(e) {
    // This captures selections (shift+(alt/cmd)+right/left) and just offset changes (alt/cmd)+right/left
    let c1 = e.key.substring(0, 5).toUpperCase() == "ARROW";
    let c2 = e.key == "a" && contentutils.getModifierKey(e);
    return c1 || c2;
}

window.addEventListener('beforeunload', function() {
    chrome.runtime.sendMessage({
        event: {
            type: "UNLOAD",
            element_id: "NA",
            element_node: "NA",
        },
    });
});

document.addEventListener('selectionchange', () => {
    let element = document.activeElement;
    if (!contentutils.isElementTextEditable(element) || !contentutils.isTextSelected()) {
        return;
    }

    let event = {
        type: "KEY_GROUP_SELECTION",
        element_id: contentutils.getElementId(element),
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

document.addEventListener('copy', e => {
    let elem = e.path[0];
    let element_id = contentutils.getElementId(elem);
    let element_node = elem.nodeName;
    if (contentutils.areWeInSpreadsheets()) {
        element_id = getElementIdWithCellInfo();
        element_node = SHEET_ELEM_NODE;
    }
    let event = {
        type: "PLACE_IN_CLIPBOARD",
        element_id: element_id,
        element_node: element_node,
    };
    chrome.runtime.sendMessage({
        event: event
    });
});

document.addEventListener('paste', e => {
    // We don't want to handle sheets paste here, since we want to differentiate between paste and raw paste
    if (contentutils.areWeInSpreadsheets()) {
        return;
    }
    let elem = e.path[0];
    // Not sure how this would happen but better be safe
    if (!contentutils.isElementTextEditable(elem)) {
        return;
    }
    contentutils.getValueInClipboard().then(clipboard => {
        let event = {
            type: "KEY_GROUP_PASTE",
            element_id: contentutils.getElementId(elem),
            element_node: elem.nodeName,
            keyGroupInput: {
                startOffset: elem.selectionStart,
                value: elem.value,
                clipboard: clipboard,
            },
        };
        chrome.runtime.sendMessage({
            event: event
        });
    });
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PLACE_IN_CLIPBOARD") {
        console.log("I was asked to place element in clipboard element_id: " + request.params.id);
        automation.placeElementInClipboard(request.params.id).then(text => {
            sendResponse({ "text": text });
        });
    }
    else if (request.action == "CLICK_ON_ELEMENT") {
        console.log("I was asked to click on element: " + request.params.id);
        automation.clickOnElement(request.params.id);
        sendResponse({ "event": "DONE" });
    }
    else if (request.action == "KEY_GROUP_INPUT") {
        console.log("I was asked to keyGroup on element: " + request.params.id + ", keyGroup=", request.params.keyGroup);
        automation.keyGroupOnElement(request.params.id, request.params.keyGroup).then(() => {
            sendResponse({ "event": "DONE" });
        });
    }
    else if (request.action == "SHEETS_PASTE") {
        console.log("I was asked to paste on element: " + request.params.id);
        automation.handleSheetsPaste(request.params.id, request.params.userSheetSetting).then(() => {
            sendResponse({ "event": "DONE" });
        });
    }
});