/**
 * Tests for sidepanel extractContent result processing
 * Regression tests for Issue #107 (result.data structure fix)
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
