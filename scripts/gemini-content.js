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

        // Dispatch multiple events to ensure it's registered
        const events = ['input', 'change', 'keyup'];
        events.forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
            // console.log(`${eventType} event dispatched`);
        });

        // Additional keypress simulation
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        // console.log('Enter key events simulated');

        // Clear the input after a short delay
        setTimeout(() => {
            if (element.tagName.toLowerCase() === 'textarea') {
                element.value = '';
            } else {
                element.textContent = '';
            }
            // console.log('Input cleared');
        }, 300);

        return true;
    } catch (error) {
        // console.error('Error in typeAndSend:', error);
        return false;
    }
}

// Function to wait for the input element
function waitForInput(maxAttempts = 40) {
    // console.log('Starting to wait for input element');
    return new Promise((resolve) => {
        let attempts = 0;
        
        const checkForInput = () => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                const input = findInputElement();
                if (input) {
                    // console.log('Input element found, resolving promise');
                    resolve(input);
                    return;
                }
            }

            if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkForInput, 1000);
            } else {
                // console.log('Max attempts reached, resolving with null');
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
