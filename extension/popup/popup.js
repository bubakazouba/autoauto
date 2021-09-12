const REPITITIONS_TEXT_FIELD = document.getElementById('repitions');

document.getElementById('start').onclick = function() {
    sendMsg({
        type: "USER_PRESSED_START",
        repitions: REPITITIONS_TEXT_FIELD.value,
    });
};
document.getElementById('usepaste').onclick = function() {
    sendMsg({ type: "USER_PRESSED_USE_PASTE" }, callbackSetSheetSetting);
};

document.getElementById('useapi').onclick = function() {
    sendMsg({ type: "USER_PRESSED_USE_API" }, callbackSetSheetSetting);
};

document.getElementById('slowmode').onclick = document.getElementById('mediummode').onclick = document.getElementById('quickmode').onclick = function() {
    document.getElementById('slowmode').parentNode.className = "btn btn-primary";
    document.getElementById('mediummode').parentNode.className = "btn btn-primary";
    document.getElementById('quickmode').parentNode.className = "btn btn-primary";

    document.getElementById(this.id).parentNode.className = "btn btn-primary active";
    sendMsg({ type: "USER_SELECTED_SPEED_MODE", mode: this.id });
}

document.getElementById('clearsheetsetting').onclick = function() {
    sendMsg({ type: "CLEAR_SHEET_SETTING" }, callbackSetSheetSetting);
};
document.getElementById('haltautomation').onclick = function() {
    sendMsg({ type: "HALT_AUTOMATION" }, () => {
        getAndUpdateState();
    });
};
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     console.log("popup got some stuff back", request);
//     if (request.action == "WHATAMIUSING") {
//         document.getElementById("whatamiusing").textContent = request.text;
//     }
// });

function sendMsg(event, callback) {
    if (!callback) {
        callback = (response) => {
            console.log("Response: ", response);
        };
    }
    chrome.runtime.sendMessage({
        event: event
    }, callback);
}

// either "API" or "PASTE"
function callbackSetSheetSetting(response, whatAmIUsingText) {
    if (!whatAmIUsingText) {
        whatAmIUsingText = response.text;
    }
    console.log("got response back for callbackSetSheetSetting", whatAmIUsingText);
    document.getElementById('usepaste').parentNode.className = "btn btn-primary";
    document.getElementById('useapi').parentNode.className = "btn btn-primary";
    document.getElementById(whatAmIUsingText == "API" ? 'useapi' : 'usepaste').parentNode.className += " active";
}

function getAndUpdateState() {
    sendMsg({ type: "GET_POPUP_STATE" }, (response) => {
        console.log("got popupstate", response);
        callbackSetSheetSetting(null, response.whatAmIUsingText);
        if (response.amiwaiting) {
            document.getElementById("haltautomation").style.display = "";
            document.getElementById("start").style.display = "none";
        }
        else {
            document.getElementById("haltautomation").style.display = "none";
            document.getElementById("start").style.display = "";
        }
    });
}

window.onload = function() {
    REPITITIONS_TEXT_FIELD.focus();
    REPITITIONS_TEXT_FIELD.select();
    getAndUpdateState();
};