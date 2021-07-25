import unittest
from context import keygrouper
import testutils

class TestStringMethods(unittest.TestCase):

    def test_keygrouper_appends(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        self.assertEqual(s.getVal(), "abdc")

    def test_keygrouper_appends_then_appendsPaste(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1, "PASTE_ID_1")
        self.assertEqual(s.getVal(), "xhelloabdc")
    
    def test_keygrouper_appends_then_appendsPaste_then_appendsMidPaste(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1, "PASTE_ID_1")
        s.appendTextAtOffset("!",2)
        
        p1 = keygrouper.Part(0, 1, "PASTE_ID_1", "hello")
        p2 = keygrouper.Part(1, "E", "PASTE_ID_1", "hello")
        self.assertEqual(s.getVal(), "xh!elloabdc")
        expectedParts = ["x", p1, "!", p2, "abdc"]
        self.assertPartsEqual(s, expectedParts)
    
    def test_keygrouper_appends_then_appendsPaste_then_appendsMidPaste_thenRemoves(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1, "PASTE_ID_1")
        s.appendTextAtOffset("!",2)
        s.deleteTextAtOffsetRange(6,8)
        
        p1 = keygrouper.Part(0, 1, "PASTE_ID_1", "hello")
        p2 = keygrouper.Part(1, 4, "PASTE_ID_1", "hello")
        self.assertEqual(s.getVal(), "xh!ellbdc")
        expectedParts = ["x", p1, "!", p2, "bdc"]
        self.assertPartsEqual(s, expectedParts)

    def test_keygrouper_with_initialValue(self):
        s = keygrouper.KeyGrouper("initial value")
        self.assertEqual(s.getVal(), "initial value")

        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value")
        expectedParts = [p0]
        self.assertPartsEqual(s, expectedParts)

    def test_keygrouper_with_initialValue_and_changes(self):
        s = keygrouper.KeyGrouper("initial value")
        
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1, "PASTE_ID_1")
        s.appendTextAtOffset("!",2)

        self.assertEqual(s.getVal(), "xh!elloabdcinitial value")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value")
        p1 = keygrouper.Part(0, 1, "PASTE_ID_1", "hello")
        p2 = keygrouper.Part(1, "E", "PASTE_ID_1", "hello")
        expectedParts = ["x", p1, "!", p2, "abdc", p0]
        self.assertPartsEqual(s, expectedParts)

    def assertPartsEqual(self, s, expectedParts):
        resultParts = s.getParts()
        self.assertEqual(len(resultParts), len(expectedParts))
        for i in range(len(s.getParts())):
            self.assertEqual(resultParts[i], expectedParts[i])

if __name__ == '__main__':
    unittest.main()