/**
 * Service Worker - Webpage to Markdown Extension
 * Handles background tasks and message passing
 */

console.log('[Service Worker] Starting...');

// Extension installation/update handler
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Service Worker] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First install - set default settings
    await chrome.storage.sync.set({
      enableTranslation: false,
      preserveOriginal: true,
      includeMetadata: true,
      autoTranslate: false
    });

    console.log('[Service Worker] Default settings initialized');

    // Open options page on first install (optional)
    // chrome.runtime.openOptionsPage();
  }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', request.action);

  if (request.action === 'saveArticle') {
    handleSaveArticle(request.data)
      .then(result => sendResponse({ success: true, articleId: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }

  if (request.action === 'translateArticle') {
    handleTranslateArticle(request.articleId)
      .then(result => sendResponse({ success: true, translation: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'exportAll') {
    handleExportAll()
      .then(_result => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getArticles') {
    handleGetArticles()
      .then(articles => sendResponse({ success: true, articles }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'displayMarkdown') {
    // Forward message to side panel
    chrome.runtime.sendMessage(request)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Handle save article request
 * Phase 1: Just log the data (IndexedDB implementation in Phase 2)
 */
async function handleSaveArticle(data) {
  try {
    console.log('[Service Worker] Saving article:', data.metadata.title);

    // Phase 1: Log data for testing
    console.log('Article metadata:', data.metadata);
    console.log('Markdown length:', data.markdown.length);
    console.log('Images:', data.images.length);

    // TODO Phase 2: Implement IndexedDB storage
    // - Download images
    // - Update markdown image paths
    // - Save to IndexedDB

    // For now, just return a dummy ID
    const articleId = Date.now();

    console.log('[Service Worker] Article saved with ID:', articleId);

    return articleId;
  } catch (error) {
    console.error('[Service Worker] Save article error:', error);
    throw error;
  }
}

/**
 * Handle translate article request
 * Phase 4: Implement translation with Anthropic API
 */
async function handleTranslateArticle(articleId) {
  try {
    console.log('[Service Worker] Translate article:', articleId);

    // Check if translation is enabled
    const settings = await chrome.storage.sync.get({
      enableTranslation: false,
      apiKey: ''
    });

    if (!settings.enableTranslation) {
      throw new Error('Translation feature is disabled. Please enable it in Settings.');
    }

    if (!settings.apiKey) {
      throw new Error('Anthropic API key not configured. Please set it in Settings.');
    }

    // TODO Phase 4: Implement translation
    // - Get article from IndexedDB
    // - Split into sections
    // - Translate with Anthropic API
    // - Save translation

    throw new Error('Translation feature coming in Phase 4');
  } catch (error) {
    console.error('[Service Worker] Translation error:', error);
    throw error;
  }
}

/**
 * Handle export all articles request
 * Phase 3: Implement ZIP export with JSZip
 */
async function handleExportAll() {
  try {
    console.log('[Service Worker] Export all articles');

    // TODO Phase 3: Implement export
    // - Get all articles from IndexedDB
    // - Create ZIP with JSZip
    // - Download ZIP file

    throw new Error('Export feature coming in Phase 3');
  } catch (error) {
    console.error('[Service Worker] Export error:', error);
    throw error;
  }
}

/**
 * Handle get articles request
 * Phase 2: Implement IndexedDB queries
 */
async function handleGetArticles() {
  try {
    console.log('[Service Worker] Get all articles');

    // TODO Phase 2: Implement IndexedDB queries
    // - Query all articles
    // - Return with metadata

    // For now, return empty array
    return [];
  } catch (error) {
    console.error('[Service Worker] Get articles error:', error);
    throw error;
  }
}

console.log('[Service Worker] Loaded successfully');
