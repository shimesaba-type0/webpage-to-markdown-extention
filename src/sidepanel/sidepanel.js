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
let currentBlobUrls = []; // Store blob URLs for cleanup (Issue #25)

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
  if (shouldAutoExtract === true) {
    // pendingExtraction flag was set, extract from current page
    extractContent();
  } else if (shouldAutoExtract === false) {
    // viewingArticle was found and displayed, do nothing
    // (content is already shown by displayMarkdown)
  } else {
    // No pending action, show empty state
    showEmptyState();
  }
}

/**
 * Check if we should automatically extract content or load saved article
 *
 * Architecture (Issue #27):
 * - Primary: Message-based communication (displayMarkdown action)
 * - Fallback: storage.local flags for edge cases (SidePanel reopened, message missed)
 *
 * Returns:
 * - true: Trigger auto-extraction (pendingExtraction flag set)
 * - false: Article displayed from storage (viewingArticle fallback)
 * - null: No action needed (show empty state)
 */
async function checkPendingExtraction() {
  try {
    // FALLBACK: Check storage for article to view (in case message was missed)
    // Primary flow: viewArticle() sends displayMarkdown message directly
    const result = await chrome.storage.local.get('viewingArticle');
    console.log('[SidePanel] Storage check result:', result);

    if (result.viewingArticle) {
      console.log('[SidePanel] [FALLBACK] Loading article from storage:', result.viewingArticle.metadata?.title);
      // Load the saved article
      displayMarkdown(result.viewingArticle);
      // Clear the storage
      await chrome.storage.local.remove('viewingArticle');
      // Return false to indicate article was displayed (don't show empty state)
      return false;
    }

    // Check for pending extraction (Extract & Save flow)
    const extractionResult = await chrome.storage.local.get('pendingExtraction');
    if (extractionResult.pendingExtraction) {
      console.log('[SidePanel] Pending extraction detected, auto-extracting');
      await chrome.storage.local.remove('pendingExtraction');
      // Return true to trigger extraction
      return true;
    }
  } catch (error) {
    console.error('[SidePanel] Storage check error:', error);
  }
  // Return null to indicate no action needed (show empty state)
  return null;
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
      // Extract metadata and markdown from the response
      const { metadata, markdown } = result.data;
      displayMarkdown({ metadata, markdown });
    } else {
      throw new Error(result.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('[SidePanel] Extract error:', error);
    showError(error.message);
  }
}

/**
 * Clean up blob URLs to prevent memory leaks (Issue #25)
 */
function cleanupBlobUrls() {
  for (const url of currentBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('[SidePanel] Failed to revoke blob URL:', url, error);
    }
  }
  currentBlobUrls = [];
  console.log('[SidePanel] Cleaned up blob URLs');
}

/**
 * Display markdown content
 */
function displayMarkdown(data) {
  try {
    console.log('[SidePanel] displayMarkdown called with data:', data);

    // Validate data structure
    if (!data) {
      throw new Error('No data provided to displayMarkdown');
    }

    const { metadata, markdown, images = [] } = data;

    // Validate required fields
    if (!metadata) {
      throw new Error('metadata is undefined in data: ' + JSON.stringify(data));
    }
    if (markdown === undefined) {
      throw new Error('markdown is undefined in data');
    }

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

    // Process images: Convert Blobs to URLs and replace paths (Issue #25)
    let processedMarkdown = markdown;
    if (images && images.length > 0) {
      console.log(`[SidePanel] Processing ${images.length} images`);

      // Clean up old blob URLs to prevent memory leaks
      cleanupBlobUrls();

      // Create blob URLs and build path mapping
      const imageMap = {};
      for (const img of images) {
        if (img.blob && img.localPath) {
          try {
            const blobUrl = URL.createObjectURL(img.blob);
            imageMap[img.localPath] = blobUrl;
            currentBlobUrls.push(blobUrl);
            console.log(`[SidePanel] Mapped ${img.localPath} → ${blobUrl}`);
          } catch (error) {
            console.error('[SidePanel] Failed to create blob URL for image:', img.localPath, error);
          }
        } else {
          // Rev1 feedback: Log warning for invalid images
          console.warn('[SidePanel] Skipping invalid image (missing blob or localPath):', img);
        }
      }

      // Replace image paths in markdown
      for (const [localPath, blobUrl] of Object.entries(imageMap)) {
        processedMarkdown = processedMarkdown.replaceAll(localPath, blobUrl);
      }

      console.log(`[SidePanel] Replaced ${Object.keys(imageMap).length} image paths`);
    }

    // Render markdown
    renderMarkdown(processedMarkdown);

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
    console.log('[SidePanel] renderMarkdown called with markdown length:', markdown?.length);

    if (!markdown) {
      console.warn('[SidePanel] Markdown is empty or undefined');
      previewView.innerHTML = '<p>No content to display</p>';
      markdownCode.textContent = '';
      return;
    }

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

    // Safely update markdown code view
    if (markdownCode) {
      markdownCode.textContent = markdown;
      console.log('[SidePanel] Markdown rendered successfully');
      console.log('[SidePanel] markdownCode.textContent length:', markdownCode.textContent?.length);
    } else {
      console.error('[SidePanel] markdownCode element not found!');
    }
  } catch (error) {
    console.error('[SidePanel] Render error:', error);
    previewView.innerHTML = '<p>Error rendering markdown</p>';
    if (markdownCode) {
      markdownCode.textContent = markdown;
    }
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

    // Convert blob to data URL for compatibility
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;

      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      }, (_downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[SidePanel] Download error:', chrome.runtime.lastError);
          showNotification('Failed to download', 'error');
          return;
        }
        showNotification('Download started');
      });
    };

    reader.onerror = () => {
      console.error('[SidePanel] FileReader error:', reader.error);
      showNotification('Failed to download', 'error');
    };

    reader.readAsDataURL(blob);
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
