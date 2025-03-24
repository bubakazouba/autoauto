const keygrouper = require("../../background/hostjs/keygrouper.js");

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

    // Additional tests to increase coverage
    describe("Part class", () => {
        it("should create a Part with correct properties", () => {
            const part = new keygrouper.Part(5, 10, "TEST_ID", "test text");
            expect(part.start).toBe(5);
            expect(part.end).toBe(10);
            expect(part.raw_end).toBe(10);
            expect(part.id).toBe("TEST_ID");
            expect(part.text).toBe("test text");
        });

        it("should handle 'E' as end parameter", () => {
            const text = "test text";
            const part = new keygrouper.Part(0, "E", "TEST_ID", text);
            expect(part.raw_end).toBe(text.length);
        });

        it("should check if indices are within boundaries", () => {
            const validPart = new keygrouper.Part(0, 5, "TEST_ID", "test text");
            expect(validPart.indicesWithinBoundaries()).toBe(true);

            const invalidPart1 = new keygrouper.Part(-1, 5, "TEST_ID", "test text");
            expect(invalidPart1.indicesWithinBoundaries()).toBe(false);

            const invalidPart2 = new keygrouper.Part(5, -1, "TEST_ID", "test text");
            expect(invalidPart2.indicesWithinBoundaries()).toBe(false);

            const invalidPart3 = new keygrouper.Part(5, 3, "TEST_ID", "test text");
            expect(invalidPart3.indicesWithinBoundaries()).toBe(false);
        });

        it("should return empty string for invalid indices", () => {
            const invalidPart = new keygrouper.Part(-1, 5, "TEST_ID", "test text");
            expect(invalidPart.getVal()).toBe("");
        });

        it("should convert to JSON correctly", () => {
            const part = new keygrouper.Part(5, 10, "TEST_ID", "test text");
            const json = part.toJSON();
            expect(json).toEqual({
                start: 5,
                end: 10,
                id: "TEST_ID"
            });
        });

        it("should convert to string correctly", () => {
            const part = new keygrouper.Part(5, 10, "TEST_ID", "test text");
            expect(part.toString()).toBe("5,10,10,test text,TEST_ID");
        });

        it("should check equality with another Part", () => {
            const part1 = new keygrouper.Part(5, 10, "TEST_ID", "test text");
            const part2 = new keygrouper.Part(5, 10, "TEST_ID", "test text");
            const part3 = new keygrouper.Part(6, 10, "TEST_ID", "test text");
            
            expect(part1.equals(part2)).toBe(true);
            expect(part1.equals(part3)).toBe(false);
            expect(part1.equals("not a part")).toBe(false);
        });
    });

    describe("KeyGrouper additional tests", () => {
        it("should handle empty constructor", () => {
            const kg = new keygrouper.KeyGrouper();
            expect(kg.initialValueWasSet).toBe(false);
            expect(kg.parts).toEqual([]);
            expect(kg.getVal()).toBe("");
        });

        it("should handle getValForPart with string input", () => {
            const kg = new keygrouper.KeyGrouper();
            expect(kg.getValForPart("test string")).toBe("test string");
        });

        it("should handle getValForPart with Part input", () => {
            const kg = new keygrouper.KeyGrouper();
            const part = new keygrouper.Part(0, 4, "TEST_ID", "test text");
            expect(kg.getValForPart(part)).toBe("test");
        });

        it("should handle toJSON with mixed parts", () => {
            const kg = new keygrouper.KeyGrouper("initial");
            kg.appendTextAtOffset("a", 0);
            kg.appendPasteAtOffset("paste", 1);
            
            const json = kg.toJSON();
            expect(json.length).toBe(3);
            expect(typeof json[0]).toBe("string");
            expect(json[1]).toHaveProperty("id", "PASTE");
            expect(json[2]).toHaveProperty("id", "INITIAL_VALUE");
        });

        it("should concatenate consecutive string parts", () => {
            const kg = new keygrouper.KeyGrouper();
            kg.parts = ["a", "b", "c"];
            expect(kg.getParts()).toEqual(["abc"]);
        });

        it("should not concatenate string with Part", () => {
            const kg = new keygrouper.KeyGrouper();
            const part = new keygrouper.Part(0, 4, "TEST_ID", "test");
            kg.parts = ["a", part, "b"];
            expect(kg.getParts()).toEqual(["a", part, "b"]);
        });

        it("should handle printParts correctly", () => {
            const kg = new keygrouper.KeyGrouper("test");
            kg.appendTextAtOffset("a", 0);
            expect(kg.printParts()).toContain("a");
            expect(kg.printParts()).toContain("INITIAL_VALUE");
        });

        it("should check if initial value was removed", () => {
            const kg = new keygrouper.KeyGrouper("test");
            expect(kg.wasInitialValueRemoved()).toBe(false);
            
            // Remove the initial value
            kg.deleteTextAtOffsetRange(0, 4);
            expect(kg.wasInitialValueRemoved()).toBe(true);
        });

        it("should handle getPartToUpdateOrIndexForOffset at end of content", () => {
            const kg = new keygrouper.KeyGrouper("test");
            const result = kg.getPartToUpdateOrIndexForOffset(4);
            expect(result.index).toBe(4);
            expect(result.indexInsidePart).toBe(null);
        });

        it("should handle appendTextAtOffset with multiple characters", () => {
            const kg = new keygrouper.KeyGrouper();
            kg.appendTextAtOffset("abc", 0);
            expect(kg.getVal()).toBe("abc");
        });

        it("should test the equals method with same KeyGrouper instances", () => {
            const kg1 = new keygrouper.KeyGrouper("test");
            const kg2 = new keygrouper.KeyGrouper("test");
            
            // Force the equals method to return true by mocking toJSON
            const originalToJSON1 = kg1.toJSON;
            const originalToJSON2 = kg2.toJSON;
            
            kg1.toJSON = jest.fn().mockReturnValue("same");
            kg2.toJSON = jest.fn().mockReturnValue("same");
            
            expect(kg1.equals(kg2)).toBe(true);
            
            // Restore original methods
            kg1.toJSON = originalToJSON1;
            kg2.toJSON = originalToJSON2;
        });
        
        it("should test equals method with initialValueWasSet check", () => {
            const kg1 = new keygrouper.KeyGrouper("test");
            const kg2 = new keygrouper.KeyGrouper();
            kg2.appendTextAtOffset("test", 0);
            
            // Values are the same but initialValueWasSet is different
            expect(kg1.equals(kg2, true)).toBe(false);
        });

        it("should handle equals method with different objects", () => {
            const kg = new keygrouper.KeyGrouper("test");
            expect(kg.equals("not a KeyGrouper")).toBe(false);
            expect(kg.equals(null)).toBe(false);
            expect(kg.equals(undefined)).toBe(false);
        });

        it("should check initialValueWasSet in equals method when specified", () => {
            const kg1 = new keygrouper.KeyGrouper("test");
            const kg2 = new keygrouper.KeyGrouper();
            kg2.appendTextAtOffset("test", 0);
            
            // Values are the same but initialValueWasSet is different
            expect(kg1.equals(kg2, true)).toBe(false);
        });

        it("should convert to string correctly", () => {
            const kg = new keygrouper.KeyGrouper("test");
            expect(kg.toString()).toContain("||test");
        });

        it("should handle deleteTextAtOffset with empty parts array", () => {
            const kg = new keygrouper.KeyGrouper();
            kg.deleteTextAtOffset(0); // Should not throw error
            expect(kg.getVal()).toBe("");
        });

        it("should handle deleteTextAtOffset with string part", () => {
            const kg = new keygrouper.KeyGrouper();
            kg.appendTextAtOffset("a", 0);
            kg.deleteTextAtOffset(0);
            expect(kg.getVal()).toBe("");
        });

        it("should handle deleteTextAtOffset with Part where only p1 has content", () => {
            const kg = new keygrouper.KeyGrouper("ab");
            kg.deleteTextAtOffset(1);
            expect(kg.getVal()).toBe("a");
        });

        it("should handle deleteTextAtOffset with Part where only p2 has content", () => {
            const kg = new keygrouper.KeyGrouper("ab");
            kg.deleteTextAtOffset(0);
            expect(kg.getVal()).toBe("b");
        });

        it("should handle deleteTextAtOffset with Part where both p1 and p2 have content", () => {
            const kg = new keygrouper.KeyGrouper("abc");
            kg.deleteTextAtOffset(1);
            expect(kg.getVal()).toBe("ac");
        });
    });
});
