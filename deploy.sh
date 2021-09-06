#!/bin/bash
cd extension
browserify -p tinyify background.js -o backgroundbundle.js
browserify -p tinyify content/content.js -o content/contentbundle.js
browserify -p tinyify popup/popup.js -o popup/popupbundle.js
cd ..

rm -rf ../autoautodeployment
mkdir -p ../autoautodeployment
cp manifest.json ../autoautodeployment

mkdir -p ../autoautodeployment/extension
cp extension/backgroundbundle.js ../autoautodeployment/extension
cp extension/background.html ../autoautodeployment/extension

mkdir -p ../autoautodeployment/extension/content
cp extension/content/contentbundle.js ../autoautodeployment/extension/content

mkdir -p ../autoautodeployment/extension/popup
cp extension/popup/popupbundle.js ../autoautodeployment/extension/popup
cp extension/popup/popup.html ../autoautodeployment/extension/popup

mkdir -p ../autoautodeployment/extension/images
cp -r extension/images ../autoautodeployment/extension