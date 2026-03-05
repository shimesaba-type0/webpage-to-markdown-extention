/**
 * Tests for sidepanel extractContent result processing
 * Regression tests for Issue #107 (result.data structure fix)
 * Regression tests for Issue #137 (pendingExtraction type mismatch)
 */

// PR #100 での変更: content-script が SW レスポンスを直接転送するようになった
// SW レスポンス: { success: true, articleId, metadata, markdown }
// 旧形式 (バグ): { success: true, data: { metadata, markdown } }

function processExtractResult(result) {
  // Issue #107 修正後の正しいロジック
  if (result.success && result.metadata) {
    return {
      success: true,
      metadata: result.metadata,
      markdown: result.markdown,
      articleId: result.articleId
    };
  } else {
    throw new Error(result.error || 'Extraction failed');
  }
}

describe('SidePanel extractContent result processing (Issue #107)', () => {
  test('should handle new result structure (PR #100 format) correctly', () => {
    const result = {
      success: true,
      metadata: { title: 'Test Article', url: 'https://example.com' },
      markdown: '# Test Article\n\nContent',
      articleId: 42
    };
    const processed = processExtractResult(result);
    expect(processed.success).toBe(true);
    expect(processed.metadata.title).toBe('Test Article');
    expect(processed.markdown).toBe('# Test Article\n\nContent');
    expect(processed.articleId).toBe(42);
  });

  test('should fail with old data structure { success, data: { metadata } } - regression guard', () => {
    const oldStructureResult = {
      success: true,
      data: {
        metadata: { title: 'Test' },
        markdown: '# Test'
      }
    };
    expect(() => processExtractResult(oldStructureResult)).toThrow('Extraction failed');
  });

  test('should throw with error message when success is false', () => {
    const result = { success: false, error: 'Could not extract content' };
    expect(() => processExtractResult(result)).toThrow('Could not extract content');
  });

  test('should throw generic message when error field is missing', () => {
    const result = { success: false };
    expect(() => processExtractResult(result)).toThrow('Extraction failed');
  });

  test('should include articleId when present', () => {
    const result = {
      success: true,
      metadata: { title: 'Test', url: 'https://example.com' },
      markdown: '# Test',
      articleId: 123
    };
    const processed = processExtractResult(result);
    expect(processed.articleId).toBe(123);
  });
});

/**
 * Regression tests for Issue #137
 * pendingExtraction type mismatch: popup saves an object, sidepanel treated it as boolean flag
 */

// Simulate checkPendingExtraction logic extracted for unit testing
async function simulateCheckPendingExtraction(storageData, displayMarkdownFn) {
  const result = storageData.viewingArticle
    ? { viewingArticle: storageData.viewingArticle }
    : { viewingArticle: undefined };

  if (result.viewingArticle) {
    displayMarkdownFn(result.viewingArticle);
    return false;
  }

  const pending = storageData.pendingExtraction;
  if (pending) {
    if (typeof pending === 'object') {
      displayMarkdownFn(pending);
      return false;
    }
    return true;
  }

  return null;
}

describe('checkPendingExtraction - pendingExtraction type handling (Issue #137)', () => {
  test('should display data and return false when pendingExtraction is an object', async () => {
    const mockData = {
      metadata: { title: 'Saved Article', url: 'https://example.com' },
      markdown: '# Saved Article\n\nContent'
    };
    const displayMarkdown = jest.fn();
    const result = await simulateCheckPendingExtraction(
      { pendingExtraction: mockData },
      displayMarkdown
    );
    expect(result).toBe(false);
    expect(displayMarkdown).toHaveBeenCalledWith(mockData);
  });

  test('should return true (re-extract) when pendingExtraction is boolean true', async () => {
    const displayMarkdown = jest.fn();
    const result = await simulateCheckPendingExtraction(
      { pendingExtraction: true },
      displayMarkdown
    );
    expect(result).toBe(true);
    expect(displayMarkdown).not.toHaveBeenCalled();
  });

  test('should return null when neither pendingExtraction nor viewingArticle is set', async () => {
    const displayMarkdown = jest.fn();
    const result = await simulateCheckPendingExtraction({}, displayMarkdown);
    expect(result).toBeNull();
    expect(displayMarkdown).not.toHaveBeenCalled();
  });

  test('should display viewingArticle and return false when viewingArticle is set', async () => {
    const article = { metadata: { title: 'Viewed' }, markdown: '# Viewed' };
    const displayMarkdown = jest.fn();
    const result = await simulateCheckPendingExtraction(
      { viewingArticle: article },
      displayMarkdown
    );
    expect(result).toBe(false);
    expect(displayMarkdown).toHaveBeenCalledWith(article);
  });

  test('viewingArticle takes priority over pendingExtraction', async () => {
    const article = { metadata: { title: 'Viewing' }, markdown: '# Viewing' };
    const pending = { metadata: { title: 'Pending' }, markdown: '# Pending' };
    const displayMarkdown = jest.fn();
    const result = await simulateCheckPendingExtraction(
      { viewingArticle: article, pendingExtraction: pending },
      displayMarkdown
    );
    expect(result).toBe(false);
    expect(displayMarkdown).toHaveBeenCalledWith(article);
    expect(displayMarkdown).toHaveBeenCalledTimes(1);
  });
});
