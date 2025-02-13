# Smart Brief - Chrome Extension

A powerful Chrome extension that helps you summarize articles using AI. This extension provides quick summaries, key points, and recommendations from any article you're reading.

## Features

- 🌓 Dark/Light theme support
- 📝 Article summarization
- 🔑 Key points extraction
- 🌍 Multi-language support
- 📊 Reading history
- 💾 PDF export option

## Installation

### 1. Clone the Repository

```bash
[git clone https://github.com/yourusername/smart-brief-extension.git](https://github.com/chandankumarm55/SmartBrief-chromeextension.git)
cd smart-brief-extension
```

### 2. Get API Key

1. Visit [Mistral AI Platform](https://console.mistral.ai/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate a new API key
   - For detailed instructions on generating the API key, follow this guide: [How to Get Mistral AI API Key](https://www.merge.dev/blog/mistral-ai-api-key)
5. Copy your API key for later use

### 3. Configure the Extension

1. Open `popup.js` in your code editor
2. Find the `API_KEY` variable (usually near the top of the file)
3. Replace the placeholder with your Mistral AI API key:
```javascript
const API_KEY = 'your-api-key-here';
```

### 4. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the directory containing your extension files
5. The extension should now appear in your Chrome toolbar

## Project Structure

```
smart-brief-extension/
├── manifest.json      # Extension configuration
├── popup.html        # User interface
├── popup.js         # JavaScript functionality
├── styles.css       # Styling
└── README.md        # Documentation
```

### Key Files:

- `manifest.json`: Contains extension configuration and permissions
- `popup.html`: Main UI file with HTML structure
- `popup.js`: Contains all the logic including API calls and summarization
- `styles.css`: Contains all styling including dark/light theme support

## Customization

### Using a Different AI Provider

The extension currently uses Mistral AI, but you can modify the `summarizeContent` function in `popup.js` to use any other AI provider. Here's the general structure:

```javascript
async function summarizeContent(text) {
    try {
        // Replace this with your preferred AI provider's API call
        const response = await fetch('YOUR_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Adjust according to your API's requirements
                messages: [{
                    role: "user",
                    content: `Summarize this article: ${text}`
                }]
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
```

## Troubleshooting

1. **Extension not appearing**: Make sure Developer mode is enabled in chrome://extensions/
2. **API errors**: Verify your API key is correctly set in popup.js
3. **Summarization not working**: Check the console for errors (Right-click extension → Inspect)

## Security Notes

- Never commit your API key to version control
- Consider using environment variables for API keys in production
- Regularly rotate your API keys for security

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Thanks to Mistral AI for providing the summarization API
- Icon credits: Material Icons by Google


