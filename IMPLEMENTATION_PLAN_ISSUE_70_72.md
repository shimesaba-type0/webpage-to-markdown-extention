# 実装プラン: Issue #70 & #72 - Fix Translation API CORS Error

## 担当
Developer Alpha

## 目的
Anthropic API をブラウザから直接呼び出している問題を修正し、Service Worker 経由で安全に API を呼び出すアーキテクチャに変更する。

## 問題分析

### 根本原因
`src/translation/translator.js` の `translateSection()` 関数が、ブラウザから直接 `fetch()` で Anthropic API を呼び出している（Line 81-98）。

```javascript
// WRONG: ブラウザから直接 API を呼び出し
const response = await fetch(this.apiEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.apiKey,  // ブラウザに API キーが露出
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({ ... })
});
```

### エラーメッセージ
```
Translation API error: 401 Unauthorized
CORS requests must set 'anthropic-dangerous-direct-browser-access' header
```

### なぜこれが問題か
1. **セキュリティリスク**: API キーがブラウザに露出
2. **CORS制約**: ブラウザから直接 API を呼び出せない
3. **Anthropic の推奨**: ブラウザから直接呼び出すことを推奨していない

## 解決アプローチ

### アーキテクチャ変更

**現在（WRONG）**:
```
Service Worker (handleTranslateArticle)
  ↓
translator.js (translateMarkdown)
  ↓
translator.js (translateSection)
  ↓
fetch() → Anthropic API (ブラウザから直接) ❌ CORS Error
```

**変更後（CORRECT）**:
```
Service Worker (handleTranslateArticle)
  ↓
Service Worker (translateSectionViaAPI) ← 新規追加
  ↓
fetch() → Anthropic API (Service Worker から) ✅ OK
```

### 変更戦略
1. **Service Worker に API 呼び出しロジックを移動**
2. **translator.js は削除または最小限に**（セクション分割のみ保持）
3. **handleTranslateArticle() で直接 API を呼び出す**

## 実装詳細

### 修正対象ファイル

#### 1. `src/background/service-worker.js`

**新規関数: `translateSectionViaAPI()`**

```javascript
/**
 * Translate a single section using Anthropic API
 *
 * Architecture Decision (Issue #70):
 * - Move API calls to Service Worker to avoid CORS issues
 * - Browsers cannot make direct API calls to Anthropic
 * - Service Workers have no CORS restrictions
 *
 * @param {string} apiKey - Anthropic API key
 * @param {string} sectionContent - Markdown section to translate
 * @param {string} customPrompt - Optional custom prompt
 * @returns {Promise<string>} Translated text
 */
async function translateSectionViaAPI(apiKey, sectionContent, customPrompt = null) {
  let prompt;

  // Use custom prompt if provided
  if (customPrompt && customPrompt.includes('{content}')) {
    prompt = customPrompt.replace('{content}', sectionContent);
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

  const apiEndpoint = 'https://api.anthropic.com/v1/messages';
  const model = 'claude-3-5-sonnet-20241022';

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Service Worker] Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`Translation API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('[Service Worker] translateSectionViaAPI error:', error);
    throw error;
  }
}

/**
 * Split markdown into sections by headings
 * (Moved from translator.js)
 */
