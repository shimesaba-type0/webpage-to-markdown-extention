/**
 * ImageDownloader - Download and process images for offline storage
 */

class ImageDownloader {
  constructor() {
    this.downloadedImages = new Map();
  }

  /**
   * Download an image from URL and return blob
   */
  async downloadImage(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const mimeType = response.headers.get('content-type') || 'image/png';

      return {
        blob,
        mimeType,
        size: blob.size
      };
    } catch (error) {
      console.error(`[ImageDownloader] Failed to download ${url}:`, error);
      throw error;
    }
  }

  /**
   * Download multiple images and return results
   */
  async downloadImages(imageUrls) {
    const results = [];

    for (const imageUrl of imageUrls) {
      try {
        const imageData = await this.downloadImage(imageUrl);
        results.push({
          originalUrl: imageUrl,
          ...imageData,
          success: true
        });
      } catch (error) {
        results.push({
          originalUrl: imageUrl,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generate local path for image
   */
  generateLocalPath(imageUrl, index) {
    const url = new URL(imageUrl);
    const filename = url.pathname.split('/').pop() || `image-${index}`;

    // Sanitize filename
    const sanitized = filename
      .replace(/[^a-z0-9.-]/gi, '_')
      .substring(0, 50);

    return `./images/${sanitized}`;
  }

  /**
   * Update markdown with local image paths
   *
   * Bug Fix (Issue #44):
   * - Previous regex approach failed with URLs containing special characters
   * - Use simple string replacement for more reliable URL substitution
   * - Handle both standard markdown format and plain URLs
   */
  updateMarkdownImagePaths(markdown, imageMapping) {
    let updatedMarkdown = markdown;

    for (const [originalUrl, localPath] of Object.entries(imageMapping)) {
      // Replace image URLs in markdown
      // Format: ![alt](url)

      // Method 1: Simple string replacement (more reliable than regex)
      // This handles URLs with query parameters, special characters, etc.
      const markdownImage = `](${originalUrl})`;
      const replacement = `](${localPath})`;

      // Replace all occurrences
      updatedMarkdown = updatedMarkdown.split(markdownImage).join(replacement);

      // Method 2: Also replace plain URLs (in case markdown doesn't use standard format)
      // This is a fallback for edge cases
      if (updatedMarkdown.includes(originalUrl) && !updatedMarkdown.includes(localPath)) {
        console.warn('[ImageDownloader] URL still found after standard replacement, attempting fallback:', originalUrl);
        updatedMarkdown = updatedMarkdown.split(originalUrl).join(localPath);
      }
    }

    return updatedMarkdown;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Convert blob to data URL
   */
  async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Extract unique image URLs from markdown
   */
  extractImageUrls(markdown) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const urls = new Set();
    let match;

    while ((match = imageRegex.exec(markdown)) !== null) {
      const url = match[2];
      // Skip data URLs
      if (!url.startsWith('data:')) {
        urls.add(url);
      }
    }

    return Array.from(urls);
  }
}

// Export singleton instance
const imageDownloader = new ImageDownloader();

// For ES6 modules (Node.js environment)
/* global module */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = imageDownloader;
}
