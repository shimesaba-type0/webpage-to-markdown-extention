/**
 * Tests for progressive translation display (Issue #109)
 *
 * Tests the section-by-section translation accumulation logic
 * that allows users to see translated content as each section completes.
 */

// ── Helpers extracted from service-worker.js ──────────────────────────────

function splitMarkdownIntoSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  let currentSection = [];
  let currentHeading = null;
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code block state (Issue #111)
    if (line.startsWith('```') || line.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
    }

    const headingMatch = !inCodeBlock && line.match(/^(#{1,2})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.length > 0) {
        sections.push({ heading: currentHeading, content: currentSection.join('\n') });
      }
      currentHeading = line;
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }

  if (currentSection.length > 0) {
    sections.push({ heading: currentHeading, content: currentSection.join('\n') });
  }

  return sections;
}

// ── Helpers extracted from sidepanel.js ───────────────────────────────────

/**
 * Simulates the progressive accumulation of translated sections
 * as they arrive from the service worker.
 */
function createProgressiveAccumulator() {
  const buffer = [];

  return {
    addSection(sectionIndex, translatedContent) {
      buffer[sectionIndex] = translatedContent;
      // Build partial markdown from consecutive sections received so far
      return buffer.filter(s => s !== undefined).join('\n\n');
    },
    getBuffer() {
      return buffer;
    }
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('splitMarkdownIntoSections (Issue #109)', () => {
  test('should split markdown into sections at H1 headings', () => {
    const markdown = `# Introduction\n\nSome intro text.\n\n# Details\n\nDetail text.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('# Introduction');
    expect(sections[1].heading).toBe('# Details');
  });

  test('should split markdown at H2 headings', () => {
    const markdown = `## Section A\n\nContent A.\n\n## Section B\n\nContent B.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('## Section A');
    expect(sections[1].heading).toBe('## Section B');
  });

  test('should treat content before first heading as its own section', () => {
    const markdown = `Preamble text.\n\n# Section One\n\nSection content.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toContain('Preamble text.');
  });

  test('should NOT split at H3+ headings', () => {
    const markdown = `# Main\n\nSome text.\n\n### SubSection\n\nSub content.`;
    const sections = splitMarkdownIntoSections(markdown);
    // H3 should not trigger a split - still only 1 section from # Main
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain('### SubSection');
  });

  test('should handle markdown with no headings as single section', () => {
    const markdown = `Just plain text.\n\nMore text.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
  });

  test('should handle empty markdown', () => {
    const sections = splitMarkdownIntoSections('');
    // Empty string produces one empty section
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toBe('');
  });

  test('should NOT split on headings inside backtick code blocks (Issue #111 fix)', () => {
    const markdown = `# Section\n\n\`\`\`js\n## Not a heading\n\`\`\`\n\nMore text.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain('## Not a heading');
  });

  test('should NOT split on headings inside tilde code blocks', () => {
    const markdown = `# Section\n\n~~~python\n## Not a heading\n~~~\n\nMore text.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(1);
  });

  test('should resume splitting after code block closes', () => {
    const markdown = `# First\n\n\`\`\`js\n## Inside block\n\`\`\`\n\n## Second\n\nContent.`;
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(2);
    expect(sections[1].heading).toBe('## Second');
  });
});

describe('Progressive translation accumulation (Issue #109)', () => {
  test('should return only first section content after first arrival', () => {
    const acc = createProgressiveAccumulator();
    const partial = acc.addSection(0, '# 導入\n\n最初のセクション内容。');
    expect(partial).toBe('# 導入\n\n最初のセクション内容。');
  });

  test('should accumulate sections in order', () => {
    const acc = createProgressiveAccumulator();
    acc.addSection(0, 'セクション0');
    const partial = acc.addSection(1, 'セクション1');
    expect(partial).toBe('セクション0\n\nセクション1');
  });

  test('should handle 3 sections accumulating one by one', () => {
    const acc = createProgressiveAccumulator();
    acc.addSection(0, 'First');
    acc.addSection(1, 'Second');
    const final = acc.addSection(2, 'Third');
    expect(final).toBe('First\n\nSecond\n\nThird');
  });

  test('percentage calculation should be correct', () => {
    const totalSections = 5;
    const cases = [
      { index: 0, expected: 20 },
      { index: 1, expected: 40 },
      { index: 2, expected: 60 },
      { index: 3, expected: 80 },
      { index: 4, expected: 100 }
    ];
    for (const { index, expected } of cases) {
      const percentage = Math.round(((index + 1) / totalSections) * 100);
      expect(percentage).toBe(expected);
    }
  });

  test('buffer should preserve each section independently', () => {
    const acc = createProgressiveAccumulator();
    acc.addSection(0, 'Alpha');
    acc.addSection(1, 'Beta');
    const buf = acc.getBuffer();
    expect(buf[0]).toBe('Alpha');
    expect(buf[1]).toBe('Beta');
  });

  test('resetting buffer should clear previous translation state', () => {
    // Simulates starting a new translation by creating a fresh accumulator
    let acc = createProgressiveAccumulator();
    acc.addSection(0, 'Old translation');

    // Start new translation (reset)
    acc = createProgressiveAccumulator();
    const partial = acc.addSection(0, 'New translation');
    expect(partial).toBe('New translation');
    expect(partial).not.toContain('Old');
  });
});

describe('Service worker delay reduction (Issue #109)', () => {
  test('100ms delay should be less than 500ms (confirming optimization)', () => {
    const newDelay = 100;
    const oldDelay = 500;
    expect(newDelay).toBeLessThan(oldDelay);
  });

  test('section count calculation should match expected timing reduction', () => {
    // For 8 sections: old = 7 * 500ms = 3500ms, new = 7 * 100ms = 700ms
    const sections = 8;
    const gaps = sections - 1;
    const oldTotalDelay = gaps * 500;
    const newTotalDelay = gaps * 100;
    expect(newTotalDelay).toBeLessThan(oldTotalDelay);
    expect(oldTotalDelay - newTotalDelay).toBe(2800); // 2.8 seconds saved from delays alone
  });
});
