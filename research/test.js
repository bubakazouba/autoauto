//105: i
//49: 1
//13: enter
window.dispatchEvent(new KeyboardEvent("keydown", {
    "code": "Digit1",
    "key": "1",
    "keyCode": 49,
    "shiftKey": false,
    "ctrlKey": false,
    "metaKey": false,
    "altKey": false
}));

const input = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;
    
// Insert the character in the document and trigger the save API call
const eventObj = document.createEvent("Event");
eventObj.initEvent("keydown", true, true);
eventObj.keyCode = 13; //105
input.dispatchEvent(eventObj);
--------
const input = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;
    
// Insert the character in the document and trigger the save API call
const eventObj = document.createEvent("Event");
eventObj.initEvent("keypress", true, true);
eventObj.keyCode = 105;
input.dispatchEvent(eventObj);