/**
 * SecureScope Companion — Chrome Service Worker
 * Manages native messaging lifecycle and routes popup requests.
 */

const NATIVE_HOST_ID = 'com.securescope.desktop';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SecureScope Extension] Service worker initialized.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SEND_NATIVE') {
    chrome.runtime.sendNativeMessage(NATIVE_HOST_ID, message.payload, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[SecureScope Extension] Native messaging error:', chrome.runtime.lastError.message);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
          hostNotFound: chrome.runtime.lastError.message.includes('Specified native messaging host not found') ||
                        chrome.runtime.lastError.message.includes('Access to the specified native messaging host is forbidden')
        });
      } else {
        sendResponse({
          success: true,
          data: response
        });
      }
    });

    // Return true to indicate asynchronous response
    return true;
  }
});
