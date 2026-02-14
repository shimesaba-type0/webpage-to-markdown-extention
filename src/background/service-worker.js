/**
 * Service Worker - Webpage to Markdown Extension
 * Handles background tasks and message passing
 */

/* global importScripts, storageManager, imageDownloader, fileExporter */

// Import storage modules
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');

// Import export modules
importScripts('../lib/jszip.min.js', '../export/file-exporter.js');

// Translation logic moved to Service Worker (Issue #70)
// No longer importing translator.js to avoid CORS issues

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
      autoTranslate: false,
      downloadImages: false  // Issue #38: Default disabled for user consent
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
    // Forward message to side panel (Issue #80: Improved error handling)
    chrome.runtime.sendMessage(request)
      .then(() => {
        console.log('[Service Worker] Message forwarded to SidePanel successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('[Service Worker] Failed to forward message to SidePanel:', error);
        // Note: SidePanel may not be open yet, which is expected behavior
        // Message will be picked up from storage fallback
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }
});

/**
 * Handle save article request
 * Phase 2: Implement IndexedDB storage with image downloads
 *
 * Architecture Decision (Issue #36):
 * - Primary: Use image data from content-script (metadata.images)
 * - Fallback: Extract from markdown for backward compatibility
 * - This ensures images are reliably captured and stored
 *
 * User Consent (Issue #38):
 * - Check downloadImages setting before downloading
 * - Default is disabled (requires explicit user consent)
 * - Respects copyright and terms of service concerns
 */
async function handleSaveArticle(data) {
  try {
    console.log('[Service Worker] Saving article:', data.metadata.title);

    const { metadata, markdown } = data;

    // Check user consent for image download (Issue #38)
    const settings = await chrome.storage.sync.get({ downloadImages: false });

    // Download images
    let downloadedImages = [];
    let updatedMarkdown = markdown;
    let imageMapping = {};

    if (!settings.downloadImages) {
      console.log('[Service Worker] Image download disabled by user (Issue #38)');
      // Skip image download, save article without images
    } else {
      // Primary: Extract image URLs from metadata (Issue #36)
      let imageUrls = [];
      if (metadata.images && Array.isArray(metadata.images)) {
        imageUrls = metadata.images
          .map(img => img.src)
          .filter(src => src && !src.startsWith('data:'));
        console.log(`[Service Worker] Extracted ${imageUrls.length} images from metadata`);
      }

      // Fallback: Extract from markdown if no images in metadata
      if (imageUrls.length === 0) {
        imageUrls = imageDownloader.extractImageUrls(markdown);
        console.log(`[Service Worker] [FALLBACK] Extracted ${imageUrls.length} images from markdown`);
      }

      // Remove duplicates
      imageUrls = Array.from(new Set(imageUrls));
      console.log(`[Service Worker] Total unique images to download: ${imageUrls.length}`);

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

/**
 * Split markdown into sections by headings
 *
 * Architecture Decision (Issue #70):
 * - Moved from translator.js to Service Worker
 * - Avoids browser-based API calls
 *
 * @param {string} markdown - Markdown content
 * @returns {Array} Array of sections with heading and content
 */
function splitMarkdownIntoSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = [];
  let currentHeading = null;

  for (const line of lines) {
    // Match H1 or H2 headings
    const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentSection.join('\n')
        });
      }

      // Start new section
      currentHeading = line;
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }

  // Save last section
  if (currentSection.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentSection.join('\n')
    });
  }

  return sections;
}

/**
 * Translate a single section using Anthropic API
 *
 * Architecture Decision (Issue #70):
 * - Move API calls to Service Worker to avoid CORS issues
 * - Browsers cannot make direct API calls to Anthropic
 * - Service Workers have no CORS restrictions
 *
 * Bug Fix (Issue #75):
 * - Add 'anthropic-dangerous-direct-browser-access' header
 * - Required when calling Anthropic API from browser context (including Service Workers)
 * - Without this header, API returns 401 authentication_error
 *
 * Bug Fix (Issue #79):
 * - Validate API response structure before accessing data.content[0].text
 * - Check for missing or empty content array
 * - Verify text field exists and is a string
 * - Prevent TypeError from unexpected API response format
 *
 * @param {string} apiKey - Anthropic API key
 * @param {string} sectionContent - Markdown section to translate
 * @param {string} customPrompt - Optional custom prompt
 * @returns {Promise<string>} Translated text
 */
