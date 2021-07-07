const FIELDS = ["code","key","keyCode","shiftKey","ctrlKey","metaKey","altKey","which"];
function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  return chrome.tabs.query(queryOptions);
}
document.onkeydown = function(e) {
  if (!e.isTrusted) {
    console.log("not trusted ignore");
    return;
  }
  let m = {};
  for (f of FIELDS) {
    m[f] = e[f];
  }
  console.log(e);

  chrome.runtime.sendMessage({text: m}, function(response) {
      console.log("Response: ", response);
  });
};
chrome.runtime.onMessage.addListener(function (response, sendResponse) {
    console.log("got this response:::", response);
    dispatchSetOfKeys(response);
});

function dispatchSetOfKeys(setOfKeysToDispatch) {
    for (key of setOfKeysToDispatch.map(e => e.action.keyParams)) {
        let eventType = "keydown";
        if ([13,37,38,39,40,16,91,18,8,9,20,27].indexOf() != -1) {
          eventType = "keypress";
        }
        // const input = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;
            
        // Insert the character in the document and trigger the save API call
        const eventObj = document.createEvent("Event");
        eventObj.initEvent(eventType, true, true);
        for (f of FIELDS) {
          eventObj[f] = key[f];
          // eventObj.keyCode = 105;
        }
        input.dispatchEvent(eventObj);
    }
}
///////////////////////////////////////
var port = null;
function sendNativeMessage(text) {
  message = {"text": text};
  port.postMessage(message);
}

function onNativeMessage(message) {
  console.log("received back message:", message);
}

function onDisconnected() {
  port = null;
}

function connect() {
  var hostName = "com.google.chrome.example.echo";
  port = chrome.runtime.connectNative(hostName);
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onDisconnected);
}
///////////////////////////////////////