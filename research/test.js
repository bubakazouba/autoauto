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
----------
// testing spreadsheets inputting
eEnter = document.createEvent("Event");
eEnter.initEvent("keydown", true, false);
eEnter.keyCode = 13; //105
eEnter.key = "Enter"
document.getElementsByClassName("cell-input")[0].dispatchEvent(eEnter)


var eEnter = new KeyboardEvent("keydown", {bubbles : true, cancelable : true, key : "Enter", code: "Enter", keyCode: 13, shiftKey: false});
var eEnterPress = new KeyboardEvent("keypress", {bubbles : true, cancelable : true, key : "Enter", code: "Enter", keyCode: 13, shiftKey: false});
var eEnterUp = new KeyboardEvent("keyup", {bubbles : true, cancelable : true, key : "Enter", code: "Enter", keyCode: 13, shiftKey: false});

var eEscape = new KeyboardEvent("keydown", {bubbles : true, cancelable : true, key : "Escape", code: "Escape", keyCode: 27, shiftKey: false});
var eEscapeUp = new KeyboardEvent("keyup", {bubbles : true, cancelable : true, key : "Escape", code: "Escape", keyCode: 27, shiftKey: false});

document.getElementsByClassName("cell-input")[1].dispatchEvent(eEnter); // Doesnt work
document.getElementsByClassName("cell-input")[1].dispatchEvent(eEnterUp); // Doesnt work
document.getElementsByClassName("cell-input")[1].dispatchEvent(eEnterPress); // Doesnt work

document.getElementsByClassName("cell-input")[1].dispatchEvent(eEscape) // This works!
document.getElementsByClassName("cell-input")[1].dispatchEvent(eH) // Doesnt work

var eH = new KeyboardEvent("keydown", {bubbles : true, cancelable : true, key : "h", code: "KeyH", keyCode: 72, shiftKey: false});
//////
eTry = document.createEvent("KeyboardEvent")
// eTry.initKeyEvent(type, bubbles, cancelable, viewArg, 
//        ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg, 
//            keyCodeArg, charCodeArg)
// eTry.initKeyEvent("keypress", true, true, null, false, false, false, false, 72, 72);
eTry.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, 72, 72);
eTry.keyCodeVal = 72;
document.getElementsByClassName("cell-input")[1].dispatchEvent(eTry)