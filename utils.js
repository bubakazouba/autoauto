function object_equals(x, y) {
    if (x === y) return true;
    // if both x and y are null or undefined and exactly the same

    if (!(x instanceof Object) || !(y instanceof Object)) return false;
    // if they are not strictly equal, they both need to be Objects

    if (x.constructor !== y.constructor) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for (var p in x) {
        if (!x.hasOwnProperty(p)) continue;
        // other properties were tested using x.constructor === y.constructor

        if (!y.hasOwnProperty(p)) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if (x[p] === y[p]) continue;
        // if they have the same strict value or identity then they are equal

        if (typeof(x[p]) !== "object") return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if (!object_equals(x[p], y[p])) return false;
        // Objects and Arrays must be tested recursively
    }

    for (p in y)
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
            return false;
    // allows x[ p ] to be set to undefined

    return true;
}


function actionToString(action) {
  return "key=" + action.action.keyParams.key + ", tab=" + action.tab.index;
}

function actionsToString(actions) {
  return actions.map(lr => actionToString(lr));
}

function areKeyArraysEqual(keys1, keys2) {
    // let keys1normalized = {tab: keys1.tab, action: keys2.action};
    // let keys2normalized = {tab: keys2.tab, action: keys2.action};
    // console.log("comparing=",keys1, keys2);
    // console.log("comparing=", JSON.stringify(keys1normalized), JSON.stringify(keys2normalized));
    // return JSON.stringify(keys1normalized) == JSON.stringify(keys2normalized);
    // console.log("comparing=", JSON.stringify(keys1), JSON.stringify(keys2));
    // return JSON.stringify(keys1) == JSON.stringify(keys2);
    for (let i = 0; i < keys1.length; i++) {
        if (!object_equals(keys1[i], keys2[i])) {
            return false;
        }
    }
    return true;
}

// note that this is hardcoded to detect exactly 1 repition for size n
function isLastNRepeatedOnce(actions, n) {
    if (actions.length < n * 2 || actions.length == 0 || n <= 1) {
        return false;
    }
    last_n = actions.slice(actions.length - n, actions.length);
    n_before_last_n = actions.slice(actions.length - n * 2, actions.length - n)
    // console.log("checking last_n=", last_n, n_before_last_n);
    if (areKeyArraysEqual(last_n, n_before_last_n)) {
        return true;
    }
    return false;
}

function getIndexOfLastSameTabAction(list) {
    let tabIndex = list[0].tab.index;
    for (let i = 0; i < list.length; i++) {
        if (list[i].tab.index != tabIndex) {
            return i - 1;
        }
    }
    return list.length - 1;
}
