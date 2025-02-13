const API_KEY = 'your_mistral_api_key';
const API_URL = "https://api.mistral.ai/v1/chat/completions";

async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Language configuration with prompts and instructions
const languageConfig = {
    en: {
        systemPrompt: "You are a helpful assistant that summarizes articles and provides key insights. Provide a concise summary followed by 3-4 key takeaways or recommendations.",
        outputLang: "in English"
    },
    hi: {
        systemPrompt: "आप एक सहायक सहायक हैं जो लेखों को संक्षेप में प्रस्तुत करता है और प्रमुख अंतर्दृष्टि प्रदान करता है। एक संक्षिप्त सारांश और 3-4 प्रमुख टेकअवे या सिफारिशें प्रदान करें।",
        outputLang: "in Hindi (हिंदी में)"
    },
    kn: {
        systemPrompt: "ನೀವು ಲೇಖನಗಳನ್ನು ಸಾರಾಂಶಗೊಳಿಸುವ ಮತ್ತು ಪ್ರಮುಖ ಒಳನೋಟಗಳನ್ನು ನೀಡುವ ಸಹಾಯಕ ಸಹಾಯಕರಾಗಿದ್ದೀರಿ. ಸಂಕ್ಷಿಪ್ತ ಸಾರಾಂಶ ಮತ್ತು 3-4 ಪ್ರಮುಖ ಟೇಕ್‌ಅವೇಗಳು ಅಥವಾ ಶಿಫಾರಸುಗಳನ್ನು ಒದಗಿಸಿ.",
        outputLang: "in Kannada (ಕನ್ನಡದಲ್ಲಿ)"
    },
    ta: {
        systemPrompt: "நீங்கள் கட்டுரைகளை சுருக்கி முக்கிய நுண்ணறிவுகளை வழங்கும் உதவி உதவியாளர். சுருக்கமான சுருக்கம் மற்றும் 3-4 முக்கிய கருத்துகள் அல்லது பரிந்துரைகளை வழங்கவும்.",
        outputLang: "in Tamil (தமிழில்)"
    },
    te: {
        systemPrompt: "మీరు వ్యాసాలను సంక్షిప్తీకరించి ముఖ్యమైన అంతర్దృష్టులను అందించే సహాయక సహాయకులు. సంక్షిప్త సారాంశం మరియు 3-4 ముఖ్యమైన టేకావేలు లేదా సిఫార్సులను అందించండి.",
        outputLang: "in Telugu (తెలుగులో)"
    },
    ml: {
        systemPrompt: "നിങ്ങൾ ലേഖനങ്ങൾ സംഗ്രഹിക്കുകയും പ്രധാന ഉൾക്കാഴ്ചകൾ നൽകുകയും ചെയ്യുന്ന സഹായ അസിസ്റ്റന്റാണ്. ഒരു ചുരുക്കമായ സംഗ്രഹവും 3-4 പ്രധാന ടേക്ക്എവേകളോ ശുപാർശകളോ നൽകുക.",
        outputLang: "in Malayalam (മലയാളത്തിൽ)"
    },
    es: {
        systemPrompt: "Eres un asistente útil que resume artículos y proporciona ideas clave. Proporciona un resumen conciso seguido de 3-4 conclusiones o recomendaciones clave.",
        outputLang: "in Spanish"
    },
    fr: {
        systemPrompt: "Vous êtes un assistant utile qui résume les articles et fournit des informations clés. Fournissez un résumé concis suivi de 3 à 4 points clés ou recommandations.",
        outputLang: "in French"
    },
    de: {
        systemPrompt: "Sie sind ein hilfreicher Assistent, der Artikel zusammenfasst und wichtige Einblicke liefert. Geben Sie eine prägnante Zusammenfassung gefolgt von 3-4 wichtigen Erkenntnissen oder Empfehlungen.",
        outputLang: "in German"
    }
};

async function getArticleContent() {
    const tab = await getCurrentTab();

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const selectors = [
                    'article',
                    '[role="article"]',
                    '.article-content',
                    '.post-content',
                    'main',
                    '.main-content'
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element.textContent.trim();
                    }
                }

                // Fallback to getting visible text from body
                const bodyText = document.body.innerText;
                return bodyText.trim();
            }
        });

        return result;
    } catch (error) {
        console.error('Scripting error:', error);
        throw new Error('Failed to extract content from page');
    }
}

