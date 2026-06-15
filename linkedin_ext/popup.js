document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const btnText = generateBtn.querySelector('.btn-text');
  const btnLoader = generateBtn.querySelector('.btn-loader');
  const statusDiv = document.getElementById('status');
  const contextArea = document.getElementById('context');
  const charCount = document.getElementById('charCount');

  // Resume elements
  const uploadZone = document.getElementById('uploadZone');
  const resumeInput = document.getElementById('resumeInput');
  const uploadEmpty = document.getElementById('uploadEmpty');
  const uploadFilled = document.getElementById('uploadFilled');
  const resumeFileName = document.getElementById('resumeFileName');
  const removeResume = document.getElementById('removeResume');

  // In-memory store for this session
  let resumeBase64 = null;

  // --- Pill group logic ---
  function setupPillGroup(groupId, hiddenInputId) {
    const group = document.getElementById(groupId);
    const hiddenInput = document.getElementById(hiddenInputId);
    group.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        hiddenInput.value = pill.dataset.value;
      });
    });
  }

  setupPillGroup('lengthGroup', 'length');
  setupPillGroup('styleGroup', 'style');

  // --- Character counter ---
  contextArea.addEventListener('input', () => {
    const len = contextArea.value.length;
    charCount.textContent = `${len} / 300`;
    if (len > 300) contextArea.value = contextArea.value.slice(0, 300);
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  });

  // --- Suggestion chips ---
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      contextArea.value = chip.dataset.text;
      const len = contextArea.value.length;
      charCount.textContent = `${len} / 300`;
      contextArea.focus();
      contextArea.setSelectionRange(len, len);
    });
  });

  // --- Resume upload ---

  // Restore saved resume from storage on popup open
  chrome.storage.local.get(['resumeBase64', 'resumeFileName'], (result) => {
    if (result.resumeBase64 && result.resumeFileName) {
      resumeBase64 = result.resumeBase64;
      showResumeFilled(result.resumeFileName);
    }
  });

  // Click on upload zone triggers file picker
  uploadZone.addEventListener('click', (e) => {
    // Don't trigger if clicking the remove button
    if (e.target.closest('#removeResume')) return;
    resumeInput.click();
  });

  // File selected
  resumeInput.addEventListener('change', () => {
    const file = resumeInput.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showStatus('Only PDF files are supported.', 'error');
      return;
    }

    if (file.size > 3 * 1024 * 1024) { // 3MB limit
      showStatus('Resume must be under 3MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Strip the data URL prefix ("data:application/pdf;base64,") to get raw base64
      const base64 = e.target.result.split(',')[1];
      resumeBase64 = base64;

      // Persist across popup sessions
      chrome.storage.local.set({ resumeBase64: base64, resumeFileName: file.name });
      showResumeFilled(file.name);
      showStatus('');
    };
    reader.readAsDataURL(file);
  });

  // Remove resume
  removeResume.addEventListener('click', (e) => {
    e.stopPropagation();
    resumeBase64 = null;
    resumeInput.value = '';
    chrome.storage.local.remove(['resumeBase64', 'resumeFileName']);
    uploadFilled.hidden = true;
    uploadEmpty.hidden = false;
  });

  function showResumeFilled(name) {
    resumeFileName.textContent = name;
    uploadEmpty.hidden = true;
    uploadFilled.hidden = false;
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
            data: { length, style, context, profileData, resumeBase64: resumeBase64 || null }
          },
          (apiResponse) => {
            if (!apiResponse || apiResponse.error) {
              showStatus(apiResponse?.error || 'Something went wrong. Please try again.', 'error');
              setLoading(false);
              return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'injectDM', text: apiResponse.text }, (injectResp) => {
              setLoading(false);
              if (injectResp && injectResp.success) {
                showStatus('✓ DM written to message box. Review and send!', 'success');
              } else {
                showStatus(injectResp?.error || 'Make sure the LinkedIn message box is open.', 'error');
              }
            });
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
