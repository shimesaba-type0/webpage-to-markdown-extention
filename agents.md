# Agent Configuration

このファイルは、Webpage to Markdown拡張機能の開発におけるAIエージェント（Claude Code）の動作を定義します。

## プロジェクト概要

**プロジェクト名**: Webpage to Markdown Extension
**目的**: WebページをMarkdown形式に変換し、保存・管理できるChrome/Edge拡張機能
**技術スタック**: Chrome Extensions Manifest V3, IndexedDB, Anthropic API

## 開発フェーズ

### Phase 1: MVP (最小限動作するバージョン)
- 基本的なChrome拡張機能のセットアップ
- Mozilla Readabilityによるコンテンツ抽出
- Turndown.jsによるMarkdown変換
- シンプルなポップアップUI

**優先度**: 🔴 High
**完了条件**: ユーザーがボタンをクリックして、現在のWebページをMarkdownに変換できる

### Phase 2: ストレージ機能
- IndexedDBの実装（articles, images, translations ストア）
- 画像のダウンロードと保存
- 保存済み記事の一覧表示

**優先度**: 🔴 High
**完了条件**: 変換した記事が永続的に保存され、後で閲覧できる

### Phase 3: エクスポート機能
- JSZipを使ったZIPファイル作成
- Markdown + 画像フォルダのエクスポート
- 単一記事・複数記事の一括エクスポート

**優先度**: 🟡 Medium
**完了条件**: 保存した記事をZIPファイルとしてダウンロードできる

### Phase 4: 翻訳機能
- Anthropic API統合
- 章ごとの翻訳処理
- 翻訳ON/OFFスイッチ
- カスタム翻訳プロンプト設定
- 原文と翻訳の両方を保存

**優先度**: 🟡 Medium
**完了条件**: ユーザーがAPIキーを設定し、記事を日本語に翻訳できる

### Phase 5: UI/UX改善
- より洗練されたポップアップデザイン
- 検索・フィルタリング機能
- タグ付け機能
- プレビュー表示

**優先度**: 🟢 Low
**完了条件**: ユーザーが直感的に操作でき、保存した記事を簡単に見つけられる

### Phase 6: テストと最適化
- 手動テスト（複数のWebサイトで動作確認）
- パフォーマンス最適化
- エラーハンドリングの強化
- ドキュメント作成

**優先度**: 🟡 Medium
**完了条件**: 主要なWebサイトで安定して動作する

### Phase 7: Chrome Web Store公開
- アイコンとスクリーンショットの作成
- プライバシーポリシーの作成
- ストアリスティングの準備
- レビュー申請

**優先度**: 🟢 Low
**完了条件**: Chrome Web Storeで公開され、誰でもインストールできる

## コーディングガイドライン

### 1. ファイル構成
- 各モジュールは単一責任の原則に従う
- `src/modules/` - ビジネスロジック
- `src/popup/` - ユーザーインターフェース
- `src/lib/` - サードパーティライブラリ
- `src/utils/` - 汎用ヘルパー関数

### 2. コーディングスタイル
- **言語**: JavaScript (ES6+)
- **命名規則**:
  - クラス: `PascalCase` (例: `ArticleDB`)
  - 関数: `camelCase` (例: `extractContent`)
  - 定数: `UPPER_SNAKE_CASE` (例: `API_ENDPOINT`)
- **非同期処理**: `async/await` を優先（Promiseチェーンは避ける）
- **エラーハンドリング**: すべての非同期関数で `try-catch` を使用

### 3. Chrome拡張固有のルール
- **Manifest V3**: 必ず最新の仕様に従う
- **Content Security Policy**: インラインスクリプト禁止
- **Permissions**: 必要最小限のみ要求
- **Message Passing**: Content Script ↔ Background ↔ Popup 間の通信は `chrome.runtime.sendMessage` を使用

### 4. IndexedDB使用ルール
- **トランザクション**: 常に適切なモード（`readonly` / `readwrite`）を指定
- **エラーハンドリング**: `onerror` / `onsuccess` を必ず実装
- **インデックス**: 頻繁に検索するフィールドにインデックスを作成

