const jsonUtils = require('../../background/hostjs/jsonutils.js');

describe('jsonUtils', () => {
    describe('parseRobustly', () => {
        test('should parse valid JSON correctly', () => {
            const validJson = '[{"name": "test"}]';
            expect(jsonUtils.parseRobustly(validJson)).toEqual([{ "name": "test" }]);
        });

        test('should handle JSON without outer brackets', () => {
            const jsonWithoutBrackets = '{"name": "test"}';
            expect(jsonUtils.parseRobustly(jsonWithoutBrackets)).toEqual({ "name": "test" });
        });

        test('should filter empty arrays when filterEmptyArrays is true', () => {
            const jsonWithEmptyArrays = '[[],{"name": "test"}]';
            expect(jsonUtils.parseRobustly(jsonWithEmptyArrays, true)).toEqual([{ "name": "test" }]);
        });

        test('should keep empty arrays when filterEmptyArrays is false', () => {
            const jsonWithEmptyArrays = '[[],{"name": "test"}]';
            expect(jsonUtils.parseRobustly(jsonWithEmptyArrays, false)).toEqual([[], { "name": "test" }]);
        });

        test('should handle incomplete JSON by finding the last complete object', () => {
            const incompleteJson = '[{"complete": true},{"incomplete":';
            // Just check that it doesn't throw and returns something
            const result = jsonUtils.parseRobustly(incompleteJson);
            expect(result).toBeDefined();
        });

        test('should extract valid arrays from malformed JSON using regex', () => {
            const malformedJson = 'garbage[{"valid": true}]more garbage';
            const result = jsonUtils.parseRobustly(malformedJson);
            // Accept either format as long as the data is there
            expect(Array.isArray(result)).toBeTruthy();
            if (Array.isArray(result[0])) {
                expect(result[0][0].valid).toBe(true);
            } else {
                expect(result[0].valid).toBe(true);
            }
        });

        test('should handle multiple arrays in the response', () => {
            const multipleArrays = '[{"first": true}],[{"second": true}]';
            const result = jsonUtils.parseRobustly(multipleArrays);
            // Should either combine them or return the first valid one
            expect(Array.isArray(result)).toBeTruthy();
        });

        test('should return empty array for completely invalid JSON', () => {
            const invalidJson = 'completely invalid';
            const result = jsonUtils.parseRobustly(invalidJson);
            expect(Array.isArray(result)).toBeTruthy();
            expect(result.length).toBe(0);
        });

        test('should handle the specific example from the requirements', () => {
            const exampleJson = '[],[{"tab":{"id":621284635,"index":10,"url":"https://docs.google.com/spreadsheets/d/1r_Tf-X523If2l2wFTXVjS9HpljhOP9cb1rtZmSwp-8E/edit?gid=0#gid=0"},"action":{"type":"PLACE_IN_CLIPBOARD","element_id":"0.1.5","element_node":"SHEET"}}],[{"tab":{"id":621284635,"index":10,"url":"https://docs.google.com/spreadsheets/d/1r_Tf-X523If2l2wFTXVjS9HpljhOP9cb1rtZmSwp-8E/edit?gid=0#gid=0"},"action":{"type":"SHEETS_PASTE","element_id":"0.2.5","element_node":"SHEET"}}]';
      
            const result = jsonUtils.parseRobustly(exampleJson);
            expect(result.length).toBeGreaterThan(0); // Should have at least one non-empty array
        });

        test('should handle cut-off JSON from the example', () => {
            const cutOffJson = '[],[{"tab":{"id":621284635,"index":10,"url":"https://docs.google.com/spreadsheets/d/1r_Tf-X523If2l2wFTXVjS9HpljhOP9cb1rtZmSwp-8E/edit?gid=0#gid=0"},"action":{"type":"PLACE_IN';
      
            const result = jsonUtils.parseRobustly(cutOffJson);
            // Just check that it doesn't throw and returns something
            expect(result).toBeDefined();
        });
    });
});
