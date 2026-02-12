/**
 * Service Worker - Webpage to Markdown Extension
 * Handles background tasks and message passing
 */

/* global importScripts, storageManager, imageDownloader, fileExporter, translator */

// Import storage modules
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');

// Import export modules
importScripts('../lib/jszip.min.js', '../export/file-exporter.js');

// Import translation modules
importScripts('../translation/translator.js');

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
      .then(result => sendResponse({ success: true, ...result }))
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
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'exportArticle') {
    handleExportArticle(request.articleId)
      .then(result => sendResponse({ success: true, result }))
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

    // Return article data for immediate use
    return {
      articleId,
      metadata,
      markdown: updatedMarkdown
    };
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

    // Get settings
    const settings = await chrome.storage.sync.get({
      enableTranslation: false,
      apiKey: '',
      translationPrompt: '',
      preserveOriginal: true
    });

    if (!settings.enableTranslation) {
      throw new Error('Translation feature is disabled. Please enable it in Settings.');
    }

    if (!settings.apiKey) {
      throw new Error('Anthropic API key not configured. Please set it in Settings.');
    }

    // Validate API key
    const validation = translator.validateApiKey(settings.apiKey);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get article from IndexedDB
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.hasTranslation) {
      console.log('[Service Worker] Article already translated, re-translating...');
    }

    // Create translator instance
    const translatorInstance = translator.create(
      settings.apiKey,
      settings.translationPrompt || null
    );

    // Translate markdown
    console.log('[Service Worker] Starting translation...');
    const translatedMarkdown = await translatorInstance.translateMarkdown(
      article.markdown,
      (progress) => {
        // Send progress updates to popup
        chrome.runtime.sendMessage({
          action: 'translationProgress',
          articleId,
          progress
        }).catch(() => {
          // Ignore errors if popup is closed
        });

        console.log(`[Service Worker] Translation progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
      }
    );

    // Save translation
    await storageManager.saveTranslation(articleId, translatedMarkdown);
    console.log('[Service Worker] Translation saved successfully');

    return {
      articleId,
      translatedMarkdown,
      originalPreserved: settings.preserveOriginal
    };
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

    // Get all articles from IndexedDB
    const articles = await storageManager.getAllArticles();

    if (articles.length === 0) {
      throw new Error('No articles to export');
    }

    // Prepare articles data with images
    const articlesData = [];
    for (const article of articles) {
      const images = await storageManager.getArticleImages(article.id);
      articlesData.push({ article, images });
    }

    // Export as ZIP
    const result = await fileExporter.exportMultipleArticles(articlesData);
    console.log('[Service Worker] Export completed:', result);

    return result;
  } catch (error) {
    console.error('[Service Worker] Export error:', error);
    throw error;
  }
}

/**
 * Handle export single article request
 */
async function handleExportArticle(articleId) {
  try {
    console.log('[Service Worker] Export article:', articleId);

    // Get article from IndexedDB
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Get article images
    const images = await storageManager.getArticleImages(articleId);

    // Export as ZIP
    const result = await fileExporter.exportArticle(article, images);
    console.log('[Service Worker] Export completed:', result);

    return result;
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

    // Filter out corrupted articles with missing metadata
    const validArticles = articles.filter(article => {
      if (!article.metadata) {
        console.warn('[Service Worker] Skipping article with missing metadata:', article.id);
        return false;
      }
      if (article.markdown === undefined) {
        console.warn('[Service Worker] Skipping article with missing markdown:', article.id);
        return false;
      }
      return true;
    });

    if (validArticles.length < articles.length) {
      console.warn(`[Service Worker] Filtered out ${articles.length - validArticles.length} corrupted articles`);
    }

    return validArticles;
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

    // Validate article structure
    if (!article.metadata) {
      console.error('[Service Worker] Invalid article structure - missing metadata:', article);
      throw new Error('Article data is corrupted: missing metadata');
    }

    if (article.markdown === undefined) {
      console.error('[Service Worker] Invalid article structure - missing markdown:', article);
      throw new Error('Article data is corrupted: missing markdown');
    }

    console.log('[Service Worker] Retrieved article:', article.metadata.title);

    // Get associated images from IndexedDB (Issue #25)
    const images = await storageManager.getArticleImages(articleId);
    console.log(`[Service Worker] Retrieved ${images.length} images for article`);

    // Return article with images
    return { ...article, images };
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
