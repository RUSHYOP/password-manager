# SecureVault Browser Extension

A browser extension for auto-filling passwords from your SecureVault password manager.

## Features

- 🔐 Secure password auto-fill
- 🔍 Form detection on login pages
- 🔒 Vault lock/unlock from extension
- 🚀 Quick search for passwords

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Building

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build:extension
   ```

3. The built extension will be in `extension/dist/`

### Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension/dist/` directory

### Loading in Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `extension/dist/` directory

## Architecture

```
extension/
├── manifest.json    # Extension manifest (Chrome MV3)
├── background.ts    # Service worker for extension lifecycle
├── content.ts       # Content script for form detection
├── content.css      # Styles for form indicators
├── popup.html       # Extension popup UI
├── popup.ts         # Popup interaction logic
└── icons/           # Extension icons
```

## Security Notes

- The extension communicates with the main SecureVault app via secure messaging
- Passwords are only decrypted when needed and cleared from memory immediately after use
- No sensitive data is stored in plain text in extension storage
- The vault auto-locks after a configurable period of inactivity

## Building for Production

```bash
npm run build:extension:prod
```

This creates a production-ready ZIP file in `extension/releases/`

## Testing

```bash
npm run test:extension
```

## License

MIT
