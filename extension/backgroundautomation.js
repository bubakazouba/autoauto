function sheetsPaste(message) {
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let request = { action: 'SHEETS_PASTE', params: { id: element_id} };
    console.log("PASTE request=", request, "tab_id=", tab_id);
    chrome.tabs.sendMessage(tab_id, request, function(response) {
        
    });
}

function keyGroupInput(message) {
    let element_id = message.event.element_id;
    let tab_id = message.event.tab_id;
    let keyGroup = message.event.keyGroup;
    let request = { action: 'KEY_GROUP_INPUT', params: { id: element_id, keyGroup: keyGroup } };
    console.log("keyGroupInput request=", request, "tab_id=", tab_id);
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
        console.log("[placeInClipboard] got back from content script", response);
    });
}