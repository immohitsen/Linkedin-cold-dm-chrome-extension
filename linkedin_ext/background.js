// Background service worker — routes DM generation requests to the backend API

const BACKEND_URL = 'https://linkedin-cold-dm-chrome-extension.onrender.com';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateDM') {
    handleGenerateDM(request.data, sendResponse);
    return true; // Indicates we will send response asynchronously
  }
});

async function handleGenerateDM(data, sendResponse) {
  const { length, style, context, profileData, resumeBase64 } = data;

  const body = JSON.stringify({
    length,
    style,
    context,
    profileData,
    resumeBase64: resumeBase64 || null
  });

  // Retry loop — handles Render free-tier cold starts gracefully
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      sendResponse({ text: result.text });
      return; // Success — exit

    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        // Wait before retrying (server may be waking up)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        // All retries exhausted
        sendResponse({
          error: 'Could not reach the server. It may still be waking up — please try again in a moment.'
        });
      }
    }
  }
}
