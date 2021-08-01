from collections import defaultdict
from keygrouper import KeyGrouper
import printutils
import copy

# Responsible for only reporting user actions that we would want to automate them
#   e.g dont report SELECT if not followed by copy/replace
# Responsible for grouping actions
#   keystrokes on the same text field are grouped together so they are returned as 1 grouped action
#   
class ActionsGrouper:
    def __init__(self, log):
        self.log = log
        self.actionsCache = []
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

    def _appendKeyboardActionInKeyGroup(self, action):
        keyParams = action["action"]["keyParams"]
        keyGroupInput = action["action"]["keyGroupInput"]
        startOffset = keyGroupInput["startOffset"]
        key = keyParams["key"] if not keyParams["isManuveringAction"] else None

        if not keyParams["isManuveringAction"]:
            # Starting here all actions are destructive ones (character or cmd+v or backspace)
            if self._getSelectionForAction(action) != []:
                [selectionStartOffset, selectionEndOffset] = self._getSelectionForAction(action)
                self.log("There is selection and a nondestructive action [{},{}]".format(selectionStartOffset, selectionEndOffset))
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

    # TODO: needs to be more specific so it wouldn't capture FOCUS on element node for example
    def lastActionWasAlteringKeyGroup(self):
        return len(self.actionsCache) > 0 and self.actionsCache[-1]["action"]["element_node"] == "INPUT"

    def lastActionWasNotAlteringSameKeyGroup(self, action):
        if len(self.actionsCache) == 0:
            return True
        lastAction = self.actionsCache[-1]
        lastTabId = lastAction["tab"]["id"]
        lastElementId = lastAction["action"]["element_id"]
        tabId = action["tab"]["id"]
        elementId = action["action"]["element_id"]
        return not (lastElementId == elementId and lastTabId == tabId)
    
    def didUserDoADestructiveActionOnTheSameTabAfterAlteringThisElement(self, action):
        # TODO: this can be smarter by checking if the subsequence of actions between last time we were on the same element same tab where actions on a different element on the same tab
        # the problem with the current logic is that if the user switched to another tab did some actions and then came back
        # we would return true, but we should actually return false, since the user didnt do anything with what they typed in the text field
        # 
        # TODO: Another problem is if the user did a nondestuctive action on the same tab such as selecting some text (but not copying)
        return self.lastActionWasNotAlteringSameKeyGroup(action)

    def actionIsOnEditableElement(self, action):
        return action["action"]["element_node"] == "INPUT"

    def append(self, action):
        res = None
        if self.actionIsOnEditableElement(action):
            tabId = action["tab"]["id"]
            elementId = action["action"]["element_id"]
            # TODO: only create a new one on re-focus if some action happened 
            if action["action"]["type"] == "FOCUS" and self.didUserDoADestructiveActionOnTheSameTabAfterAlteringThisElement(action):
                self.keyGroupDict[tabId][elementId] = KeyGrouper(action["action"]["keyGroupInput"]["value"])
            if action["action"]["type"] == "KEY_GROUP_INPUT":
                self._appendKeyboardActionInKeyGroup(action)
            self.actionsCache.append(action)
        # TODO: group select + copy here too, and discard useless selects
        # if action is clicking/selecting
        else:
            if self.lastActionWasAlteringKeyGroup():
                keyGroup = self._getKeyGroupForAction(self.actionsCache[-1])
                lastAction = copy.deepcopy(self.actionsCache[-1])
                lastAction["action"]["keyGroup"] = keyGroup
                res = [lastAction, action]
                self.actionsCache.append(action)
            else:
                self.actionsCache.append(action)
                res = [action]
        return res

def t():
    return defaultdict(KeyGrouper)
def ts():
    return defaultdict(list)