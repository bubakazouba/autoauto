function actionToString(action) {
    let keyName = action.action.keyParams.key;
    if (action.action.keyParams.metaKey) {
        keyName = "cmd+" + keyName
    }
    if (action.action.keyParams.ctrlKey) {
        keyName = "ctrl+" + keyName;
    }
    if (action.action.keyParams.shiftKey) {
        keyName = "shift+" + keyName;
    }
    if (action.action.keyParams.altKey) {
        keyName = "alt+" + keyName;
    }
    
    return "key=" + keyName + ", tab=" + action.tab.index;
}

function actionsToString(actions) {
    return actions.map(lr => actionToString(lr));
}
