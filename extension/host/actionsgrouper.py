from collections import defaultdict
from keygrouper import KeyGrouper
import printutils
import copy

# Responsible for only reporting user actions that we would want to automate them
#   e.g dont report SELECT if not followed by copy/replace
# Responsible for grouping actions
#   keystrokes on the same text field are grouped together so they are returned as 1 grouped action
class ActionsGrouper:
    def __init__(self, log):
        self.log = log
        # we store last action of altered keygroup so we have all data like tab info..etc to submit for patternfinder
        self.unsubmittedKeyGroupActionsDict = defaultdict(tb) # {tabId: {elementId: action}}
        self.keyGroupDict = defaultdict(t) # {tabId: {elementId: KeyGrouper}} 
        self.selectionDict = defaultdict(ts) # {tabId: {elementId: [selection start, selection end]}} 
    
    def _getKeyGroupForAction(self, action):
        return self.keyGroupDict[action["tab"]["id"]][action["action"]["element_id"]]

    def _getSelectionForAction(self, action):
        return self.selectionDict[action["tab"]["id"]][action["action"]["element_id"]]

    def _updateSelectionDict(self, action):
        keyParams = action["action"]["keyParams"]
        keyGroupInput = action["action"]["keyGroupInput"]
        startOffset = keyGroupInput["startOffset"]
        endOffset = keyGroupInput["endOffset"]
        self.log("_updateSelectionDict: {},{}".format(startOffset, endOffset))
        if startOffset != endOffset:
            self.selectionDict[action["tab"]["id"]][action["action"]["element_id"]] = [startOffset, endOffset]
        else:
            self.selectionDict[action["tab"]["id"]][action["action"]["element_id"]] = []
    
    def _actionOnEditableElementIsSubmitted(self, action):
        return action["action"]["element_id"] not in self.unsubmittedKeyGroupActionsDict[action["tab"]["id"]]

    def _markUnsubmittedKeyGroup(self, action):
        self.unsubmittedKeyGroupActionsDict[action["tab"]["id"]][action["action"]["element_id"]] = action
    
    def _getAndSubmitUnsubmittedKeyGroupsInTab(self, tabId):
        l = []
        keys = list(self.unsubmittedKeyGroupActionsDict[tabId].keys())
        for elementId in keys:
            l.append(self.unsubmittedKeyGroupActionsDict[tabId][elementId])
            del self.unsubmittedKeyGroupActionsDict[tabId][elementId]
        return l

    def _appendKeyboardActionInKeyGroup(self, action):
        keyParams = action["action"]["keyParams"]
        keyGroupInput = action["action"]["keyGroupInput"]
        startOffset = keyGroupInput["startOffset"]
        key = keyParams["key"] if not keyParams["isManuveringAction"] else None

        if not keyParams["isManuveringAction"]:
            self._markUnsubmittedKeyGroup(action)
            # Starting here all actions are destructive ones (character or cmd+v or backspace)
            if self._getSelectionForAction(action) != []:
                [selectionStartOffset, selectionEndOffset] = self._getSelectionForAction(action)
                self.log("There is selection and a destructive action deleting selected range [{},{}] ".format(selectionStartOffset, selectionEndOffset))
                self._getKeyGroupForAction(action).deleteTextAtOffsetRange(selectionStartOffset, selectionEndOffset)
            if key == "v" and keyParams["metaKey"]:
                clipboard = keyGroupInput["clipboard"]
                self._getKeyGroupForAction(action).appendPasteAtOffset(clipboard, startOffset)
                self.log("I sent paste")
            elif key == "Backspace" and not keyParams["metaKey"]:
                # if there was selection then we have already taken care of it
                if self._getSelectionForAction(action) == []:
                    self._getKeyGroupForAction(action).deleteTextAtOffset(startOffset - 1)
                    self.log("I sent deleteTextAtOffset: "+str(startOffset-1))
            elif key == "Backspace" and keyParams["metaKey"]: # TODO: add also alt+delete
                # if there was selection then we have already taken care of it
                if self._getSelectionForAction(action) == []:
                    self._getKeyGroupForAction(action).deleteTextAtOffsetRange(0, startOffset)
                    self.log("I sent deleteTextAtOffsetRange(0, : "+str(startOffset-1) + ")")
            elif keyParams["metaKey"] or keyParams["key"] == "CapsLock": # ignore cmd+c,cmd+f,cmd+d (any browser shortcuts)
                pass
            else:
                self.log("im appending text")
                self._getKeyGroupForAction(action).appendTextAtOffset(key, startOffset)
        self.log("now keygroup=" + str(self._getKeyGroupForAction(action)))

        self._updateSelectionDict(action)

    def actionIsOnEditableElement(self, action):
        return action["action"]["element_node"] == "INPUT"

    def append(self, action):
        res = None
        if self.actionIsOnEditableElement(action):
            tabId = action["tab"]["id"]
            elementId = action["action"]["element_id"]
            # TODO: only create a new KeyGroup on re-focus if keyGroup for element was submitted (or if it didn't exist before) 
            if action["action"]["type"] == "FOCUS" and self._actionOnEditableElementIsSubmitted(action):
                self.keyGroupDict[tabId][elementId] = KeyGrouper(action["action"]["keyGroupInput"]["value"])
            if action["action"]["type"] == "KEY_GROUP_INPUT":
                self._appendKeyboardActionInKeyGroup(action)
            return None
        # if action is clicking/selecting
        else:
            res = []
            if action["action"]["type"] == "FOCUS":
                pass
            elif action["action"]["type"] == "CLICK":
                # Only submit keyGroups and report them back if we clicked on a button
                # (assuming here that clicking on this button is submitting the text in the web page)
                unsubmittedKeyGroupActions = self._getAndSubmitUnsubmittedKeyGroupsInTab(action["tab"]["id"])
                for a in unsubmittedKeyGroupActions:
                    a = copy.deepcopy(a)
                    del a["action"]["keyParams"]
                    del a["action"]["keyGroupInput"]
                    a["action"]["keyGroup"] = self._getKeyGroupForAction(a)
                    res.append(a)
                res.append(action)
            # this should only run for spreadsheets
            elif action["action"]["type"] == "KEYBOARD" and "docs.google.com" in action["tab"]["url"]:
                res.append(action)

            return res


def t():
    return defaultdict(KeyGrouper)
def ts():
    return defaultdict(list)
def tb():
    return defaultdict(bool)