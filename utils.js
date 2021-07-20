function clickOnElement(message){
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let request = { action: 'CLICK_ON_ELEMENT', params: { id: element_id } };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        
    });
}

function putElementInFocus(message){
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let request = { action: 'PUT_ELEMENT_IN_FOCUS', params: { id: element_id } };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        
    });
}

function placeInClipboard(message) {
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    console.log("[placeInClipboard] element_id=" + element_id);
    if (message.event.element_type == "LIST") {
        let item_index = message.event.item_index;
        chrome.tabs.update(tab_id, { selected: true });
        parseList(element_id, tab_id, item_index);
    }
    else if (message.event.element_type == "TABLE") {
        let x = message.event.item_index[0];
        let y = message.event.item_index[1];
        chrome.tabs.update(tab_id, { selected: true });
        parseTable(element_id, tab_id, x, y);
    }
}

function parseList(element_id, tab_id, index) {
    let request = { action: 'PARSE_LIST', params: { id: element_id, index: index } };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        console.log("[placeInClipboard] got back parsed list from content script", response.text);
        _copy(response.text);
    });
}

function parseTable(element_id, tab_id, x, y) {
    let request = { action: 'PARSE_TABLE', params: { id: element_id, x: x, y: y } };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        console.log("[placeInClipboard] got back parsed text from content script", response.text);
        _copy(response.text);
    });
}

function keyParamsToString(keyParams) {
    let keyName = keyParams.key;
    if (keyParams.metaKey) {
        keyName = "cmd+" + keyName
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
    if(!msg.event) {
        return JSON.stringify(msg);
    }
    if (msg.event.type == "KEYBOARD") {
        return keyParamsToString(msg.event.keyParams);
    }
    else {
        return JSON.stringify(msg.event);
    }
}

function pprint(msg, tabIndex) {
     return _pprint(msg) + ", tab=" + tabIndex;
}

// function _copy(str, mimeType) {
//   document.oncopy = function(event) {
//     event.clipboardData.setData("plain/text", str);
//     event.preventDefault();
//   };
//   document.execCommand("copy", false, null);
// }

function _copy(text) {
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
}