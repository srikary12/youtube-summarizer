document.addEventListener('DOMContentLoaded', () => {
  const summarizeButton = document.getElementById('summarizeButton');
  const customPromptTextarea = document.getElementById('customPrompt');
  const useCustomPromptCheckbox = document.getElementById('useCustomPrompt');
  const densityOptions = document.querySelector('.density-options');

  // Load saved settings
  chrome.storage.local.get(['useCustomPrompt', 'customPrompt', 'selectedDensity'], (result) => {
    useCustomPromptCheckbox.checked = result.useCustomPrompt || false;
    customPromptTextarea.value = result.customPrompt || '';
    if (result.selectedDensity) {
        document.querySelector(`input[name="density"][value="${result.selectedDensity}"]`).checked = true;
    }
    toggleInputs();
  });

  // Toggle inputs based on checkbox state
  function toggleInputs() {
    if (useCustomPromptCheckbox.checked) {
      customPromptTextarea.disabled = false;
      densityOptions.style.opacity = '0.5';
      densityOptions.querySelectorAll('input').forEach(input => input.disabled = true);
    } else {
      customPromptTextarea.disabled = true;
      densityOptions.style.opacity = '1';
      densityOptions.querySelectorAll('input').forEach(input => input.disabled = false);
    }
  }

  useCustomPromptCheckbox.addEventListener('change', toggleInputs);

  summarizeButton.addEventListener('click', async () => {
    // Save settings
    const useCustomPrompt = useCustomPromptCheckbox.checked;
    const customPrompt = customPromptTextarea.value.trim();
    const selectedDensity = document.querySelector('input[name="density"]:checked').value;
    chrome.storage.local.set({ useCustomPrompt, customPrompt, selectedDensity });

    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
      let finalPrompt;

      if (useCustomPrompt && customPrompt) {
        finalPrompt = customPrompt + ": " + tab.url;
      } else {
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
        finalPrompt = densityPrompt + tab.url;
      }

      // Send message to background script
      chrome.runtime.sendMessage({ action: 'initializeGemini', prompt: finalPrompt });
    } else {
      alert('Please open this extension on a YouTube video page.');
    }
  });
});