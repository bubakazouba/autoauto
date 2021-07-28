from collections import defaultdict
from keygrouper import KeyGrouper
import printutils
class ActionsGrouper:
    def __init__(self):
        self.actionsCache = []
        self.keyGroupDict = defaultdict(t) # {tabId: {elementId: KeyGrouper}} 
    
    def _getKeyGroupForAction(self, action):
        return self.keyGroupDict[action["tab"]["id"]][action["action"]["element_id"]]

    # TODO: allow pastes too, for now assuming only keystrokes
    def _appendKeyboardAction(self, action):
        keyParams = action["action"]["keyParams"]
        startOffset = keyParams["input"]["startOffset"]
        key = keyParams["key"]
        #TODO: differentiate selections (cmd+)shift+arrow or cmd+shift+a
        # Ignore these (TODO: allow selections)
        if key[:5] == "Arrow":
            return
        if printutils.get_keyboard_string_from_key_params(keyParams) == "cmd+v":
            clipboard = keyParams["input"]["clipboard"]
            # TODO: unhardcode paste id to allow multiple pastes
            self._getKeyGroupForAction(action).appendPasteAtOffset(clipboard, startOffset, "PASTE_ID_1")
        # elif key == backspace
        #   
        else:
            self._getKeyGroupForAction(action).appendTextAtOffset(key, startOffset)

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
                self.keyGroupDict[tabId][elementId] = KeyGrouper(action["action"]["input"]["value"])
            if action["action"]["type"] == "KEYBOARD":
                self._appendKeyboardAction(action)
            self.actionsCache.append(action)
        # if action is clicking/selecting
        else:
            if self.lastActionWasAlteringKeyGroup():
                keyGroup = self._getKeyGroupForAction(self.actionsCache[-1])
                lastAction = self.actionsCache[-1]
                lastAction["action"]["keyParams"]["keyGroup"] = keyGroup
                res = [lastAction, action]
                self.actionsCache.append(action)
            else:
                self.actionsCache.append(action)
                res = [action]
        return res

def t():
    return defaultdict(KeyGrouper)
def ts():
    return defaultdict(str)