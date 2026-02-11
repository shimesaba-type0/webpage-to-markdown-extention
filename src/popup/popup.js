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
          await chrome.runtime.sendMessage({
            action: 'displayMarkdown',
            data: result.data
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
    // Placeholder: In Phase 2, this will load from IndexedDB
    // For now, show empty state

    const articles = []; // TODO: Load from IndexedDB

    articleCountEl.textContent = articles.length;

    if (articles.length === 0) {
      articleListEl.innerHTML = '<p class="empty-message">No articles saved yet</p>';
      exportAllBtn.style.display = 'none';
      return;
    }

    // Render article list
    articleListEl.innerHTML = articles.map(article => `
      <div class="article-item" data-id="${article.id}">
        <div class="article-title">${escapeHtml(article.title)}</div>
        <div class="article-meta">
          <span>${formatDate(article.timestamp)}</span>
          <span class="dot"></span>
          <span>${article.siteName || 'Unknown'}</span>
        </div>
      </div>
    `).join('');

    // Add click listeners to article items
    document.querySelectorAll('.article-item').forEach(item => {
      item.addEventListener('click', () => {
        const articleId = parseInt(item.dataset.id);
        viewArticle(articleId);
      });
    });

    exportAllBtn.style.display = 'flex';
  } catch (error) {
    console.error('[Popup] Load articles error:', error);
  }
}

/**
 * View article details
 */
function viewArticle(articleId) {
  // TODO: Implement article viewer in Phase 2
  console.log('View article:', articleId);
  showStatus('Article viewer coming in Phase 2', 'info');
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
