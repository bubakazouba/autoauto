const keygrouper = require("../../hostjs/keygrouper.js");

describe("KeyGrouper", () => {
    it("should work with appends", () => {
        let s = new keygrouper.KeyGrouper();
        s.appendTextAtOffset("a", 0);
        s.appendTextAtOffset("b", 1);
        s.appendTextAtOffset("c", 2);
        s.appendTextAtOffset("d", 2);
        expect(s.getVal()).toEqual("abdc");
    });

    it("should work with appends then appends paste", () => {
        let s = new keygrouper.KeyGrouper();
        s.appendTextAtOffset("a", 0);
        s.appendTextAtOffset("b", 1);
        s.appendTextAtOffset("c", 2);
        s.appendTextAtOffset("d", 2);
        s.appendTextAtOffset("x", 0);
        s.appendPasteAtOffset("hello", 1);
        expect(s.getVal()).toEqual("xhelloabdc");
    });
    
    it("should work with appends then appends paste then appends mid paste", () => {
        let s = new keygrouper.KeyGrouper();
        s.appendTextAtOffset("a", 0);
        s.appendTextAtOffset("b", 1);
        s.appendTextAtOffset("c", 2);
        s.appendTextAtOffset("d", 2);
        s.appendTextAtOffset("x", 0);
        s.appendPasteAtOffset("hello", 1);
        s.appendTextAtOffset("!", 2);
        expect(s.getVal()).toEqual("xh!elloabdc");

        let p1 = new keygrouper.Part(0, 1, "PASTE", "hello");
        let p2 = new keygrouper.Part(1, "E", "PASTE", "hello");
        let expectedParts = ["x", p1, "!", p2, "abdc"];
        expect(expectedParts).toEqual(s.getParts());
    });

    it ("should keygrouper appends then appendsPaste then appendsMidPaste then appendsMidPaste", () => {
        let s = new keygrouper.KeyGrouper();
        s.appendTextAtOffset("a", 0);
        s.appendTextAtOffset("b", 1);
        s.appendTextAtOffset("c", 2);
        s.appendTextAtOffset("d", 2);
        s.appendTextAtOffset("x", 0);
        s.appendPasteAtOffset("h123ello", 1);
        s.appendTextAtOffset("!", 4);
        expect(s.getVal()).toEqual("xh12!3elloabdc");

        s.appendTextAtOffset("!", 7);
        expect(s.getVal()).toEqual("xh12!3e!lloabdc");
        
        let p1 = new keygrouper.Part(0, 3, "PASTE", "h123ello");
        let p2 = new keygrouper.Part(3, 5, "PASTE", "h123ello");
        let p3 = new keygrouper.Part(5, "E", "PASTE", "h123ello");
        let expectedParts = ["x", p1, "!", p2, "!", p3, "abdc"];
        expect(expectedParts).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue", () => {
        let s = new keygrouper.KeyGrouper("initial value");
        expect(s.getVal()).toEqual("initial value");

        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value");
        let expectedParts = [p0];
        expect(expectedParts).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and changes", () => {
        let s = new keygrouper.KeyGrouper("initial value");
        
        s.appendTextAtOffset("a", 0);
        s.appendTextAtOffset("b", 1);
        s.appendTextAtOffset("c", 2);
        s.appendTextAtOffset("d", 2);
        s.appendTextAtOffset("x", 0);
        s.appendPasteAtOffset("hello", 1);
        s.appendTextAtOffset("!", 2);

        expect(s.getVal()).toEqual("xh!elloabdcinitial value");
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value");
        let p1 = new keygrouper.Part(0, 1, "PASTE", "hello");
        let p2 = new keygrouper.Part(1, "E", "PASTE", "hello");
        let expectedParts = ["x", p1, "!", p2, "abdc", p0];
        expect(expectedParts).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and deletesAllFromBeginning", () => {
        let s = new keygrouper.KeyGrouper("123");
        expect(s.getVal()).toEqual("123");
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "123");
        let expectedParts = [p0];
        expect(expectedParts).toEqual(s.getParts());

        s.deleteTextAtOffset(0);
        expect(s.getVal()).toEqual("23");

        s.deleteTextAtOffset(0);
        expect(s.getVal()).toEqual("3");

        s.deleteTextAtOffset(0);
        expect(s.getVal()).toEqual("");
        expect([]).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and deletesAllFromEnd", () => {
        let s = new keygrouper.KeyGrouper("123");
        expect(s.getVal()).toEqual("123");
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "123");
        let expectedParts = [p0];
        expect(expectedParts).toEqual(s.getParts());

        s.deleteTextAtOffset(2);
        s.deleteTextAtOffset(1);
        s.deleteTextAtOffset(0);
        expect(s.getVal()).toEqual("");
        expect([]).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and deletesAllWithRange", () => {
        let s = new keygrouper.KeyGrouper("123");
        expect(s.getVal()).toEqual("123");
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "123");
        let expectedParts = [p0];
        expect(expectedParts).toEqual(s.getParts());

        s.deleteTextAtOffsetRange(0, 3);
        expect(s.getVal()).toEqual("");
        expect([]).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and deletesAll and extraDelete", () => {
        let s = new keygrouper.KeyGrouper("123");
        expect(s.getVal()).toEqual("123");
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "123");
        let expectedParts = [p0];
        expect(expectedParts).toEqual(s.getParts());

        s.deleteTextAtOffset(0);
        s.deleteTextAtOffset(0);
        s.deleteTextAtOffset(0);
        s.deleteTextAtOffset(0); // Extra delete
        expect(s.getVal()).toEqual("");
        expect([]).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and modifictions", () => {
        let s = new keygrouper.KeyGrouper("123");
        s.appendTextAtOffset("4", 3);
        for (let i = 0 ; i < 10 ; i++) {
            s.appendTextAtOffset("A", 0);
        }
        let p0 = new keygrouper.Part(0, "E", "INITIAL_VALUE", "123");
        let expectedParts = ["A".repeat(10), p0, '4'];

        expect(s.getVal()).toEqual("A".repeat(10) + "1234");
        expect(expectedParts).toEqual(s.getParts());

        s.appendTextAtOffset("Z", 11);

        let p1 = new keygrouper.Part(0, 1, "INITIAL_VALUE", "123");
        let p2 = new keygrouper.Part(1, "E", "INITIAL_VALUE", "123");
        expectedParts = ["A".repeat(10), p1, "Z", p2, '4'];

        expect(s.getVal()).toEqual("A".repeat(10) + "1Z234");
        expect(expectedParts).toEqual(s.getParts());
    });
    it ("should keygrouper with initialValue and longStart", () => {
        let s = new keygrouper.KeyGrouper("123");
        for (let i = 0 ; i < 10 ; i++) {
            s.appendTextAtOffset("A", 0);
        }

        let p1 = new keygrouper.Part(0, 1, "INITIAL_VALUE", "123");
        let p2 = new keygrouper.Part(1, "E", "INITIAL_VALUE", "123");
        let expectedParts = ["A".repeat(10), p1, "Z", p2];
        s.appendTextAtOffset("Z", 11);
        expect(s.getVal()).toEqual("A".repeat(10) + "1Z23");
        expect(expectedParts).toEqual(s.getParts());
    });
});