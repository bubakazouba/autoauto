const USER_SHEET_SETTING_KEY = "USER_SHEET_SETTING";
const PATTERNS_ASSESSMENTS = "PATTERNS_ASSESSMENTS";
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

function setPatternsFound(found_patternes) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            [PATTERNS_ASSESSMENTS]: found_patternes
        }, function() {
            console.log('[Storage][Set] Setting the patterns assessments', found_patternes);
            resolve(found_patternes);
        });
    });
}

function getPatternsFound() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([PATTERNS_ASSESSMENTS], function(result) {
            console.log('[Storage][Get] getting the patterns assessments');
            resolve(result[PATTERNS_ASSESSMENTS] || []);
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
    setPatternsFound: setPatternsFound,
    getPatternsFound: getPatternsFound,
    setCurrentPatternId: setCurrentPatternId,
    getCurrentPatternId: getCurrentPatternId,
};