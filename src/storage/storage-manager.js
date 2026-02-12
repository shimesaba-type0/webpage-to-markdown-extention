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
  async saveArticle(articleData) {
    await this.init();

    const { metadata, markdown, images = [] } = articleData;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readwrite');
      const store = transaction.objectStore(STORE_ARTICLES);

      const article = {
        metadata,
        markdown,
        imageCount: images.length,
        createdAt: new Date().toISOString(),
        hasTranslation: false
      };

      const request = store.add(article);

      request.onsuccess = () => {
        const articleId = request.result;
        console.log('[StorageManager] Article saved:', articleId);
        resolve(articleId);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get an article by ID
   */
  async getArticle(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readonly');
      const store = transaction.objectStore(STORE_ARTICLES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
   */
  async deleteArticle(id) {
    await this.init();

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
  async saveImage(articleId, imageData) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_IMAGES], 'readwrite');
      const store = transaction.objectStore(STORE_IMAGES);

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
        const imageId = request.result;
        console.log('[StorageManager] Image saved:', imageId);
        resolve(imageId);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all images for an article
   */
  async getArticleImages(articleId) {
    await this.init();

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
   */
  async saveTranslation(articleId, translatedMarkdown) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ARTICLES], 'readwrite');
      const store = transaction.objectStore(STORE_ARTICLES);
      const getRequest = store.get(articleId);

      getRequest.onsuccess = () => {
        const article = getRequest.result;
        if (!article) {
          reject(new Error('Article not found'));
          return;
        }

        article.translatedMarkdown = translatedMarkdown;
        article.hasTranslation = true;
        article.translatedAt = new Date().toISOString();

        const updateRequest = store.put(article);
        updateRequest.onsuccess = () => resolve(articleId);
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
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
