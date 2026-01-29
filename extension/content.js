// Content script for Bookmark Deck overlay

let overlay = null;
let iframe = null;

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'bookmark-deck-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('overlay.html');
  iframe.allow = 'clipboard-read; clipboard-write';
  iframe.style.cssText = `
    width: 90%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  `;

  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  // Close on click outside iframe
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', handleEscape);
}

function closeOverlay() {
  if (overlay) {
    document.removeEventListener('keydown', handleEscape);
    overlay.remove();
    overlay = null;
    iframe = null;
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    closeOverlay();
  }
}

function toggleOverlay() {
  if (overlay) {
    closeOverlay();
  } else {
    createOverlay();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleOverlay') {
    toggleOverlay();
  } else if (message.action === 'closeOverlay') {
    closeOverlay();
  }
  return true;
});

// Listen for messages from iframe
window.addEventListener('message', (event) => {
  const { action, data } = event.data || {};
  if (action === 'close-overlay') {
    closeOverlay();
  } else if (action === 'open-url') {
    closeOverlay();
    chrome.runtime.sendMessage({ action: 'openUrl', url: data?.url });
  } else if (action === 'copy-url') {
    // URL already copied to clipboard in iframe, just close
    closeOverlay();
  }
});
