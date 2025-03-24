const clipboardStore = require('../clipboardStore.js');

// Mock console.log to prevent test output noise
console.log = jest.fn();

describe('ClipboardStore', () => {
    beforeEach(() => {
    // Reset the clipboard before each test
        clipboardStore.clipboard = '';
        // Clear mock calls
        console.log.mockClear();
    });

    test('should initialize with empty clipboard', () => {
        expect(clipboardStore.clipboard).toBe('');
    });

    test('should set clipboard value', () => {
        clipboardStore.setClipboard('test text');
        expect(clipboardStore.clipboard).toBe('test text');
    });

    test('should get clipboard value', () => {
        clipboardStore.clipboard = 'test value';
        expect(clipboardStore.getClipboard()).toBe('test value');
    });

    test('should log when setting clipboard', () => {
        clipboardStore.setClipboard('logging test');
        // The log function spreads the array arguments, not passing it as an array
        expect(console.log).toHaveBeenCalledWith(
            '    ClipboardStore',
            'Setting clipboard to',
            'logging test'
        );
    });

    test('should update clipboard when setting new value', () => {
        clipboardStore.setClipboard('first value');
        expect(clipboardStore.clipboard).toBe('first value');
    
        clipboardStore.setClipboard('second value');
        expect(clipboardStore.clipboard).toBe('second value');
    });
});