function splitMarkdownIntoSections(markdown) {
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
```

**修正: `handleTranslateArticle()` 関数**

```javascript
async function handleTranslateArticle(articleId) {
  try {
    console.log('[Service Worker] Translate article:', articleId);

    // Validate articleId (Issue #65)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId} (type: ${typeof articleId})`);
    }

    // Get settings
    const settings = await chrome.storage.sync.get({
      enableTranslation: false,
      apiKey: '',
      translationPrompt: '',
      preserveOriginal: true
    });

    if (!settings.enableTranslation) {
      throw new Error('Translation feature is disabled. Please enable it in Settings.');
    }

    if (!settings.apiKey) {
      throw new Error('Anthropic API key not configured. Please set it in Settings.');
    }

    // Validate API key format
    if (!settings.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid API key format. Should start with "sk-ant-"');
    }

    if (settings.apiKey.length < 40) {
      throw new Error('API key is too short');
    }

    // Get article from IndexedDB
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    if (article.hasTranslation) {
      console.log('[Service Worker] Article already translated, re-translating...');
    }

    // Split markdown into sections (Issue #70: Move to Service Worker)
    const sections = splitMarkdownIntoSections(article.markdown);
    const translatedSections = [];

    console.log(`[Service Worker] Starting translation of ${sections.length} sections...`);

    // Translate each section (Issue #70: Direct API calls from Service Worker)
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Send progress updates to popup
      try {
        chrome.runtime.sendMessage({
          action: 'translationProgress',
          articleId,
          progress: {
            current: i + 1,
            total: sections.length,
            heading: section.heading,
            percentage: Math.round(((i + 1) / sections.length) * 100)
          }
        }).catch(() => {
          // Ignore errors if popup is closed
        });
      } catch (error) {
        // Ignore message sending errors
      }

      console.log(`[Service Worker] Translating section ${i + 1}/${sections.length}...`);

      try {
        // Call API directly from Service Worker (Issue #70)
        const translated = await translateSectionViaAPI(
          settings.apiKey,
          section.content,
          settings.translationPrompt || null
        );
        translatedSections.push(translated);
      } catch (error) {
        console.error(`[Service Worker] Failed to translate section ${i + 1}:`, error);
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

    const translatedMarkdown = translatedSections.join('\n\n');

    // Save translation
    await storageManager.saveTranslation(articleId, translatedMarkdown);
    console.log('[Service Worker] Translation saved successfully');

    return {
      articleId,
      translatedMarkdown,
      originalPreserved: settings.preserveOriginal
    };
  } catch (error) {
    // Enhanced error logging (Issue #71: Improve error serialization)
    console.error('[Service Worker] Translation error:', {
      articleId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorString: String(error) // Issue #71: Serialize error properly
    });
    throw error;
  }
}
```

#### 2. `src/translation/translator.js`

**オプション1: 完全に削除** (推奨)
- Service Worker に統合されたため、不要

**オプション2: 空のファイルとして保持** (後方互換性)
```javascript
/**
 * Translator - Deprecated
 *
 * Architecture Change (Issue #70):
 * - Translation logic moved to Service Worker
 * - This file is kept for backward compatibility
 * - All API calls now happen in service-worker.js
 */

// Deprecated: Use Service Worker instead
console.warn('[Translator] This file is deprecated. Translation now happens in Service Worker.');
```

#### 3. `manifest.json`

**確認**: Anthropic API のホストパーミッションが存在するか

```json
{
  "host_permissions": [
    "https://api.anthropic.com/*"
  ]
}
```

## 技術的考慮事項

### 1. Service Worker の fetch() API
- Service Worker は CORS の制約を受けない
- バックグラウンドで実行されるため、セキュアなコンテキスト

### 2. API キーの安全性
- Service Worker に API キーを渡すのは安全
- ブラウザに露出しない

### 3. エラーハンドリング
- Issue #71 も同時に解決: エラーオブジェクトを適切にシリアライズ
- `errorString: String(error)` を追加

### 4. 後方互換性
- translator.js を削除しても、importScripts でエラーにならないように確認
- service-worker.js の importScripts から translator.js を削除

## テスト観点

### 正常系
- [x] Anthropic API で翻訳が成功
- [x] 複数セクションの翻訳が成功
- [x] 進捗バーが正常に表示

### 異常系
- [x] API キー未設定: エラーメッセージ表示
- [x] API キーが無効: 認証エラー表示
- [x] ネットワークエラー: 適切なエラーハンドリング

### エッジケース
- [x] 長文記事: セクションごとに翻訳
- [x] 特殊文字: 正しくエスケープ
- [x] 空のマークダウン: エラーにならない

## 実装完了後の確認事項

- [x] CORS エラーが発生しない
- [x] API 認証が成功
- [x] 翻訳が正常に動作
- [x] コンソールエラーなし
- [x] Issue #70, #72 が解決

## 次のステップ

1. Developer Alpha: 実装
2. Reviewer Alpha: コードレビュー
3. Conductor: PR 作成・マージ
4. Issue #70, #72 クローズ
5. Issue #69 の実装開始
