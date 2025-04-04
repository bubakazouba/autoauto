const html2canvas = require('html2canvas');
const Compressor = require("compressorjs");
const contentutils = require("./contentutils.js");
const automation = require("./automation.js");


// document.addEventListener("onready", (e) => {
//     fetchCurrentSheetAsCSV()
//         .then(csv => {
//             let event = {
//                 type: "PAGE_DATA",
//                 data: csv,
//             };
//             chrome.runtime.sendMessage({
//                 event: event
//             });
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// });

document.addEventListener("change", (e) => {
    if (!e.isTrusted) {
        // ignore javascript programmatic clicks
        console.log("click not trusted ignore");
        return;
    }
    let element = e.composedPath()[0];
    if (element.nodeName != "INPUT" || element.type.toLowerCase() != "checkbox") {
        return;
    }
    let event = {
        type: "CLICK",
        element_id: contentutils.getElementId(element),
        element_node: "CHECKBOX",
    };
    console.log("changeEvent=", event);
    chrome.runtime.sendMessage({
        event: event
    });
});
document.addEventListener('click', (e) => {
    if (!e.isTrusted) {
        // ignore javascript programmatic clicks
        return;
    }
    function _isElemAButton(elem) {
        let elemIsSubmitButton = elem.nodeName == "INPUT" && !!elem.attributes["type"] && elem.attributes["type"].value.toUpperCase() == "SUBMIT";
        return elemIsSubmitButton || elem.nodeName == "BUTTON";
    }
    function _isElemClickable(elem) {
        let elemHasClickHandler = false; // TODO: implement this
        // TODO: allowlist checkboxes and radio buttons (see how popular implementations make these, bootstrap..etc)
        return _isElemAButton(elem) || elem.nodeName == "A" || elemHasClickHandler;
    }
    let elem;
    let elemIsClickable = false;
    // walk down the parents of the element until we find one thats clickable (if any)
    const path = e.composedPath();
    for (let i = 0; i < path.length; i++) {
        elem = path[i];
        elemIsClickable = _isElemClickable(elem);
        if (elemIsClickable) {
            break;
        }
    }
    if (elemIsClickable) {
        chrome.runtime.sendMessage({
            event: {
                type: "CLICK",
                element_id: contentutils.getElementId(elem),
                element_node: _isElemAButton(elem) ? "BUTTON" : elem.nodeName,
            }
        });
    }

    if (contentutils.areWeInSpreadsheets()) {
        const PASTE_TEXT = "PASTE⌘V";
        const RAW_PASTE_TEXT = 'PASTE VALUES ONLY⌘+SHIFT+V';
        const _getText = function(elem) {
            if (["goog-menuitem apps-menuitem", "goog-menuitem-content"].indexOf(elem.className) != -1) {
                return elem.textContent;
            } else if (["goog-menuitem-label", "goog-menuitem-accel", "docs-icon goog-inline-block goog-menuitem-icon"].indexOf(elem.className) != -1) {
                return elem.parentElement.textContent;
            } else if (["docs-icon-img-container docs-icon-img docs-icon-paste"].indexOf(elem.className) != -1) {
                return PASTE_TEXT;
            }
        };
        let elemText = _getText(e.composedPath()[0]);
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
                    }
                });
            }
        }
        // TODO: also check if user was holding shift and report what cell range is selected in the sheet
        // else {
        //     console.log("reporting normal click on a cell in the sheet");
        //     chrome.runtime.sendMessage({
        //         event: {
        //             type: "click",
        //             element_id: getElementIdWithCellInfo(),
        //         }
        //     })
        // }
    }
}, true);

document.addEventListener('focusin', function(e) {
    // TODO: i guess we shouldnt be using same function for key presses here
    if (contentutils.areWeInSpreadsheets()) {
        return;
    }
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
        console.log(">> keydown got nothing from getElementInfoForKeyPresses returning early");
        return;
    }
    let { element, element_id, element_node } = elementInfo;
    // if (contentutils.areWeInSpreadsheets()) {
    //     return handleSheetsKeyDown(e);
    // }

    // Copy and Pastes are handled in 'copy' and 'paste' event listeners
    // if (contentutils.keyIsCopy(e) || contentutils.keyIsPaste(e)) {
    //     return;
    // }

    // We are not interesting in  any text manuvering commands
    if (isTextManuveringCommand(e, false)) {
        return;
    }

    let event = contentutils.getKeyPressEvent(e, element, element_id, element_node);
    if (["meta", "shift", "ctrl", "alt"].includes(event.keyParams.key.toLowerCase())) {
        // we will assume users are just interested in pairing this with the next key so this will get caught later
        return;
    }
    if(event.keyParams.key.toLowerCase().startsWith("arrow")) {
        return;
    }
    event = transformKeyEvent(event);
    if (contentutils.areWeInSpreadsheets()) {
        event.element_id = document.getElementById("t-name-box").value;
    }

    chrome.runtime.sendMessage({
        event: event
    });
});

