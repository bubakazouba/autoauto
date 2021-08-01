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
            self.log("im updating selection dict to smth")
            self.selectionDict[action["tab"]["id"]][action["action"]["element_id"]] = [startOffset, endOffset]
        else:
            self.log("im updating selection dict to nothing")
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
            if printutils.get_keyboard_string_from_key_params(keyParams) == "cmd+v":
                clipboard = keyGroupInput["clipboard"]
                # TODO: unhardcode paste id to allow multiple pastes
                self._getKeyGroupForAction(action).appendPasteAtOffset(clipboard, startOffset, "PASTE_ID_1")
                self.log("I sent paste")
            elif key == "Backspace": # also add cmd+backspace for delete
                # if there was selection then we have already taken care of it
                if self._getSelectionForAction(action) == []:
                    self._getKeyGroupForAction(action).deleteTextAtOffset(startOffset - 1)
                    self.log("I sent deleteTextAtOffset: "+str(startOffset-1) + ", now keygroup=" + str(self._getKeyGroupForAction(action)))
            else:
                self.log("im appending text")
                self._getKeyGroupForAction(action).appendTextAtOffset(key, startOffset)

        self._updateSelectionDict(action)

    def actionIsOnEditableElement(self, action):
        return action["action"]["element_node"] == "INPUT"

    def append(self, action):
        res = None
        if self.actionIsOnEditableElement(action):
            tabId = action["tab"]["id"]
            elementId = action["action"]["element_id"]
            # TODO: only create a new KeyGroup on re-focus if some action happened 
            if action["action"]["type"] == "FOCUS" and self._actionOnEditableElementIsSubmitted(action):# and self.didUserDoADestructiveActionOnTheSameTabAfterAlteringThisElement(action):
                self.keyGroupDict[tabId][elementId] = KeyGrouper(action["action"]["keyGroupInput"]["value"])
            if action["action"]["type"] == "KEY_GROUP_INPUT":
                self._appendKeyboardActionInKeyGroup(action)
        # TODO: group select + copy here too, and discard useless selects
        # if action is clicking/selecting
        else:
            res = []
            # TODO: only submit unsubmitted keygroups if a click happened (select/copy shouldnt submit)
            unsubmittedKeyGroupActions = self._getAndSubmitUnsubmittedKeyGroupsInTab(action["tab"]["id"])
            for a in unsubmittedKeyGroupActions:
                a = copy.deepcopy(a)
                del a["action"]["keyParams"]
                del a["action"]["keyGroupInput"]
                a["action"]["keyGroup"] = self._getKeyGroupForAction(a)
                res.append(a)
            res.append(action)
        return res

def t():
    return defaultdict(KeyGrouper)
def ts():
    return defaultdict(list)
def tb():
    return defaultdict(bool)