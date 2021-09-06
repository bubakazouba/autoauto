class Part {
    // text could be pasted text or initial value
    constructor(start, end, _id, text) {
        this.start = start;
        this.end = end;
        this.raw_end = end == "E" ? text.length : end;
        this.id = _id;
        this.text = text;
    }

    indicesWithinBoundaries() {
        let outOfBounds = this.start < 0 || this.raw_end < 0 || this.raw_end <= this.start;
        return !outOfBounds;
    }

    getVal() {
        if (!this.indicesWithinBoundaries()) {
            return "";
        }
        return this.text.slice(this.start, this.raw_end);
    }
    jsonify() {
        return {
            "start": this.start,
            "end": this.end,
            "id": this.id,
        };
    }
    toString() {
        return String([this.start, this.end, this.raw_end, this.text, this.id]);
    }
    equals(other) {
        if (other instanceof Part) {
            return this.start == other.start &&
                this.end == other.end &&
                this.raw_end == other.raw_end &&
                this.id == other.id &&
                this.text == other.text;
        }
        return false;
    }
}

class KeyGrouper {
    constructor(initialValue = "") {
        this.initialValueWasSet = false;
        this.parts = [];
        if (initialValue.length > 0) {
            this.initialValueWasSet = true;
            this.parts = [new Part(0, "E", "INITIAL_VALUE", initialValue)];
        }
    }

    getVal() {
        let val = "";
        for (let part of this.parts) {
            val += this.getValForPart(part);
        }
        return val;
    }

    getValForPart(part) {
        let val = "";
        if (typeof part == "string") {
            val = part;
        } else if (part instanceof Part) {
            return part.getVal();
        }
        return val;
    }
    jsonify() {
        let parts = this.getParts();
        let jsonExport = [];
        for (let p of parts) {
            if (typeof p == "string") {
                jsonExport.push(p);
            } else {
                jsonExport.push(p.jsonify());
            }
        }
        return jsonExport;
    }

    // TODO concatenate consecutive parts if for example (0,1) (1,2) on same paste
    // TODO later even smarter, if user removes char from paste then types it again
    getParts() {
        if (this.parts.length == 0) {
            return [];
        }
        // Consecutive strings concatenation
        let finalParts = [this.parts[0]];
        for (let i = 1; i < this.parts.length; i++) {
            let part = this.parts[i];
            if (typeof part == 'string' && typeof finalParts[finalParts.length - 1] == 'string') {
                finalParts[finalParts.length - 1] += part;
            } else if ((typeof part == 'string' && finalParts[finalParts.length - 1] instanceof Part) || part instanceof Part) {
                finalParts.push(part);
            }
        }
        return finalParts;
    }

    printParts() {
        let s = "";
        for (let part of this.parts) {
            s += String(part);
        }
        return s;
    }

    getLenPart(i) {
        return this.getValForPart(this.parts[i]).length;
    }

    // If initialValue is here i can check how much of it was removed/split..etc
    // if its not there we cant tell if it wasnt there from the first place or if it was there
    // then removed
    wasInitialValueRemoved() {
        let isThereAnInitialValue = !!this.parts.filter(p => p instanceof Part && p.id == "INITIAL_VALUE").length;
        return !isThereAnInitialValue && this.initialValueWasSet;
    }
    getPartToUpdateOrIndexForOffset(offset) {
        let currentOffset = 0;
        for (let i in this.parts) {
            currentOffset += this.getLenPart(i);
            if (currentOffset > offset && typeof this.parts[i] == "string") {
                return { indexInsidePart: null, index: parseInt(i) };
            } else if (currentOffset > offset) {
                return { indexInsidePart: this.getLenPart(i) - (currentOffset - offset), index: parseInt(i) };
            }
        }
        return { indexInsidePart: null, index: currentOffset };
    }
    appendTextAtOffset(text, offset) {
        for (let c of text.split('').reverse().join('')) {
            this._appendTextAtOffset(c, offset);
        }
    }
    _appendTextAtOffset(char, offset) {
        let { indexInsidePart, index } = this.getPartToUpdateOrIndexForOffset(offset);
        // if indexInsidePart is 0 then its the beginning of the part, we can just append it before it
        if (indexInsidePart != null && indexInsidePart != 0) {
            let p = this.parts[index];
            let p1 = new Part(p.start, p.start + indexInsidePart, p.id, p.text);
            let p2 = new Part(p.start + indexInsidePart, p.end, p.id, p.text);
            this.parts[index] = p1;
            this.parts.splice(index + 1, 0, char);
            this.parts.splice(index + 2, 0, p2);
        } else {
            this.parts.splice(index, 0, char);
        }
    }
    // TODO: allow more than one paste
    appendPasteAtOffset(pastedText, offset) {
        let { _, index } = this.getPartToUpdateOrIndexForOffset(offset);
        let part = new Part(0, "E", "PASTE", pastedText);
        this.parts.splice(index, 0, part);
    }

    deleteTextAtOffset(offset) {
        if (this.parts.length == 0) {
            return;
        }
        let { indexInsidePart, index } = this.getPartToUpdateOrIndexForOffset(offset);
        if (indexInsidePart != null) {
            let p = this.parts[index];
            let p1 = new Part(p.start, p.start + indexInsidePart, p.id, p.text);
            let p2 = new Part(p.start + indexInsidePart + 1, p.end, p.id, p.text);
            if (this.getValForPart(p1).length != 0) {
                this.parts[index] = p1;
            }
            if (this.getValForPart(p2).length != 0) {
                if (this.getValForPart(p1).length != 0) {
                    this.parts.splice(index + 1, 0, p2);
                } else {
                    this.parts[index] = p2;
                }
            }
            if (this.getValForPart(p1).length == 0 && this.getValForPart(p2).length == 0) {
                this.parts.splice(index, 1); // deletes index from array;
            }
        } else {
            this.parts.splice(index, 1); // deletes index from array;
        }
    }

    deleteTextAtOffsetRange(startOffset, endOffset) {
        for (let i = startOffset; i < endOffset; i++) {
            this.deleteTextAtOffset(startOffset);
        }
    }

    equals(other, checkInitialValueWasSet) {
        if (other instanceof KeyGrouper) {
            if (checkInitialValueWasSet && this.initialValueWasSet != other.initialValueWasSet) {
                return false;
            }
            return this.jsonify() == other.jsonify();
        }
        return false;
    }

    toString() {
        return this.printParts() + "||" + this.getVal();
    }
}

module.exports = {
    KeyGrouper: KeyGrouper,
    Part: Part,
};