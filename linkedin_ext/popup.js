// Popup UI script for LinkedIn Cold DM extension
// Handles pill selection, character count, suggestion chips, and DM generation.
// The legacy resume‑upload feature has been removed.

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const btnText = generateBtn.querySelector('.btn-text');
  const btnLoader = generateBtn.querySelector('.btn-loader');
  const statusDiv = document.getElementById('status');
  const contextArea = document.getElementById('context');
  const charCount = document.getElementById('charCount');
  const copyBtn = document.getElementById('copyBtn');
  const generatedDM = document.getElementById('generatedDM');
  const outputContainer = document.getElementById('outputContainer');

  // Modern copy‑to‑clipboard logic with visual feedback
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (generatedDM && generatedDM.value) {
        try {
          await navigator.clipboard.writeText(generatedDM.value);

          const copyIcon = copyBtn.querySelector('.copy-icon');
          const checkIcon = copyBtn.querySelector('.check-icon');
          const copyText = copyBtn.querySelector('.copy-text');

          // Transition to copied state
          copyBtn.classList.add('copied');
          if (copyIcon) copyIcon.style.display = 'none';
          if (checkIcon) checkIcon.style.display = 'inline-block';
          if (copyText) copyText.textContent = 'Copied!';

          showStatus('DM copied to clipboard', 'success');

          // Reset feedback after 2 seconds
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            if (copyIcon) copyIcon.style.display = 'inline-block';
            if (checkIcon) checkIcon.style.display = 'none';
            if (copyText) copyText.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          showStatus('Failed to copy. Please select and copy manually.', 'error');
        }
      }
    });
  }

  // Update character count
  function updateCharCount() {
    const len = contextArea.value.length;
    charCount.textContent = `${len} / 300`;
  }
  contextArea.addEventListener('input', updateCharCount);
  updateCharCount();

  // Initialize pill groups (length and style)
  function initPillGroup(groupId, hiddenInputId) {
    const group = document.getElementById(groupId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!group || !hiddenInput) return;
    group.addEventListener('click', (e) => {
      e.preventDefault();
      const btn = e.target.closest('.pill');
      if (!btn) return;
      // Deactivate all
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      // Activate selected
      btn.classList.add('active');
      hiddenInput.value = btn.dataset.value;
    });
  }
  initPillGroup('lengthGroup', 'length');
  initPillGroup('styleGroup', 'style');

  // Suggestion chips
  const suggestions = document.getElementById('suggestions');
  if (suggestions) {
    suggestions.addEventListener('click', (e) => {
      e.preventDefault();
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const text = chip.dataset.text;
      contextArea.value = text;
      updateCharCount();
      // Highlight selected chip
      suggestions.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  }

  // --- Generate button ---
  generateBtn.addEventListener('click', async () => {
    const length = document.getElementById('length').value;
    const style = document.getElementById('style').value;
    const context = contextArea.value.trim();

    if (!context) {
      showStatus('Please describe why you are reaching out.', 'error');
      contextArea.focus();
      return;
    }

      setLoading(true);
      // Reset output area
      if (outputContainer) {
        outputContainer.style.display = 'none';
      }
      if (generatedDM) {
        generatedDM.value = '';
      }
      showStatus('');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        throw new Error('Open a LinkedIn profile page first.');
      }

      chrome.tabs.sendMessage(tab.id, { action: 'scrapeProfile' }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Could not connect to the page. Please refresh LinkedIn and try again.', 'error');
          setLoading(false);
          return;
        }

        if (response && response.error) {
          showStatus(response.error, 'error');
          setLoading(false);
          return;
        }

        const profileData = response || { name: 'there', headline: '', about: '' };

        chrome.runtime.sendMessage(
          {
            action: 'generateDM',
            data: { length, style, context, profileData }
          },
          (apiResponse) => {
            if (!apiResponse || apiResponse.error) {
              showStatus(apiResponse?.error || 'Something went wrong. Please try again.', 'error');
              setLoading(false);
              return;
            }

            let text = (apiResponse.text || '').trim();
            // Remove any surrounding double quotes, single quotes, or curly quotes
            if ((text.startsWith('"') && text.endsWith('"')) ||
                (text.startsWith("'") && text.endsWith("'")) ||
                (text.startsWith('“') && text.endsWith('”')) ||
                (text.startsWith('‘') && text.endsWith('’'))) {
              text = text.slice(1, -1).trim();
            }

            chrome.tabs.sendMessage(tab.id, { action: 'injectDM', text: text }, (injectResp) => {
                setLoading(false);
                 if (generatedDM) {
                   generatedDM.value = text;
                 }
                 if (outputContainer) {
                   outputContainer.style.display = 'block';
                 }
                 if (injectResp && injectResp.success) {
                   showStatus('✓ DM written to message box. Review and send!', 'success');
                 } else {
                   showStatus(injectResp?.error || 'Make sure the LinkedIn message box is open.', 'error');
                 }              });
          }
        );
      });

    } catch (err) {
      showStatus(err.message, 'error');
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    btnText.hidden = isLoading;
    btnLoader.hidden = !isLoading;
  }

  function showStatus(msg, type = '') {
    statusDiv.textContent = msg;
    statusDiv.className = 'status' + (type ? ` ${type}` : '');
  }
});
