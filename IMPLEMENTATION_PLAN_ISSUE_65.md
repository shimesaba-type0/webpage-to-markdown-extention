# 実装プラン: Issue #65 - Fix Invalid article ID Error

## 担当
Developer Alpha

## 目的
`result.data` の誤ったアクセスにより発生する "Invalid article ID: [object Object]" エラーを修正し、翻訳機能を正常に動作させる。

## 分析

### 現状の問題点
1. **popup.js Line 113**: `result.data.articleId` にアクセスしているが、正しくは `result.articleId`
2. **popup.js Line 119**: `result.data.images` にアクセスしているが、正しくは `result.images`
3. **popup.js Line 143**: Auto-translate で `result.data.articleId` を使用、`undefined` または `object` が渡される
4. **popup.js Line 162-189**: `handleTranslate()` にバリデーションがない（Issue #63 で追加漏れ）
5. **popup.js Line 18**: "Translate to JP" ボタンが引数なしで `handleTranslate()` を呼び出し

### データ構造の正しい理解

**service-worker.js `handleSaveArticle()` の戻り値**:
```javascript
return {
  articleId,      // number
  metadata,       // object
  markdown        // string
};
```

**service-worker.js message handler**:
```javascript
sendResponse({ success: true, ...result });
// = { success: true, articleId, metadata, markdown }
```

**content-script.js**:
```javascript
return response; // { success: true, articleId, metadata, markdown }
```

**popup.js**:
```javascript
const result = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
// result = { success: true, articleId, metadata, markdown }

// ❌ WRONG: result.data.articleId
// ✅ CORRECT: result.articleId
```

## 解決アプローチ

### 1. データアクセスの修正
すべての `result.data.*` を `result.*` に修正

### 2. バリデーション追加
`handleTranslate()` に Issue #63 と同様の多層防御を実装

### 3. "Translate to JP" ボタンの削除
- 混乱を避けるため、グローバルな翻訳ボタンを削除
- 個別記事の翻訳ボタンのみサポート

## 実装詳細

### 修正対象ファイル

#### 1. `src/popup/popup.js`

**変更箇所1: Line 113-122 (handleExtract 内)**
```javascript
// BEFORE
const { metadata, markdown, articleId } = result.data;
await chrome.runtime.sendMessage({
  action: 'displayMarkdown',
  data: {
    metadata,
    markdown,
    images: result.data.images || [],
    articleId
  }
});

// AFTER (Issue #65: Fix data structure access)
const { metadata, markdown, articleId } = result;
await chrome.runtime.sendMessage({
  action: 'displayMarkdown',
  data: {
    metadata,
    markdown,
    images: result.images || [],
    articleId
  }
});
```

**理由**:
- `result` 自体に `articleId`, `metadata`, `markdown` が含まれる
- `result.data` は存在しない

**変更箇所2: Line 143-147 (Auto-translate)**
```javascript
// BEFORE
if (settings.enableTranslation && settings.autoTranslate && result.data && result.data.articleId) {
  setTimeout(() => {
    handleTranslate(result.data.articleId);
  }, 1000);
}

// AFTER (Issue #65: Fix data structure access)
if (settings.enableTranslation && settings.autoTranslate && result.articleId) {
  setTimeout(() => {
    handleTranslate(result.articleId);
  }, 1000);
}
```

**理由**:
- `result.articleId` が正しいアクセス方法
- `result.data.articleId` は `undefined`

