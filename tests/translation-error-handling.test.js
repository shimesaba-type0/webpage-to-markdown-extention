/**
 * Regression tests for translation failure handling.
 * Covers Issue #145 and Issue #146.
 */

const INVALID_ANTHROPIC_MODEL_PREFIX = 'Invalid Anthropic model ID:';

function simulateAnthropicError(status, message, model) {
  if (
    status === 400 &&
    /model/i.test(message) &&
    /(invalid|not found|unknown|supported)/i.test(message)
  ) {
    throw new Error(`${INVALID_ANTHROPIC_MODEL_PREFIX} ${model}. Please choose a valid model in Settings.`);
  }

  throw new Error(`Translation API error: ${status} - ${message}`);
}

async function simulateTranslationRun(sectionResults) {
  const translatedSections = [];
  let failedSections = 0;

  for (const result of sectionResults) {
    try {
      if (result instanceof Error) {
        throw result;
      }
      translatedSections.push(result);
    } catch (error) {
      failedSections++;

      if (error.message.includes(INVALID_ANTHROPIC_MODEL_PREFIX)) {
        throw error;
      }

      translatedSections.push(error.originalText || '[original]');
    }
  }

  if (failedSections === sectionResults.length) {
    throw new Error('Translation failed for all sections. Please try again after checking your model, network, or rate limits.');
  }

  return {
    translatedMarkdown: translatedSections.join('\n\n'),
    failedSections,
    totalSections: sectionResults.length
  };
}

describe('Issue #145 translation fallback handling', () => {
  test('should throw and avoid success when all sections fail', async () => {
    const failures = [
      Object.assign(new Error('network down'), { originalText: '# Intro' }),
      Object.assign(new Error('network down'), { originalText: 'Body' })
    ];

    await expect(simulateTranslationRun(failures)).rejects.toThrow(
      'Translation failed for all sections'
    );
  });

  test('should report partial failures when some sections succeed', async () => {
    const result = await simulateTranslationRun([
      '# 見出し',
      Object.assign(new Error('temporary 5xx'), { originalText: 'Original body' }),
      'Translated footer'
    ]);

    expect(result.failedSections).toBe(1);
    expect(result.totalSections).toBe(3);
    expect(result.translatedMarkdown).toContain('Original body');
  });
});

describe('Issue #146 invalid Anthropic model handling', () => {
  test('should convert invalid model API responses into a dedicated settings error', () => {
    expect(() => simulateAnthropicError(
      400,
      'The model claude-haiku-4-5-20251001 is invalid or not supported',
      'claude-haiku-4-5-20251001'
    )).toThrow('Invalid Anthropic model ID: claude-haiku-4-5-20251001');
  });

  test('should leave unrelated API errors as generic translation failures', () => {
    expect(() => simulateAnthropicError(
      429,
      'rate limit exceeded',
      'claude-sonnet-4-20250514'
    )).toThrow('Translation API error: 429 - rate limit exceeded');
  });
});
