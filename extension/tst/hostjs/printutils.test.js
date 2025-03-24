const printutils = require('../../hostjs/printutils.js');

describe('PrintUtils', () => {
    describe('get_keyboard_string_from_key_params', () => {
        test('should format arrow keys correctly', () => {
            const keyParams = { key: 'ArrowDown' };
            expect(printutils.get_keyboard_string_from_key_params(keyParams)).toBe('Down');
        });

        test('should return empty string for lone modifier keys', () => {
            expect(printutils.get_keyboard_string_from_key_params({ key: 'Meta' })).toBe('');
            expect(printutils.get_keyboard_string_from_key_params({ key: 'Shift' })).toBe('');
            expect(printutils.get_keyboard_string_from_key_params({ key: 'Control' })).toBe('');
            expect(printutils.get_keyboard_string_from_key_params({ key: 'Alt' })).toBe('');
        });

        test('should format keys with modifiers correctly', () => {
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'a', 
                metaKey: true 
            })).toBe('cmd+a');
      
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'b', 
                ctrlKey: true 
            })).toBe('ctrl+b');
      
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'c', 
                shiftKey: true 
            })).toBe('shift+c');
      
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'd', 
                altKey: true 
            })).toBe('alt+d');
        });

        test('should format keys with multiple modifiers correctly', () => {
            // The order of modifiers in the implementation is: meta, ctrl, shift, alt
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'a', 
                metaKey: true,
                shiftKey: true 
            })).toBe('shift+cmd+a');
      
            expect(printutils.get_keyboard_string_from_key_params({ 
                key: 'v', 
                metaKey: true,
                ctrlKey: true,
                shiftKey: true,
                altKey: true
            })).toBe('alt+shift+ctrl+cmd+v');
        });
    });

    describe('getPrettyPrintAction', () => {
        test('should return "None" for null action', () => {
            expect(printutils.getPrettyPrintAction(null)).toBe('None');
        });

        test('should format KEYBOARD action correctly', () => {
            const action = {
                action: {
                    type: 'KEYBOARD',
                    element_id: '1.2',
                    keyParams: { key: 'a' }
                }
            };
            expect(printutils.getPrettyPrintAction(action)).toBe('KEYBOARD1.2 +" Key=\'a\'');
        });

        test('should format KEY_GROUP_INPUT action correctly', () => {
            const action = {
                action: {
                    type: 'KEY_GROUP_INPUT',
                    element_id: '3.4',
                    keyGroup: 'test-group'
                }
            };
            expect(printutils.getPrettyPrintAction(action)).toBe('KEY_GROUP_INPUT3.4 KeyGroup=\'test-group\'');
        });

        test('should format CLICK action correctly', () => {
            const action = {
                action: {
                    type: 'CLICK',
                    element_id: '5.6'
                }
            };
            expect(printutils.getPrettyPrintAction(action)).toBe('CLICK5.6');
        });

        test('should include increment pattern if present', () => {
            const action = {
                action: {
                    type: 'CLICK',
                    element_id: '5.6',
                    increment_pattern: '1.0'
                }
            };
            expect(printutils.getPrettyPrintAction(action)).toBe('CLICK5.6 I=1.0');
        });
    });

    describe('getPrettyPrintActions', () => {
        test('should join multiple actions with commas', () => {
            const actions = [
                {
                    action: {
                        type: 'CLICK',
                        element_id: '1.2'
                    }
                },
                {
                    action: {
                        type: 'KEYBOARD',
                        element_id: '3.4',
                        keyParams: { key: 'a' }
                    }
                }
            ];
            expect(printutils.getPrettyPrintActions(actions)).toBe('CLICK1.2,KEYBOARD3.4 +" Key=\'a\'');
        });
    });
});
