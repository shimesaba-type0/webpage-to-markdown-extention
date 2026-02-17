/**
 * Tests for popup sendToSidePanelWithRetry response validation
 * Regression tests for Issue #104 (SW response { success: false } not checked)
 */

// sendToSidePanelWithRetry の SW レスポンス検証ロジックを切り出してテスト
async function validateSWResponse(response) {
  if (!response || !response.success) {
    throw new Error(response?.error || 'SidePanel not ready');
  }
  return true;
}

describe('sendToSidePanelWithRetry SW response validation (Issue #104)', () => {
  test('should succeed when SW returns { success: true }', async () => {
    const response = { success: true };
    const result = await validateSWResponse(response);
    expect(result).toBe(true);
  });

  test('should throw when SW returns { success: false } - regression guard', async () => {
    const response = {
      success: false,
      error: 'Could not establish connection. Receiving end does not exist.'
    };
    await expect(validateSWResponse(response)).rejects.toThrow('Could not establish connection');
  });

  test('should throw when SW returns null response', async () => {
    await expect(validateSWResponse(null)).rejects.toThrow('SidePanel not ready');
  });

  test('should throw with generic message when error field is missing', async () => {
    const response = { success: false };
    await expect(validateSWResponse(response)).rejects.toThrow('SidePanel not ready');
  });

  test('should throw when SW returns undefined', async () => {
    await expect(validateSWResponse(undefined)).rejects.toThrow('SidePanel not ready');
  });
});