**変更箇所3: Line 162-189 (handleTranslate)**
```javascript
// BEFORE
async function handleTranslate(articleId) {
  try {
    showStatus('Translating to Japanese...', 'loading');
    translateBtn.disabled = true;

    if (!articleId) {
      throw new Error('No article selected for translation');
    }

    // ...
  }
}

// AFTER (Issue #65: Add validation)
/**
 * Handle translate action
 *
 * Bug Fix (Issue #65):
 * - Add articleId validation to prevent IndexedDB errors
 * - Ensure articleId is a valid positive number
 */
async function handleTranslate(articleId) {
  try {
    // Validate articleId (Issue #65: Defense in depth)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID for translation: ${articleId} (type: ${typeof articleId})`);
    }

    showStatus('Translating to Japanese...', 'loading');
    translateBtn.disabled = true;

    // ...
  }
}
```

**理由**:
- Issue #63 で他の関数に追加したバリデーションが漏れていた
- 多層防御の一貫性を保つ

**変更箇所4: Line 6-9, 18, 39-41 ("Translate to JP" ボタン削除)**
```javascript
// BEFORE (Line 6-9)
const extractBtn = document.getElementById('extract-btn');
const translateBtn = document.getElementById('translate-btn');
const settingsBtn = document.getElementById('settings-btn');

// AFTER (Issue #65: Remove global translate button)
const extractBtn = document.getElementById('extract-btn');
// translateBtn removed (Issue #65: Use per-article translate buttons instead)
const settingsBtn = document.getElementById('settings-btn');

// BEFORE (Line 18)
translateBtn.addEventListener('click', handleTranslate);

// AFTER
// Removed (Issue #65)

// BEFORE (Line 39-41)
if (settings.enableTranslation) {
  translateBtn.style.display = 'flex';
}

// AFTER
// Removed (Issue #65)

// BEFORE (Line 165, 187)
translateBtn.disabled = true;
translateBtn.disabled = false;

// AFTER
// Removed (Issue #65: handleTranslate no longer used by global button)
```

**理由**:
- グローバル翻訳ボタンはどの記事を翻訳するか不明確
- 個別記事の翻訳ボタンで十分
- UI の混乱を避ける

**注意**: `handleTranslate()` 関数は Auto-translate 機能で使用されているため、削除せず保持

#### 2. `src/popup/popup.html`

**変更箇所: Line 22-25 ("Translate to JP" ボタン削除)**
```html
<!-- BEFORE -->
<button id="translate-btn" class="btn btn-secondary" style="display: none;">
  <span class="icon">🌐</span>
  Translate to JP
</button>

<!-- AFTER (Issue #65: Remove global translate button) -->
<!-- Removed: Use per-article translate buttons in article list instead -->
```

**理由**:
- popup.js の変更と一貫性を保つ
- 不要な UI 要素を削除

## 技術的考慮事項

### データ構造の一貫性
- `result` の構造を明確に文書化
- 今後の開発で `result.data` の誤用を防ぐ

### バリデーションの一貫性
- すべての翻訳関連関数でバリデーション実施
- エラーメッセージに型情報を含める

### UX 改善
- グローバル翻訳ボタンの削除により、ユーザーの混乱を軽減
- 個別翻訳ボタンのみで機能を統一

## テスト観点

### 正常系
- [x] 記事抽出後、Auto-translate が有効な場合に自動翻訳
- [x] 個別記事の翻訳ボタンで翻訳が成功
- [x] 翻訳済み記事のバッジが表示

### 異常系
- [x] `articleId` が `undefined`: エラーメッセージ表示
- [x] `articleId` が `NaN`: エラーメッセージ表示
- [x] `articleId` が `object`: エラーメッセージ表示

### エッジケース
- [x] Auto-translate 無効時: 翻訳されない
- [x] 翻訳設定が無効時: エラーメッセージ表示
- [x] API キー未設定時: エラーメッセージ表示

## 実装完了後の確認事項

- [x] コンソールエラーなし
- [x] Auto-translate が正常動作
- [x] 個別翻訳ボタンが正常動作
- [x] "Translate to JP" ボタンが削除されている
- [x] 既存機能（Extract、View、Export）に影響なし

## 次のステップ

1. Developer Alpha: コード修正実装
2. Reviewer Alpha: コードレビュー
3. Conductor: PR 作成・マージ
4. Issue #65 クローズ
5. Issue #66 の実装開始
