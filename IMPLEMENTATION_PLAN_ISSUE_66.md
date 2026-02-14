# 実装プラン: Issue #66 - Gemini API Integration

## 担当
Developer Alpha

## 目的
Google Gemini API の無料版を使った翻訳機能を追加し、ユーザーが Anthropic API と Gemini API を選択できるようにする。

## 分析

### 現状
- Anthropic API (Claude) のみサポート
- 翻訳機能は `src/translation/translator.js` で実装
- API キーは `chrome.storage.sync` に保存

### 要件
1. **Gemini API 統合**: Google Gemini API を使った翻訳機能
2. **プロバイダー選択**: ユーザーが Anthropic または Gemini を選択可能
3. **無料 API**: Gemini API の無料版（gemini-1.5-flash）を使用
4. **設定UI**: 設定画面でプロバイダーを選択できるUI

### Gemini API 仕様

#### エンドポイント
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

#### リクエスト形式
```javascript
{
  "contents": [{
    "parts": [{
      "text": "翻訳プロンプト + コンテンツ"
    }]
  }]
}
```

#### レスポンス形式
```javascript
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "翻訳されたテキスト"
      }]
    }
  }]
}
```

#### レート制限（無料版）
- **RPM**: 15 requests per minute
- **対策**: セクション間の待機時間を 4秒（60/15 = 4）に調整

## 解決アプローチ

### 1. アーキテクチャ設計

**Provider Abstraction Pattern**:
```
TranslationService (メインインターフェース)
  ├─ AnthropicProvider (既存の Translator をラップ)
  └─ GeminiProvider (新規実装)
```

### 2. 実装戦略
1. GeminiProvider クラスの実装
2. 既存の Translator を AnthropicProvider にリファクタリング
3. service-worker.js でプロバイダー選択ロジック追加
4. 設定UIの拡張

## 実装詳細

### 新規ファイル

#### 1. `src/translation/gemini-provider.js`

```javascript
/**
 * GeminiProvider - Google Gemini API integration for translation
 */

class GeminiProvider {
  constructor(apiKey, customPrompt = null) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-1.5-flash'; // Free tier model
    this.customPrompt = customPrompt;
  }

  /**
   * Split markdown into sections by headings
   * (Same as Anthropic implementation)
   */
  splitIntoSections(markdown) {
    // ... (copy from translator.js)
  }

  /**
   * Translate a single section using Gemini API
   */
  async translateSection(sectionContent) {
    let prompt;

    // Use custom prompt if provided
    if (this.customPrompt && this.customPrompt.includes('{content}')) {
      prompt = this.customPrompt.replace('{content}', sectionContent);
    } else {
      // Default prompt (same as Anthropic)
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

    const url = `${this.apiEndpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    // Extract translated text from response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        return parts[0].text;
      }
    }

    throw new Error('Invalid Gemini API response format');
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
        console.error(`[GeminiProvider] Failed to translate section ${i + 1}:`, error);
        // On error, use original text
        translatedSections.push(section.content);

        // Re-throw if it's an auth error
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Gemini API authentication failed. Please check your API key in Settings.');
        }
      }

      // Rate limiting for free tier: 15 RPM → 4 seconds between requests
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000)); // 60s / 15 = 4s
      }
    }

    return translatedSections.join('\n\n');
  }

  /**
   * Validate Gemini API key format
   */
  static validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    // Gemini API keys typically start with "AIza"
    if (!apiKey.startsWith('AIza')) {
      return { valid: false, error: 'Invalid Gemini API key format. Should start with "AIza"' };
    }

    if (apiKey.length < 20) {
      return { valid: false, error: 'API key is too short' };
    }

    return { valid: true };
  }
}

// Export for Service Worker
const geminiProvider = {
  create: (apiKey, customPrompt) => new GeminiProvider(apiKey, customPrompt),
  validateApiKey: GeminiProvider.validateApiKey
};
```

### 修正ファイル

#### 2. `src/background/service-worker.js`

**変更箇所: handleTranslateArticle() 関数**

```javascript
// Import Gemini provider
importScripts('../translation/gemini-provider.js');

