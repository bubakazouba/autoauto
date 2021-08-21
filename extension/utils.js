function keyGroupInput(message) {
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let keyGroup = message.event.keyGroup;
    let request = { action: 'KEY_GROUP_INPUT', params: { id: element_id, keyGroup: keyGroup } };
    console.log("request=", request, "tab_id=", tab_id);
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        
    });
}

function clickOnElement(message) {
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let request = { action: 'CLICK_ON_ELEMENT', params: { id: element_id } };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        
    });
}

function putElementInFocus(message) {
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
    
    let request = { action: 'PLACE_IN_CLIPBOARD', params: { id: element_id} };
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        console.log("[placeInClipboard] got back from content script", response.text);
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