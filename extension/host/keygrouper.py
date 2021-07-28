class Part:
    # text could be pasted text or initial value
    def __init__(self, start, end, _id, text):
        self.start = start
        self.end = end
        self.raw_end = len(text) if end == "E" else end
        self.id = _id
        self.text = text

    def indicesWithinBoundaries(self):
        outOfBounds = self.start < 0 or self.raw_end < 0 or self.raw_end <= self.start
        return not outOfBounds

    def getVal(self):
        if not self.indicesWithinBoundaries():
            return ""
        return self.text[self.start:self.raw_end]
    def __str__(self):
        return str([self.start,self.end,self.raw_end, self.text, self.id])
    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Part):
            return self.start == other.start and \
            self.end == other.end and \
            self.raw_end == other.raw_end and \
            self.id == other.id and \
            self.text == other.text
        return False
    def __ne__(self, other):
        """Overrides the default implementation (unnecessary in Python 3)"""
        return not self.__eq__(other)
    def __hash__(self):
        """Overrides the default implementation"""
        return hash(tuple(sorted(self.__dict__.items())))

class KeyGrouper:
    def __init__(self, initialValue=""):
        self.initiaValueWasSet = False
        self.parts = []
        if len(initialValue) > 0:
            self.initiaValueWasSet = True
            self.parts = [Part(0, "E", "INITIAL_VALUE", initialValue)]
    
    def getVal(self):
        val = ""
        for part in self.parts:
            val += self.getValForPart(part)
        return val
    
    def getValForPart(self, part):
        val = ""
        if type(part) == str:
            val = part
        elif type(part) == Part:
            return part.getVal()
        return val
    def __str__(self):
        return str(self.printParts())+"||"+str([str(p) for p in self.getParts()])
    # TODO concatenate consecutive parts if for example (0,1) (1,2) on same element
    def getParts(self):
        if len(self.parts) == 0:
            return []
        finalParts = [self.parts[0]]
        for i in range(1, len(self.parts)):
            part = self.parts[i]
            if type(part) == str and type(finalParts[-1]) == str:
                finalParts[-1] += part
            elif (type(part) == str and type(finalParts[-1]) == Part) or type(part) == Part:
                finalParts.append(part)
        return finalParts

    def printParts(self):
        s = ""
        for part in self.parts:
            s+=str(part)
        return s

    def getLenPart(self, i):
        return len(self.getValForPart(self.parts[i]))
    
    # If initialValue is here i can check how much of it was removed/split..etc
    # if its not there we cant tell if it wasnt there from the first place or if it was there
    # then removed
    def wasInitialValueRemoved(self):
        return not any([type(p) == Part and p.id == "INITIAL_VALUE" for p in self.parts]) and \
            self.initiaValueWasSet
    def getPartToUpdateOrIndexToInsertNewPart(self, offset):
        currentOffset = 0
        for i in range(len(self.parts)):
            currentOffset += self.getLenPart(i)
            part = self.parts[i]
            if currentOffset > offset and type(self.parts[i]) == str:
                return None, i
            elif currentOffset > offset:
                return self.getLenPart(i) - (currentOffset- offset), i
        return None, currentOffset
    def appendTextAtOffset(self, char, offset):
        for c in reversed(char):
            self._appendTextAtOffset(c, offset)
    def _appendTextAtOffset(self, char, offset):
        indexInsidePart, index = self.getPartToUpdateOrIndexToInsertNewPart(offset)
        # if indexInsidePart is 0 then its the beginning of the part, we can just append it before it
        if indexInsidePart is not None and indexInsidePart != 0:
            initialPart = self.parts[index]
            firstPart = Part(initialPart.start, indexInsidePart, initialPart.id, initialPart.text)
            secondPart = Part(indexInsidePart, initialPart.end, initialPart.id, initialPart.text)
            self.parts[index] = firstPart
            self.parts.insert(index + 1, char)
            self.parts.insert(index + 2, secondPart)
        elif index is not None:
            self.parts.insert(index, char)
    # TODO: allow more than one paste
    def appendPasteAtOffset(self, pastedText, offset, pasteId):
        indexInsidePart, index = self.getPartToUpdateOrIndexToInsertNewPart(offset)
        if index is not None:
            part = Part(0, "E", pasteId, pastedText)
            self.parts.insert(index, part)
    
    def deleteTextAtOffset(self, offset):
        indexInsidePart, index = self.getPartToUpdateOrIndexToInsertNewPart(offset)
        if indexInsidePart is not None:
            initialPart = self.parts[index]
            indexInsidePart += initialPart.start + 1
            firstPart = Part(initialPart.start, indexInsidePart - 1, initialPart.id, initialPart.text)
            secondPart = Part(indexInsidePart, initialPart.end, initialPart.id, initialPart.text)
            if len(self.getValForPart(firstPart)) != 0:
                self.parts[index] = firstPart
            if len(self.getValForPart(secondPart)) != 0:
                if len(self.getValForPart(firstPart)) != 0 :
                    self.parts.insert(index+1, secondPart)
                else:
                    self.parts[index] = secondPart
        elif index is not None:
            del self.parts[index]
    
    def deleteTextAtOffsetRange(self, startOffset, endOffset):
        for i in range(startOffset, endOffset):
            self.deleteTextAtOffset(startOffset)
