# Auto Auto

Auto Auto is a Chrome extension designed to automate browser interactions by recording user actions and replaying them. This extension is particularly useful for repetitive tasks across web applications, with special handling for Google Sheets.


## Installation
* Install the pre-commit githook: `cp extension/githooks/pre-commit .git/hooks/`
* `cp manifest-template.json manifest.json`
* `npm install -g watchify`
* `cd extension && npm install`
* Configure your API keys:
  * Edit `extension/config.js` with your OpenAI API key:
  ```javascript
  module.exports = {
      openai: {
          apiKey: 'your-openai-api-key-here'
      }
  };
  ```

## Load extension (1 time process)
* `cd extension && npm start`
* Open `chrome://extensions`
* Enable developer mode
* click `Load Unpacked`
    * Select `autoauto` (root repo directory) in file browser
* Reload extension (from `chrome://extensions`)
* Open background page, check console to make sure you have no errors

## Development
* `cd extension && npm start`
* Reload extension (from `chrome://extensions`)

## Tests
Run `cd extension && npm test`

## Linting
Run `cd extension && npm run eslint -- --fix`

## Deploy
`./deploy.sh`
