// Extension background script
// Ye directly Groq API ko call nahi karega, ye hamare python backend ko call karega

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateDM") {
    handleGenerateDM(request.data, sendResponse);
    return true; // Indicates we will send response asynchronously
  }
});

async function handleGenerateDM(data, sendResponse) {
  try {
    const { length, style, context, profileData, resumeBase64 } = data;

    // Replace the URL below with your actual Render deployment URL
    const BACKEND_URL = 'https://linkedin-cold-dm-chrome-extension.onrender.com';

    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        length: length,
        style: style,
        context: context,
        profileData: profileData,
        resumeBase64: resumeBase64 || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    const result = await response.json();
    sendResponse({ text: result.text });

  } catch (error) {
    console.error("Error generating DM:", error);
    sendResponse({ error: "Could not reach the backend. If it's the first request in a while, the server may be waking up (can take ~30s). Please try again." });
  }
}
