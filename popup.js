document.addEventListener('DOMContentLoaded', () => {
  const summarizeButton = document.getElementById('summarizeButton');
  
  summarizeButton.addEventListener('click', async () => {
    // Get the selected density
    const selectedDensity = document.querySelector('input[name="density"]:checked').value;
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
      // Construct the prompt based on density
      let densityPrompt;
      switch (selectedDensity) {
        case 'concise':
          densityPrompt = 'Provide a brief, concise summary of this YouTube video: ';
          break;
        case 'balanced':
          densityPrompt = 'Provide a balanced summary with main points and context for this YouTube video: ';
          break;
        case 'detailed':
          densityPrompt = 'Provide a detailed, comprehensive summary of this YouTube video: ';
          break;
      }

      // Send message to background script to handle Gemini tab
      chrome.runtime.sendMessage({
        action: 'initializeGemini',
        prompt: densityPrompt + tab.url
      }, (response) => {
        if (chrome.runtime.lastError) {
          // console.error('Error:', chrome.runtime.lastError);
        } else {
          // console.log('Background script response:', response);
        }
      });
    } else {
      alert('Please open this extension on a YouTube video page.');
    }
  });
});