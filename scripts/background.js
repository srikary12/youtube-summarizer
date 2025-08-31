let targetTab = null;

// Initialize the service worker
chrome.runtime.onInstalled.addListener(() => {
    // console.log('YouTube Summarizer extension installed');
});

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log('Background script received message:', request);
    
    if (request.action === 'initializeGemini') {
        // Store the YouTube URL and prompt
        targetTab = {
            prompt: request.prompt,
            attempts: 0,
            scriptInjected: false // Flag to track script injection
        };
        
        // Create Gemini tab
        chrome.tabs.create({ url: 'https://gemini.google.com/app' }, (tab) => {
            targetTab.tabId = tab.id;
            // console.log('Created Gemini tab:', tab.id);
        });
        
        sendResponse({ status: 'initializing' });
        return true;
    } else if (request.action === 'geminiReady') {
        // Content script is ready, send the prompt
        if (targetTab && sender.tab.id === targetTab.tabId) {
            sendPromptToTab(sender.tab.id, targetTab.prompt);
        }
        return true;
    }
});

// Function to inject and execute content script
async function injectContentScript(tabId) {
    // console.log('Injecting content script into tab:', tabId);
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['scripts/gemini-content.js']
        });
        targetTab.scriptInjected = true; // Set the flag
        // console.log('Content script injection successful');
        return true;
    } catch (error) {
        // console.error('Content script injection failed:', error);
        return false;
    }
}

// Function to send prompt to tab
function sendPromptToTab(tabId, prompt, attempt = 1) {
    // console.log(`Sending prompt to tab ${tabId}, attempt ${attempt}`);
    chrome.tabs.sendMessage(tabId, {
        action: 'setPrompt',
        prompt: prompt
    }, (response) => {
        const error = chrome.runtime.lastError;
        if (error || !response || !response.success) {
            // console.log('Attempt failed:', error ? error.message : 'No or unsuccessful response');
            if (attempt < 5) {
                setTimeout(() => sendPromptToTab(tabId, prompt, attempt + 1), 2000);
            }
        } else {
            // console.log('Successfully sent prompt, clearing target tab.');
            targetTab = null; // Clear the target tab to prevent re-injection
        }
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (targetTab && tabId === targetTab.tabId && !targetTab.scriptInjected && changeInfo.status === 'complete') {
        // console.log('Gemini tab loaded, injecting content script...');
        injectContentScript(tabId);
    }
});
