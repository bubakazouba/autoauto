const USER_SHEET_SETTING_KEY = "USER_SHEET_SETTING";
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


module.exports = {
    getUserSheetSetting: getUserSheetSetting,
    storeUserSheetSetting: storeUserSheetSetting,
    clearUserSheetSetting: clearUserSheetSetting,
};