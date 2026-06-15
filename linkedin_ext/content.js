chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeProfile") {
    try {
      // Profile page name OR Messaging page name
      const nameEl = document.querySelector('h1.text-heading-xlarge') 
                  || document.querySelector('h2.msg-entity-lockup__entity-title')
                  || document.querySelector('.msg-thread__name');
      const name = nameEl ? nameEl.textContent.trim() : "there";
      
      // Profile page headline OR Messaging page headline
      const headlineEl = document.querySelector('div.text-body-medium')
                      || document.querySelector('.msg-entity-lockup__entity-info');
      const headline = headlineEl ? headlineEl.textContent.trim() : "";

      // About section (usually only on profile page)
      const aboutEl = document.querySelector('div#about ~ div .visually-hidden') || document.querySelector('.display-flex.ph5.pv3 .visually-hidden');
      const about = aboutEl ? aboutEl.textContent.trim() : "";

      sendResponse({ name, headline, about });
    } catch (e) {
      sendResponse({ error: "Failed to scrape profile: " + e.message });
    }
    return true;
  }
  
  if (request.action === "injectDM") {
    try {
      // Find LinkedIn message box (works for both profile popup and full messaging page)
      const messageBox = document.querySelector('.msg-form__contenteditable[contenteditable="true"]') 
                      || document.querySelector('.msg-form__msg-content-container[contenteditable="true"]')
                      || document.querySelector('div.msg-form__contenteditable')
                      || document.querySelector('div[role="textbox"][contenteditable="true"]');
      
      if (messageBox) {
        // Focus the box
        messageBox.focus();
        
        // Select any existing text or empty paragraphs to replace them cleanly
        document.execCommand('selectAll', false, null);
        
        // Insert the new text
        const success = document.execCommand('insertText', false, request.text);
        
        if (!success) {
           // Fallback if execCommand fails
           messageBox.textContent = request.text;
        }

        // Trigger React input events so LinkedIn's UI updates and hides the placeholder
        messageBox.dispatchEvent(new Event('input', { bubbles: true }));
        messageBox.dispatchEvent(new Event('change', { bubbles: true }));
        
        sendResponse({ success: true });
      } else {
        // If message box is not open
        sendResponse({ error: "Could not find chat box. Please make sure the message box is open on the screen." });
      }
    } catch (e) {
      sendResponse({ error: "Failed to inject DM: " + e.message });
    }
    return true;
  }
});
