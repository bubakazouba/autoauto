const FIELDS = ["code", "key", "keyCode", "shiftKey", "ctrlKey", "metaKey", "altKey", "which"];

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

    chrome.runtime.sendMessage({ text: m }, function(response) {
        console.log("Response: ", response);
    });
};

function parseList(listId) {
    return ["1.", "2.", "3.", "4.", "5.", "6."];
}

function parseTable(tableId) {
    return [
        ["(0,0)", "(1,0)", "(2,0)", "(3,0)"],
        ["(0,1)", "(1,1)", "(2,1)", "(3,1)"],
        ["(0,2)", "(1,2)", "(2,2)", "(3,2)"],
        ["(0,3)", "(1,3)", "(2,3)", "(3,3)"],
        ["(0,4)", "(1,4)", "(2,4)", "(3,4)"]
    ];
}

chrome.runtime.onMessage.addListener(function(request, sendResponse) {
    console.log("got this request:::", request);
    if (request.action == "PARSE_LIST") {
        console.log("I was asked to parse list:" + request.id);
        parsedList = parseList(request.id);
        sendResponse({ "parsedList": parsedList });
    }
    else if (request.action == "PARSE_TABLE") {
        console.log("I was asked to parse table:" + request.id);
        parsedTable = parseTable(request.id);
        sendResponse({ "parsedTable": parsedTable });
    }
});