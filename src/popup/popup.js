/**
 * Popup Script - Webpage to Markdown Extension
 * Handles user interactions in the popup UI
 */

// DOM Elements
const extractBtn = document.getElementById('extract-btn');
// translateBtn removed (Issue #65: Use per-article translate buttons instead)
const settingsBtn = document.getElementById('settings-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const statusEl = document.getElementById('status');
const articleListEl = document.getElementById('article-list');
const articleCountEl = document.getElementById('article-count');
const downloadImagesToggle = document.getElementById('download-images-toggle');

/**
 * Send data to SidePanel with retry logic
 *
 * Bug Fix (Issue #77):
 * - Replace setTimeout race condition with reliable retry mechanism
 * - Try multiple times before falling back to storage
 * - Ensure message delivery before closing popup
 *
 * @param {Object} data - Data to send to SidePanel
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 200)
 * @returns {Promise<boolean>} True if message sent successfully, false otherwise
 */
async function sendToSidePanelWithRetry(data, maxRetries = 3, retryDelay = 200) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await chrome.runtime.sendMessage({
        action: 'displayMarkdown',
        data: data
      });
      console.log(`[Popup] Message sent to SidePanel successfully on attempt ${i + 1}`);
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.warn(`[Popup] SidePanel not ready, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error(`[Popup] Failed to send message after ${maxRetries} attempts:`, error);
        // Fallback: Save to storage for SidePanel to pick up on startup
        try {
          await chrome.storage.local.set({ pendingExtraction: data });
          console.log('[Popup] Data saved to storage as fallback');
        } catch (storageError) {
          console.error('[Popup] Failed to save to storage:', storageError);
        }
        return false;
      }
    }
  }
  return false;
}

/**
 * Validate response from chrome.runtime.sendMessage
 *
 * Bug Fix (Issue #79 Item #4):
 * - Validate response exists and is an object before accessing properties
 * - Prevents TypeError when service worker doesn't respond or returns undefined
 *
 * @param {any} response - Response from sendMessage
 * @param {string} operation - Operation name for error messages
 * @returns {Object} Validated response object
 * @throws {Error} If response is invalid
 */
function validateResponse(response, operation) {
  if (!response || typeof response !== 'object') {
    throw new Error(`${operation}: Service worker did not respond properly (received: ${typeof response})`);
  }
  return response;
}

// Event Listeners
extractBtn.addEventListener('click', handleExtract);
// translateBtn removed (Issue #65)
settingsBtn.addEventListener('click', openSettings);
exportAllBtn.addEventListener('click', exportAll);
downloadImagesToggle.addEventListener('change', handleDownloadImagesToggle);

// Initialize popup
init();

/**
 * Initialize popup on load
 */
async function init() {
  console.log('[Popup] Initializing...');

  // Load settings
  const settings = await chrome.storage.sync.get({
    enableTranslation: false,
    downloadImages: false
  });

  // Translation button removed (Issue #65: Use per-article translate buttons instead)

  // Set download images toggle state (Issue #44 UX improvement)
  downloadImagesToggle.checked = settings.downloadImages;

  // Load saved articles (placeholder for Phase 2)
  loadSavedArticles();
}

/**
 * Handle extract and convert action
 */
async function handleExtract() {
  try {
    showStatus('Extracting content from page...', 'loading');
    extractBtn.disabled = true;

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Check if tab URL is restricted (Issue #52: UX improvement)
    // For restricted pages, silently do nothing (no error message, no side panel)
    const restrictedProtocols = ['chrome:', 'about:', 'chrome-extension:', 'edge:', 'file:'];
    if (restrictedProtocols.some(protocol => tab.url?.startsWith(protocol))) {
      console.log('[Popup] Restricted page detected, skipping extraction:', tab.url);
      hideStatus();
      return; // Silently exit
    }

    // Check if content script is ready
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    } catch (error) {
      throw new Error('Content script not loaded. Please refresh the page and try again.');
    }

    // Send extract command to content script
    showStatus('Converting to Markdown...', 'loading');

    const result = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    if (result.success) {
      showStatus('✓ Content extracted!', 'success');

      // Open side panel and send data
      try {
        // Set flag as fallback (Issue #27: Architecture unification)
        // Primary: Direct message passing
        // Fallback: pendingExtraction flag if SidePanel not ready
        await chrome.storage.local.set({ pendingExtraction: true });

        // Configure side panel to be tab-specific (Issue #24, #43)
        // This ensures the panel only appears for this tab and closes when tab is closed
        if (chrome.sidePanel && chrome.sidePanel.setOptions) {
          await chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'src/sidepanel/sidepanel.html',
            enabled: true
          });
        }

        // Open side panel for this specific tab (Issue #43)
        // Using tabId instead of windowId for better tab-specific behavior
        await chrome.sidePanel.open({ tabId: tab.id });

        // Fix data structure access (Issue #65, #69)
        console.log('[Popup] Result structure:', {
          success: result.success,
          hasMetadata: !!result.metadata,
          hasMarkdown: !!result.markdown,
          hasArticleId: !!result.articleId,
          hasImages: !!result.images
        });

        const { metadata, markdown, articleId } = result;

        // Validate required fields (Issue #69)
        if (!metadata) {
          console.error('[Popup] metadata is undefined. Full result:', result);
          throw new Error('Failed to extract article metadata');
        }

        if (!markdown) {
          console.error('[Popup] markdown is undefined. Full result:', result);
          throw new Error('Failed to extract article content');
        }

        // Send data directly to SidePanel with retry logic (Issue #77)
        const messageData = {
          metadata,
          markdown,
          images: result.images || [], // Integration with Team A (Issue #25)
          articleId
        };

        const sent = await sendToSidePanelWithRetry(messageData);

        if (sent) {
          console.log('[Popup] Content successfully sent to SidePanel');
        } else {
          console.warn('[Popup] SidePanel not ready, content saved to storage as fallback');
        }

        // Close popup after we've done our best to deliver the message (Issue #77)
        window.close();
      } catch (error) {
        console.error('[Popup] Side panel error:', error);
        // Fallback: just show success
        showStatus('✓ Content extracted! Open side panel to view.', 'success');
      }

      // Auto-translate if enabled
      const settings = await chrome.storage.sync.get({
        enableTranslation: false,
        autoTranslate: false
      });

      // Fix data structure access (Issue #65)
      if (settings.enableTranslation && settings.autoTranslate && result.articleId) {
        setTimeout(() => {
          handleTranslate(result.articleId);
        }, 1000);
      }
    } else {
      throw new Error(result.error || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('[Popup] Extract error:', error);
    showStatus(`✗ Error: ${error.message}`, 'error');
  } finally {
    extractBtn.disabled = false;
  }
}

/**
 * Handle translate action
 *
 * Bug Fix (Issue #65):
 * - Add articleId validation to prevent IndexedDB errors
 * - Ensure articleId is a valid positive number
 */
async function handleTranslate(articleId) {
  try {
    // Validate articleId (Issue #65: Defense in depth)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID for translation: ${articleId} (type: ${typeof articleId})`);
    }

    showStatus('Translating to Japanese...', 'loading');
    // translateBtn removed (Issue #65)

    // Send translate request to background script
    const response = await chrome.runtime.sendMessage({
      action: 'translateArticle',
      articleId: articleId
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Translate article');

    if (response.success) {
      showStatus('✓ Translation completed!', 'success');
      loadSavedArticles();
    } else {
      throw new Error(response.error || 'Translation failed');
    }
  } catch (error) {
    console.error('[Popup] Translation error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
  // translateBtn removed (Issue #65)
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Export all articles
 */
async function exportAll() {
  try {
    showStatus('Exporting all articles...', 'loading');

    const response = await chrome.runtime.sendMessage({
      action: 'exportAll'
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Export all');

    if (response.success) {
      showStatus('✓ Export completed!', 'success');
    } else {
      throw new Error(response.error || 'Export failed');
    }
  } catch (error) {
    console.error('[Popup] Export error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Handle download images toggle change
 *
 * UX Improvement (Issue #44):
 * - Make image download setting more discoverable in popup
 * - Previously only available in Options page
 * - Users were confused why images weren't downloading
 */
async function handleDownloadImagesToggle() {
  try {
    const isEnabled = downloadImagesToggle.checked;

    // Save setting to sync storage
    await chrome.storage.sync.set({ downloadImages: isEnabled });

    console.log('[Popup] Download images setting updated:', isEnabled);

    // Show feedback to user
    if (isEnabled) {
      showStatus('✓ Image download enabled', 'success');
    } else {
      showStatus('Image download disabled', 'info');
    }
  } catch (error) {
    console.error('[Popup] Failed to save download images setting:', error);
    showStatus('✗ Failed to save setting', 'error');
    // Revert checkbox state on error
    downloadImagesToggle.checked = !downloadImagesToggle.checked;
  }
}

/**
 * Load and display saved articles
 */
async function loadSavedArticles() {
  try {
    // Load from IndexedDB via background script
    const response = await chrome.runtime.sendMessage({
      action: 'getArticles'
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Get articles');

    if (!response.success) {
      throw new Error(response.error || 'Failed to load articles');
    }

    const articles = response.articles || [];
    articleCountEl.textContent = articles.length;

    if (articles.length === 0) {
      articleListEl.innerHTML = '<p class="empty-message">No articles saved yet</p>';
      exportAllBtn.style.display = 'none';
      return;
    }

    // Get settings to check if translation is enabled
    const settings = await chrome.storage.sync.get({ enableTranslation: false });

    // Render article list
    articleListEl.innerHTML = articles.map(article => `
      <div class="article-item" data-id="${article.id}">
        <div class="article-title">${escapeHtml(article.metadata.title)}</div>
        <div class="article-meta">
          <span>${formatDate(article.metadata.timestamp)}</span>
          <span class="dot">•</span>
          <span>${escapeHtml(article.metadata.siteName || 'Unknown')}</span>
          ${article.hasTranslation ? '<span class="badge">翻訳済み</span>' : ''}
        </div>
        <div class="article-actions">
          <button class="action-btn view-btn" data-id="${article.id}" title="View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          ${settings.enableTranslation && !article.hasTranslation ? `
          <button class="action-btn translate-article-btn" data-id="${article.id}" title="Translate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 8h14M5 8a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h2m-1-1v3"></path>
            </svg>
          </button>` : ''}
          <button class="action-btn export-btn" data-id="${article.id}" title="Export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="action-btn delete-btn" data-id="${article.id}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id, 10);
        viewArticle(articleId);
      });
    });

    document.querySelectorAll('.translate-article-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id, 10);
        // Validate articleId before calling translateArticle (Issue #63)
        if (isNaN(articleId) || articleId <= 0) {
          console.error('[Popup] Invalid article ID for translation:', btn.dataset.id);
          showStatus('Error: Invalid article ID', 'error');
          return;
        }
        await translateArticle(articleId);
      });
    });

    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id, 10);
        await exportArticle(articleId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id, 10);
        await deleteArticle(articleId);
      });
    });

    exportAllBtn.style.display = 'flex';
  } catch (error) {
    console.error('[Popup] Load articles error:', error);
    articleListEl.innerHTML = '<p class="error-message">Failed to load articles</p>';
  }
}

/**
 * View article details
 */
async function viewArticle(articleId) {
  try {
    console.log('[Popup] viewArticle called with ID:', articleId);

    // Get article data
    const response = await chrome.runtime.sendMessage({
      action: 'getArticle',
      articleId
    });

    console.log('[Popup] getArticle response:', response);

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Get article');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get article');
    }

    if (!response.article) {
      throw new Error('Article data is empty');
    }

    console.log('[Popup] Article metadata:', response.article.metadata);
    console.log('[Popup] Article markdown length:', response.article.markdown?.length);

    // Validate article structure (Issue #69)
    if (!response.article.metadata) {
      console.error('[Popup] Article metadata is undefined:', response.article);
      throw new Error('Article data is corrupted: missing metadata');
    }

    if (!response.article.markdown) {
      console.error('[Popup] Article markdown is undefined:', response.article);
      throw new Error('Article data is corrupted: missing content');
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Store article data as fallback for SidePanel init() (Rev2 feedback)
    const viewingArticle = {
      metadata: response.article.metadata,
      markdown: response.article.markdown,
      images: response.article.images || []
    };
    await chrome.storage.local.set({ viewingArticle });

    // Configure side panel to be tab-specific (Issue #24, #43)
    // This ensures the panel only appears for this tab and closes when tab is closed
    if (chrome.sidePanel && chrome.sidePanel.setOptions) {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: 'src/sidepanel/sidepanel.html',
        enabled: true
      });
    }

    // Open side panel for this specific tab (Issue #43)
    // Using tabId instead of windowId for better tab-specific behavior
    await chrome.sidePanel.open({ tabId: tab.id });

    // Send article data directly to SidePanel (Issue #26)
    // This ensures content displays even when SidePanel is already open
    setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({
          action: 'displayMarkdown',
          data: viewingArticle
        });
        console.log('[Popup] displayMarkdown message sent to SidePanel');
      } catch (error) {
        console.error('[Popup] Failed to send message to SidePanel:', error);
      } finally {
        // Close popup after message is sent (Rev2 feedback)
        window.close();
      }
    }, 500);
  } catch (error) {
    console.error('[Popup] View article error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Translate single article
 *
 * Bug Fix (Issue #63):
 * - Validate articleId to prevent IndexedDB errors
 * - Ensure articleId is a valid positive number
 */
async function translateArticle(articleId) {
  try {
    // Validate articleId (Issue #63: Defense in depth)
    if (!articleId || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId}`);
    }

    showStatus('Translating article...', 'loading');

    const response = await chrome.runtime.sendMessage({
      action: 'translateArticle',
      articleId
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Translate article');

    if (!response.success) {
      throw new Error(response.error || 'Failed to translate article');
    }

    showStatus('✓ Translation completed!', 'success');

    // Reload article list to show updated badge
    setTimeout(() => {
      loadSavedArticles();
    }, 1000);
  } catch (error) {
    console.error('[Popup] Translate article error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Export single article
 */
async function exportArticle(articleId) {
  try {
    showStatus('Exporting article...', 'loading');

    const response = await chrome.runtime.sendMessage({
      action: 'exportArticle',
      articleId
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Export article');

    if (!response.success) {
      throw new Error(response.error || 'Failed to export article');
    }

    showStatus(`✓ Exported: ${response.result.filename}`, 'success');
  } catch (error) {
    console.error('[Popup] Export article error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Delete article
 */
async function deleteArticle(articleId) {
  try {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    showStatus('Deleting article...', 'loading');

    const response = await chrome.runtime.sendMessage({
      action: 'deleteArticle',
      articleId
    });

    // Validate response (Issue #79 Item #4)
    validateResponse(response, 'Delete article');

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete article');
    }

    showStatus('✓ Article deleted', 'success');

    // Reload article list
    setTimeout(() => {
      loadSavedArticles();
    }, 500);
  } catch (error) {
    console.error('[Popup] Delete article error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;

  // Auto-hide after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      hideStatus();
    }, 5000);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  statusEl.classList.remove('show');
}

/**
 * Format date for display
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('[Popup] Script loaded');
