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

// View Controls (Issue #51)
const reloadBtn = document.getElementById('reload-btn');
const fontSelect = document.getElementById('font-select');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');

// State
let currentMarkdown = '';
let currentMetadata = null;
let currentBlobUrls = []; // Store blob URLs for cleanup (Issue #25)
let currentFontSize = 100; // Percentage (Issue #51)

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

  // View controls event listeners (Issue #51)
  reloadBtn.addEventListener('click', reloadCurrentArticle);
  fontSelect.addEventListener('change', handleFontChange);
  fontDecreaseBtn.addEventListener('click', () => adjustFontSize(-10));
  fontIncreaseBtn.addEventListener('click', () => adjustFontSize(10));

  // Load saved view preferences (Issue #51)
  loadViewPreferences();

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
 *
 * Bug Fix (Issue #45):
 * - Check if content script is available before sending message
 * - Provide user-friendly error messages for different failure scenarios
 * - Handle restricted pages (chrome://, about:, extension://) gracefully
 */
async function extractContent() {
  try {
    showLoadingState();

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Check if tab URL is restricted (Issue #52: UX improvement)
    // For restricted pages, silently do nothing (no error message)
    const restrictedProtocols = ['chrome:', 'about:', 'chrome-extension:', 'edge:', 'file:'];
    if (restrictedProtocols.some(protocol => tab.url?.startsWith(protocol))) {
      console.log('[SidePanel] Restricted page detected, skipping extraction:', tab.url);
      showEmptyState(); // Show empty state instead of error
      return; // Silently exit
    }

    // Check if content script is ready (Issue #45)
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    } catch (error) {
      // Content script not available
      throw new Error('Content script not loaded. Please refresh the page and try again.');
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

    // URL validation and display (Issue #79 Item #6)
    if (metadata.url) {
      try {
        const url = new URL(metadata.url);
        articleUrl.textContent = metadata.siteName || url.hostname;
        articleUrl.href = metadata.url;
        articleUrl.style.display = 'inline';
      } catch (error) {
        // Invalid URL - use raw text and don't make it clickable
        console.warn('[SidePanel] Invalid URL in metadata:', metadata.url, error);
        articleUrl.textContent = metadata.siteName || metadata.url;
        articleUrl.removeAttribute('href');
        articleUrl.style.display = 'inline';
        articleUrl.style.cursor = 'default';
      }
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

    // Enable clickable links (Issue #56)
    enableClickableLinks();

    // Show content
    showContentView();

    console.log('[SidePanel] Content displayed successfully');
  } catch (error) {
    console.error('[SidePanel] Display error:', error);
    showError('Failed to display content');
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 *
 * Security Fix (Issue #80):
 * - Whitelist safe HTML elements and attributes
 * - Remove potentially dangerous content (scripts, event handlers, etc.)
 * - Use DOMParser for safe HTML parsing
 *
 * @param {string} html - Raw HTML from marked.parse()
 * @returns {string} Sanitized HTML safe for innerHTML
 */
function sanitizeHTML(html) {
  // Whitelist of safe tags
  const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u', 's', 'del', 'mark',
    'ul', 'ol', 'li',
    'a', 'img',
    'code', 'pre',
    'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'details', 'summary'
  ];

  // Whitelist of safe attributes per tag
  const ALLOWED_ATTRS = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'code': ['class'],
    'pre': ['class'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan']
  };

  // Parse HTML safely
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Recursive function to sanitize nodes
  function sanitizeNode(node) {
    // Text nodes are safe
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(false);
    }

    // Only allow whitelisted elements
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Remove disallowed tags
      if (!ALLOWED_TAGS.includes(tagName)) {
        console.warn(`[SidePanel] Removed disallowed tag: ${tagName}`);
        return null;
      }

      // Create sanitized element
      const sanitized = document.createElement(tagName);

      // Copy only whitelisted attributes
      const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
      for (const attr of node.attributes) {
        const attrName = attr.name.toLowerCase();

        // Remove event handlers (onclick, onerror, etc.)
        if (attrName.startsWith('on')) {
          console.warn(`[SidePanel] Removed event handler: ${attrName}`);
          continue;
        }

        // Copy whitelisted attributes
        if (allowedAttrs.includes(attrName)) {
          let attrValue = attr.value;

          // Sanitize href to prevent javascript: protocol
          if (attrName === 'href') {
            const lower = attrValue.toLowerCase().trim();
            if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
              console.warn(`[SidePanel] Blocked dangerous href: ${attrValue}`);
              continue;
            }
          }

          // Sanitize src to prevent javascript: protocol
          if (attrName === 'src') {
            const lower = attrValue.toLowerCase().trim();
            if (lower.startsWith('javascript:')) {
              console.warn(`[SidePanel] Blocked dangerous src: ${attrValue}`);
              continue;
            }
          }

          sanitized.setAttribute(attrName, attrValue);
        }
      }

      // Recursively sanitize children
      for (const child of node.childNodes) {
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) {
          sanitized.appendChild(sanitizedChild);
        }
      }

      return sanitized;
    }

    return null;
  }

  // Sanitize all nodes in body
  const fragment = document.createDocumentFragment();
  for (const child of doc.body.childNodes) {
    const sanitized = sanitizeNode(child);
    if (sanitized) {
      fragment.appendChild(sanitized);
    }
  }

  // Create temp div to get HTML string
  const temp = document.createElement('div');
  temp.appendChild(fragment);
  return temp.innerHTML;
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
    const rawHtml = marked.parse(markdown);

    // Sanitize HTML to prevent XSS (Issue #80)
    const sanitizedHtml = sanitizeHTML(rawHtml);

    // Update views with sanitized HTML
    previewView.innerHTML = sanitizedHtml;

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

    // Use Blob URL directly for better memory efficiency (Issue #81 Item #3)
    // Chrome 88+ (required for Manifest V3) supports blob: URLs in downloads
    const blobUrl = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: blobUrl,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      // Revoke Blob URL after download starts to free memory
      URL.revokeObjectURL(blobUrl);

      if (chrome.runtime.lastError) {
        console.error('[SidePanel] Download error:', chrome.runtime.lastError);
        showNotification('Failed to download', 'error');
        return;
      }

      console.log('[SidePanel] Download started:', downloadId);
      showNotification('Download started');
    });
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

/**
 * Reload current article (Issue #51)
 * Re-displays the currently loaded article
 */
function reloadCurrentArticle() {
  if (!currentMarkdown || !currentMetadata) {
    console.warn('[SidePanel] No article loaded to reload');
    return;
  }

  console.log('[SidePanel] Reloading current article');

  // Re-display the current article
  displayMarkdown({
    metadata: currentMetadata,
    markdown: currentMarkdown
  });
}

/**
 * Handle font family change (Issue #51)
 */
function handleFontChange(event) {
  const fontFamily = event.target.value;
  console.log('[SidePanel] Changing font to:', fontFamily);

  // Apply font to markdown content
  applyFontFamily(fontFamily);

  // Save preference
  localStorage.setItem('sidepanel-font-family', fontFamily);
}

/**
 * Apply font family to markdown content (Issue #51)
 */
function applyFontFamily(fontFamily) {
  const fontMap = {
    'default': '',
    'serif': '"Georgia", "Times New Roman", serif',
    'sans-serif': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    'monospace': '"Consolas", "Monaco", "Courier New", monospace'
  };

  const fontValue = fontMap[fontFamily] || '';

  if (fontValue) {
    previewView.style.fontFamily = fontValue;
    markdownView.style.fontFamily = fontValue;
  } else {
    previewView.style.fontFamily = '';
    markdownView.style.fontFamily = '';
  }
}

/**
 * Adjust font size (Issue #51)
 * @param {number} delta - Amount to change (e.g., +10 or -10)
 */
function adjustFontSize(delta) {
  const minSize = 80;
  const maxSize = 150;

  currentFontSize = Math.max(minSize, Math.min(maxSize, currentFontSize + delta));

  console.log('[SidePanel] Font size adjusted to:', currentFontSize + '%');

  // Apply font size
  previewView.style.fontSize = currentFontSize + '%';
  markdownView.style.fontSize = currentFontSize + '%';

  // Save preference
  localStorage.setItem('sidepanel-font-size', currentFontSize.toString());
}

/**
 * Load saved view preferences (Issue #51)
 */
function loadViewPreferences() {
  // Load font family
  const savedFont = localStorage.getItem('sidepanel-font-family');
  if (savedFont) {
    fontSelect.value = savedFont;
    applyFontFamily(savedFont);
  }

  // Load font size with validation (Issue #79 Item #8)
  const savedSize = localStorage.getItem('sidepanel-font-size');
  if (savedSize) {
    const parsedSize = parseInt(savedSize, 10);
    // Validate range (min: 80, max: 150)
    if (!isNaN(parsedSize) && parsedSize >= 80 && parsedSize <= 150) {
      currentFontSize = parsedSize;
      previewView.style.fontSize = currentFontSize + '%';
      markdownView.style.fontSize = currentFontSize + '%';
    } else {
      console.warn('[SidePanel] Invalid font size in localStorage:', savedSize, '- using default');
      localStorage.removeItem('sidepanel-font-size'); // Clean up invalid value
    }
  }

  console.log('[SidePanel] Loaded view preferences:', { font: savedFont || 'default', size: currentFontSize + '%' });
}

// Event listener references for proper cleanup (Issue #78)
let currentClickListener = null;
let currentMousedownListener = null;

/**
 * Validate URL for safe navigation
 *
 * Security (Issue #81 Item #4):
 * - Prevent Open Redirect vulnerabilities
 * - Only allow http: and https: protocols
 * - Block javascript:, data:, file:, and other dangerous protocols
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe, false otherwise
 */
function isSafeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Allow relative URLs and hash links
  if (url.startsWith('/') || url.startsWith('#')) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.href);
    const protocol = parsed.protocol.toLowerCase();

    // Only allow http and https
    if (protocol === 'http:' || protocol === 'https:') {
      return true;
    }

    console.warn('[SidePanel] Blocked unsafe URL protocol:', protocol, url);
    return false;
  } catch (error) {
    console.warn('[SidePanel] Invalid URL:', url, error);
    return false;
  }
}