async function summarizeContent(content) {
    try {
        // Get the selected language
        const selectedLang = document.getElementById('language-select').value;
        const langConfig = languageConfig[selectedLang] || languageConfig.en;

        console.log(`Summarizing in language: ${selectedLang}`);

        const messages = [{
                role: "system",
                content: langConfig.systemPrompt
            },
            {
                role: "user",
                content: `Please summarize the following article and provide key takeaways ${langConfig.outputLang}: ${content.substring(0, 4000)}`
            }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Summarization error:', error);
        throw error;
    }
}

function updateUI(summary) {
    try {

        const parts = summary.split('\n\n');
        const mainSummary = parts[0];

        const recommendations = parts
            .slice(1)
            .join('\n')
            .split('\n')
            .filter(line => line.trim().length > 0);

        // Update summary text
        document.getElementById('summary-text').textContent = mainSummary;

        // Update recommendations list
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = '';
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec.replace(/^[•-]\s*/, '');
            recommendationsList.appendChild(li);
        });
    } catch (error) {
        console.error('UI update error:', error);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {


    const summarizeBtn = document.getElementById('summarize-btn');
    const loadingSpinner = document.getElementById('loading');
    const summaryContainer = document.getElementById('summary-container');

    if (!summarizeBtn || !loadingSpinner || !summaryContainer) {
        console.error('Required elements not found');
        return;
    }

    summarizeBtn.addEventListener('click', async() => {
        console.log('Summarize button clicked');

        try {
            // Show loading state
            loadingSpinner.style.display = 'block';
            summaryContainer.style.display = 'none';
            summarizeBtn.disabled = true;

            // Get and summarize content
            console.log('Getting article content...');
            const content = await getArticleContent();
            console.log('Content retrieved, getting summary...');
            const summary = await summarizeContent(content);

            // Update UI with results
            console.log('Updating UI with summary');
            updateUI(summary);
        } catch (error) {
            console.error('Process error:', error);
            document.getElementById('summary-text').textContent =
                `Error: ${error.message}. Please try again.`;
        } finally {
            // Hide loading state
            loadingSpinner.style.display = 'none';
            summaryContainer.style.display = 'block';
            summarizeBtn.disabled = false;
        }
    });
});

class SummaryManager {
    constructor() {
        this.currentLanguage = 'en';
        this.summaryLength = 'medium';
        this.history = [];
        this.initializeFeatures();
    }

