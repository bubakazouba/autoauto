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
    if (!isElementTextEditable(element) && !areWeInDrive()) {
        if (!keyIsCopy(e)) {
            return;
        }
    }
    // TODO: reconcile key ignoring logic (rn its fragmented here,backgorund.js and actionsgrouper.py)
    // User is just switching tabs, unfortunately key gets reported on a text editable element if its active
    if(!!e.code && e.code.startsWith("Digit") && e.metaKey) {
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
            // TODO: only send clipboard if this action is a paste
            clipboard: keyIsPaste(e) ? getValueInClipboard() : undefined,
        }
    }
    else {
        event.type = "KEYBOARD";
    }
    event.keyParams = {};
    const FIELDS = ["code", "key", "keyCode", "shiftKey", "ctrlKey", "metaKey", "altKey", "which"];
    for (f of FIELDS) {
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
    return e.key.toUpperCase() == "C" && e.metaKey;
}

function keyIsPaste(e) {
    if (!e.key) {
        return false;
    }
    return e.key.toUpperCase() == "V" && e.metaKey;
}

function getValueInClipboard() {
    let elementInFocus = document.activeElement;
    //Create a textbox field where we can insert text to. 
    var getClipboardFrom = document.createElement("textarea");

    //Append the textbox field into the body as a child. 
    //"execCommand()" only works when there exists selected text, and the text is inside 
    //document.body (meaning the text is part of a valid rendered HTML element).
    document.body.appendChild(getClipboardFrom);
    getClipboardFrom.focus();
    //Execute command
    document.execCommand('paste');

    let text = getClipboardFrom.value;

    //Remove the textbox field from the document.body, so no other JavaScript nor 
    //other elements can get access to this.
    document.body.removeChild(getClipboardFrom);

    elementInFocus.focus();
    return text;
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
    } else if (document.getSelection) {
        if (!document.getSelection().isCollapsed) {
            selecttxt = document.getSelection().baseNode.textContent;
        }
    } else if (document.selection) {
        selecttxt = document.selection.createRange().text;
    }
 
    if (selecttxt == '') {
        return false;
    }
    return true;
}

function areWeInDrive() {
    return window.location.origin == "https://docs.google.com";
}