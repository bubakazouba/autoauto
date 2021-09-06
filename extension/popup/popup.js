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

document.getElementById('clearsheetsetting').onclick = function() {
    sendMsg({ type: "CLEAR_SHEET_SETTING" }, callbackSetSheetSetting);
};
document.getElementById('haltautomation').onclick = function() {
    sendMsg({ type: "HALT_AUTOMATION" });
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
function callbackSetSheetSetting(response) {
    console.log("got response back for callbackSetSheetSetting", response);
    document.getElementById("whatamiusing").textContent = response.text;
}

window.onload = function() {
    REPITITIONS_TEXT_FIELD.focus();
    REPITITIONS_TEXT_FIELD.select();

    // TODO: ideally this would just run once, but this runs once each time user opens popup
    sendMsg({ type: "GET_WHAT_AM_I_USING" }, callbackSetSheetSetting);
}