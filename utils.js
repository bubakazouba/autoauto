function placeInClipboard(message) {
    if (message.action.list_id) {
        let listId = message.action.list_id;
        if (!window.lists[tabId] || !window.lists[tabId][listId]) {
            chrome.tabs.update(message.action.tab_id, { selected: true });
            parseList(listId, tabId, message.action.list_item_index);
        } else {
            navigator.clipboard.writeText(window.lists[listId][message.action.list_item_index]);
        }
    }
    else if (message.action.table_id) {
        let tableId = message.action.table_id;
        if (!window.tables[tabId] || !window.tables[tabId][tableId]) {
            chrome.tabs.update(message.action.tab_id, { selected: true });
            parseTable(tableId, tabId, message.action.table_cell.x, message.action.table_cell.y);
        } else {
            navigator.clipboard.writeText(window.tables[tableId][message.action.table_cell.x][message.action.table_cell.y]);
        }
    }
}

function storeListData(tabId, listId, parsedList) {
    if (!window.lists[tabId]) {
        window.lists[tabId] = {};
    }
    window.lists[tabId][listId] = parsedList;
}

function storeTableData(tabId, tableId, parsedTable) {
    if (!window.tables[tabId]) {
        window.tables[tabId] = {};
    }
    window.tables[tabId][tableId] = parsedTable;
}

function parseList(tabId, listId, index) {
    let request = { action: 'PARSE_LIST', params: { id: listId } };
    chrome.tabs.sendMessage(tabId, request, function(response) {
        console.log(">> got back parsed list from content script");
        storeListData(tabId, listId, response.parsedList);
        navigator.clipboard.writeText(window.lists[tabId][listId][index]);
        console.log("<< finished placing list index " + index + " in clipboard");
    });
}

function parseTable(tabId, tableId, x, y) {
    let request = { action: 'PARSE_TABLE', params: { id: tableId } };
    chrome.tabs.sendMessage(tabId, request, function(response) {
        console.log(">> got back parsed table from content script");
        storeTableData(tabId, tableId, response.parsedTable);
        navigator.clipboard.writeText(window.tables[tabId][tableId][x][y]);
        console.log("<< finished placing table x,y " + x + "," + y + " in clipboard");
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
    if (msg.event.type == "KEY_PRESSED") {
        return keyParamsToString(msg.event.keyParams);
    }
    else {
        return JSON.stringify(msg.event);
    }
}

function pprint(msg, tabIndex) {
     return _pprint(msg) + ", tab=" + tabIndex;
}