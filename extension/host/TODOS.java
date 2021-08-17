>>more manual testing of keygrouper/actiongrouper on text field
------------
PatternFinder needs to know:
    1- [INITIAL_VALUE substring(s), PASTE(s) substring(s), ADDITIONS]
scenario:
    text field: ""
    user adds: "hello"
    -> state [+"hello"]
scenario:
    text field: "text"
    user adds: "hello"
    -> state[+"hello"]
scenario:
    text field: "text"
    user removes all:
    user adds: "hello"
    -> state[-all, +"hello"]
scenario:
    text field: ""
    user adds: "paste"
    -> state[+paste]
    user removes: -2
    -> state[+paste-2]
    user clicks on button

normal case:
    description: user removing whats in text field and pasting
    condition: (wasInitialValueRemoved yes or no intialValue) and getParts() == [Part(id="paste")]


TODO:
    add mouse
extesion -> input grouper
[
    keystroke: [<letter>|arrow|backspace|mouse click|mouse selection|shift+<>+arrow selection]
    type: destructive: input character|paste  non destructive:copy|cursor change|select|
    state: "full text",
    cursorIndex: "",
    selection: (startOffset, endOffset)
]
from this we can determine if smth changed or not



input grouper -> pattern finder
Change = [
    // only for editable elements
    "+text": {
        initialText: "..",
        // addedText: "..",
        finalText: "..",
        offset: Offset,
        isPasted: Boolean
    },
    // only for editable elements
    "-text": {
        initialText: "..",
        // removedText: : "..",
        finalText: "..",
        offset: [start: Offset, end: Offset],
    },
    "ReplaceWithClipboard": {
        initialText: "..",
        removedText: : "..",
        // finalText: "..",
    }
    // works for editable/non-editable elements
    "copied text": {
        offset: [start: Offset, end: Offset],
    }
]

-----
Offset:
    line number: int
    word index: int
    character index in word: int
    isEnd: Boolean