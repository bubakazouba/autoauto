class Singleton {
    constructor() {
        this.clipboard = '';
    }

    setClipboard(text) {
        console.log('Setting clipboard to', text)
        this.clipboard = text;
    }
    
    getClipboard() {
        return this.clipboard;
    }
}
module.exports = new Singleton();