/**
 * Disable clickable links and cleanup event listeners
 *
 * Bug Fix (Issue #78):
 * - Properly remove event listeners to prevent memory leaks
 * - Called before attaching new listeners to avoid duplicates
 */
function disableClickableLinks() {
  if (currentClickListener) {
    previewView.removeEventListener('click', currentClickListener);
    currentClickListener = null;
  }
  if (currentMousedownListener) {
    previewView.removeEventListener('mousedown', currentMousedownListener);
    currentMousedownListener = null;
  }
  console.log('[SidePanel] Clickable links disabled and cleaned up');
}

/**
 * Enable clickable links in markdown preview (Issue #56)
 *
 * Bug Fix (Issue #78):
 * - Use closure variables instead of DOM properties for listener references
 * - Call disableClickableLinks() first to prevent duplicate listeners
 * - Proper memory management to prevent leaks on repeated calls
 *
 * Makes links in the preview view clickable and functional.
 * - External links open in new tabs (respects browser modifier keys)
 * - Internal links (#section) scroll smoothly to target
 *
 * Browser Standard Behavior (User Feedback):
 * - Click: New background tab (default)
 * - Ctrl/Cmd + Click: New background tab (explicit)
 * - Shift + Click: New foreground tab
 * - Ctrl/Cmd + Shift + Click: New foreground tab
 * - Middle Click: New background tab
 *
 * UX Decision:
 * - Default: Background tab (keeps SidePanel visible)
 * - Modifier keys: Follow browser standards (Jakob's Law)
 * - Intuitive: Users can control tab behavior naturally
 */
