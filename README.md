## Installation
* `pip3 install -r host/requirements.txt`
* `cp manifest-template.json manifest.json`
### com.my_company.my_app.json
#### Mac/Linux
* Modify `host.py` path in `com.my_company.my_app.json` if needed
* `cp  host/com.my_company.my_app.json ~/Library/Application Support/Microsoft Edge/NativeMessagingHosts`
    * If you are not using MacOS you can find the correct path [here](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/native-messaging?tabs=macos).
    * If you are using chrome copy the path from [here](https://developer.chrome.com/docs/apps/nativeMessaging/)
#### Windows
* Modify `host.py` path in `com.my_company.my_app.json` to your `host.bat` file path
* run the following command in powershell (run as admin) `REG ADD "HKEY_LOCAL_MACHINE\Software\Google\Chrome\NativeMessagingHosts\com.my_company.my_app" /ve /t REG_SZ /d "D:\GitHub\autoauto\extension\host\com.my_company.my_app.json" /f`
    * You will need to update the path of the json file in the command
### Load extension
* Open `chrome://extensions`
* Enable developer mode
* click `Load Unpacked`
    * Select extension directory in file browser
* Modify extension id in `com.my_company.my_app.json` to match the extension id shown in `chrome://extensions` page
* Reload extension (from `chrome://extensions`)
* Open background page, check console to make sure you have no errors

## Running
Launch Chrome/Edge using the command line so you can see errors from the host process.
### Mac
* `/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge`
* `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome`
### Windows
* https://support.google.com/chrome/a/answer/6271282?hl=en#zippy=%2Cwindows

## Tests
Run `./host/runtests.sh`