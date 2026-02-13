# 実装プラン: Issue #63 - Translation IndexedDB Error Fix

## 担当
Developer Alpha

## 目的
翻訳機能で発生する IndexedDB エラー「Failed to execute 'get' on 'IDBObjectStore': The parameter is not a valid key.」を解決し、翻訳機能を正常に動作させる。

## 分析

### 現状の問題点
1. **popup.js:329**: `parseInt(btn.dataset.id)` が `NaN` を返す可能性
   - `article.id` が `undefined` または無効な値の場合
2. **service-worker.js:241**: `getArticle(articleId)` に `NaN` が渡される
   - 型チェックが行われていない
3. **storage-manager.js:102**: IndexedDB の `get()` が無効なキーを拒否
   - エラーメッセージが不明瞭

### データフロー
```
User clicks "Translate" button
  ↓
popup.js: translateArticle(articleId)
  ↓
popup.js: parseInt(btn.dataset.id) → NaN ❌
  ↓
service-worker.js: handleTranslateArticle(NaN)
  ↓
storage-manager.js: getArticle(NaN)
  ↓
IndexedDB: store.get(NaN) → Error!
```

## 解決アプローチ

### 1. 早期バリデーション（Defense in Depth）
各レイヤーで入力値を検証し、無効な値を早期に検出

### 2. 明確なエラーメッセージ
ユーザーに何が問題かを明確に伝える

### 3. デバッグ情報の充実
開発者が問題を追跡しやすいログを追加

## 実装詳細

### 修正対象ファイル

#### 1. `src/popup/popup.js`
**関数**: `translateArticle()` (line 433), イベントリスナー (line 326-332)

**変更内容**:
```javascript
// BEFORE (line 329)
const articleId = parseInt(btn.dataset.id);
await translateArticle(articleId);

// AFTER
const articleId = parseInt(btn.dataset.id);
if (isNaN(articleId) || articleId <= 0) {
  console.error('[Popup] Invalid article ID:', btn.dataset.id);
  showStatus('Error: Invalid article ID', 'error');
  return;
}
await translateArticle(articleId);
```

**変更内容 2**: `translateArticle()` 関数の先頭でバリデーション
```javascript
// AFTER (line 433)
async function translateArticle(articleId) {
  try {
    // Validate articleId
    if (!articleId || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId}`);
    }

    showStatus('Translating article...', 'loading');
    // ... rest of the code
  }
}
```

**理由**:
- ユーザーアクションの時点で無効な ID を検出
- エラーメッセージをUIに即座に表示
- 無駄な API 呼び出しを防ぐ

**効果**:
- エラーの早期発見
- ユーザー体験の向上（明確なエラーメッセージ）

#### 2. `src/background/service-worker.js`
**関数**: `handleTranslateArticle()` (line 214)

**変更内容**:
```javascript
// AFTER (line 214)
async function handleTranslateArticle(articleId) {
  try {
    console.log('[Service Worker] Translate article:', articleId);

    // Validate articleId (Defense in depth)
    if (!articleId || typeof articleId !== 'number' || isNaN(articleId) || articleId <= 0) {
      throw new Error(`Invalid article ID: ${articleId} (type: ${typeof articleId})`);
    }

    // Get settings
    // ... rest of the code
  } catch (error) {
    console.error('[Service Worker] Translation error:', {
      articleId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

**理由**:
- バックエンドでも型安全性を保証
- 詳細なエラーログで問題を追跡
- IndexedDB エラーを防ぐ最後の防衛線

**効果**:
- 防御的プログラミングの実践
- デバッグしやすいエラーメッセージ

#### 3. `src/storage/storage-manager.js`
**関数**: `getArticle()` (line 96)

**変更内容**:
```javascript
// AFTER (line 96)
async getArticle(id) {
  await this.init();

  // Validate ID parameter
  if (!id || typeof id !== 'number' || isNaN(id) || id <= 0) {
    throw new Error(`Invalid article ID for getArticle: ${id} (type: ${typeof id})`);
  }

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction([STORE_ARTICLES], 'readonly');
    const store = transaction.objectStore(STORE_ARTICLES);
    const request = store.get(id);

    request.onsuccess = () => {
      const article = request.result;
      console.log(`[StorageManager] getArticle(${id}):`, article ? 'found' : 'not found');
      resolve(article);
    };

    request.onerror = () => {
      console.error('[StorageManager] getArticle error:', {
        id,
        error: request.error
      });
      reject(request.error);
    };
  });
}
```

**理由**:
- IndexedDB の `get()` に無効なキーを渡さない
- エラーの根本原因（パラメータの型）を明確化
- デバッグログで記事の取得結果を確認

**効果**:
- IndexedDB エラーの完全な防止
- 問題のトラブルシューティングが容易

#### 4. 他の関数にも同様のバリデーション追加

**対象関数**:
- `deleteArticle(id)` (line 143)
- `saveTranslation(articleId, translatedMarkdown)` (line 227)
- `getArticleImages(articleId)` (line 210)

**理由**: 一貫性のある防御的プログラミング

### 追加機能: デバッグモード

**オプション**: `getAllArticles()` で `id` がない記事を検出

```javascript
// src/storage/storage-manager.js (line 112)
async getAllArticles() {
  await this.init();

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction([STORE_ARTICLES], 'readonly');
    const store = transaction.objectStore(STORE_ARTICLES);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');

    const articles = [];
    let invalidCount = 0;

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const article = {
          id: cursor.value.id,
          ...cursor.value
        };

        // Detect invalid IDs
        if (!article.id || typeof article.id !== 'number') {
          console.warn('[StorageManager] Found article with invalid ID:', article);
          invalidCount++;
        } else {
          articles.push(article);
        }

        cursor.continue();
      } else {
        if (invalidCount > 0) {
          console.warn(`[StorageManager] Found ${invalidCount} articles with invalid IDs`);
        }
        resolve(articles);
      }
    };

    request.onerror = () => reject(request.error);
  });
}
```

**理由**: 既存データの問題を検出し、ユーザーに通知

## 技術的考慮事項

### API互換性
- `isNaN()`: すべての JavaScript 環境でサポート
- `typeof`: 標準的な型チェック

### メモリ管理
- バリデーションによるオーバーヘッドは無視できるレベル

### エラーハンドリング
- 3層防御: popup → service-worker → storage-manager
- 各層で明確なエラーメッセージ
- ユーザー向けとデバッグ向けを分離

### パフォーマンス
- 早期バリデーションにより、無駄な処理を削減
- エラーログは console.error/warn で適切に管理

## テスト観点

### 正常系
- [x] 有効な articleId で翻訳が成功
- [x] 翻訳済み記事の再翻訳
- [x] 複数記事の連続翻訳

### 異常系
- [x] articleId が NaN の場合
- [x] articleId が undefined の場合
- [x] articleId が null の場合
- [x] articleId が負の数の場合
- [x] articleId が 0 の場合
- [x] articleId が文字列の場合

### エッジケース
- [x] データベースに存在しない ID
- [x] 翻訳設定が無効な状態
- [x] API キーが未設定

## 実装完了後の確認事項

- [x] コンソールエラーなし
- [x] 翻訳機能が正常動作
- [x] エラーメッセージが明確
- [x] 既存機能（View、Export）に影響なし
- [x] デバッグログが適切に出力

## 次のステップ

1. Developer Alpha: コード修正実装
2. Reviewer Alpha: コードレビュー
3. Conductor: 統合テスト確認
4. PR 作成・マージ
5. Issue #63 クローズ
