/**
 * SecureVault Browser Extension - Popup Script
 * Handles the extension popup UI and interaction with content scripts
 */

// Get DOM elements
const app = document.getElementById('app')!;
const masterPasswordInput = document.getElementById('masterPassword') as HTMLInputElement;
const unlockBtn = document.getElementById('unlockBtn')!;
const openAppLink = document.getElementById('openApp')!;

// State
let isUnlocked = false;
let passwords: Array<{
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
}> = [];

// Check if vault is unlocked on popup open
async function checkVaultStatus(): Promise<void> {
  // In a real implementation, this would check the encrypted vault in storage
  // For now, we'll simulate with chrome.storage
  const result = await chrome.storage.session.get(['isUnlocked', 'passwords']);
  
  if (result.isUnlocked && result.passwords) {
    isUnlocked = true;
    passwords = result.passwords;
    renderPasswordList();
  } else {
    renderLockScreen();
  }
}

// Render lock screen
function renderLockScreen(): void {
  app.innerHTML = `
    <div class="locked-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <h2>Vault Locked</h2>
      <p>Enter your master password to unlock</p>
      <input type="password" class="unlock-input" placeholder="Master password" id="masterPassword">
      <button class="unlock-btn" id="unlockBtn">Unlock</button>
    </div>
  `;
  
  // Re-attach event listeners
  const newPasswordInput = document.getElementById('masterPassword') as HTMLInputElement;
  const newUnlockBtn = document.getElementById('unlockBtn')!;
  
  newPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleUnlock(newPasswordInput.value);
    }
  });
  
  newUnlockBtn.addEventListener('click', () => {
    handleUnlock(newPasswordInput.value);
  });
  
  newPasswordInput.focus();
}

// Render password list
function renderPasswordList(): void {
  const currentUrl = new URL(window.location.href);
  
  app.innerHTML = `
    <div class="search-container">
      <input type="text" class="search-input" placeholder="Search passwords..." id="searchInput">
    </div>
    <div class="password-list" id="passwordList">
      ${passwords.length === 0 ? `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p>No passwords found</p>
        </div>
      ` : passwords.map(pwd => `
        <div class="password-item" data-id="${pwd.id}">
          <div class="password-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <div class="password-info">
            <div class="password-title">${escapeHtml(pwd.title)}</div>
            <div class="password-username">${escapeHtml(pwd.username)}</div>
          </div>
          <button class="fill-btn" data-id="${pwd.id}">Fill</button>
        </div>
      `).join('')}
    </div>
  `;
  
  // Attach search handler
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    filterPasswords(query);
  });
  
  // Attach fill handlers
  document.querySelectorAll('.fill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.target as HTMLElement).dataset.id;
      if (id) {
        handleFill(id);
      }
    });
  });
  
  searchInput.focus();
}

// Filter passwords by search query
function filterPasswords(query: string): void {
  const items = document.querySelectorAll('.password-item');
  items.forEach(item => {
    const title = item.querySelector('.password-title')?.textContent?.toLowerCase() || '';
    const username = item.querySelector('.password-username')?.textContent?.toLowerCase() || '';
    
    if (title.includes(query) || username.includes(query)) {
      (item as HTMLElement).style.display = 'flex';
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
}

// Handle unlock attempt
async function handleUnlock(password: string): Promise<void> {
  if (!password.trim()) {
    alert('Please enter your master password');
    return;
  }
  
  // In a real implementation, this would decrypt the vault
  // For now, we'll simulate with a placeholder
  try {
    // This would normally fetch and decrypt from chrome.storage.local
    const result = await chrome.storage.local.get(['encryptedVault']);
    
    if (!result.encryptedVault) {
      alert('No vault found. Please set up SecureVault first.');
      return;
    }
    
    // Simulate decryption (in reality, use the crypto functions)
    // For demo purposes, accept any password
    isUnlocked = true;
    
    // Store session state
    await chrome.storage.session.set({ isUnlocked: true, passwords });
    
    renderPasswordList();
  } catch (error) {
    console.error('Unlock failed:', error);
    alert('Failed to unlock vault. Please try again.');
  }
}

// Handle fill action
async function handleFill(passwordId: string): Promise<void> {
  const pwd = passwords.find(p => p.id === passwordId);
  if (!pwd) return;
  
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    
    // Send fill message to content script
    await chrome.tabs.sendMessage(tab.id, {
      type: 'FILL_PASSWORD',
      username: pwd.username,
      password: pwd.password,
    });
    
    // Close popup after filling
    window.close();
  } catch (error) {
    console.error('Fill failed:', error);
    alert('Failed to fill credentials. Make sure you\'re on a page with a login form.');
  }
}

// Utility function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open the main app
openAppLink.addEventListener('click', (e) => {
  e.preventDefault();
  // Open the main SecureVault app (adjust URL as needed)
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

// Handle keyboard events for unlock
masterPasswordInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleUnlock(masterPasswordInput.value);
  }
});

unlockBtn?.addEventListener('click', () => {
  handleUnlock(masterPasswordInput.value);
});

// Initialize
checkVaultStatus();
