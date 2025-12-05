/**
 * SecureVault Browser Extension - Content Script
 * Handles password form detection and auto-fill functionality
 */

// Types for messages
interface FillPasswordMessage {
  type: 'FILL_PASSWORD';
  username: string;
  password: string;
}

interface GetFormsMessage {
  type: 'GET_FORMS';
}

type ExtensionMessage = FillPasswordMessage | GetFormsMessage;

interface FormInfo {
  hasUsernameField: boolean;
  hasPasswordField: boolean;
  formIndex: number;
  url: string;
}

/**
 * Find all login forms on the page
 */
function findLoginForms(): HTMLFormElement[] {
  const forms: HTMLFormElement[] = [];
  
  // Find all forms with password fields
  document.querySelectorAll('form').forEach((form) => {
    const hasPassword = form.querySelector('input[type="password"]');
    if (hasPassword) {
      forms.push(form as HTMLFormElement);
    }
  });
  
  // Also check for password fields outside forms
  const orphanPasswords = document.querySelectorAll('input[type="password"]:not(form input)');
  if (orphanPasswords.length > 0) {
    // Create a virtual form reference for orphan fields
    orphanPasswords.forEach((pwd) => {
      const container = pwd.closest('div, section, article') as HTMLElement;
      if (container) {
        // @ts-ignore - marking container as a pseudo-form
        container._isVirtualForm = true;
        forms.push(container as unknown as HTMLFormElement);
      }
    });
  }
  
  return forms;
}

/**
 * Find username field in a form (or near a password field)
 */
function findUsernameField(form: HTMLElement): HTMLInputElement | null {
  // Common username field selectors
  const selectors = [
    'input[type="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="login"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
  ];
  
  for (const selector of selectors) {
    const field = form.querySelector(selector) as HTMLInputElement;
    if (field) return field;
  }
  
  // Fallback: first text input before password field
  const passwordField = form.querySelector('input[type="password"]');
  if (passwordField) {
    const allInputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"]'));
    const passwordIndex = Array.from(form.querySelectorAll('input')).indexOf(passwordField as HTMLInputElement);
    
    for (let i = allInputs.length - 1; i >= 0; i--) {
      const input = allInputs[i] as HTMLInputElement;
      const inputIndex = Array.from(form.querySelectorAll('input')).indexOf(input);
      if (inputIndex < passwordIndex) {
        return input;
      }
    }
  }
  
  return null;
}

/**
 * Find password field in a form
 */
function findPasswordField(form: HTMLElement): HTMLInputElement | null {
  return form.querySelector('input[type="password"]') as HTMLInputElement | null;
}

/**
 * Fill credentials into a form
 */
function fillCredentials(username: string, password: string): boolean {
  const forms = findLoginForms();
  
  if (forms.length === 0) {
    console.log('[SecureVault] No login forms found');
    return false;
  }
  
  // Fill the first form found
  const form = forms[0];
  const usernameField = findUsernameField(form);
  const passwordField = findPasswordField(form);
  
  if (!passwordField) {
    console.log('[SecureVault] No password field found');
    return false;
  }
  
  // Fill username if field exists
  if (usernameField && username) {
    usernameField.value = username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Fill password
  passwordField.value = password;
  passwordField.dispatchEvent(new Event('input', { bubbles: true }));
  passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('[SecureVault] Credentials filled successfully');
  return true;
}

/**
 * Get information about forms on the page
 */
function getFormInfo(): FormInfo[] {
  const forms = findLoginForms();
  
  return forms.map((form, index) => ({
    hasUsernameField: !!findUsernameField(form),
    hasPasswordField: !!findPasswordField(form),
    formIndex: index,
    url: window.location.href,
  }));
}

/**
 * Add visual indicator to fillable fields
 */
function addFieldIndicators(): void {
  const forms = findLoginForms();
  
  forms.forEach((form) => {
    const passwordField = findPasswordField(form);
    const usernameField = findUsernameField(form);
    
    [passwordField, usernameField].forEach((field) => {
      if (field && !field.dataset.securevaultIndicator) {
        field.dataset.securevaultIndicator = 'true';
        
        // Add a small icon indicator
        const indicator = document.createElement('div');
        indicator.className = 'securevault-indicator';
        indicator.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        `;
        indicator.title = 'Fill with SecureVault';
        indicator.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Send message to popup to show password selection
          chrome.runtime.sendMessage({ type: 'SHOW_FILL_DIALOG', url: window.location.href });
        });
        
        // Position the indicator
        const fieldRect = field.getBoundingClientRect();
        const parent = field.parentElement;
        if (parent) {
          parent.style.position = 'relative';
          parent.appendChild(indicator);
        }
      }
    });
  });
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'FILL_PASSWORD':
      const success = fillCredentials(message.username, message.password);
      sendResponse({ success });
      break;
      
    case 'GET_FORMS':
      const formInfo = getFormInfo();
      sendResponse({ forms: formInfo });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Initialize on page load
function initialize(): void {
  // Check for login forms after a short delay (for SPAs)
  setTimeout(() => {
    const forms = findLoginForms();
    if (forms.length > 0) {
      addFieldIndicators();
      // Notify background script that we found login forms
      chrome.runtime.sendMessage({
        type: 'LOGIN_FORM_DETECTED',
        url: window.location.href,
        formCount: forms.length,
      });
    }
  }, 1000);
  
  // Watch for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const forms = findLoginForms();
        if (forms.length > 0) {
          addFieldIndicators();
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[SecureVault] Content script loaded');
