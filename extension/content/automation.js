function putElementInFocus(element_id) {
    let element = getElementById(element_id);
    element.focus();
}

function clickOnElement(element_id) {
    let element = getElementById(element_id);
    element.click();
}
function keyGroupOnElement(element_id, keyGroup) {
    console.log("[keyGroupOnElement] keyGroup=", keyGroup);
    let element = getElementById(element_id);
    let initialValue = element.value;
    getValueInClipboard().then(paste => {
        let finalValue = "";
        for(let p of keyGroup) {
            if (typeof p == typeof "") {
                console.log("im appending p=", p);
                finalValue += p;
            }
            else {
                let s = "";
                if (p.id == "INITIAL_VALUE") {
                    s = initialValue;
                }
                else if (p.id == "PASTE") {
                    s = paste;
                }
                let raw_end = p.end == "E" ? s.length : p.end;
                console.log("[keyGroupOnElement] appending s=", s, p.start, raw_end, s.substring(p.start, raw_end));
                finalValue += s.substring(p.start, raw_end);
            }
        }
        element.value = finalValue;
    });
}

function placeElementInClipboard(element_id) {
    if (areWeInSpreadsheets()) {
        // update selector
        console.log("[placeElementInClipboard] changing cell");
        changeCellWithElementId(element_id);
        console.log("[placeElementInClipboard] done changing cell copying cell content");
        setTimeout(() => {
            copy(document.getElementsByClassName("cell-input")[0].textContent);
        }, 400);
    }
    else {
        let element = getElementById(element_id);
        // TODO: we will need to use different accessors (e.g textfields use .value)
        copy(element.textContent);
    }
}

////////////////////////////////////////
// Sheets stuff

function getCellFromSheetsElementId(element_id) {
    return colNumAndRowToCell(element_id.split(".").slice(-2));
}

function getSheetId() {
    // assuming we are in a spreadsheet tab
    return window.location.pathname.split("/")[3];
}

function changeCellWithElementId(element_id) {
    let cell = getCellFromSheetsElementId(element_id);
    console.log("[changeCellWithElementId] got cell=", cell);
    // Change Cell
    document.getElementById("t-name-box").value = cell;

    const ENTER_EVENT = new window.KeyboardEvent("keydown", {key: "Enter", keyCode: 13});
    document.getElementById("t-name-box").dispatchEvent(ENTER_EVENT);
    document.dispatchEvent(ENTER_EVENT);    
}


function handleSheetsPaste(element_id) {
    let cell = getCellFromSheetsElementId(element_id);
    getValueInClipboard().then(value => {
        let request = {
            type: "WRITE_SHEET",
            range: cell,
            values: [[value]],
            sheetId: getSheetId(),
        }
        chrome.runtime.sendMessage({
            request: request
        });
    });
    
    changeCellWithElementId(element_id);

    // Now Paste
    // document.execCommand("paste");
}