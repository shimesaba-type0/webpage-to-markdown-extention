/**
 * Tests for content-script.js
 */

describe('Content Script Functions', () => {
  describe('getMetaContent', () => {
    function getMetaContent(nameOrProperty) {
      const metaByName = document.querySelector(`meta[name="${nameOrProperty}"]`);
      if (metaByName) return metaByName.getAttribute('content');

      const metaByProperty = document.querySelector(`meta[property="${nameOrProperty}"]`);
      if (metaByProperty) return metaByProperty.getAttribute('content');

      return null;
    }

    beforeEach(() => {
      document.head.innerHTML = '';
    });

    test('should get meta content by name', () => {
      document.head.innerHTML = '<meta name="description" content="Test description">';
      expect(getMetaContent('description')).toBe('Test description');
    });

    test('should get meta content by property', () => {
      document.head.innerHTML = '<meta property="og:title" content="Test Title">';
      expect(getMetaContent('og:title')).toBe('Test Title');
    });

    test('should return null for non-existent meta tag', () => {
      expect(getMetaContent('nonexistent')).toBeNull();
    });
  });

  describe('getDomain', () => {
    function getDomain() {
      try {
        return new URL(window.location.href).hostname;
      } catch (e) {
        return window.location.hostname;
      }
    }

    test('should extract domain from URL', () => {
      // Note: In jsdom, window.location.href is set to about:blank by default
      expect(getDomain()).toBeTruthy();
    });
  });

  describe('extractImages', () => {
    function extractImages(htmlContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const imgElements = tempDiv.querySelectorAll('img');

      const images = [];

      imgElements.forEach(img => {
        let src = img.getAttribute('src');

        // Convert relative URLs to absolute
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          try {
            src = new URL(src, window.location.href).href;
          } catch (e) {
            // Skip invalid URLs
            return;
          }
        }

        // Skip data URLs
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

    test('should extract image with valid source', () => {
      const html = '<img src="https://example.com/image.jpg" alt="Test" width="200" height="200">';
      const images = extractImages(html);
      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('https://example.com/image.jpg');
      expect(images[0].alt).toBe('Test');
    });

    test('should filter out small icons', () => {
      const html = '<img src="https://example.com/icon.png" width="20" height="20">';
      const images = extractImages(html);
      expect(images).toHaveLength(0);
    });

    test('should skip data URLs', () => {
      const html = '<img src="data:image/png;base64,abc123" width="200" height="200">';
      const images = extractImages(html);
      expect(images).toHaveLength(0);
    });

    test('should handle images without alt text', () => {
      const html = '<img src="https://example.com/image.jpg" width="200" height="200">';
      const images = extractImages(html);
      expect(images).toHaveLength(1);
      expect(images[0].alt).toBe('');
    });

    test('should extract multiple valid images', () => {
      const html = `
        <img src="https://example.com/image1.jpg" width="200" height="200">
        <img src="https://example.com/image2.jpg" width="300" height="300">
        <img src="https://example.com/icon.png" width="20" height="20">
      `;
      const images = extractImages(html);
      expect(images).toHaveLength(2);
    });
  });
});
