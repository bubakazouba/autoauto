const patternutils = require("./patternutils.js");

module.exports = class IncrementTracker {
    constructor() {
        this.lastIndexTrackers = {}; // actionIndex: element_id
        this.incrementPatterns = {}; // actionIndex: pattern (in form of element_id)
    }
    static commit(lastIndexTrackers, incrementPatterns) {
        this.lastIndexTrackers = lastIndexTrackers;
        this.incrementPatterns = incrementPatterns;
    }
    static updateIndexTrackerElementId(actionIndex, actionOrElementId) {
        let elementId = typeof actionOrElementId == "string" ? actionOrElementId : actionOrElementId["action"]["element_id"];
        this.lastIndexTrackers[actionIndex] = elementId;
    }
    static getExpectedIndex(actionIndex) {
        return patternutils.addIds(this.lastIndexTrackers[actionIndex], this.incrementPatterns[actionIndex]);
    }    
};