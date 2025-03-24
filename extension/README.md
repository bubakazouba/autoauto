# AutoAuto Extension

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd autoauto/extension
   ```

2. Run `npm install` to install dependencies:
   ```bash
   npm install
   ```

3. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```

4. Edit `config.js` and replace the placeholder API key with your actual OpenAI API key:
   ```javascript
   // config.js
   module.exports = {
       openai: {
           apiKey: 'your-openai-api-key-here'
       }
   };
   ```

5. Security Note:
   - The `config.js` file is included in `.gitignore` to prevent accidentally committing your API key
   - Never commit sensitive API keys to version control
   - For production environments, consider using environment variables instead

## Code Coverage

To run tests with code coverage reporting:

```bash
npm run test:coverage
```