    initializeFeatures() {
        // Language selector
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
        });

        // Summary length selector
        document.getElementById('summary-length').addEventListener('change', (e) => {
            this.summaryLength = e.target.value;
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Copy button
        document.getElementById('copy-summary').addEventListener('click', () => this.copyToClipboard());

        // Share button
        document.getElementById('share-summary').addEventListener('click', () => this.shareSummary());

        // Notes saving
        document.getElementById('save-notes').addEventListener('click', () => this.saveNotes());

        // PDF download
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());

        // History
        document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
    }

    async summarizeWithCustomization(content) {
        const lengthPrompts = {
            short: "Provide a very concise summary in 2-3 sentences and 2 key points.",
            medium: "Provide a balanced summary and 3-4 key takeaways.",
            long: "Provide a detailed summary with 5-6 comprehensive key points and analysis."
        };

        const systemPrompt = `You are a helpful assistant that summarizes articles. ${lengthPrompts[this.summaryLength]} Respond in ${this.currentLanguage} language.`;


    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    async copyToClipboard() {
        const summaryText = document.getElementById('summary-text').textContent;
        await navigator.clipboard.writeText(summaryText);
        this.showToast('Summary copied to clipboard!');
    }

    async shareSummary() {
        const summaryText = document.getElementById('summary-text').textContent;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Article Summary',
                    text: summaryText
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        }
    }

    saveNotes() {
        const notes = document.getElementById('user-notes').value;
        const url = this.currentUrl;

        chrome.storage.local.get(['savedNotes'], function(result) {
            const savedNotes = result.savedNotes || {};
            savedNotes[url] = notes;
            chrome.storage.local.set({ savedNotes });
        });

        this.showToast('Notes saved successfully!');
    }

    async downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const summaryText = document.getElementById('summary-text').textContent;
        const recommendations = Array.from(document.getElementById('recommendations-list').children)
            .map(li => li.textContent)
            .join('\n');

        doc.text('Article Summary', 10, 10);
        doc.text(summaryText, 10, 30);
        doc.text('Key Points:', 10, 100);
        doc.text(recommendations, 10, 120);

        doc.save('article-summary.pdf');
    }

    showHistory() {
        const modal = document.getElementById('history-modal');
        const historyList = document.getElementById('history-list');

        chrome.storage.local.get(['summaryHistory'], function(result) {
            const history = result.summaryHistory || [];
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <h4>${item.title}</h4>
                    <p>${item.summary.substring(0, 100)}...</p>
                    <small>${new Date(item.date).toLocaleDateString()}</small>
                </div>
            `).join('');
        });

        modal.style.display = 'block';
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize the enhanced features
document.addEventListener('DOMContentLoaded', () => {
    const manager = new SummaryManager();
    // ... (rest of the initialization code) ...
});

// Add this function to handle language changes
function handleLanguageChange() {
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', (event) => {
        const selectedLang = event.target.value;
        console.log(`Language changed to: ${selectedLang}`);

        // Update placeholder text based on language
        const userNotes = document.getElementById('user-notes');
        const summarizeBtn = document.getElementById('summarize-btn');

        // Update UI text based on selected language
        switch (selectedLang) {
            case 'hi':
                userNotes.placeholder = "अपनी टिप्पणियाँ यहाँ जोड़ें...";
                summarizeBtn.textContent = "सारांश करें";
                break;
            case 'kn':
                userNotes.placeholder = "ನಿಮ್ಮ ಟಿಪ್ಪಣಿಗಳನ್ನು ಇಲ್ಲಿ ಸೇರಿಸಿ...";
                summarizeBtn.textContent = "ಸಾರಾಂಶ";
                break;
            case 'ta':
                userNotes.placeholder = "உங்கள் குறிப்புகளை இங்கே சேர்க்கவும்...";
                summarizeBtn.textContent = "சுருக்கம்";
                break;
            case 'te':
                userNotes.placeholder = "మీ నోట్స్ ఇక్కడ జోడించండి...";
                summarizeBtn.textContent = "సారాంశం";
                break;
            case 'ml':
                userNotes.placeholder = "നിങ്ങളുടെ കുറിപ്പുകൾ ഇവിടെ ചേർക്കുക...";
                summarizeBtn.textContent = "സംഗ്രഹം";
                break;
            default:
                userNotes.placeholder = "Add your notes here...";
                summarizeBtn.textContent = "Summarize Article";
        }
    });
}

// Initialize language handling when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    handleLanguageChange();
});


//for closing the extension 
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Close button functionality
    const closeButton = document.getElementById('close-btn');
    closeButton.addEventListener('click', function() {
        window.close();
    });

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Summarize button functionality
    const summarizeBtn = document.getElementById('summarize-btn');
    const loadingSpinner = document.getElementById('loading');
    const summaryText = document.getElementById('summary-text');
    const recommendationsList = document.getElementById('recommendations-list');

    summarizeBtn.addEventListener('click', async() => {
        loadingSpinner.style.display = 'flex';

        try {
            // Get the selected language and summary length
            const language = document.getElementById('language-select').value;
            const summaryLength = document.getElementById('summary-length').value;

            // Get the current tab's content
            chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
                const tab = tabs[0];

                // Send message to content script to get page content
                chrome.tabs.sendMessage(tab.id, { action: "getContent" }, async function(response) {
                    if (response && response.content) {
                        // Simulate API call with timeout
                        setTimeout(() => {
                            // Update summary
                            summaryText.textContent = "This is a sample summary of the article...";

                            // Update recommendations
                            recommendationsList.innerHTML = `
                                <li>Key point 1</li>
                                <li>Key point 2</li>
                                <li>Key point 3</li>
                            `;

                            loadingSpinner.style.display = 'none';

                            // Save to history
                            saveToHistory({
                                url: tab.url,
                                title: tab.title,
                                summary: summaryText.textContent,
                                date: new Date().toISOString()
                            });
                        }, 1500);
                    }
                });
            });
        } catch (error) {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            summaryText.textContent = 'Error generating summary. Please try again.';
        }
    });

    // Copy summary functionality
    const copyButton = document.getElementById('copy-summary');
    copyButton.addEventListener('click', () => {
        const summaryText = document.getElementById('summary-text').textContent;
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text:', err);
            });
    });

    // Share functionality
    const shareButton = document.getElementById('share-summary');
    shareButton.addEventListener('click', () => {
        const summaryText = document.getElementById('summary-text').textContent;
        if (navigator.share) {
            navigator.share({
                title: 'Article Summary',
                text: summaryText
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            alert('Share functionality is not supported in this browser');
        }
    });

    // Save notes functionality
    const saveNotesButton = document.getElementById('save-notes');
    const userNotes = document.getElementById('user-notes');

    saveNotesButton.addEventListener('click', () => {
        const notes = userNotes.value;
        chrome.storage.local.set({ 'userNotes': notes }, function() {
            saveNotesButton.textContent = 'Saved!';
            setTimeout(() => {
                saveNotesButton.textContent = 'Save Notes';
            }, 2000);
        });
    });

    // History functionality
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');

    historyBtn.addEventListener('click', () => {
        historyModal.style.display = 'block';
        displayHistory();
    });

    // Download PDF functionality
    const downloadPdfButton = document.getElementById('download-pdf');
    downloadPdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const summary = document.getElementById('summary-text').textContent;
        const notes = document.getElementById('user-notes').value;

        doc.text('Article Summary', 20, 20);
        doc.text(summary, 20, 30);

        if (notes) {
            doc.text('Notes:', 20, 90);
            doc.text(notes, 20, 100);
        }

        doc.save('article-summary.pdf');
    });

    // Helper function to save to history
    function saveToHistory(data) {
        chrome.storage.local.get(['summaryHistory'], function(result) {
            let history = result.summaryHistory || [];
            history.unshift(data);
            // Keep only last 10 items
            history = history.slice(0, 10);
            chrome.storage.local.set({ 'summaryHistory': history });
        });
    }

    // Helper function to display history
    function displayHistory() {
        chrome.storage.local.get(['summaryHistory'], function(result) {
            const history = result.summaryHistory || [];
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <h4>${item.title}</h4>
                    <p>${new Date(item.date).toLocaleDateString()}</p>
                    <p>${item.summary.substring(0, 100)}...</p>
                </div>
            `).join('');
        });
    }
});


// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Add this to your existing popup.js
