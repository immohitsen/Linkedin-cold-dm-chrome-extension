// Background service worker for LinkedIn Cold DM extension
// Receives generation requests, forwards them to the remote AI service, and returns the result.

// Set to true for local testing, false for production deployment
const DEV_MODE = false;
const BACKEND_URL = DEV_MODE 
  ? 'http://localhost:8000' 
  : 'https://linkedin-cold-dm-chrome-extension.onrender.com';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateDM') {
    handleGenerateDM(request.data, sendResponse);
    return true; // Indicates we will send response asynchronously
  }
});

async function handleGenerateDM(data, sendResponse) {
  // Extract relevant fields from the request (resume data removed)
  const { length, style, context, profileData } = data;

  const body = JSON.stringify({
    length,
    style,
    context,
    profileData,
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
