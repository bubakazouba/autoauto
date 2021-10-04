const singleton = require('./singleton');

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

// Should be able to copy images/links/formatting too
function copy(text) {
    //Create a textbox field where we can insert text to. 
    var copyFrom = document.createElement("textarea");

    //Set the text content to be the text you wished to copy.
    copyFrom.textContent = text;

    //Append the textbox field into the body as a child. 
    //"execCommand()" only works when there exists selected text, and the text is inside 
    //document.body (meaning the text is part of a valid rendered HTML element).
    document.body.appendChild(copyFrom);

    //Select all the text!
    copyFrom.select();

    //Execute command
    document.execCommand('copy');

    //(Optional) De-select the text using blur(). 
    copyFrom.blur();

    //Remove the textbox field from the document.body, so no other JavaScript nor 
    //other elements can get access to this.
    document.body.removeChild(copyFrom);

    return true;
}

function keyParamsToString(keyParams) {
    let keyName = keyParams.key;
    if (keyParams.metaKey) {
        keyName = "cmd+" + keyName;
    }
    if (keyParams.ctrlKey) {
        keyName = "ctrl+" + keyName;
    }
    if (keyParams.shiftKey) {
        keyName = "shift+" + keyName;
    }
    if (keyParams.altKey) {
        keyName = "alt+" + keyName;
    }

    return "key=" + keyName;
}

function _pprint(msg) {
    if (!msg.event) {
        return JSON.stringify(msg);
    }
    if (msg.event.type == "KEYBOARD") {
        return keyParamsToString(msg.event.keyParams);
    } else {
        return JSON.stringify(msg.event);
    }
}

function pprint(msg, tabIndex) {
    return _pprint(msg) + ", tab=" + tabIndex;
}

function setSecondaryClipboard(text) {
    singleton.setClipboard(text);
}

function getSecondaryClipboard() {
    return singleton.getClipboard();
}

module.exports = {
    getValueInClipboard: getValueInClipboard,
    copy: copy,
    keyParamsToString: keyParamsToString,
    pprint: pprint,
    setSecondaryClipboard,
    getSecondaryClipboard,
};