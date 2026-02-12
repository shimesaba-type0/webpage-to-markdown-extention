/**
 * FileExporter - Export articles as ZIP files
 * Uses JSZip to create downloadable archives
 */

/* global JSZip */

class FileExporter {
  /**
   * Export a single article as ZIP
   */
  async exportArticle(article, images = []) {
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
          imagesFolder.file(image.filename || `image-${image.id}.jpg`, image.blob);
        }
      }
    }

    // Add metadata JSON
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
   */
  async exportMultipleArticles(articlesData) {
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
            imagesFolder.file(image.filename || `image-${image.id}.jpg`, image.blob);
          }
        }
      }

      // Add metadata
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
   * Note: For Service Worker compatibility, converts ArrayBuffer to base64
   */
  async downloadBlob(blob, filename) {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();

      // Convert to base64
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      // Create data URL
      const dataUrl = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;

      return new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: dataUrl,
          filename,
          saveAs: true
        }, (downloadId) => {
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
