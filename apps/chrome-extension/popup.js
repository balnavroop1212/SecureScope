/**
 * SecureScope Companion — Chrome Extension Popup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM References
  const connectionBadge = document.getElementById('connection-badge');
  const connectionStatusText = document.getElementById('connection-status-text');
  const targetUrlInput = document.getElementById('target-url-input');
  const targetSchemeBadge = document.getElementById('target-scheme-badge');
  const targetWarning = document.getElementById('target-warning');
  const consentCheckbox = document.getElementById('consent-checkbox');
  const scanButton = document.getElementById('scan-button');
  const scanBtnSpinner = document.getElementById('scan-btn-spinner');
  const scanBtnText = document.getElementById('scan-btn-text');
  const alertBox = document.getElementById('alert-box');
  const resultsCard = document.getElementById('results-card');
  const hostTroubleshoot = document.getElementById('host-troubleshoot');
  const userPlanLabel = document.getElementById('user-plan-label');

  const modeOptions = document.querySelectorAll('.mode-option');

  // State
  let hostConnected = false;
  let userCanScan = false;
  let currentTabUrl = '';
  let selectedMode = 'normal';

  // 1. Mode Selector Handler
  modeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      modeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        selectedMode = radio.value;
      }
    });
  });

  // 2. Consent and URL validation
  function updateButtonState() {
    const isUrlValid = Boolean(
      currentTabUrl && 
      (currentTabUrl.startsWith('http://') || currentTabUrl.startsWith('https://'))
    );
    const hasConsent = consentCheckbox.checked;

    if (!hostConnected) {
      scanButton.disabled = true;
      return;
    }

    if (!userCanScan) {
      scanButton.disabled = true;
      return;
    }

    scanButton.disabled = !(isUrlValid && hasConsent);
  }

  consentCheckbox.addEventListener('change', updateButtonState);

  targetUrlInput.addEventListener('input', (e) => {
    currentTabUrl = e.target.value.trim();
    validateUrl(currentTabUrl);
    updateButtonState();
  });

  function validateUrl(url) {
    targetWarning.style.display = 'none';
    if (!url) {
      targetSchemeBadge.textContent = 'NONE';
      return;
    }

    try {
      const parsed = new URL(url);
      targetSchemeBadge.textContent = parsed.protocol.replace(':', '').toUpperCase();
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        targetWarning.textContent = 'Only HTTP and HTTPS targets are supported.';
        targetWarning.style.display = 'block';
      }
    } catch {
      targetSchemeBadge.textContent = 'INVALID';
      targetWarning.textContent = 'Enter a valid URL (e.g. https://example.com).';
      targetWarning.style.display = 'block';
    }
  }

  // 3. Query Active Chrome Tab
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        currentTabUrl = tab.url;
        targetUrlInput.value = currentTabUrl;
        validateUrl(currentTabUrl);

        if (currentTabUrl.startsWith('chrome://') || currentTabUrl.startsWith('edge://') || currentTabUrl.startsWith('about:')) {
          targetWarning.textContent = 'Browser internal pages cannot be assessed. Please open a website.';
          targetWarning.style.display = 'block';
        }
      }
    } catch (err) {
      console.warn('Error reading active tab:', err);
    }
  } else {
    // Development fallback
    currentTabUrl = 'https://example.com';
    targetUrlInput.value = currentTabUrl;
    validateUrl(currentTabUrl);
  }

  // 4. Query Native Messaging Host
  function checkNativeStatus() {
    connectionBadge.className = 'badge badge-loading';
    connectionStatusText.textContent = 'Connecting...';

    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      connectionBadge.className = 'badge badge-disconnected';
      connectionStatusText.textContent = 'Not in Chrome';
      userPlanLabel.textContent = 'Chrome runtime required';
      hostTroubleshoot.style.display = 'block';
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'SEND_NATIVE', payload: { type: 'GET_STATUS' } },
      (response) => {
        if (!response || !response.success || !response.data) {
          hostConnected = false;
          userCanScan = false;
          connectionBadge.className = 'badge badge-disconnected';
          connectionStatusText.textContent = 'Desktop Offline';
          hostTroubleshoot.style.display = 'block';
          userPlanLabel.textContent = 'Host Disconnected';
          updateButtonState();
          return;
        }

        const data = response.data;
        hostConnected = true;
        hostTroubleshoot.style.display = 'none';

        if (data.authenticated && data.user) {
          const plan = data.user.plan || 'free';
          userPlanLabel.textContent = `${data.user.name} (${plan.toUpperCase()})`;

          if (plan === 'premium') {
            userCanScan = true;
            connectionBadge.className = 'badge badge-connected';
            connectionStatusText.textContent = 'Desktop PRO';
          } else {
            userCanScan = false;
            connectionBadge.className = 'badge badge-loading';
            connectionStatusText.textContent = 'Desktop (Free)';
            showAlert('SecureScope Pro is required to assess websites via Chrome Extension. Please upgrade in the desktop app.', 'info');
          }
        } else {
          userCanScan = false;
          connectionBadge.className = 'badge badge-loading';
          connectionStatusText.textContent = 'Login Required';
          userPlanLabel.textContent = 'Not logged in';
          showAlert('Please log in to the SecureScope desktop application to use this companion extension.', 'info');
        }

        updateButtonState();
      }
    );
  }

  function showAlert(msg, type = 'error') {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }

  // 5. Handle Scan Trigger
  scanButton.addEventListener('click', async () => {
    hideAlert();
    resultsCard.style.display = 'none';

    if (!currentTabUrl || !consentCheckbox.checked) {
      showAlert('Please enter a target URL and confirm authorized scope.');
      return;
    }

    // Set UI to loading state
    scanButton.disabled = true;
    scanBtnSpinner.style.display = 'inline-block';
    scanBtnText.textContent = 'Assessing Target...';

    chrome.runtime.sendMessage(
      {
        action: 'SEND_NATIVE',
        payload: {
          type: 'START_SCAN',
          url: currentTabUrl,
          mode: selectedMode,
          authorizedScopeConfirmed: true,
        },
      },
      (response) => {
        scanBtnSpinner.style.display = 'none';
        scanBtnText.textContent = 'Assess Website';
        updateButtonState();

        if (!response || !response.success || !response.data) {
          showAlert(response?.error || 'Failed to communicate with SecureScope native host.');
          return;
        }

        const data = response.data;
        if (data.type === 'SCAN_ERROR') {
          showAlert(data.error || 'Assessment failed.');
          return;
        }

        if (data.type === 'SCAN_COMPLETE') {
          // Render results
          resultsCard.style.display = 'flex';
          document.getElementById('results-domain').textContent = data.targetUrl;
          document.getElementById('results-score-badge').textContent = `${data.score} / ${data.grade}`;
          
          const sevs = data.severityCounts || { critical: 0, high: 0, medium: 0, low: 0 };
          document.getElementById('sev-crit-count').textContent = sevs.critical || 0;
          document.getElementById('sev-high-count').textContent = sevs.high || 0;
          document.getElementById('sev-med-count').textContent = sevs.medium || 0;
          document.getElementById('sev-low-count').textContent = sevs.low || 0;

          document.getElementById('results-summary-text').textContent = data.executiveSummary || data.message;
        }
      }
    );
  });

  // Initial check
  checkNativeStatus();
});

