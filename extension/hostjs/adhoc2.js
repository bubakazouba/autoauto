const cloneDeep = require('clone-deep');
// const log = function(...args) {
//     console.log("      ADHOC2", ...args);
// }

function detectRepition(actions) {
    // TODO: Action should be a class with an __eq__ override where it can do smart stuff like
    // 1- checking if keyGroup guesses are equal and returning that guess
    //   if nth char is always replaced with uppercased letter
    //   all delimiters replaced with spaces..etc
    // 2- checking if theres an increment pattern and using that to compare
    // or maybe these checks should happen in another class like IncrementFinder? 
    let n = actions.length;
    let min_editdistance = 9999;
    let min_eval = null;
    for (let i = 1; i < n; i++) {
        let x1 = actions.slice(0, i);
        let x2 = actions.slice(i);
        let dis = _levenshteinDistance(x1, x2);
        if (dis < min_editdistance) {
            min_eval = x1;
            if (x2.length < x1.length) {
                min_eval = x2;
            }
            min_editdistance = dis;
        }
    }

    if (!min_eval) {
        return null;
    }
    return {
        "error": min_editdistance,
        "pattern": min_eval,
    };
}

function _levenshteinDistance(arr1, arr2) {
    const track = Array(arr2.length + 1).fill(null).map(() => Array(arr1.length + 1).fill(null));
    for (let i = 0; i <= arr1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= arr2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= arr2.length; j += 1) {
        for (let i = 1; i <= arr1.length; i += 1) {
            const indicator = _areActionsEqual(arr1[i - 1], arr2[j - 1]) ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    return track[arr2.length][arr1.length];
}

function _areActionsEqual(action1, action2) {
    // TODO: we should reuse function in patternfinder.js with complete logic for increment_pattern
    if ("increment_pattern" in action1["action"]) {
        action1 = cloneDeep(action1);
        delete action1["action"]["element_id"];
    }
    if ("increment_pattern" in action2["action"]) {
        action2 = cloneDeep(action2);
        delete action2["action"]["element_id"];
    }
    if (action1["action"]["type"] == action2["action"]["type"] == "KEY_GROUP_INPUT") {
        return action1.equals(action2);
    }
    return JSON.stringify(action1) == JSON.stringify(action2);
}

module.exports = {
    detectRepition: detectRepition,
};