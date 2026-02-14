/**
 * StorageManager - IndexedDB wrapper for article storage
 * Handles saving, retrieving, and managing articles with images
 */

const DB_NAME = 'WebpageToMarkdownDB';
const DB_VERSION = 1;
const STORE_ARTICLES = 'articles';
const STORE_IMAGES = 'images';

class StorageManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Articles store
        if (!db.objectStoreNames.contains(STORE_ARTICLES)) {
          const articleStore = db.createObjectStore(STORE_ARTICLES, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Indexes for querying
          articleStore.createIndex('timestamp', 'metadata.timestamp', { unique: false });
          articleStore.createIndex('url', 'metadata.url', { unique: false });
          articleStore.createIndex('title', 'metadata.title', { unique: false });
        }

        // Images store
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const imageStore = db.createObjectStore(STORE_IMAGES, {
            keyPath: 'id',
            autoIncrement: true
          });

          imageStore.createIndex('articleId', 'articleId', { unique: false });
          imageStore.createIndex('originalUrl', 'originalUrl', { unique: false });
        }
      };
    });
  }

  /**
   * Save an article with metadata and markdown
   */
  /**
   * Save an article with metadata and markdown
   *
   * Bug Fix (Issue #79 Item #3):
   * - Added transaction lifecycle handlers (oncomplete, onerror, onabort)
   * - Ensures transaction completes successfully before resolving
   * - Better error handling for transaction failures
   */
  async saveArticle(articleData) {
    await this.init();

    const { metadata, markdown, images = [] } = articleData;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readwrite');
      const store = transaction.objectStore(STORE_ARTICLES);

      let articleId = null;

      // Transaction lifecycle handlers (Issue #79 Item #3)
      transaction.oncomplete = () => {
        console.log('[StorageManager] Transaction completed successfully');
        if (articleId !== null) {
          resolve(articleId);
        } else {
          reject(new Error('Transaction completed but articleId is null'));
        }
      };

      transaction.onerror = (event) => {
        console.error('[StorageManager] Transaction error:', event.target.error);
        reject(transaction.error || new Error('Transaction failed'));
      };

      transaction.onabort = (event) => {
        console.error('[StorageManager] Transaction aborted:', event.target.error);
        reject(transaction.error || new Error('Transaction aborted'));
      };

      const article = {
        metadata,
        markdown,
        imageCount: images.length,
        createdAt: new Date().toISOString(),
        hasTranslation: false
      };

      const request = store.add(article);

      request.onsuccess = () => {
        articleId = request.result;
        console.log('[StorageManager] Article added to store:', articleId);
        // Note: Transaction will complete asynchronously, triggering oncomplete
      };

      request.onerror = (event) => {
        console.error('[StorageManager] Request error:', event.target.error);
        // Transaction will automatically abort and trigger onabort
      };
    });
  }

  /**
   * Get an article by ID
   *
   * Bug Fix (Issue #63):
   * - Validate ID parameter to prevent IndexedDB errors
   * - Ensure ID is a valid positive number
   */
  async getArticle(id) {
    await this.init();

    // Validate ID parameter (Issue #63)
    if (!id || typeof id !== 'number' || isNaN(id) || id <= 0) {
      throw new Error(`Invalid article ID for getArticle: ${id} (type: ${typeof id})`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readonly');
      const store = transaction.objectStore(STORE_ARTICLES);
      const request = store.get(id);

      request.onsuccess = () => {
        const article = request.result;
        console.log(`[StorageManager] getArticle(${id}):`, article ? 'found' : 'not found');
        resolve(article);
      };

      request.onerror = () => {
        console.error('[StorageManager] getArticle error:', {
          id,
          error: request.error
        });
        reject(request.error);
      };
    });
  }

  /**
   * Get all articles, sorted by timestamp (newest first)
   */
  async getAllArticles() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readonly');
      const store = transaction.objectStore(STORE_ARTICLES);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Descending order

      const articles = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          articles.push({
            id: cursor.value.id,
            ...cursor.value
          });
          cursor.continue();
        } else {
          resolve(articles);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an article by ID
   *
   * Bug Fix (Issue #63):
   * - Validate ID parameter to prevent IndexedDB errors
   */
  async deleteArticle(id) {
    await this.init();

    // Validate ID parameter (Issue #63)
    if (!id || typeof id !== 'number' || isNaN(id) || id <= 0) {
      throw new Error(`Invalid article ID for deleteArticle: ${id} (type: ${typeof id})`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES, STORE_IMAGES], 'readwrite');

      // Delete article
      const articleStore = transaction.objectStore(STORE_ARTICLES);
      articleStore.delete(id);

      // Delete associated images
      const imageStore = transaction.objectStore(STORE_IMAGES);
      const imageIndex = imageStore.index('articleId');
      const imageRequest = imageIndex.openCursor(IDBKeyRange.only(id));

      imageRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log('[StorageManager] Article deleted:', id);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Save an image blob with metadata
   */
  /**
   * Save an image to IndexedDB
   *
   * Bug Fix (Issue #79 Item #3):
   * - Added transaction lifecycle handlers
   */
  async saveImage(articleId, imageData) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_IMAGES], 'readwrite');
      const store = transaction.objectStore(STORE_IMAGES);

      let imageId = null;

      // Transaction lifecycle handlers (Issue #79 Item #3)
      transaction.oncomplete = () => {
        if (imageId !== null) {
          resolve(imageId);
        } else {
          reject(new Error('Transaction completed but imageId is null'));
        }
      };

      transaction.onerror = (event) => {
        console.error('[StorageManager] Image save transaction error:', event.target.error);
        reject(transaction.error || new Error('Image save transaction failed'));
      };

      transaction.onabort = (event) => {
        console.error('[StorageManager] Image save transaction aborted:', event.target.error);
        reject(transaction.error || new Error('Image save transaction aborted'));
      };

      const image = {
        articleId,
        originalUrl: imageData.originalUrl,
        blob: imageData.blob,
        mimeType: imageData.mimeType,
        alt: imageData.alt || '',
        localPath: imageData.localPath || '',
        savedAt: new Date().toISOString()
      };

      const request = store.add(image);

      request.onsuccess = () => {
        imageId = request.result;
        console.log('[StorageManager] Image added to store:', imageId);
      };

      request.onerror = (event) => {
        console.error('[StorageManager] Image add request error:', event.target.error);
      };
    });
  }

  /**
   * Get all images for an article
   *
   * Bug Fix (Issue #63):
   * - Validate articleId parameter to prevent IndexedDB errors
   */
  async getArticleImages(articleId) {
    await this.init();

    // Validate articleId parameter (Issue #63)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID for getArticleImages: ${articleId} (type: ${typeof articleId})`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_IMAGES], 'readonly');
      const store = transaction.objectStore(STORE_IMAGES);
      const index = store.index('articleId');
      const request = index.getAll(articleId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update article with translation
   *
   * Bug Fix (Issue #63):
   * - Validate articleId parameter to prevent IndexedDB errors
   */
  async saveTranslation(articleId, translatedMarkdown) {
    await this.init();

    // Validate articleId parameter (Issue #63)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID for saveTranslation: ${articleId} (type: ${typeof articleId})`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readwrite');
      const store = transaction.objectStore(STORE_ARTICLES);

      let updateCompleted = false;

      // Transaction lifecycle handlers (Issue #79 Item #3)
      transaction.oncomplete = () => {
        if (updateCompleted) {
          resolve(articleId);
        } else {
          reject(new Error('Transaction completed without update'));
        }
      };

      transaction.onerror = (event) => {
        console.error('[StorageManager] Translation save transaction error:', event.target.error);
        reject(transaction.error || new Error('Translation save failed'));
      };

      transaction.onabort = (event) => {
        console.error('[StorageManager] Translation save transaction aborted:', event.target.error);
        reject(transaction.error || new Error('Translation save aborted'));
      };

      const getRequest = store.get(articleId);

      getRequest.onsuccess = () => {
        const article = getRequest.result;
        if (!article) {
          // Aborting transaction will trigger onabort handler
          transaction.abort();
          return;
        }

        article.translatedMarkdown = translatedMarkdown;
        article.hasTranslation = true;
        article.translatedAt = new Date().toISOString();

        const updateRequest = store.put(article);
        updateRequest.onsuccess = () => {
          updateCompleted = true;
          console.log('[StorageManager] Translation saved for article:', articleId);
        };
        updateRequest.onerror = (event) => {
          console.error('[StorageManager] Update request error:', event.target.error);
        };
      };

      getRequest.onerror = (event) => {
        console.error('[StorageManager] Get request error:', event.target.error);
      };
    });
  }

  /**
   * Search articles by title
   */
  async searchArticles(query) {
    const articles = await this.getAllArticles();
    const lowerQuery = query.toLowerCase();

    return articles.filter(article =>
      article.metadata.title?.toLowerCase().includes(lowerQuery) ||
      article.metadata.url?.toLowerCase().includes(lowerQuery) ||
      article.metadata.excerpt?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this.init();

    const articles = await this.getAllArticles();

    return {
      totalArticles: articles.length,
      totalWithTranslation: articles.filter(a => a.hasTranslation).length,
      totalImages: articles.reduce((sum, a) => sum + (a.imageCount || 0), 0),
      oldestArticle: articles[articles.length - 1]?.metadata.timestamp,
      newestArticle: articles[0]?.metadata.timestamp
    };
  }

  /**
   * Clear all data
   */
  async clearAll() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES, STORE_IMAGES], 'readwrite');

      transaction.objectStore(STORE_ARTICLES).clear();
      transaction.objectStore(STORE_IMAGES).clear();

      transaction.oncomplete = () => {
        console.log('[StorageManager] All data cleared');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
const storageManager = new StorageManager();

// For ES6 modules (Node.js environment)
/* global module */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = storageManager;
}
