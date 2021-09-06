document.getElementById('start').onclick = function() {
    chrome.runtime.sendMessage({
        event: {
            type: "USER_PRESSED_START",
            repitions: document.getElementById('repitions').value,
        }
    }, function(response) {
        console.log("popup.js: Response: ", response);
    });
};