## Installation
* `cp manifest-template.json manifest.json`
* `npm install -g watchify`
* `npm install`

## Run
* `npm start`
* Reload extension (from `chrome://extensions`)

## Load extension
* Open `chrome://extensions`
* Enable developer mode
* click `Load Unpacked`
    * Select `autoauto` (root repo directory) in file browser
* Reload extension (from `chrome://extensions`)
* Open background page, check console to make sure you have no errors

## Tests
Run `npm test`

## Linting
Run ` npm run eslint -- --fix`

## Deploy
`browserify -p tinyify background.js`