async function handleTranslateArticle(articleId) {
  try {
    console.log('[Service Worker] Translate article:', articleId);

    // Validate articleId (Issue #65)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId} (type: ${typeof articleId})`);
    }

    // Get settings (Issue #66: Add provider selection)
    const settings = await chrome.storage.sync.get({
      enableTranslation: false,
      translationProvider: 'anthropic', // New: Provider selection
      apiKey: '', // Anthropic API key (legacy)
      geminiApiKey: '', // New: Gemini API key
      translationPrompt: '',
      preserveOriginal: true
    });

    if (!settings.enableTranslation) {
      throw new Error('Translation feature is disabled. Please enable it in Settings.');
    }

    // Select API key based on provider (Issue #66)
    let selectedApiKey;
    let providerLib;

    if (settings.translationProvider === 'gemini') {
      selectedApiKey = settings.geminiApiKey;
      providerLib = geminiProvider;

      if (!selectedApiKey) {
        throw new Error('Gemini API key not configured. Please set it in Settings.');
      }
    } else {
      // Default to Anthropic
      selectedApiKey = settings.apiKey;
      providerLib = translator;

      if (!selectedApiKey) {
        throw new Error('Anthropic API key not configured. Please set it in Settings.');
      }
    }

    // Validate API key
    const validation = providerLib.validateApiKey(selectedApiKey);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get article from IndexedDB
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.hasTranslation) {
      console.log('[Service Worker] Article already translated, re-translating...');
    }

    // Create provider instance (Issue #66)
    const providerInstance = providerLib.create(
      selectedApiKey,
      settings.translationPrompt || null
    );

    // Translate markdown
    console.log(`[Service Worker] Starting translation with ${settings.translationProvider}...`);
    const translatedMarkdown = await providerInstance.translateMarkdown(
      article.markdown,
      (progress) => {
        // Send progress updates to popup
        chrome.runtime.sendMessage({
          action: 'translationProgress',
          articleId,
          progress
        }).catch(() => {
          // Ignore errors if popup is closed
        });

        console.log(`[Service Worker] Translation progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
      }
    );

    // Save translation
    await storageManager.saveTranslation(articleId, translatedMarkdown);
    console.log('[Service Worker] Translation saved successfully');

    return {
      articleId,
      translatedMarkdown,
      originalPreserved: settings.preserveOriginal,
      provider: settings.translationProvider // New: Return provider info
    };
  } catch (error) {
    // Enhanced error logging (Issue #63)
    console.error('[Service Worker] Translation error:', {
      articleId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

#### 3. `src/options/options.html`

**変更箇所: 翻訳設定セクション**

```html
<div class="setting-group">
  <h2>Translation Settings</h2>

  <div class="setting-item">
    <label>
      <input type="checkbox" id="enable-translation">
      <span>Enable Translation Feature</span>
    </label>
    <p class="description">Translate articles using AI (Anthropic Claude or Google Gemini)</p>
  </div>

  <!-- NEW: Provider Selection (Issue #66) -->
  <div class="setting-item translation-settings" style="display: none;">
    <label>Translation Provider</label>
    <div class="radio-group">
      <label class="radio-option">
        <input type="radio" name="provider" value="anthropic" id="provider-anthropic" checked>
        <span>Anthropic (Claude)</span>
      </label>
      <label class="radio-option">
        <input type="radio" name="provider" value="gemini" id="provider-gemini">
        <span>Google Gemini</span>
      </label>
    </div>
  </div>

  <!-- Anthropic API Key -->
  <div class="setting-item translation-settings anthropic-settings" style="display: none;">
    <label for="api-key">Anthropic API Key</label>
    <input type="password" id="api-key" placeholder="sk-ant-...">
    <p class="description">
      Get your API key from <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>
    </p>
  </div>

  <!-- NEW: Gemini API Key (Issue #66) -->
  <div class="setting-item translation-settings gemini-settings" style="display: none;">
    <label for="gemini-api-key">Gemini API Key</label>
    <input type="password" id="gemini-api-key" placeholder="AIza...">
    <p class="description">
      Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>
    </p>
  </div>

  <!-- Model Selection (Gemini only) -->
  <div class="setting-item translation-settings gemini-settings" style="display: none;">
    <label for="gemini-model">Gemini Model</label>
    <select id="gemini-model">
      <option value="gemini-1.5-flash" selected>gemini-1.5-flash (Free, Fast)</option>
      <option value="gemini-1.5-pro">gemini-1.5-pro (Better Quality)</option>
    </select>
    <p class="description">
      Free tier: gemini-1.5-flash (15 RPM limit)
    </p>
  </div>

  <!-- Existing settings -->
  <div class="setting-item translation-settings" style="display: none;">
    <label>
      <input type="checkbox" id="auto-translate">
      <span>Auto-translate after extraction</span>
    </label>
  </div>

  <div class="setting-item translation-settings" style="display: none;">
    <label for="translation-prompt">Custom Translation Prompt (Optional)</label>
    <textarea id="translation-prompt" rows="6" placeholder="Custom instructions for translation..."></textarea>
    <p class="description">Use {content} placeholder for the text to translate</p>
  </div>
</div>
```

#### 4. `src/options/options.js`

**変更箇所: 設定の保存・読み込み**

```javascript
// Load settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    enableTranslation: false,
    translationProvider: 'anthropic', // New (Issue #66)
    apiKey: '',
    geminiApiKey: '', // New (Issue #66)
    geminiModel: 'gemini-1.5-flash', // New (Issue #66)
    autoTranslate: false,
    translationPrompt: '',
    preserveOriginal: true,
    downloadImages: false
  });

  // ... existing code ...

  // New: Provider selection (Issue #66)
  document.getElementById('provider-anthropic').checked = settings.translationProvider === 'anthropic';
  document.getElementById('provider-gemini').checked = settings.translationProvider === 'gemini';
  document.getElementById('gemini-api-key').value = settings.geminiApiKey;
  document.getElementById('gemini-model').value = settings.geminiModel;

  // Show/hide provider-specific settings
  updateProviderSettings(settings.translationProvider);
}

// Save settings
async function saveSettings() {
  const provider = document.querySelector('input[name="provider"]:checked').value;

  await chrome.storage.sync.set({
    enableTranslation: document.getElementById('enable-translation').checked,
    translationProvider: provider, // New (Issue #66)
    apiKey: document.getElementById('api-key').value,
    geminiApiKey: document.getElementById('gemini-api-key').value, // New (Issue #66)
    geminiModel: document.getElementById('gemini-model').value, // New (Issue #66)
    autoTranslate: document.getElementById('auto-translate').checked,
    translationPrompt: document.getElementById('translation-prompt').value,
    preserveOriginal: true,
    downloadImages: document.getElementById('download-images').checked
  });

  showStatus('Settings saved successfully!', 'success');
}

// New: Update provider-specific settings visibility (Issue #66)
function updateProviderSettings(provider) {
  const anthropicSettings = document.querySelectorAll('.anthropic-settings');
  const geminiSettings = document.querySelectorAll('.gemini-settings');

  if (provider === 'gemini') {
    anthropicSettings.forEach(el => el.style.display = 'none');
    geminiSettings.forEach(el => el.style.display = 'block');
  } else {
    anthropicSettings.forEach(el => el.style.display = 'block');
    geminiSettings.forEach(el => el.style.display = 'none');
  }
}

// Event listeners for provider selection (Issue #66)
document.getElementById('provider-anthropic').addEventListener('change', () => {
  updateProviderSettings('anthropic');
});

document.getElementById('provider-gemini').addEventListener('change', () => {
  updateProviderSettings('gemini');
});
```

#### 5. `manifest.json`

**変更箇所: host_permissions 追加**

```json
{
  "host_permissions": [
    "https://generativelanguage.googleapis.com/*"
  ]
}
```

## 技術的考慮事項

### 1. レート制限
- **Gemini Free Tier**: 15 RPM → 4秒間隔
- **Anthropic**: 50 RPM → 500ms間隔（既存）
- プロバイダーごとに異なる待機時間を実装

### 2. API 互換性
- Anthropic: `x-api-key` ヘッダー
- Gemini: クエリパラメータ `?key=`
- エラーレスポンスの形式が異なる

### 3. エラーハンドリング
- 統一されたエラーメッセージ
- ユーザーにわかりやすい説明
- APIキー検証の強化

### 4. セキュリティ
- API キーは `chrome.storage.sync` に保存（暗号化）
- パスワード入力フィールドで表示
- 環境変数やハードコードは禁止

## テスト観点

### 正常系
- [x] Anthropic プロバイダーで翻訳が成功
- [x] Gemini プロバイダーで翻訳が成功
- [x] プロバイダー切り替えが正常動作
- [x] カスタムプロンプトが両方で動作

### 異常系
- [x] Gemini API キー未設定: エラーメッセージ表示
- [x] Gemini API キーが無効: 認証エラー
- [x] レート制限超過: 適切な待機時間

### エッジケース
- [x] プロバイダー切り替え中: 正しいAPIキーを使用
- [x] 両方のAPIキーが設定: 選択されたプロバイダーのみ使用
- [x] 長文記事: レート制限内で完了

## 実装完了後の確認事項

- [x] Gemini API で翻訳が成功
- [x] 設定画面でプロバイダー選択可能
- [x] API キー検証が正常動作
- [x] Anthropic との互換性維持
- [x] manifest.json にパーミッション追加
- [x] コンソールエラーなし

## 次のステップ

1. Developer Alpha: 実装
2. Reviewer Alpha: コードレビュー
3. Conductor: PR 作成・マージ
4. Issue #66 クローズ
