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
        s.appendPasteAtOffset("hello", 1)
        self.assertEqual(s.getVal(), "xhelloabdc")
    
    def test_keygrouper_appends_then_appendsPaste_then_appendsMidPaste(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1)
        s.appendTextAtOffset("!",2)
        
        p1 = keygrouper.Part(0, 1, "PASTE", "hello")
        p2 = keygrouper.Part(1, "E", "PASTE", "hello")
        self.assertEqual(s.getVal(), "xh!elloabdc")
        expectedParts = ["x", p1, "!", p2, "abdc"]
        self.assertEqual(expectedParts, s.getParts())
    
    def test_keygrouper_appends_then_appendsPaste_then_appendsMidPaste_then_appendsMidPaste(self):
        s = keygrouper.KeyGrouper()
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("h123ello", 1)
        s.appendTextAtOffset("!",4)
        self.assertEqual(s.getVal(), "xh12!3elloabdc")

        s.appendTextAtOffset("!",7)
        self.assertEqual(s.getVal(), "xh12!3e!lloabdc")
        
        p1 = keygrouper.Part(0, 3, "PASTE", "h123ello")
        p2 = keygrouper.Part(3, 5, "PASTE", "h123ello")
        p3 = keygrouper.Part(5, "E", "PASTE", "h123ello")
        expectedParts = ["x", p1, "!", p2, "!", p3, "abdc"]
        self.assertEqual(expectedParts, s.getParts())

    def test_keygrouper_with_initialValue(self):
        s = keygrouper.KeyGrouper("initial value")
        self.assertEqual(s.getVal(), "initial value")

        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value")
        expectedParts = [p0]
        self.assertEqual(expectedParts, s.getParts())

    def test_keygrouper_with_initialValue_and_changes(self):
        s = keygrouper.KeyGrouper("initial value")
        
        s.appendTextAtOffset("a", 0)
        s.appendTextAtOffset("b", 1)
        s.appendTextAtOffset("c", 2)
        s.appendTextAtOffset("d", 2)
        s.appendTextAtOffset("x", 0)
        s.appendPasteAtOffset("hello", 1)
        s.appendTextAtOffset("!",2)

        self.assertEqual(s.getVal(), "xh!elloabdcinitial value")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "initial value")
        p1 = keygrouper.Part(0, 1, "PASTE", "hello")
        p2 = keygrouper.Part(1, "E", "PASTE", "hello")
        expectedParts = ["x", p1, "!", p2, "abdc", p0]
        self.assertEqual(expectedParts, s.getParts())

    def test_keygrouper_with_initialValue_and_deletesAllFromBeginning(self):
        s = keygrouper.KeyGrouper("123")
        self.assertEqual(s.getVal(), "123")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        expectedParts = [p0]
        self.assertEqual(expectedParts, s.getParts())

        s.deleteTextAtOffset(0)
        self.assertEqual(s.getVal(), "23")

        s.deleteTextAtOffset(0)
        self.assertEqual(s.getVal(), "3")

        s.deleteTextAtOffset(0)
        self.assertEqual(s.getVal(), "")
        self.assertEqual([], s.getParts())

    def test_keygrouper_with_initialValue_and_deletesAllFromEnd(self):
        s = keygrouper.KeyGrouper("123")
        self.assertEqual(s.getVal(), "123")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        expectedParts = [p0]
        self.assertEqual(expectedParts, s.getParts())

        s.deleteTextAtOffset(2)
        s.deleteTextAtOffset(1)
        s.deleteTextAtOffset(0)
        self.assertEqual(s.getVal(), "")
        self.assertEqual([], s.getParts())

    def test_keygrouper_with_initialValue_and_deletesAllWithRange(self):
        s = keygrouper.KeyGrouper("123")
        self.assertEqual(s.getVal(), "123")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        expectedParts = [p0]
        self.assertEqual(expectedParts, s.getParts())

        s.deleteTextAtOffsetRange(0, 3)
        self.assertEqual(s.getVal(), "")
        self.assertEqual([], s.getParts())

    def test_keygrouper_with_initialValue_and_deletesAll_and_extraDelete(self):
        s = keygrouper.KeyGrouper("123")
        self.assertEqual(s.getVal(), "123")
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        expectedParts = [p0]
        self.assertEqual(expectedParts, s.getParts())

        s.deleteTextAtOffset(0)
        s.deleteTextAtOffset(0)
        s.deleteTextAtOffset(0)
        s.deleteTextAtOffset(0) # Extra delete
        self.assertEqual(s.getVal(), "")
        self.assertEqual([], s.getParts())

    def test_keygrouper_with_initialValue_and_modifictions(self):
        s = keygrouper.KeyGrouper("123")
        s.appendTextAtOffset("4", 3)
        for i in range(10):
            s.appendTextAtOffset("A", 0)
        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        expectedParts = ["A"*10, p0, '4']

        self.assertEqual(s.getVal(), "A"*10 + "1234")
        self.assertEqual(expectedParts, s.getParts())

        s.appendTextAtOffset("Z", 11)

        p1 = keygrouper.Part(0, 1, "INITIAL_VALUE", "123")
        p2 = keygrouper.Part(1, "E", "INITIAL_VALUE", "123")
        expectedParts = ["A"*10, p1, "Z", p2, '4']

        self.assertEqual(s.getVal(), "A"*10 + "1Z234")
        self.assertEqual(expectedParts, s.getParts())

    def test_keygrouper_with_initialValue_and_longStart(self):
        s = keygrouper.KeyGrouper("123")
        for i in range(10):
            s.appendTextAtOffset("A", 0)

        p0 = keygrouper.Part(0, "E", "INITIAL_VALUE", "123")
        p1 = keygrouper.Part(0, 1, "INITIAL_VALUE", "123")
        p2 = keygrouper.Part(1, "E", "INITIAL_VALUE", "123")
        expectedParts = ["A"*10, p1, "Z", p2]
        s.appendTextAtOffset("Z", 11)
        self.assertEqual(s.getVal(), "A"*10 + "1Z23")
        self.assertEqual(expectedParts, s.getParts())

if __name__ == '__main__':
    unittest.main()