console.log("Background script running...");
// Listen for messages from popup and relay to content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.gesture && message.tabId) {
    chrome.tabs.sendMessage(message.tabId, { gesture: message.gesture }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, response: response });
      }
    });
    return true; // Required for async sendResponse
  }
});

// Keep service worker alive
function keepAlive() {
  setInterval(() => {
    console.log("Keeping service worker alive");
  }, 20000);
}

keepAlive();