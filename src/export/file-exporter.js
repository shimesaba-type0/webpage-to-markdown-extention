/**
 * FileExporter - Export articles as ZIP files
 * Uses JSZip to create downloadable archives
 */

/* global JSZip */

class FileExporter {
  /**
   * Export a single article as ZIP
   *
   * Bug Fix (Issue #138):
   * - Accept options to conditionally include metadata.json
   * - includeMetadata=false skips metadata.json output
   *
   * @param {Object} article - Article data
   * @param {Array} images - Array of image objects
   * @param {Object} options - Export options
   * @param {boolean} [options.includeMetadata=true] - Whether to include metadata.json
   */
  async exportArticle(article, images = [], options = {}) {
    const { includeMetadata = true } = options;
    const zip = new JSZip();

    // Sanitize filename
    const filename = this.sanitizeFilename(article.metadata?.title || article.title || 'article');

    // Add markdown file
    zip.file(`${filename}.md`, article.markdown);

    // Add images folder if images exist
    if (images.length > 0) {
      const imagesFolder = zip.folder('images');
      for (const image of images) {
        if (image.blob) {
          imagesFolder.file(this.resolveExportImageFilename(image), image.blob);
        }
      }
    }

    // Add metadata JSON (Issue #138: only when includeMetadata is enabled)
    if (includeMetadata) {
      const metadata = {
        title: article.metadata?.title || article.title,
        author: article.metadata?.author || article.author,
        url: article.metadata?.url || article.url,
        siteName: article.metadata?.siteName || article.siteName,
        timestamp: article.metadata?.timestamp || article.timestamp,
        createdAt: article.createdAt,
        hasTranslation: article.hasTranslation || false
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Add translation if exists
    if (article.hasTranslation && article.translatedMarkdown) {
      zip.file(`${filename}_ja.md`, article.translatedMarkdown);
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Download
    await this.downloadBlob(blob, `${filename}.zip`);

    return { success: true, filename: `${filename}.zip` };
  }

  /**
   * Export multiple articles as a single ZIP
   *
   * Bug Fix (Issue #138):
   * - Accept options to conditionally include metadata.json per article
   *
   * @param {Array} articlesData - Array of {article, images} objects
   * @param {Object} options - Export options
   * @param {boolean} [options.includeMetadata=true] - Whether to include metadata.json
   */
  async exportMultipleArticles(articlesData, options = {}) {
    const { includeMetadata = true } = options;
    const zip = new JSZip();

    for (let i = 0; i < articlesData.length; i++) {
      const { article, images } = articlesData[i];
      const folderName = `${i + 1}_${this.sanitizeFilename(article.metadata?.title || article.title || 'article')}`;
      const articleFolder = zip.folder(folderName);

      // Add markdown
      articleFolder.file('article.md', article.markdown);

      // Add images
      if (images && images.length > 0) {
        const imagesFolder = articleFolder.folder('images');
        for (const image of images) {
          if (image.blob) {
            imagesFolder.file(this.resolveExportImageFilename(image), image.blob);
          }
        }
      }

      // Add metadata (Issue #138: only when includeMetadata is enabled)
      if (includeMetadata) {
        const metadata = {
          title: article.metadata?.title || article.title,
          author: article.metadata?.author || article.author,
          url: article.metadata?.url || article.url,
          siteName: article.metadata?.siteName || article.siteName,
          timestamp: article.metadata?.timestamp || article.timestamp,
          createdAt: article.createdAt,
          hasTranslation: article.hasTranslation || false
        };
        articleFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
      }

      // Add translation if exists
      if (article.hasTranslation && article.translatedMarkdown) {
        articleFolder.file('article_ja.md', article.translatedMarkdown);
      }
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Download with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `articles_export_${timestamp}.zip`;
    await this.downloadBlob(blob, filename);

    return { success: true, filename, count: articlesData.length };
  }

  /**
   * Download blob as file using Chrome Downloads API
   *
   * Performance Fix (Issue #140):
   * - Prefer URL.createObjectURL to avoid Base64 memory overhead
   * - Fall back to Base64 data URL if createObjectURL is unavailable
   * - Object URL is revoked after download starts to free memory
   */
  async downloadBlob(blob, filename) {
    let url;
    let isObjectUrl = false;

    try {
      // Prefer createObjectURL: avoids full binary→string conversion
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        try {
          url = URL.createObjectURL(blob);
          isObjectUrl = true;
        } catch (_e) {
          // createObjectURL unavailable in this context; fall through to base64
        }
      }

      if (!url) {
        // Fallback: Base64 data URL (works in all extension contexts)
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = this.arrayBufferToBase64(arrayBuffer);
        url = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
      }

      return new Promise((resolve, reject) => {
        chrome.downloads.download({
          url,
          filename,
          saveAs: true
        }, (downloadId) => {
          if (isObjectUrl) {
            URL.revokeObjectURL(url);
          }
          if (chrome.runtime.lastError) {
            console.error('[FileExporter] Download error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          console.log('[FileExporter] Download started:', downloadId);
          resolve(downloadId);
        });
      });
    } catch (error) {
      if (isObjectUrl && url) {
        URL.revokeObjectURL(url);
      }
      console.error('[FileExporter] downloadBlob error:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string (Service Worker compatible)
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Resolve image filename for ZIP export.
   * Priority: localPath basename -> filename -> generated fallback.
   */
  resolveExportImageFilename(image) {
    const localPathBasename = this.extractBasename(image?.localPath);
    if (localPathBasename) {
      return localPathBasename;
    }

    if (image?.filename) {
      const safeFilename = this.sanitizeFilename(String(image.filename));
      if (safeFilename) {
        return safeFilename;
      }
    }

    const ext = this.getExtensionFromMimeType(image?.mimeType);
    const id = image?.id ?? 'unknown';
    return `image-${id}${ext}`;
  }

  /**
   * Extract basename from a path-like string and sanitize it.
   */
  extractBasename(path) {
    if (!path || typeof path !== 'string') {
      return '';
    }

    const normalizedPath = path.replace(/\\/g, '/');
    const basename = normalizedPath.split('/').pop() || '';
    return this.sanitizeFilename(basename);
  }

  /**
   * Map image mime type to file extension.
   */
  getExtensionFromMimeType(mimeType) {
    const map = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/avif': '.avif',
      'image/bmp': '.bmp'
    };

    return map[mimeType] || '.jpg';
  }

  /**
   * Sanitize filename for safe file system use
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
      .replace(/\s+/g, '_')            // Replace spaces with underscores
      .replace(/_{2,}/g, '_')          // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '')         // Remove leading/trailing underscores
      .substring(0, 100);              // Limit length to 100 characters
  }
}

// Export singleton instance
const fileExporter = new FileExporter();

// For ES6 modules (Node.js environment)
/* global module */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = fileExporter;
}
