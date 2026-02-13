/**
 * Content Script - Webpage to Markdown Extension
 * This script runs in the context of web pages and extracts content
 */

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    extractContent()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }

  if (request.action === 'getStatus') {
    sendResponse({ success: true, ready: true });
  }
});

/**
 * Extract and convert content from current page
 */
async function extractContent() {
  try {
    console.log('[Webpage to Markdown] Starting content extraction...');

    // 1. Extract main content using Readability
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content. The page may not contain readable content.');
    }

    console.log('[Webpage to Markdown] Content extracted successfully');

    // 2. Convert HTML to Markdown using Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    const markdown = turndownService.turndown(article.content);

    console.log('[Webpage to Markdown] Markdown conversion completed');

    // 3. Extract images from content
    const images = extractImages(article.content);

    console.log(`[Webpage to Markdown] Found ${images.length} images`);

    // 4. Collect metadata
    const metadata = {
      title: article.title || document.title,
      author: article.byline || getMetaContent('author'),
      url: window.location.href,
      siteName: article.siteName || getMetaContent('og:site_name') || getDomain(),
      excerpt: article.excerpt || getMetaContent('description'),
      timestamp: new Date().toISOString(),
      images: images
    };

    console.log('[Webpage to Markdown] Metadata collected:', metadata);

    // 5. Send to background script for storage
    const response = await chrome.runtime.sendMessage({
      action: 'saveArticle',
      data: {
        metadata,
        markdown,
        images
      }
    });

    return response;
  } catch (error) {
    console.error('[Webpage to Markdown] Error:', error);
    throw error;
  }
}

/**
 * Extract image information from HTML content
 *
 * Enhancement (Issue #37):
 * - Support lazy-loading images (data-src, data-lazy-src, data-original)
 * - Support srcset for high-resolution images
 * - Improved image filtering
 */
function extractImages(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const imgElements = tempDiv.querySelectorAll('img');

  const images = [];

  imgElements.forEach(img => {
    // Enhanced image source extraction (Issue #37)
    let src = getImageSource(img);

    // Convert relative URLs to absolute
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      try {
        src = new URL(src, window.location.href).href;
      } catch (error) {
        console.warn('[Content Script] Invalid image URL:', src, error);
        return;
      }
    }

    // Skip data URLs and very small images (likely icons)
    if (!src || src.startsWith('data:')) return;

    const width = img.width || parseInt(img.getAttribute('width')) || 0;
    const height = img.height || parseInt(img.getAttribute('height')) || 0;

    // Skip very small images (likely icons/buttons)
    if (width > 0 && height > 0 && (width < 50 || height < 50)) {
      return;
    }

    images.push({
      src: src,
      alt: img.getAttribute('alt') || '',
      width: width,
      height: height
    });
  });

  return images;
}

/**
 * Get image source from element (Issue #37)
 * Checks multiple attributes in priority order:
 * 1. srcset (highest resolution)
 * 2. data-src (lazy loading)
 * 3. data-lazy-src (LazyLoad library)
 * 4. data-original (some image libraries)
 * 5. src (standard)
 */
function getImageSource(imgElement) {
  // Priority 1: srcset (select highest resolution)
  const srcset = imgElement.getAttribute('srcset');
  if (srcset) {
    try {
      const sources = parseSrcset(srcset);
      if (sources.length > 0) {
        // Return highest resolution image
        return sources[sources.length - 1].url;
      }
    } catch (error) {
      console.warn('[Content Script] Failed to parse srcset:', srcset, error);
    }
  }

  // Priority 2-4: Lazy loading attributes
  const lazyAttributes = ['data-src', 'data-lazy-src', 'data-original'];
  for (const attr of lazyAttributes) {
    const lazySrc = imgElement.getAttribute(attr);
    if (lazySrc) {
      console.log(`[Content Script] Using ${attr} for lazy-loaded image`);
      return lazySrc;
    }
  }

  // Priority 5: Standard src
  return imgElement.getAttribute('src');
}

/**
 * Parse srcset attribute (Issue #37)
 * Format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
 *
 * @param {string} srcset - srcset attribute value
 * @returns {Array} Sorted array of {url, descriptor}
 */
function parseSrcset(srcset) {
  const sources = srcset.split(',').map(source => {
    const parts = source.trim().split(/\s+/);
    return {
      url: parts[0],
      descriptor: parts[1] || '1x'
    };
  });

  // Sort by descriptor (lower to higher resolution)
  sources.sort((a, b) => {
    const aVal = parseFloat(a.descriptor) || 1;
    const bVal = parseFloat(b.descriptor) || 1;
    return aVal - bVal;
  });

  return sources;
}

/**
 * Get meta tag content by name or property
 */
function getMetaContent(nameOrProperty) {
  const metaByName = document.querySelector(`meta[name="${nameOrProperty}"]`);
  if (metaByName) return metaByName.getAttribute('content');

  const metaByProperty = document.querySelector(`meta[property="${nameOrProperty}"]`);
  if (metaByProperty) return metaByProperty.getAttribute('content');

  return null;
}

/**
 * Get domain from current URL
 */
function getDomain() {
  try {
    return new URL(window.location.href).hostname;
  } catch (e) {
    return window.location.hostname;
  }
}

console.log('[Webpage to Markdown] Content script loaded');
