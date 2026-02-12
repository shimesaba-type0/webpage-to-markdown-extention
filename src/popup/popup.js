/**
 * Popup Script - Webpage to Markdown Extension
 * Handles user interactions in the popup UI
 */

// DOM Elements
const extractBtn = document.getElementById('extract-btn');
const translateBtn = document.getElementById('translate-btn');
const settingsBtn = document.getElementById('settings-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const statusEl = document.getElementById('status');
const articleListEl = document.getElementById('article-list');
const articleCountEl = document.getElementById('article-count');

// Event Listeners
extractBtn.addEventListener('click', handleExtract);
translateBtn.addEventListener('click', handleTranslate);
settingsBtn.addEventListener('click', openSettings);
exportAllBtn.addEventListener('click', exportAll);

// Initialize popup
init();

/**
 * Initialize popup on load
 */
async function init() {
  console.log('[Popup] Initializing...');

  // Load settings
  const settings = await chrome.storage.sync.get({
    enableTranslation: false
  });

  // Show/hide translation button based on settings
  if (settings.enableTranslation) {
    translateBtn.style.display = 'flex';
  }

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
        // Set flag to indicate we want to display content
        await chrome.storage.local.set({ pendingExtraction: true });

        // Open side panel
        await chrome.sidePanel.open({ windowId: tab.windowId });

        // Send data to side panel
        setTimeout(async () => {
          const { metadata, markdown } = result.data;
          await chrome.runtime.sendMessage({
            action: 'displayMarkdown',
            data: { metadata, markdown }
          });
        }, 500);

        // Close popup
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

      if (settings.enableTranslation && settings.autoTranslate && result.data && result.data.articleId) {
        setTimeout(() => {
          handleTranslate(result.data.articleId);
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
 */
async function handleTranslate(articleId) {
  try {
    showStatus('Translating to Japanese...', 'loading');
    translateBtn.disabled = true;

    if (!articleId) {
      throw new Error('No article selected for translation');
    }

    // Send translate request to background script
    const response = await chrome.runtime.sendMessage({
      action: 'translateArticle',
      articleId: articleId
    });

    if (response.success) {
      showStatus('✓ Translation completed!', 'success');
      loadSavedArticles();
    } else {
      throw new Error(response.error || 'Translation failed');
    }
  } catch (error) {
    console.error('[Popup] Translation error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  } finally {
    translateBtn.disabled = false;
  }
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
 * Load and display saved articles
 */
async function loadSavedArticles() {
  try {
    // Load from IndexedDB via background script
    const response = await chrome.runtime.sendMessage({
      action: 'getArticles'
    });

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
        const articleId = parseInt(btn.dataset.id);
        viewArticle(articleId);
      });
    });

    document.querySelectorAll('.translate-article-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id);
        await translateArticle(articleId);
      });
    });

    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id);
        await exportArticle(articleId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const articleId = parseInt(btn.dataset.id);
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

    if (!response.success) {
      throw new Error(response.error || 'Failed to get article');
    }

    if (!response.article) {
      throw new Error('Article data is empty');
    }

    console.log('[Popup] Article metadata:', response.article.metadata);
    console.log('[Popup] Article markdown length:', response.article.markdown?.length);

    // Store article data for side panel to load
    const viewingArticle = {
      metadata: response.article.metadata,
      markdown: response.article.markdown
    };

    console.log('[Popup] Storing viewingArticle:', viewingArticle);

    await chrome.storage.local.set({ viewingArticle });

    // Open side panel
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // Close popup
    window.close();
  } catch (error) {
    console.error('[Popup] View article error:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

/**
 * Translate single article
 */
async function translateArticle(articleId) {
  try {
    showStatus('Translating article...', 'loading');

    const response = await chrome.runtime.sendMessage({
      action: 'translateArticle',
      articleId
    });

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
