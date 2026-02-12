# Privacy Policy for Webpage to Markdown Extension

**Last Updated**: February 12, 2026

## Overview

Webpage to Markdown is a Chrome browser extension that converts web content to Markdown format with optional AI-powered translation. We are committed to protecting your privacy and being transparent about how we handle your data.

## Data We Collect and Use

### 1. Webpage Content
- **What**: Text and images from webpages you choose to convert
- **When**: Only when you explicitly click the "Extract & Convert" button
- **Storage**: Stored locally in your browser's IndexedDB
- **Transmission**:
  - **NOT transmitted** for basic conversion and storage
  - **Transmitted to Anthropic API** only when you use the translation feature
- **Purpose**: To convert webpages to Markdown and provide translation services

### 2. Anthropic API Key
- **What**: Your personal Anthropic API key (if you enable translation)
- **When**: When you enter it in the Settings page
- **Storage**: Stored in Chrome's `chrome.storage.sync` (synchronized with your Google account)
- **Transmission**: Sent directly to Anthropic's servers for authentication during translation
- **Purpose**: To authenticate your translation requests with Anthropic's Claude API

### 3. User Settings
- **What**: Your preferences (translation settings, auto-translate, etc.)
- **Storage**: Stored in Chrome's `chrome.storage.sync`
- **Transmission**: Never transmitted to external servers
- **Purpose**: To remember your preferences across devices

## How We Use Your Data

### Local Operations (No External Transmission)
- Converting webpages to Markdown
- Downloading and storing images
- Saving articles to IndexedDB
- Exporting articles as ZIP files
- Managing your saved articles

### External Transmission (Only When Using Translation)
When you use the AI translation feature:
1. Your article content is sent to **Anthropic's Claude API** (https://api.anthropic.com)
2. Your API key is used to authenticate the request
3. Anthropic processes the text and returns the translation
4. The translation is stored locally in your browser

**Important**: Translation is **optional** and **disabled by default**. You must explicitly:
- Enable the translation feature in Settings
- Provide your own Anthropic API key
- Click the translate button on each article

## Third-Party Services

### Anthropic (Claude AI)
- **Service**: AI-powered translation
- **Data Shared**: Article text content, API key
- **When**: Only when you use the translation feature
- **Privacy Policy**: https://www.anthropic.com/legal/privacy
- **Data Processing**: According to Anthropic's terms and privacy policy

We do **NOT** use any analytics, tracking, or advertising services.

## Permissions We Request

### Required Permissions
- **activeTab**: Read content from the current webpage (only when you click "Extract")
- **storage**: Store articles, images, and settings locally
- **downloads**: Save ZIP files to your computer
- **sidePanel**: Display Markdown preview in side panel

### Host Permissions
- **`<all_urls>`**: Required to:
  - Download images from any website for offline storage
  - Extract content from any webpage you visit

**Note**: We only access pages when you explicitly click the "Extract & Convert" button.

## Data Retention and Deletion

### Local Data
- **Articles and Images**: Stored indefinitely until you delete them
- **How to Delete**:
  - Individual articles: Click the delete button in the popup
  - All data: Use "Clear All Data" button in Settings

### Synchronized Data
- **Settings and API Key**: Stored in Chrome sync until you:
  - Clear the extension data
  - Uninstall the extension
  - Sign out of your Google account

### Anthropic API Data
- We do **NOT** control data retention on Anthropic's servers
- Refer to [Anthropic's Privacy Policy](https://www.anthropic.com/legal/privacy) for their data practices

## Your Rights

You have the right to:
- ✅ **Access**: View all your data in the extension (articles, settings)
- ✅ **Delete**: Remove any or all stored data at any time
- ✅ **Disable**: Turn off translation feature to prevent external transmission
- ✅ **Export**: Download all your data as ZIP files
- ✅ **Uninstall**: Remove the extension completely, which deletes all local data

## Security

- **Local Storage**: All data stored locally uses browser's built-in security
- **API Key**: Stored in Chrome's secure storage, encrypted at rest
- **Transmission**: HTTPS encryption for all external API calls
- **No Cloud Storage**: We do NOT operate any servers or cloud storage

## Children's Privacy

This extension is not intended for users under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy as we add new features. Changes will be:
- Posted to this page with a new "Last Updated" date
- Announced in extension update notes for major changes

## Data Processing Location

- **Local Data**: Processed and stored on your device
- **Translation**: Processed by Anthropic (see their privacy policy for locations)

## Open Source

This extension is open source. You can review our code at:
https://github.com/shimesaba-type0/webpage-to-markdown-extention

## Contact Us

For privacy questions or concerns:
- **GitHub Issues**: https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues
- **Email**: [Your email address]

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Google's User Data Policy
- GDPR principles (data minimization, user control, transparency)

---

**Summary**: We store your data locally, never transmit it to our servers (we don't have any!), and only send article text to Anthropic when you explicitly use the translation feature with your own API key.
