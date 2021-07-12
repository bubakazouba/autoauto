document.getElementById('stop').onclick = function() {
    chrome.runtime.sendMessage({
        event: {
            type: "USER_PRESSED_STOP",
            repitions: document.getElementById('repitions').value,
        }
    }, function(response) {
        console.log("popup.js: Response: ", response);
    });
}