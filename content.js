// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        // Get main content using common article selectors
        const selectors = [
            'article',
            '[role="article"]',
            '.article-content',
            '.post-content',
            'main',
            '.main-content'
        ];

        let content = '';
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                content = element.textContent.trim();
                break;
            }
        }

        // Fallback to body content if no article element found
        if (!content) {
            content = document.body.textContent.trim();
        }

        sendResponse({ content });
    }
    return true;
});