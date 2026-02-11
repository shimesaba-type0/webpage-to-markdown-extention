/**
 * Service Worker - Webpage to Markdown Extension
 * Handles background tasks and message passing
 */

/* global importScripts, storageManager, imageDownloader */

// Import storage modules
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');

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

  if (request.action === 'getArticle') {
    handleGetArticle(request.articleId)
      .then(article => sendResponse({ success: true, article }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'deleteArticle') {
    handleDeleteArticle(request.articleId)
      .then(result => sendResponse({ success: true, result }))
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
 * Phase 2: Implement IndexedDB storage with image downloads
 */
async function handleSaveArticle(data) {
  try {
    console.log('[Service Worker] Saving article:', data.metadata.title);

    const { metadata, markdown } = data;

    // Extract image URLs from markdown
    const imageUrls = imageDownloader.extractImageUrls(markdown);
    console.log(`[Service Worker] Found ${imageUrls.length} images to download`);

    // Download images
    let downloadedImages = [];
    let updatedMarkdown = markdown;
    let imageMapping = {};

    if (imageUrls.length > 0) {
      try {
        downloadedImages = await imageDownloader.downloadImages(imageUrls);
        console.log(`[Service Worker] Downloaded ${downloadedImages.filter(i => i.success).length} images`);

        // Create image mapping for markdown update
        downloadedImages.forEach((img, index) => {
          if (img.success) {
            const localPath = imageDownloader.generateLocalPath(img.originalUrl, index);
            imageMapping[img.originalUrl] = localPath;
          }
        });

        // Update markdown with local paths
        updatedMarkdown = imageDownloader.updateMarkdownImagePaths(markdown, imageMapping);
      } catch (error) {
        console.error('[Service Worker] Image download error:', error);
        // Continue without images
      }
    }

    // Save article to IndexedDB
    const articleId = await storageManager.saveArticle({
      metadata,
      markdown: updatedMarkdown,
      images: downloadedImages.filter(i => i.success)
    });

    // Save images to IndexedDB
    for (const img of downloadedImages.filter(i => i.success)) {
      try {
        await storageManager.saveImage(articleId, {
          originalUrl: img.originalUrl,
          blob: img.blob,
          mimeType: img.mimeType,
          localPath: imageMapping[img.originalUrl]
        });
      } catch (error) {
        console.error('[Service Worker] Image save error:', error);
      }
    }

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

    const articles = await storageManager.getAllArticles();
    console.log(`[Service Worker] Retrieved ${articles.length} articles`);

    return articles;
  } catch (error) {
    console.error('[Service Worker] Get articles error:', error);
    throw error;
  }
}

/**
 * Handle get single article request
 */
async function handleGetArticle(articleId) {
  try {
    console.log('[Service Worker] Get article:', articleId);

    const article = await storageManager.getArticle(articleId);

    if (!article) {
      throw new Error('Article not found');
    }

    console.log('[Service Worker] Retrieved article:', article.metadata.title);

    return article;
  } catch (error) {
    console.error('[Service Worker] Get article error:', error);
    throw error;
  }
}

/**
 * Handle delete article request
 */
async function handleDeleteArticle(articleId) {
  try {
    console.log('[Service Worker] Delete article:', articleId);

    await storageManager.deleteArticle(articleId);
    console.log('[Service Worker] Article deleted successfully');

    return true;
  } catch (error) {
    console.error('[Service Worker] Delete article error:', error);
    throw error;
  }
}

console.log('[Service Worker] Loaded successfully');
