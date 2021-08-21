function putElementInFocus(element_id) {
    let element = getElementById(element_id);
    element.focus();
}

function clickOnElement(element_id) {
    let element = getElementById(element_id);
    element.click();
}
function keyGroupOnElement(element_id, keyGroup) {
    console.log("keyGroupOnElement got called", keyGroup);
    let element = getElementById(element_id);
    let initialValue = element.value;
    let paste = getValueInClipboard();
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
            console.log("im appending s=", s, p.start, raw_end, s.substring(p.start, raw_end));
            finalValue += s.substring(p.start, raw_end);
        }
    }
    element.value = finalValue;
}

function placeElementInClipboard(element_id) {
    let element = getElementById(element_id);
    // TODO: we will need to use different accessors (e.g textfields use .value)
    _copy(element.textContent);
}