async function translateSectionViaAPI(apiKey, sectionContent, customPrompt = null) {
  let prompt;

  // Use custom prompt if provided
  if (customPrompt && customPrompt.includes('{content}')) {
    prompt = customPrompt.replace('{content}', sectionContent);
  } else {
    // Default prompt
    prompt = `以下のMarkdown形式のテキストを日本語に翻訳してください。

要件:
- Markdown記法はそのまま保持してください
- 見出し、リスト、コードブロック、リンクなどのフォーマットを維持してください
- 自然で読みやすい日本語に翻訳してください
- 技術用語は適切に日本語化してください（例: "function" → "関数"）
- URLやリンクは変更しないでください
- 画像の参照パス（例: ./images/xxx.jpg）は変更しないでください
- コードブロック内のコードは翻訳しないでください

翻訳対象テキスト:
${sectionContent}`;
  }

  const apiEndpoint = 'https://api.anthropic.com/v1/messages';
  const model = 'claude-3-5-sonnet-20241022';

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      // Security: Don't read error body as it may contain sensitive headers (Issue #81)
      console.error('[Service Worker] Anthropic API error:', {
        status: response.status,
        statusText: response.statusText
        // Error body intentionally not logged to prevent API key exposure
      });
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate API response structure (Issue #79)
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('[Service Worker] Invalid Anthropic API response structure:', data);
      throw new Error('Invalid Anthropic API response: missing or empty content array');
    }

    if (!data.content[0] || typeof data.content[0].text !== 'string') {
      console.error('[Service Worker] Missing text in API response:', data.content[0]);
      throw new Error('Invalid Anthropic API response: missing or invalid text field');
    }

    return data.content[0].text;
  } catch (error) {
    console.error('[Service Worker] translateSectionViaAPI error:', error);
    throw error;
  }
}

/**
 * Translate article with AI
 *
 * Bug Fix (Issue #63):
 * - Validate articleId to prevent IndexedDB errors
 * - Add type checking for defense in depth
 *
 * Architecture Change (Issue #70):
 * - Move API calls from translator.js to Service Worker
 * - Avoid CORS issues by calling API from Service Worker context
 */
async function handleTranslateArticle(articleId) {
  try {
    console.log('[Service Worker] Translate article:', articleId);

    // Validate articleId (Issue #63: Defense in depth)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId} (type: ${typeof articleId})`);
    }

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

    // Validate API key format (Issue #70: Move validation to Service Worker)
    if (!settings.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid API key format. Should start with "sk-ant-"');
    }

    if (settings.apiKey.length < 40) {
      throw new Error('API key is too short');
    }

    // Get article from IndexedDB
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.hasTranslation) {
      console.log('[Service Worker] Article already translated, re-translating...');
    }

    // Split markdown into sections (Issue #70: In Service Worker)
    const sections = splitMarkdownIntoSections(article.markdown);
    const translatedSections = [];

    console.log(`[Service Worker] Starting translation of ${sections.length} sections...`);

    // Translate each section (Issue #70: Direct API calls from Service Worker)
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Send progress updates to popup (Issue #79 Item #2)
      try {
        await chrome.runtime.sendMessage({
          action: 'translationProgress',
          articleId,
          progress: {
            current: i + 1,
            total: sections.length,
            heading: section.heading,
            percentage: Math.round(((i + 1) / sections.length) * 100)
          }
        });
      } catch (error) {
        // Expected: Popup may be closed, which is fine
        // Log only unexpected errors for debugging
        if (error.message && !error.message.includes('Receiving end does not exist')) {
          console.warn('[Service Worker] Unexpected progress update error:', {
            section: i + 1,
            total: sections.length,
            error: error.message
          });
        }
      }

      console.log(`[Service Worker] Translating section ${i + 1}/${sections.length}...`);

      try {
        // Call API directly from Service Worker (Issue #70)
        const translated = await translateSectionViaAPI(
          settings.apiKey,
          section.content,
          settings.translationPrompt || null
        );
        translatedSections.push(translated);
      } catch (error) {
        console.error(`[Service Worker] Failed to translate section ${i + 1}:`, error);
        // On error, use original text
        translatedSections.push(section.content);

        // Re-throw if it's an auth error
        if (error.message.includes('401')) {
          throw new Error('API authentication failed. Please check your API key in Settings.');
        }
      }

      // Rate limiting: 500ms delay between sections
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const translatedMarkdown = translatedSections.join('\n\n');

    // Save translation
    await storageManager.saveTranslation(articleId, translatedMarkdown);
    console.log('[Service Worker] Translation saved successfully');

    return {
      articleId,
      translatedMarkdown,
      originalPreserved: settings.preserveOriginal
    };
  } catch (error) {
    // Enhanced error logging (Issue #63, #71: Improve error serialization)
    console.error('[Service Worker] Translation error:', {
      articleId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorString: String(error), // Issue #71: Serialize error properly
      errorType: error.constructor.name
    });
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
    // Improved error messaging (Issue #79 Item #9)
    console.error('[Service Worker] Get articles error:', {
      error: error.message,
      name: error.name,
      stack: error.stack
    });

    // Provide specific error message based on error type
    if (error.name === 'InvalidStateError') {
      throw new Error('Database is not accessible. Please try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('Articles database not found. Please extract an article first.');
    } else if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some articles.');
    } else {
      throw new Error(`Failed to retrieve articles: ${error.message}`);
    }
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
