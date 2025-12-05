/**
 * SecureVault Browser Extension - Background Service Worker
 * Handles extension lifecycle and communication between popup and content scripts
 */

// Track which tabs have login forms
const tabsWithLoginForms = new Map<number, { url: string; formCount: number }>();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab?.id) return;
  
  switch (message.type) {
    case 'LOGIN_FORM_DETECTED':
      tabsWithLoginForms.set(sender.tab.id, {
        url: message.url,
        formCount: message.formCount,
      });
      
      // Update badge to show form count
      chrome.action.setBadgeText({
        text: message.formCount.toString(),
        tabId: sender.tab.id,
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#8b5cf6',
        tabId: sender.tab.id,
      });
      break;
      
    case 'SHOW_FILL_DIALOG':
      // Open popup with fill context
      chrome.action.openPopup();
      break;
      
    default:
      break;
  }
  
  sendResponse({ success: true });
  return true;
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabsWithLoginForms.delete(tabId);
});

// Clean up when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabsWithLoginForms.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SecureVault] Extension installed');
    // Could open onboarding page here
  } else if (details.reason === 'update') {
    console.log('[SecureVault] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Export for use in popup
export { tabsWithLoginForms };

console.log('[SecureVault] Background service worker started');