### 5. セキュリティ
- **APIキー**: ハードコード厳禁、Chrome Storage Syncに保存
- **XSS対策**: `innerHTML` は避け、`textContent` を使用
- **サニタイゼーション**: ユーザー入力は必ず検証・サニタイズ

### 6. パフォーマンス
- **画像処理**: 並列ダウンロード数を制限（最大5並列）
- **翻訳API**: レート制限を考慮（セクション間500ms待機）
- **IndexedDB**: 大量データのクエリは `cursor` を使用

## 開発時の注意点

### やるべきこと ✅
- 段階的に開発する（Phase 1 → Phase 7）
- 各Phase完了後にテストする
- コミットメッセージは明確に（例: `Add: Markdown conversion feature`）
- エラーメッセージをユーザーフレンドリーに

### やってはいけないこと ❌
- すべての機能を一度に実装しない
- テストなしで次のPhaseに進まない
- セキュリティを軽視しない
- パフォーマンスを無視しない

## テスト戦略

### 手動テスト対象サイト
1. **ニュースサイト**: CNN, BBC, 日本経済新聞
2. **技術ブログ**: Medium, Dev.to, Qiita
3. **ドキュメント**: MDN, GitHub README
4. **複雑なレイアウト**: Wikipedia, Stack Overflow

### テスト項目
- [ ] コンテンツ抽出の精度
- [ ] Markdown変換の品質
- [ ] 画像ダウンロードの成功率
- [ ] IndexedDB保存・読み込み
- [ ] ZIPエクスポートの正常動作
- [ ] 翻訳機能の品質（原文+翻訳の両方保存）
- [ ] 翻訳ON/OFFスイッチの動作
- [ ] カスタムプロンプトの動作確認

## トラブルシューティング

### よくある問題と解決策

#### 1. Readabilityがコンテンツを抽出できない
**原因**: サイトの構造が複雑、または記事タグがない
**解決策**: ユーザーに手動選択機能を提供（Phase 5で実装）

#### 2. 画像がダウンロードできない
**原因**: CORS制限、または画像URLが相対パス
**解決策**: 絶対URLに変換、CORS対応のヘッダー追加

#### 3. IndexedDBが開けない
**原因**: ブラウザの容量制限、または権限エラー
**解決策**: エラーメッセージを表示し、ユーザーにストレージをクリアするよう促す

#### 4. 翻訳APIエラー
**原因**: APIキー未設定、またはレート制限
**解決策**: 設定画面へのリンクを表示、リトライロジック実装

#### 5. ZIPファイルが破損
**原因**: ArrayBufferの取り扱いミス
**解決策**: データ型を正しく変換（Blob → ArrayBuffer → Uint8Array）

## AI Agent（Claude）へのメッセージ

Claude Code（あなた）がこのプロジェクトを開発する際の指針：

1. **段階的実装**: 必ずPhase 1から順番に実装してください。一度にすべてを作らないでください。
2. **テスト重視**: 各機能を実装したら、必ず動作確認してください。
3. **ユーザー体験**: 開発者目線ではなく、エンドユーザーの使いやすさを最優先してください。
4. **エラーハンドリング**: すべてのエラーケースを想定し、適切なエラーメッセージを表示してください。
5. **ドキュメント**: コードにコメントを適切に追加し、README.mdを充実させてください。
6. **セキュリティ**: APIキーの取り扱いには特に注意してください。
7. **パフォーマンス**: 大きな画像や長文記事でも快適に動作するよう最適化してください。
8. **翻訳機能の実装**:
   - 翻訳ON/OFFスイッチを必ず実装
   - 原文と翻訳を両方保存（別々のフィールド）
   - カスタム翻訳プロンプトを設定可能に

## 次のステップ

現在のフェーズ: **Phase 2 完了 ✅**

