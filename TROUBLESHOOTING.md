# Troubleshooting Guide

Common issues and solutions for Webpage to Markdown Extension.

## Content Extraction Errors

### "Failed to extract content"

**Symptom**: Content extraction logs show success, but final save fails.

**Logs show**:
```
✅ Starting content extraction...
✅ Content extracted successfully
✅ Markdown conversion completed
✅ Found X images
✅ Metadata collected
❌ [Error occurs here]
```

**Common Causes**:

#### 1. CORS / Cross-Origin Image Loading
**Problem**: Images from external domains blocked by CORS policy.

**Solution**:
- This is expected behavior - images will be marked as failed
- Article will still be saved without the blocked images
- Check Service Worker console for download errors

**Verify**:
```javascript
// In Service Worker DevTools console:
[Service Worker] Downloaded 0/3 images successfully
// Some images may fail due to CORS
```

#### 2. IndexedDB Not Initialized
**Problem**: Database not ready when saving article.

**Solution**:
```
1. Open: chrome://settings/siteData
2. Search for "chrome-extension://"
3. Remove all extension data
4. Reload the extension
```

#### 3. Service Worker Inactive
**Problem**: Service worker crashed or not responding.

**Solution**:
```
1. chrome://extensions/
2. Find "Webpage to Markdown"
3. Click "Service Worker" → Should say "Active"
4. If inactive, click the link to restart it
```

**Verify**:
```javascript
// Service Worker console should show:
[Service Worker] Starting...
[Service Worker] Loaded successfully
```

#### 4. Storage Quota Exceeded
**Problem**: Browser storage full.

**Solution**:
```
1. chrome://settings/siteData
2. Clear some extension data
3. Or use "Export All" to backup and clear articles
```

## Translation Errors

### "Translation feature is disabled"
- Go to Settings (⚙️ icon)
- Check "Enable translation feature"
- Add your Anthropic API key

### "API key not configured"
- Open Settings
- Enter your Anthropic API key (starts with `sk-ant-`)
- Save settings

### "Invalid API key format"
- API key must start with `sk-ant-`
- Get key from: https://console.anthropic.com/
- Paste entire key including `sk-ant-` prefix

### "Translation failed" / API Errors
- Check API key is correct
- Verify you have API credits: https://console.anthropic.com/
- Check network connection
- Try smaller article (API rate limits)

## Service Worker Errors

### "Service worker registration failed. Status code: 15"
**Fixed in v0.1.0+**

If still seeing this:
```bash
./debug-extension.sh
```

Should show:
```
✅ No 'type: module' found
```

If script shows errors, you have old code - pull latest.

### "Module scripts don't support importScripts()"
**Fixed in v0.1.0+**

**Solution**: Clear Chrome cache completely
```
1. Delete extension from chrome://extensions/
2. Clear Service Worker cache: chrome://serviceworker-internals/
3. Restart Chrome
4. Reload extension
```

## Export Errors

### "No articles to export"
- You need to save at least one article first
- Click "Extract & Convert" on a webpage
- Then try "Export All"

### "Export failed"
- Check Downloads permission is granted
- Verify `downloads` permission in manifest.json
- Check browser download folder is writable

### ZIP file is empty
- This shouldn't happen - file a bug report
- Include Service Worker console logs

## UI Issues

### Popup shows "No articles saved yet" but I have articles
- Refresh the popup (close and reopen)
- Check Service Worker console for errors:
  ```javascript
  [Service Worker] Get all articles
  [Service Worker] Retrieved X articles
  ```
- If 0 articles, IndexedDB may be corrupted - see "IndexedDB Not Initialized"

### Side Panel doesn't open
- Check `sidePanel` permission in manifest.json
- Try closing and reopening browser
- Verify Chrome version 114+ (side panel requires newer Chrome)

### Buttons don't work
- Check Content Script is loaded:
  ```
  F12 → Console tab
  Should show: [Webpage to Markdown] Ready
  ```
- If not shown, refresh the page
- Check for JavaScript errors in console

## Debug Commands

### Check Extension Health
```bash
./debug-extension.sh
```

Expected output:
```
✅ All checks passed!
```

### Check Service Worker Status
```
1. chrome://extensions/
2. Find extension
3. Click "Service Worker"
4. Console should show:
   [Service Worker] Starting...
   [Service Worker] Loaded successfully
```

### Check Content Script Loaded
```
F12 on any webpage → Console:
chrome.runtime.sendMessage({action: 'getStatus'})
// Should return: {success: true, ready: true}
```

### Check IndexedDB
```javascript
// In browser console:
indexedDB.databases().then(console.log)
// Should show: WebpageToMarkdownDB
```

### Manual Database Inspection
```
1. F12 → Application tab
2. IndexedDB → WebpageToMarkdownDB
3. Check tables: articles, images
```

## Getting Help

If none of these solutions work:

1. **Run debug script**: `./debug-extension.sh`
2. **Collect logs**:
   - Service Worker console (full output)
   - Content Script console (F12 on page)
   - Any error messages (red text)
3. **Create Issue**: https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues
4. **Include**:
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Full error message
   - Screenshots

## Known Limitations

### Images
- CORS-protected images cannot be downloaded
- Data URLs (base64) are supported
- Very large images may fail (browser limits)

### Translation
- Requires personal Anthropic API key
- Rate limits apply (500ms between sections)
- Very long articles may hit API token limits
- Only translates to Japanese (currently)

### Storage
- Limited by browser IndexedDB quota
- Typically 10-50% of available disk space
- Check usage: chrome://settings/siteData

### Supported Pages
- Works best on article-style content
- May not work on:
  - Single-page applications (SPAs)
  - Pages with heavy JavaScript rendering
  - Pages with anti-scraping measures
  - Login-required content

## Reporting Bugs

When filing a bug report, include:

```
**Extension Version**: 0.1.0
**Chrome Version**: chrome://version/
**Page URL**: https://example.com/article
**Error Message**: [Full error text]
**Console Logs**: [Service Worker + Content Script]
**Steps to Reproduce**:
1. Go to URL
2. Click Extract
3. Error appears
```

Screenshots are very helpful, especially:
- Service Worker DevTools console
- Content Script console (F12 on page)
- Extension error card (chrome://extensions/)
