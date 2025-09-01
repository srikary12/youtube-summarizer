// console.log('Gemini content script loaded and running');

// Function to find the input element using multiple strategies
function findInputElement() {
    // console.log('Attempting to find input element...');
    
    const selectors = [
        'div[contenteditable="true"]',
        'div[role="textbox"]',
        'textarea',
        '[aria-label*="chat" i]',
        '[aria-label*="message" i]',
        '[aria-label*="prompt" i]',
        '[placeholder*="message" i]',
        '[placeholder*="ask" i]'
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        // console.log(`Searching for selector: ${selector}, found ${elements.length} elements`);
        
        for (const element of elements) {
            // Check if the element is visible
            if (element.offsetParent !== null) {
                // console.log('Found visible input element:', element);
                return element;
            }
        }
    }
    
    // console.log('No input element found');
    return null;
}

// Function to simulate typing and sending
async function typeAndSend(element, text) {
    // console.log('Attempting to type text:', text);
    
    try {
        // Focus the element
        element.focus();
        // console.log('Element focused');

        // Set the text content
        if (element.tagName.toLowerCase() === 'textarea') {
            element.value = text;
        } else {
            element.textContent = text;
        }
        // console.log('Text content set');

        // Short delay for text to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Dispatch events in quick succession
        const events = ['input', 'change', 'keyup'];
        events.forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
        });

        // Brief pause before Enter key events
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate Enter key press quickly
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));

        // Wait a shorter time for the message to be sent
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clear the input only after ensuring the message was sent
        if (element.tagName.toLowerCase() === 'textarea') {
            element.value = '';
        } else {
            element.textContent = '';
        }

        return true;
    } catch (error) {
        // console.error('Error in typeAndSend:', error);
        return false;
    }
}

// Function to wait for the input element
function waitForInput(maxAttempts = 3) {
    // console.log('Starting to wait for input element');
    return new Promise((resolve) => {
        let attempts = 0;
        
        const checkForInput = () => {
            // Only proceed if the document is fully loaded
            if (document.readyState === 'complete') {
                const input = findInputElement();
                if (input) {
                    // Wait a bit more to ensure the chat interface is fully initialized
                    setTimeout(() => {
                        // Verify the element is still valid
                        if (input.isConnected && input.offsetParent !== null) {
                            resolve(input);
                        } else {
                            continueChecking();
                        }
                    }, 500);
                    return;
                }
            }
            
            continueChecking();
        };

        const continueChecking = () => {
            if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkForInput, 1000);
            } else {
                resolve(null);
            }
        };
        
        checkForInput();
    });
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log('Message received:', request);
    
    if (request.action === 'setPrompt') {
        // Handle the prompt
        waitForInput().then(async (inputElement) => {
            if (inputElement) {
                // Add a small delay to ensure the page is fully responsive
                setTimeout(async () => {
                    const success = await typeAndSend(inputElement, request.prompt);
                    sendResponse({ success: success });
                }, 500);
            } else {
                sendResponse({ success: false });
            }
        });
        
        return true; // Keep the message channel open
    }
});


// Initial check to see if the script is running
// console.log('Gemini content script is active, sending ready message.');
chrome.runtime.sendMessage({ action: 'geminiReady' });