完了したフェーズ:
1. ✅ Phase 1: MVP - 基本的なコンテンツ抽出とMarkdown変換
2. ✅ サイドパネルUI実装 - Chrome Side Panel API統合
3. ✅ Phase 2: IndexedDB Storage - 記事の永続化と画像オフライン保存

次にやること:
1. Phase 3: ZIP Export（IndexedDBから記事を取得してエクスポート）
2. Phase 4: AI Translation（Anthropic API統合）

---

## Phase 2 実装から得られた知見（重要）

### IndexedDB実装のベストプラクティス

**1. Object Storeの設計**
```javascript
// 複数のストアを使用して関連データを分離
- articles: { id, metadata, markdown, imageCount, hasTranslation, ... }
- images: { id, articleId, originalUrl, blob, mimeType, localPath, ... }

// インデックスは頻繁にクエリするフィールドに作成
- articles: timestamp, url, title でインデックス
- images: articleId, originalUrl でインデックス
```

**2. Service WorkerでのimportScripts**
```javascript
// 先頭にグローバル変数を宣言
/* global importScripts, storageManager, imageDownloader */

// スクリプトをインポート
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');

// これにより、Service Worker内でモジュールを使用可能
```

**3. 画像のBlob保存**
```javascript
// fetch() → Blob → IndexedDBの流れ
const response = await fetch(imageUrl);
const blob = await response.blob();
const mimeType = response.headers.get('content-type');

// Blobを直接IndexedDBに保存可能（structuredClone対応）
await imageStore.add({ blob, mimeType, ... });
```

**4. トランザクション管理**
```javascript
// 複数ストアへのアクセスは1つのトランザクションで
const transaction = db.transaction(['articles', 'images'], 'readwrite');
const articleStore = transaction.objectStore('articles');
const imageStore = transaction.objectStore('images');

// transaction.oncomplete で全体の完了を待つ
transaction.oncomplete = () => resolve();
```

### Chrome Side Panel API統合の知見

**1. manifest.jsonの設定**
```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "src/sidepanel/sidepanel.html"
  }
}
```

**2. サイドパネルを開く**
```javascript
// Popup UIからサイドパネルを開く
await chrome.sidePanel.open({ windowId: tab.windowId });

// ペンディング状態をストレージに保存して、サイドパネルに通知
await chrome.storage.local.set({ pendingExtraction: true });
```

**3. メッセージング**
```javascript
// Service Worker → Side Panelへのメッセージ転送
chrome.runtime.sendMessage({ action: 'displayMarkdown', data })
```

### テストとCI/CD

**1. ESLintの設定**
```javascript
// .eslintignore でサードパーティライブラリを除外
src/lib/

// グローバル変数の宣言
/* global chrome, importScripts, storageManager */
```

**2. GitHub Actions CI**
```yaml
jobs:
  test:        # Jest + ESLint
  validate:    # manifest.json検証
  security:    # npm audit + シークレットスキャン
```

**3. ブランチ保護**
- ブランチ名: `claude/<feature>-<sessionID>`
- Required status checks: CI passing
- 自動マージ可能（テスト合格後）

### 並列開発の実践

**成功パターン:**
1. **インターフェース優先設計**: StorageManagerのAPIを先に定義
2. **モック使用**: Phase 3/4はモックStorageManagerで並列開発可能
3. **独立したモジュール**: 各モジュールは独自のファイルで完結

**失敗パターン:**
1. ブランチ名の誤り（`claude/`プレフィックスと`-DYKEg`サフィックス必須）
2. Service Workerでのモジュール読み込み（require不可、importScripts使用）
3. Blobの扱い（structuredClone対応型のみIndexedDBに保存可）

### パフォーマンス最適化

**画像ダウンロード:**
```javascript
// 並列ダウンロードだがメモリ効率を考慮
for (const url of imageUrls) {
  const imageData = await downloadImage(url);  // 順次処理
  // 並列にすると大量の画像でメモリ不足の可能性
}
```

