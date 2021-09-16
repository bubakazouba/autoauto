const USER_SHEET_SETTING_KEY = "USER_SHEET_SETTING";
const PATTERNS_HISTORY = "PATTERNS_HISTORY";
const CURRENT_PATTERN_ID = "CURRENT_PATTERN_ID";
const DEFAULT_SETTING = "PASTE";
const MAPPING = {
    "USER_PRESSED_USE_API": "API",
    "USER_PRESSED_USE_PASTE": "PASTE",
};
function getUserSheetSetting() {
    return new Promise((resolve) => {
        return chrome.storage.sync.get([USER_SHEET_SETTING_KEY], function(result) {
            console.log('[Storage][Get] user sheet value currently is', result[USER_SHEET_SETTING_KEY]);
            if (!result[USER_SHEET_SETTING_KEY]) {
                return storeUserSheetSetting("USER_PRESSED_USE_PASTE");
            }
            resolve(result[USER_SHEET_SETTING_KEY]);
        });
    });
}

function storeUserSheetSetting(useApiOrPaste) {
    let value = MAPPING[useApiOrPaste];
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            [USER_SHEET_SETTING_KEY]: value,
        }, function() {
            console.log('[Storage][Set] user sheet setting value is set to ', value);
            resolve(value);
        });
    });
}


function clearUserSheetSetting() {
    chrome.storage.sync.set({
        [USER_SHEET_SETTING_KEY]: ""
    }, function() {
        console.log('[Storage] [Clear] Cleared user sheet setting');
    });
}

function setPatternsHistory(patternsHistory) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            [PATTERNS_HISTORY]: patternsHistory
        }, function() {
            console.log('[Storage][Set] Setting the patterns history', patternsHistory);
            resolve(patternsHistory);
        });
    });
}

function pushPatternHistory(newPattern) {
    return new Promise((resolve) => {
        chrome.storage.sync.get([PATTERNS_HISTORY, CURRENT_PATTERN_ID], function(result) {
            let patternsHistory =  result[PATTERNS_HISTORY] || [];
            patternsHistory.push(newPattern);
            chrome.storage.sync.set({
                [PATTERNS_HISTORY]: patternsHistory
            }, function() {
                console.log('[Storage][Set] Setting the patterns history', patternsHistory);
                resolve(patternsHistory);
            });
        });
    });
}

function clearPatternsHistory() {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            [PATTERNS_HISTORY]: [],
            [CURRENT_PATTERN_ID]: 0
        }, function() {
            console.log('[Storage][Clear] Clearing the patterns history');
            resolve(true);
        });
    });
}

function updateLastPatternHistory(updatedObject) {
    return new Promise((resolve) => {
        chrome.storage.sync.get([PATTERNS_HISTORY, CURRENT_PATTERN_ID], function(result) {
            let patternsHistory =  result[PATTERNS_HISTORY] || [];
            let currentPatternId = result[CURRENT_PATTERN_ID] || 0;
            patternsHistory[currentPatternId] = {
                ...patternsHistory[currentPatternId],
                ...updatedObject,
            };
            chrome.storage.sync.set({
                [PATTERNS_HISTORY]: patternsHistory
            }, function() {
                console.log('[Storage][Update] Updating the recent pattern', patternsHistory);
                resolve(patternsHistory);
            });
        });
    });
}

function getLastPatternHistory() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([PATTERNS_HISTORY, CURRENT_PATTERN_ID], function(result) {
            let patternsHistory =  result[PATTERNS_HISTORY] || [];
            let currentPatternId = result[CURRENT_PATTERN_ID] || 0;
            console.log('[Storage][Get] getting the patterns history');
            resolve(patternsHistory[currentPatternId] || []);
        });
    });
}

function getPatternsHistory() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([PATTERNS_HISTORY], function(result) {
            console.log('[Storage][Get] getting the patterns history');
            resolve(result[PATTERNS_HISTORY] || []);
        });
    });
}

function setCurrentPatternId(value) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            [CURRENT_PATTERN_ID]: value
        }, function() {
            console.log('[Storage][Set] Setting the current pattern id');
            resolve(value);
        });
    });
}

function incrementCurrentPatternId() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([CURRENT_PATTERN_ID], function(result) {
            let currentPatternId = result[CURRENT_PATTERN_ID] || 0;
            chrome.storage.sync.set({
                [CURRENT_PATTERN_ID]: currentPatternId + 1
            }, function() {
                console.log('[Storage][Set] Setting the current pattern id');
                resolve(currentPatternId + 1);
            });
        });
    });
}

function getCurrentPatternId() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([CURRENT_PATTERN_ID], function(result) {
            console.log('[Storage][Get] getting the current pattern id');
            resolve(result[CURRENT_PATTERN_ID] || 0);
        });
    });
}


module.exports = {
    getUserSheetSetting: getUserSheetSetting,
    storeUserSheetSetting: storeUserSheetSetting,
    clearUserSheetSetting: clearUserSheetSetting,
    setPatternsHistory: setPatternsHistory,
    getPatternsHistory: getPatternsHistory,
    clearPatternsHistory: clearPatternsHistory,
    updateLastPatternHistory: updateLastPatternHistory,
    getLastPatternHistory: getLastPatternHistory,
    setCurrentPatternId: setCurrentPatternId,
    getCurrentPatternId: getCurrentPatternId,
    incrementCurrentPatternId: incrementCurrentPatternId,
    pushPatternHistory: pushPatternHistory,
};