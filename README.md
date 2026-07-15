# SMS Security Voicemail Service

A secure, responsive visitor-parking and voicemail logging application for SMS Security mobile patrol operations.

## Development

```bash
npm install
npm run dev
```

Production build: `npm run build`

Same-Wi-Fi testing: `npm run dev:lan`. Open the Network URL shown by Vite on another device connected to the same Wi-Fi network. Windows Firewall may ask you to allow Node.js on private networks.

## Netlify deployment

The project includes `netlify.toml`, SPA routing, security headers, Netlify Identity authentication, an authenticated Google Apps Script proxy, and API rate limiting.

Configure these Netlify environment variables before deploying:

- `GOOGLE_APPS_SCRIPT_URL`: the deployed Apps Script `/exec` URL
- `GOOGLE_APPS_SCRIPT_SECRET`: a unique random secret of at least 32 characters

Under Apps Script **Project Settings → Script Properties**, add `PROXY_SECRET`, `RECORDS_FOLDER_ID`, and `CONFIG_SPREADSHEET_ID`, then redeploy Apps Script as a new version. These private values are intentionally excluded from source code.

## Google Sheets backend

The backend is in `google-apps-script/Code.gs`. It creates one monthly spreadsheet, one sheet tab per site, and routes each submitted record accordingly.

Never commit passwords, Google credentials, deployment URLs, or private keys.

Created by Jagroop Singh.