**IndexedDB クエリ:**
```javascript
// cursorで大量データを効率的に処理
const request = index.openCursor(null, 'prev');  // 降順
request.onsuccess = (event) => {
  const cursor = event.target.result;
  if (cursor) {
    articles.push(cursor.value);
    cursor.continue();
  }
};
```

---

## 開発から得られた技術的教訓

### Chrome Extension開発

1. **Service WorkerとContent Scriptの違い**
   - Service Worker: バックグラウンド処理、永続化、API呼び出し
   - Content Script: ページDOM操作、コンテンツ抽出
   - 通信: `chrome.runtime.sendMessage()`

2. **Manifest V3の制約**
   - インラインスクリプト禁止
   - `eval()`禁止
   - Service Workerでのモジュール: `importScripts()`のみ

3. **権限管理**
   - 最小権限の原則
   - `host_permissions: ["<all_urls>"]` は画像ダウンロードに必須

### IndexedDB詳細

1. **バージョン管理**
   ```javascript
   const DB_VERSION = 1;  // スキーマ変更時にインクリメント
   request.onupgradeneeded = (event) => {
     // マイグレーション処理
   };
   ```

2. **エラーハンドリング**
   ```javascript
   // 必ず両方実装
   transaction.oncomplete = () => resolve();
   transaction.onerror = () => reject(transaction.error);
   ```

3. **データ型**
   - Blob, File, ArrayBuffer: ✅ 保存可能
   - Function, Symbol: ❌ 保存不可

### UI/UX設計

1. **状態管理**
   - Loading, Error, Empty, Content の4状態を明確に分離
   - ユーザーフィードバックは即座に表示

2. **アクセシビリティ**
   - ボタンに`title`属性
   - エラーメッセージは具体的に

3. **レスポンシブデザイン**
   - サイドパネルは固定幅
   - ポップアップは最小幅に

---

## 分散コーディングガイド

このプロジェクトは、複数の開発者やAIエージェントが協力して開発できるように設計されています。

### 開発フロー

1. **Issue作成**: 新機能やバグ修正のIssueを作成
2. **ブランチ作成**: `feature/*`, `fix/*`, `phase/*` 命名規則に従う
3. **実装**: 各Phaseのガイドラインに従って実装
4. **PR作成**: テンプレートに従ってPRを作成
5. **レビュー**: 他の開発者またはメンテナーがレビュー
6. **マージ**: 承認後にmainブランチにマージ

### ブランチ命名規則

```
feature/<機能名>     - 新機能の開発（例: feature/indexeddb-storage）
fix/<バグ名>         - バグ修正（例: fix/markdown-escape-bug）
phase/<番号>         - フェーズ別実装（例: phase/2-storage）
docs/<内容>          - ドキュメント更新（例: docs/api-guide）
refactor/<内容>      - リファクタリング（例: refactor/db-module）
test/<内容>          - テスト追加（例: test/content-extraction）
claude/<機能-ID>     - Claude Codeによる自動開発ブランチ
```

### Phase別タスク割り当て

#### Phase 2: ストレージ機能 🔄
**担当可能なエージェント/開発者**:
- データベース設計が得意な開発者
- IndexedDB経験者
- 画像処理の知識がある開発者

**主要タスク**:
1. `src/modules/db.js` - IndexedDB wrapper実装
2. `src/modules/image-handler.js` - 画像ダウンロード・管理
3. `src/background/service-worker.js` - ストレージ統合
4. テスト作成

**依存関係**: Phase 1完了（✅）

#### Phase 3: エクスポート機能 ⏳
**担当可能なエージェント/開発者**:
- ファイル操作に詳しい開発者
- ZIP処理の経験者

**主要タスク**:
1. `src/modules/file-exporter.js` - ZIP作成実装
2. `src/lib/jszip.min.js` - ライブラリ統合
3. エクスポートUIの実装
4. テスト作成

**依存関係**: Phase 2完了

#### Phase 4: 翻訳機能 ⏳
**担当可能なエージェント/開発者**:
- API統合経験者
- Anthropic API知識がある開発者
- 自然言語処理の知識

