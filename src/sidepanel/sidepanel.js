/**
 * Side Panel Script - Webpage to Markdown Extension
 * Displays markdown preview in browser side panel
 */

/* global marked */

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const emptyState = document.getElementById('empty-state');
const contentView = document.getElementById('content-view');
const errorMessage = document.getElementById('error-message');

const articleTitle = document.getElementById('article-title');
const articleAuthor = document.getElementById('article-author');
const articleDate = document.getElementById('article-date');
const articleUrl = document.getElementById('article-url');

const previewTab = document.getElementById('preview-tab');
const markdownTab = document.getElementById('markdown-tab');
const previewView = document.getElementById('preview-view');
const markdownView = document.getElementById('markdown-view');
const markdownCode = document.getElementById('markdown-code');

const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const retryBtn = document.getElementById('retry-btn');

// State
let currentMarkdown = '';
let currentMetadata = null;

// Initialize
init();

/**
 * Initialize side panel
 */
async function init() {
  console.log('[SidePanel] Initializing...');

  // Setup event listeners
  previewTab.addEventListener('click', () => switchTab('preview'));
  markdownTab.addEventListener('click', () => switchTab('markdown'));
  copyBtn.addEventListener('click', copyMarkdown);
  downloadBtn.addEventListener('click', downloadMarkdown);
  retryBtn.addEventListener('click', extractContent);

  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[SidePanel] Received message:', request.action);

    if (request.action === 'displayMarkdown') {
      displayMarkdown(request.data);
      sendResponse({ success: true });
    }

    if (request.action === 'showError') {
      showError(request.error);
      sendResponse({ success: true });
    }
  });

  // Check if we should auto-extract
  const shouldAutoExtract = await checkPendingExtraction();
  if (shouldAutoExtract) {
    extractContent();
  } else {
    showEmptyState();
  }
}

/**
 * Check if we should automatically extract content
 */
async function checkPendingExtraction() {
  // Check if there's a pending extraction request
  try {
    const result = await chrome.storage.local.get('pendingExtraction');
    if (result.pendingExtraction) {
      await chrome.storage.local.remove('pendingExtraction');
      return true;
    }
  } catch (error) {
    console.error('[SidePanel] Storage check error:', error);
  }
  return false;
}

/**
 * Extract content from current tab
 */
async function extractContent() {
  try {
    showLoadingState();

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Send extract command to content script
    const result = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    if (result.success && result.data) {
      displayMarkdown(result.data);
    } else {
      throw new Error(result.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('[SidePanel] Extract error:', error);
    showError(error.message);
  }
}

/**
 * Display markdown content
 */
function displayMarkdown(data) {
  try {
    const { metadata, markdown } = data;

    currentMarkdown = markdown;
    currentMetadata = metadata;

    // Update metadata
    articleTitle.textContent = metadata.title || 'Untitled';
    articleAuthor.textContent = metadata.author || '';
    articleAuthor.style.display = metadata.author ? 'inline' : 'none';

    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      articleDate.textContent = date.toLocaleDateString();
      articleDate.style.display = 'inline';
    } else {
      articleDate.style.display = 'none';
    }

    if (metadata.url) {
      articleUrl.textContent = metadata.siteName || new URL(metadata.url).hostname;
      articleUrl.href = metadata.url;
      articleUrl.style.display = 'inline';
    } else {
      articleUrl.style.display = 'none';
    }

    // Render markdown
    renderMarkdown(markdown);

    // Show content
    showContentView();

    console.log('[SidePanel] Content displayed successfully');
  } catch (error) {
    console.error('[SidePanel] Display error:', error);
    showError('Failed to display content');
  }
}

/**
 * Render markdown to HTML
 */
function renderMarkdown(markdown) {
  try {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    });

    // Render to HTML
    const html = marked.parse(markdown);

    // Update views
    previewView.innerHTML = html;
    markdownCode.textContent = markdown;
  } catch (error) {
    console.error('[SidePanel] Render error:', error);
    previewView.innerHTML = '<p>Error rendering markdown</p>';
    markdownCode.textContent = markdown;
  }
}

/**
 * Switch between preview and markdown tabs
 */
function switchTab(tab) {
  if (tab === 'preview') {
    previewTab.classList.add('active');
    markdownTab.classList.remove('active');
    previewView.classList.remove('hidden');
    markdownView.classList.add('hidden');
  } else {
    markdownTab.classList.add('active');
    previewTab.classList.remove('active');
    markdownView.classList.remove('hidden');
    previewView.classList.add('hidden');
  }
}

/**
 * Copy markdown to clipboard
 */
async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    showNotification('Copied to clipboard!');
  } catch (error) {
    console.error('[SidePanel] Copy error:', error);
    showNotification('Failed to copy', 'error');
  }
}

/**
 * Download markdown as file
 */
function downloadMarkdown() {
  try {
    const filename = generateFilename(currentMetadata);
    const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });

    showNotification('Download started');
  } catch (error) {
    console.error('[SidePanel] Download error:', error);
    showNotification('Failed to download', 'error');
  }
}

/**
 * Generate filename for markdown download
 */
function generateFilename(metadata) {
  const title = metadata?.title || 'article';
  const sanitized = title
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);
  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitized}-${timestamp}.md`;
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  // Simple notification (can be enhanced with a toast component)
  console.log(`[SidePanel] Notification: ${message}`);

  // Visual feedback on button
  const btn = type === 'error' ? downloadBtn : copyBtn;
  const originalColor = btn.style.color;
  btn.style.color = type === 'error' ? '#d93025' : '#0f9d58';

  setTimeout(() => {
    btn.style.color = originalColor;
  }, 500);
}

/**
 * Show loading state
 */
function showLoadingState() {
  hideAllStates();
  loadingState.classList.remove('hidden');
}

/**
 * Show error state
 */
function showError(message) {
  hideAllStates();
  errorMessage.textContent = message;
  errorState.classList.remove('hidden');
}

/**
 * Show empty state
 */
function showEmptyState() {
  hideAllStates();
  emptyState.classList.remove('hidden');
}

/**
 * Show content view
 */
function showContentView() {
  hideAllStates();
  contentView.classList.remove('hidden');
}

/**
 * Hide all state views
 */
function hideAllStates() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  contentView.classList.add('hidden');
}

console.log('[SidePanel] Script loaded');
