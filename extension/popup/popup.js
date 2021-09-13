const REPETITIONS_TEXT_FIELD = document.getElementById('repetitions');

document.getElementById('start').onclick = function() {
    sendMsg({
        type: "USER_PRESSED_START",
        repetitions: REPETITIONS_TEXT_FIELD.value,
    }, getAndUpdateState);
};
document.getElementById('usepaste').onclick = function() {
    sendMsg({ type: "USER_PRESSED_USE_PASTE" }, callbackSetSheetSetting);
};

document.getElementById('useapi').onclick = function() {
    sendMsg({ type: "USER_PRESSED_USE_API" }, callbackSetSheetSetting);
};

['slowmode', 'mediummode', 'quickmode'].forEach(id => {
    document.getElementById(id).onclick = function() {
        ['slowmode', 'mediummode', 'quickmode'].forEach(id => {
            document.getElementById(id).parentNode.className = "btn btn-primary";
        });

        document.getElementById(this.id).parentNode.className = "btn btn-primary active";
        sendMsg({ type: "USER_SELECTED_SPEED_MODE", mode: this.id });
    }
});

document.getElementById('clearsheetsetting').onclick = function() {
    sendMsg({ type: "CLEAR_SHEET_SETTING" }, callbackSetSheetSetting);
};
document.getElementById('haltautomation').onclick = function() {
    sendMsg({ type: "HALT_AUTOMATION" }, () => {
        getAndUpdateState();
    });
};

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
function callbackSetSheetSetting(response) {
    console.log("got response back for callbackSetSheetSetting", response.whatAmIUsingText);
    document.getElementById('usepaste').parentNode.className = "btn btn-primary";
    document.getElementById('useapi').parentNode.className = "btn btn-primary";
    document.getElementById(response.whatAmIUsingText == "API" ? 'useapi' : 'usepaste').parentNode.className += " active";
}

function getAndUpdateState() {
    sendMsg({ type: "GET_POPUP_STATE" }, (response) => {
        console.log("got popupstate", response);
        callbackSetSheetSetting(response);
        if (response.amIAutomating) {
            _showElements(["haltautomation"]);
        } else {
            _hideElements(["haltautomation"]);
        }

        if (response.amisure) {
            _showElements(["modechooser"]);
            _hideElements(["nostarttext"]);
        } else {
            _hideElements(["modechooser"]);
            _showElements(["nostarttext"]);
        }

        if(response.amisure && !response.amIAutomating) {
            _showElements(["repetitionslabel", REPETITIONS_TEXT_FIELD, "start"]);
            REPETITIONS_TEXT_FIELD.focus();
            REPETITIONS_TEXT_FIELD.select();
        }
        else {
            _hideElements(["repetitionslabel", REPETITIONS_TEXT_FIELD, "start"]);
        }
    });
}

// takes elements or ids
function _hideElements(elements) {
    for(let elem of elements) {
        if (typeof elem == 'string') {
            elem = document.getElementById(elem);
        }
        elem.style.display = "none";
    }
}
// takes elements or ids
function _showElements(elements) {
    for(let elem of elements) {
        if (typeof elem == 'string') {
            elem = document.getElementById(elem);
        }
        elem.style.display = "";
    }
}
window.onload = function() {
    getAndUpdateState();
};