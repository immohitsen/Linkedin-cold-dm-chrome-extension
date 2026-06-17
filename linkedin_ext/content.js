chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeProfile') {
    try {
      // 1. Prioritize profile page name
      // 2. Active mini-chat overlay bubble
      // 3. Active conversation thread in full messaging view
      // 4. General fallbacks
      const nameEl = document.querySelector('h1.text-heading-xlarge') 
                  || document.querySelector('.pv-text-details__left-panel h1')
                  || document.querySelector('.pv-top-card-layout__title')
                  || document.querySelector('main h1')
                  || document.querySelector('.msg-overlay-conversation-bubble--is-focused .msg-entity-lockup__entity-title')
                  || document.querySelector('.msg-overlay-conversation-bubble--open .msg-entity-lockup__entity-title')
                  || document.querySelector('.msg-thread__link--active .msg-thread__name')
                  || document.querySelector('h2.msg-entity-lockup__entity-title')
                  || document.querySelector('.msg-thread__name');
      
      let name = 'there';
      if (nameEl) {
        let rawName = nameEl.textContent.trim();
        // Strip out pronouns like (She/Her)
        rawName = rawName.replace(/\s*\(.*\)/g, '');
        // Strip connection degrees (e.g. • 2nd) and suffixes (e.g. , PhD)
        rawName = rawName.split('•')[0].split(',')[0].trim();
        if (rawName) {
          name = rawName;
        }
      }
      
      // Profile page headline OR Active message lockup headline
      const headlineEl = document.querySelector('div.text-body-medium')
                      || document.querySelector('.pv-text-details__left-panel .text-body-medium')
                      || document.querySelector('.msg-overlay-conversation-bubble--is-focused .msg-entity-lockup__entity-info')
                      || document.querySelector('.msg-overlay-conversation-bubble--open .msg-entity-lockup__entity-info')
                      || document.querySelector('.msg-entity-lockup__entity-info');
      const headline = headlineEl ? headlineEl.textContent.trim() : '';

      // About section (usually only on profile page)
      const aboutEl = document.querySelector('div#about ~ div .visually-hidden') || document.querySelector('.display-flex.ph5.pv3 .visually-hidden');
      const about = aboutEl ? aboutEl.textContent.trim() : '';

      sendResponse({ name, headline, about });
    } catch (e) {
      sendResponse({ error: 'Failed to scrape profile: ' + e.message });
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
