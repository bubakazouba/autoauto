## Installation
* `cp manifest-template.json manifest.json`
* `cp  host/com.my_company.my_app.json ~/Library/Application Support/Microsoft Edge/NativeMessagingHosts`
	* If you are not using MacOS you can find the correct path [here](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/native-messaging?tabs=macos).
	* If you are using chrome copy the path from [here](https://developer.chrome.com/docs/apps/nativeMessaging/)
* Modify `host.py` path in `com.my_company.my_app.json` if needed
* Open `edge://extensions` or `chrome://extensions`
* Enable developer mode (if you are on chrome)
* click `Load Unpacked`
	* Select extension directory in file browser
* Modify extension id to match the extension id shown in `edge://extensions` page
* `pip3 install -r host/requirements.txt`
* If you are on linux:
	* Add `ALL   ALL=NOPASSWD: /Users/sahmoud/extension/host/keyboard_listener.py` in your /etc/sudoers to allow running it with sudo without a password
	* Change your path accordingly
* Reload extension (from `chrome://extensions`)
* Open background page, check console to make sure you have no errors

## Tests
Run `./host/runtests.sh`