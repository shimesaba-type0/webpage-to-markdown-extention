/**
 * Translator - AI-powered translation using Anthropic API
 * Translates markdown content section by section
 */

class Translator {
  constructor(apiKey, customPrompt = null) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022';
    this.customPrompt = customPrompt;
  }

  /**
   * Split markdown into sections by headings
   */
  splitIntoSections(markdown) {
    const sections = [];
    const lines = markdown.split('\n');
    let currentSection = [];
    let currentHeading = null;

    for (const line of lines) {
      // Match H1 or H2 headings
      const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection.length > 0) {
          sections.push({
            heading: currentHeading,
            content: currentSection.join('\n')
          });
        }

        // Start new section
        currentHeading = line;
        currentSection = [line];
      } else {
        currentSection.push(line);
      }
    }

    // Save last section
    if (currentSection.length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentSection.join('\n')
      });
    }

    return sections;
  }

  /**
   * Translate a single section
   */
  async translateSection(sectionContent) {
    let prompt;

    // Use custom prompt if provided
    if (this.customPrompt && this.customPrompt.includes('{content}')) {
      prompt = this.customPrompt.replace('{content}', sectionContent);
    } else {
      // Default prompt
      prompt = `以下のMarkdown形式のテキストを日本語に翻訳してください。

要件:
- Markdown記法はそのまま保持してください
- 見出し、リスト、コードブロック、リンクなどのフォーマットを維持してください
- 自然で読みやすい日本語に翻訳してください
- 技術用語は適切に日本語化してください（例: "function" → "関数"）
- URLやリンクは変更しないでください
- 画像の参照パス（例: ./images/xxx.jpg）は変更しないでください
- コードブロック内のコードは翻訳しないでください

翻訳対象テキスト:
${sectionContent}`;
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Translate entire markdown by sections
   */
  async translateMarkdown(markdown, progressCallback = null) {
    const sections = this.splitIntoSections(markdown);
    const translatedSections = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Report progress
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: sections.length,
          heading: section.heading,
          percentage: Math.round(((i + 1) / sections.length) * 100)
        });
      }

      try {
        const translated = await this.translateSection(section.content);
        translatedSections.push(translated);
      } catch (error) {
        console.error(`[Translator] Failed to translate section ${i + 1}:`, error);
        // On error, use original text
        translatedSections.push(section.content);

        // Re-throw if it's an auth error
        if (error.message.includes('401')) {
          throw new Error('API authentication failed. Please check your API key in Settings.');
        }
      }

      // Rate limiting: 500ms delay between sections
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return translatedSections.join('\n\n');
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    if (!apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Invalid API key format. Should start with "sk-ant-"' };
    }

    if (apiKey.length < 40) {
      return { valid: false, error: 'API key is too short' };
    }

    return { valid: true };
  }
}

// Export for Service Worker
const translator = {
  create: (apiKey, customPrompt) => new Translator(apiKey, customPrompt),
  validateApiKey: Translator.validateApiKey
};

// For ES6 modules (Node.js environment)
/* global module */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = translator;
}
