const log = function(args) {
    console.log("    PATTERNFINDER", ...args);
};

class Singleton {
    constructor() {
        this.clipboard = '';
    }

    setClipboard(text) {
        log(['Setting clipboard to', text])
        this.clipboard = text;
    }
    
    getClipboard() {
        return this.clipboard;
    }
}
module.exports = new Singleton();