const log = function(args) {
    console.log("    ClipboardStore", ...args);
};

class ClipboardStore {
    constructor() {
        this.clipboard = '';
    }

    setClipboard(text) {
        log(['Setting clipboard to', text]);
        this.clipboard = text;
    }
    
    getClipboard() {
        return this.clipboard;
    }
}
module.exports = new ClipboardStore();
