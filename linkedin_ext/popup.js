document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const statusDiv = document.getElementById('status');

  generateBtn.addEventListener('click', async () => {
    const length = document.getElementById('length').value;
    const style = document.getElementById('style').value;
    const context = document.getElementById('context').value;

    if (!context.trim()) {
      showStatus('Please provide some context.', 'error');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Scraping & Generating...';
    showStatus('');

    try {
      // 1. Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes("linkedin.com")) {
        throw new Error("Please open a LinkedIn profile page.");
      }

      // 2. Request profile details from content script
      chrome.tabs.sendMessage(tab.id, { action: "scrapeProfile" }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus("Could not connect to page. Refresh the page and try again.", 'error');
          resetBtn();
          return;
        }

        if (response && response.error) {
          showStatus(response.error, 'error');
          resetBtn();
          return;
        }

        const profileData = response || { name: "there", headline: "" };
        
        // 3. Send to background for API call
        chrome.runtime.sendMessage({
          action: "generateDM",
          data: {
            length,
            style,
            context,
            profileData
          }
        }, (apiResponse) => {
          if (apiResponse.error) {
            showStatus(apiResponse.error, 'error');
            resetBtn();
            return;
          }

          const generatedText = apiResponse.text;

          // 4. Send back to content script to inject
          chrome.tabs.sendMessage(tab.id, {
            action: "injectDM",
            text: generatedText
          }, (injectResp) => {
            if (injectResp && injectResp.success) {
              showStatus("DM injected successfully!", 'success');
            } else {
              showStatus(injectResp?.error || "Failed to inject DM.", 'error');
            }
            resetBtn();
          });
        });
      });

    } catch (err) {
      showStatus(err.message, 'error');
      resetBtn();
    }
  });

  function showStatus(msg, type = '') {
    statusDiv.textContent = msg;
    statusDiv.className = 'status-message ' + type;
  }

  function resetBtn() {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate & Send DM';
  }
});
