function get_keyboard_string_from_key_params(keyParams) {
    let s = keyParams["key"];
    if (s.slice(0, 5) == "Arrow") { // ArrowDown -> Down
        s = s.slice(5);
    }
    if (["Meta", "Shift", "Control", "Alt"].includes(s)) { // Ignore a lone Meta
        return "";
    }
    if (keyParams["metaKey"]) {
        s = "cmd+" + s;
    }
    if (keyParams["ctrlKey"]) {
        s = "ctrl+" + s;
    }
    if (keyParams["shiftKey"]) {
        s = "shift+" + s;
    }
    if (keyParams["altKey"]) {
        s = "alt+" + s;
    }
    return s;
}

function getPrettyPrintActions(actions) {
    return actions.map(action => getPrettyPrintAction(action)).join(',');
}

function getPrettyPrintAction(action) {
    if (!action) {
        return "None";
    }
    let actionType = action["action"]["type"];
    if (actionType == "KEYBOARD") {
        return _getPrettyPrintKeyboard(action);
    } else if (actionType == "KEY_GROUP_INPUT") {
        return `${actionType}${action["action"]["element_id"]} KeyGroup='${action["action"]["keyGroup"]}'`;
    } else if (["CLICK", "PLACE_IN_CLIPBOARD", "SHEETS_PASTE"].includes(actionType)) {
        return _getStandardPrettyPrint(action);
    }
}

function _getStandardPrettyPrint(action) {
    let s = action["action"]["type"] + action["action"]["element_id"];
    if ("increment_pattern" in action["action"]) {
        s += ` I=${action["action"]["increment_pattern"]}`;
    }
    return s;
}

function _getPrettyPrintKeyboard(action) {
    return `${action["action"]["type"]}${action["action"]["element_id"]} +" Key='${get_keyboard_string_from_key_params(action["action"]["keyParams"])}'`;
}

module.exports = {
    getPrettyPrintAction: getPrettyPrintAction,
    getPrettyPrintActions: getPrettyPrintActions,
    get_keyboard_string_from_key_params: get_keyboard_string_from_key_params,
};