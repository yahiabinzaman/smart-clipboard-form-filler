// Service Worker for Smart Clipboard Form Filler

// Enable opening the side panel on action click
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Error setting panel behavior:", error));
});

// Logs for verification
console.log("Smart Clipboard Form Filler Service Worker registered.");
