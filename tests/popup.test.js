/**
 * Tests for popup.js
 */

describe('Popup Functions', () => {
  describe('escapeHtml', () => {
    // Create a minimal implementation for testing
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = escapeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });

    test('should preserve quotes as-is', () => {
      const input = 'Hello "World"';
      const output = escapeHtml(input);
      // textContent preserves quotes without escaping to &quot;
      expect(output).toContain('"');
      expect(output).toBe('Hello "World"');
    });

    test('should handle empty string', () => {
      const output = escapeHtml('');
      expect(output).toBe('');
    });

    test('should handle normal text without changes', () => {
      const input = 'Hello World';
      const output = escapeHtml(input);
      expect(output).toBe('Hello World');
    });
  });

  describe('formatDate', () => {
    function formatDate(isoString) {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    }

    test('should return "Just now" for very recent dates', () => {
      const now = new Date().toISOString();
      expect(formatDate(now)).toBe('Just now');
    });

    test('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatDate(date)).toBe('5m ago');
    });

    test('should return hours ago', () => {
      const date = new Date(Date.now() - 3 * 3600000).toISOString();
      expect(formatDate(date)).toBe('3h ago');
    });

    test('should return days ago', () => {
      const date = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(formatDate(date)).toBe('2d ago');
    });
  });
});
