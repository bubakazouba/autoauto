## Installation
* Install Microsoft Edge
* `cp  host/com.my_company.my_app.json ~/Library/Application Support/Microsoft Edge/NativeMessagingHosts`
	* If you are not using MacOS you can find the correct path [here](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/native-messaging?tabs=macos).
* Modify `host.py` path in `com.my_company.my_app.json` if needed
* Open ``edge://extensions` and click "Load Unpacked"
	* Select extension directory in file browser
* Modify extension id to match the extension id shown in `edge://extensions` page
* `pip3 install -r host/requirements.txt`
* Reload extension

## Tests
Run `./host/runtests.sh`