function getElementIdWithCellInfo() {
    return document.getElementById("t-name-box").value;
}

function isTextManuveringCommand(e) {
    // This captures selections (shift+(alt/cmd)+right/left) and just offset changes (alt/cmd)+right/left
    let c1 = e.key.toUpperCase().startsWith("ARROW");
    let c2 = e.key == "a" && e[contentutils.getModifierKey()];
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


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PLACE_IN_CLIPBOARD") {
        automation.placeElementInClipboard(request.params.id).then(text => {
            console.log("I was asked to place element in clipboard element_id: " + request.params.id + "I placed in clipboard: '" + text + "'");
            sendResponse({ "text": text });
        });
    } else if (request.action == "CLICK_ON_ELEMENT") {
        console.log("I was asked to click on element: " + request.params.id);
        automation.clickOnElement(request.params.id);
        sendResponse({ "event": "DONE" });
    } else if (request.action == "KEY_GROUP_INPUT") {
        console.log("I was asked to keyGroup on element: " + request.params.id + ", keyGroup=", request.params.keyGroup);
        console.log("areWeInSpreadsheets =", contentutils.areWeInSpreadsheets());
        if (contentutils.areWeInSpreadsheets()) { // TODO there should be no need to copy and paste
            contentutils.copy(request.params.keyGroup);
            automation.handleSheetsPaste(request.params.id).then(() => {
                sendResponse({ "event": "DONE" });
            });
        } else {
            automation.keyGroupOnElement(request.params.id, request.params.keyGroup).then(() => {
                sendResponse({ "event": "DONE" });
            });
        }
    } else if (request.action == "SHEETS_PASTE") {
        console.log("I was asked to paste on element: " + request.params.id);
        automation.handleSheetsPaste(request.params.id).then(() => {
            sendResponse({ "event": "DONE" });
        });
    } else if (request.action == "TAKE_SCREENSHOT") {
        takeScreenshotNewCompression().then((screenshot) => {
            sendResponse({ "screenshot": screenshot });
        });
    } else if (request.action == "GET_PAGE_DATA") {
        if(contentutils.areWeInSpreadsheets()) {
            fetchCurrentSheetAsCSV()
                .then(csv => {
                    sendResponse({ "data": csv });
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        } else {
            // TODO: get the DOM?
        }
    }
    // Return true to signal that we will sendResponse asynchronously
    return true;
});

/**
 * Fetches the current Google Sheet tab as a CSV string
 * @returns {Promise<string>} - Promise that resolves to CSV string
 */
function fetchCurrentSheetAsCSV() {
    // Function to extract sheet ID from URL
    function getSheetIdFromUrl(url) {
        const regex = /\/d\/([a-zA-Z0-9-_]+)/;
        const match = url.match(regex);

        if (match && match[1]) {
            return match[1];
        }

        throw new Error('Invalid Google Sheets URL: Could not extract sheet ID');
    }

    // Function to extract gid (tab ID) from URL
    function getGidFromUrl(url) {
        // Try to match gid in the URL query parameters or hash
        const gidRegex = /[?#&]gid=(\d+)/;
        const match = url.match(gidRegex);

        // Return the gid if found, otherwise return 0 (first sheet)
        return match && match[1] ? match[1] : '0';
    }

    return new Promise((resolve, reject) => {
        try {
            // Get the current URL
            const currentUrl = window.location.href;

            // Extract the sheet ID and gid (tab ID) from the current URL
            const sheetId = getSheetIdFromUrl(currentUrl);
            const gid = getGidFromUrl(currentUrl);

            // Create the export URL with the specific tab (gid)
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

            fetch(sheetUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(csvData => {
                    resolve(csvData);
                })
                .catch(error => {
                    reject(error);
                });
        } catch (error) {
            reject(error);
        }
    });
}

function takeScreenshotNewCompression(scale=1, quality=0.6) {
    return new Promise(resolve => {
        html2canvas(document.querySelector("body"), { scale: scale }).then(canvas => {
            canvas.toBlob(blob => {
                new Compressor(blob, {
                    quality: quality,
                    success(compressedBlob) {
                        let url = URL.createObjectURL(compressedBlob);
                        let a = document.createElement('a');
                        a.href = url;
                        a.download = 'compressed new.jpg';
                        a.click();
                        resolve(url);
                    }
                });
            }, "image/jpeg");
        });
    });
}


function transformKeyEvent(data) {
    // Create a deep copy of the data
    const result = JSON.parse(JSON.stringify(data));
    const { key, shiftKey, ctrlKey, metaKey, altKey } = result.keyParams;

    // Create an array of active modifiers
    const modifiers = [];
    if (shiftKey) modifiers.push('shift');
    if (ctrlKey) modifiers.push('ctrl');
    if (metaKey) modifiers.push('meta');
    if (altKey) modifiers.push('alt');

    // Combine modifiers and key into a single string
    const keyString = [...modifiers, key.toLowerCase()].join('+');

    // Replace keyParams with keyString
    result.keyString = keyString;
    delete result.keyParams;
    return result;
}