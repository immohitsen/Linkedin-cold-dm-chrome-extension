document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.local.get(['groqApiKey', 'groqModel'], (result) => {
    if (result.groqApiKey) apiKeyInput.value = result.groqApiKey;
    if (result.groqModel) modelSelect.value = result.groqModel;
  });

  saveBtn.addEventListener('click', () => {
    const groqApiKey = apiKeyInput.value.trim();
    const groqModel = modelSelect.value.trim() || 'llama3-8b-8192';

    chrome.storage.local.set({ groqApiKey, groqModel }, () => {
      statusDiv.textContent = 'Settings saved!';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