**主要タスク**:
1. `src/modules/translator.js` - Anthropic API統合
2. `src/options/options.html` - 翻訳設定UI
3. プロンプト管理機能
4. エラーハンドリング
5. テスト作成

**依存関係**: Phase 2完了

### ファイル所有権（推奨）

各ファイルの主担当を明確にすることで、競合を避けます：

| ファイル | 担当フェーズ | 説明 |
|---------|------------|------|
| `manifest.json` | Phase 1 ✅ | 拡張機能マニフェスト |
| `src/content/content-script.js` | Phase 1 ✅ | コンテンツ抽出 |
| `src/popup/popup.*` | Phase 1 ✅ | ポップアップUI |
| `src/background/service-worker.js` | Phase 1 ✅, 2, 3, 4 | バックグラウンド処理（拡張予定） |
| `src/modules/db.js` | Phase 2 | IndexedDB管理 |
| `src/modules/image-handler.js` | Phase 2 | 画像処理 |
| `src/modules/file-exporter.js` | Phase 3 | ファイルエクスポート |
| `src/modules/translator.js` | Phase 4 | 翻訳機能 |
| `src/options/options.*` | Phase 4 | 設定画面 |

### 並行開発のベストプラクティス

1. **モジュール分離**: 各モジュールは独立して開発可能
2. **インターフェース定義**: モジュール間のAPIを先に定義
3. **Mock実装**: 依存モジュールが未完成の場合はMockを使用
4. **定期的な同期**: main/developブランチから定期的にpull
5. **小さいPR**: 大きな変更は複数のPRに分割

### コミュニケーション

- **Issue**: 機能リクエスト、バグ報告
- **PR**: コードレビュー、実装議論
- **Discussion**: アーキテクチャ、設計の議論
- **Wiki**: 詳細なドキュメント、ガイド

### AIエージェント向けガイド

Claude CodeなどのAIエージェントが開発に参加する場合：

1. **ブランチ命名**: `claude/<機能名>-<セッションID>` を使用
2. **コミットメッセージ**: 明確で詳細な説明を含める
3. **テスト**: 実装後は必ず動作確認
4. **ドキュメント**: コード変更時はREADME/コメントも更新
5. **依存関係**: package.jsonやmanifest.jsonの変更は慎重に

### コードレビューチェックリスト

レビュアーは以下を確認：

- [ ] コーディングスタイルガイドに準拠
- [ ] エラーハンドリングが適切
- [ ] セキュリティ上の問題なし（XSS, APIキー漏洩など）
- [ ] パフォーマンスへの影響を考慮
- [ ] テストが含まれている（Phase 2以降）
- [ ] ドキュメントが更新されている
- [ ] Manifest V3のベストプラクティスに従っている

### トラブルシューティング（分散開発）

#### マージコンフリクト
```bash
# 最新のmainを取得
git fetch origin main
git merge origin/main

# コンフリクトを解決
# ... エディタで編集 ...

git add .
git commit -m "Merge: Resolve conflicts with main"
```

#### 並行開発での問題
- **同じファイルの編集**: 担当を明確にし、事前に調整
- **依存関係の変更**: Issue/PRで事前に通知
- **API変更**: インターフェース変更は慎重に、後方互換性を考慮

---

**最終更新日**: 2026-02-11
**バージョン**: 0.2.0
**ステータス**: 🟢 Phase 1-2完了 / Phase 3-4開発準備完了
**実装済み機能**:
- ✅ Phase 1: MVP（コンテンツ抽出、Markdown変換、サイドパネルUI）
- ✅ Phase 2: IndexedDB Storage（記事永続化、画像オフライン保存、CRUD操作）
- ✅ CI/CD: GitHub Actions（Jest, ESLint, セキュリティスキャン）
- ✅ マニュアルテストガイド完備

**次の開発**: Phase 3 (ZIP Export) または Phase 4 (AI Translation)
