const cloneDeep = require('clone-deep');
const patternutils = require("./patternutils.js");
// const log = function(...args) {
//     console.log("      ADHOC2", ...args);
// };

function detectRepition(actions) {
    // TODO: Action should be a class with an __eq__ override where it can do smart stuff like
    // 1- checking if keyGroup guesses are equal and returning that guess
    //   if nth char is always replaced with uppercased letter
    //   all delimiters replaced with spaces..etc
    // 2- checking if theres an increment pattern and using that to compare
    // or maybe these checks should happen in another class like IncrementFinder? 
    let n = actions.length;
    let minEditDistance = 9999;
    let leastDistancePattern = null;
    for (let i = 1; i < n; i++) {
        let x1 = actions.slice(0, i);
        let x2 = actions.slice(i);
        let dis = _levenshteinDistance(x1, x2);
        if (dis < minEditDistance) {
            leastDistancePattern = x1;
            if (x2.length < x1.length) {
                leastDistancePattern = x2;
            }
            minEditDistance = dis;
        }
    }

    if (leastDistancePattern == null) {
        return null;
    }
    let last_index_trackers = { }; // actionIndex: element_id
    let increment_patterns = { }; // actionIndex: increment_pattern
    for(let i = 0; i < parseInt(actions.length / 2); i++) {
        let action1 = actions[i];
        let action2 = actions[parseInt(i + actions.length / 2)];
        increment_patterns[i] = _proposeIncrement(action1, action2);
        last_index_trackers[i] = action2["action"]["element_id"];
    }
    return {
        "error": minEditDistance,
        "pattern": leastDistancePattern,
        "last_index_trackers": last_index_trackers,
        "increment_patterns": increment_patterns,
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
    action1 = cloneDeep(action1);
    action2 = cloneDeep(action2);
    // delete element_id before comparing and propose the increment pattern
    // Just assert that the element depth matches (element depth is how deep it is in the XML tree)
    if (action1["action"]["element_id"].split(".").length != action2["action"]["element_id"].split(".").length) {
        return false;
    }
    delete action1["action"]["element_id"];
    delete action2["action"]["element_id"];

    return JSON.stringify(action1) == JSON.stringify(action2);
}

function _proposeIncrement(action1, action2) {
    let i1 = action1["action"]["element_id"];
    let i2 = action2["action"]["element_id"];
    return patternutils.subtractIds(i2, i1);
}

module.exports = {
    detectRepition: detectRepition,
};