function enableClickableLinks() {
  // Remove existing listeners first to prevent duplicates (Issue #78)
  disableClickableLinks();

  // Handle regular clicks and Ctrl/Cmd/Shift + Click
  const linkClickListener = (e) => {
    // Find closest anchor element (event delegation)
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Prevent default navigation
    e.preventDefault();

    // Internal link (e.g., #section-id) - scroll to target
    if (href.startsWith('#')) {
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[SidePanel] Scrolled to internal link:', href);
      } else {
        console.warn('[SidePanel] Internal link target not found:', href);
      }
      return;
    }

    // Validate URL for security (Issue #81 Item #4)
    if (!isSafeUrl(href)) {
      console.error('[SidePanel] Blocked unsafe link:', href);
      return;
    }

    // External link - detect modifier keys
    const newTab = e.ctrlKey || e.metaKey; // Ctrl (Win/Linux) or Cmd (Mac)
    const foreground = e.shiftKey; // Shift = foreground tab

    // Determine tab behavior
    if (newTab || foreground) {
      // Explicit modifier: open in new tab (foreground if Shift pressed)
      chrome.tabs.create({ url: href, active: foreground });
      console.log(`[SidePanel] Opened link in ${foreground ? 'foreground' : 'background'} tab (modifier):`, href);
    } else {
      // Default: open in new background tab
      chrome.tabs.create({ url: href, active: false });
      console.log('[SidePanel] Opened link in background tab (default):', href);
    }
  };

  // Handle middle click (mousedown event, as click event doesn't fire for middle click)
  const linkMousedownListener = (e) => {
    // Middle click = button 1
    if (e.button !== 1) return;

    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Prevent default middle click behavior
    e.preventDefault();

    // Skip internal links
    if (href.startsWith('#')) return;

    // Validate URL for security (Issue #81 Item #4)
    if (!isSafeUrl(href)) {
      console.error('[SidePanel] Blocked unsafe link (middle click):', href);
      return;
    }

    // Open in new background tab (browser standard for middle click)
    chrome.tabs.create({ url: href, active: false });
    console.log('[SidePanel] Opened link in background tab (middle click):', href);
  };

  // Attach listeners
  previewView.addEventListener('click', linkClickListener);
  previewView.addEventListener('mousedown', linkMousedownListener);

  // Store references in closure variables for cleanup (Issue #78)
  currentClickListener = linkClickListener;
  currentMousedownListener = linkMousedownListener;

  console.log('[SidePanel] Clickable links enabled with browser standard modifiers');
}

console.log('[SidePanel] Script loaded');
