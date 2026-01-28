// Service worker for Bookmark Deck extension

// Handle extension icon click or keyboard shortcut
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle overlay
  chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' }).catch(() => {
    // Content script might not be loaded yet, inject it
    console.log('Content script not ready, message failed');
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openUrl') {
    chrome.tabs.create({ url: message.url });
  }
  return true;
});
