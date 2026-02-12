# Claude Code Configuration

このファイルは、Claude Codeがこのプロジェクトで作業する際の指示と設定を記載します。

## プロジェクト情報

**プロジェクト名**: Webpage to Markdown Extension
**リポジトリ**: `webpage-to-markdown-extention`
**開発ブランチ**: `claude/configure-branch-protection-DYKEg`
**言語**: JavaScript (ES6+)
**プラットフォーム**: Chrome Extensions (Manifest V3)

## 開発方針

### 基本原則
1. **段階的開発**: Phase 1からPhase 7まで順番に実装
2. **テスト駆動**: 各機能実装後に必ず動作確認
3. **ユーザー中心設計**: エンドユーザーの使いやすさを最優先
4. **セキュリティ重視**: APIキー、ユーザーデータの安全な取り扱い

### コード品質
- クリーンで読みやすいコードを書く
- 適切なコメントを追加（複雑なロジックには必須）
- 関数は単一責任の原則に従う
- マジックナンバーは定数として定義

### コミット戦略
- コミットメッセージは日本語でもOK、英語でもOK
- 形式: `Add: 機能追加`, `Fix: バグ修正`, `Update: 既存機能の改善`
- 1コミット = 1つの論理的な変更
- すべてのコミットにセッションURLを含める

## ファイル構成

```
webpage-to-markdown-extention/
|-- manifest.json
|-- README.md
|-- agents.md
|-- claude.md
|-- LICENSE
|-- .gitignore
|-- .github/
|   +-- scripts/
|       |-- setup-branch-protection.sh
|       +-- README.md
|-- icons/
|   |-- icon16.png
|   |-- icon48.png
|   +-- icon128.png
|-- src/
    |-- popup/
    |   |-- popup.html
    |   |-- popup.js
    |   +-- popup.css
    |-- content/
    |   +-- content-script.js
    |-- background/
    |   +-- service-worker.js
    |-- options/
    |   |-- options.html
    |   |-- options.js
    |   +-- options.css
    |-- lib/
    |   |-- Readability.js
    |   |-- turndown.js
    |   +-- jszip.min.js
    |-- modules/
    |   |-- db.js
    |   |-- translator.js
    |   |-- image-handler.js
    |   |-- markdown-processor.js
    |   +-- file-exporter.js
    +-- utils/
        +-- helpers.js
```

## 実装の優先順位

### Phase 1: MVP (最優先)
1. manifest.json
2. アイコン（仮のもので可）
3. src/lib/Readability.js（外部からダウンロード）
4. src/lib/turndown.js（外部からダウンロード）
5. src/content/content-script.js
6. src/popup/popup.html
7. src/popup/popup.js
8. src/popup/popup.css

### Phase 2: ストレージ
9. src/modules/db.js
10. src/background/service-worker.js
11. src/modules/image-handler.js

### Phase 3: エクスポート
12. src/lib/jszip.min.js（外部からダウンロード）
13. src/modules/file-exporter.js

### Phase 4: 翻訳
14. src/modules/translator.js（翻訳ON/OFFスイッチ含む）
15. src/options/options.html
16. src/options/options.js
17. src/options/options.css

## 翻訳機能の要件（重要）

### 必須機能
1. **翻訳ON/OFFスイッチ**
   - 設定画面とポップアップUIに配置
   - デフォルトはOFF
   - ON時のみ翻訳APIを呼び出す

2. **原文と翻訳の両方保存**
   - IndexedDBのスキーマ:
     - `articles.markdown` - 原文
     - `translations.translatedMarkdown` - 翻訳文
   - UI上で原文/翻訳を切り替え表示可能

3. **APIキー設定**
   - 設定画面（options.html）でAPIキーを入力
   - Chrome Storage Syncに安全に保存
   - パスワード形式で表示（Show/Hideボタン付き）

4. **カスタム翻訳プロンプト**
   - デフォルトプロンプトを用意
   - 設定画面で編集可能（テキストエリア）
   - プロンプトのリセット機能
   - プレビュー機能（どのようなプロンプトが送信されるか確認）

### デフォルト翻訳プロンプト

```
以下のMarkdown形式のテキストを日本語に翻訳してください。

要件:
- Markdown記法はそのまま保持してください
- 見出し、リスト、コードブロック、リンクなどのフォーマットを維持してください
- 自然で読みやすい日本語に翻訳してください
- 技術用語は適切に日本語化してください（例: "function" → "関数"）
- URLやリンクは変更しないでください
- 画像の参照パス（例: ./images/xxx.jpg）は変更しないでください
- コードブロック内のコードは翻訳しないでください

翻訳対象テキスト:
{content}
```

**プロンプト内の `{content}` は実際のMarkdown内容に置き換えられます**

### 設定画面のUI例

```html
<section>
  <h2>Translation Settings</h2>

  <div class="form-group">
    <label>
      <input type="checkbox" id="enable-translation">
      Enable translation feature
    </label>
  </div>

  <div class="form-group">
    <label for="api-key">Anthropic API Key:</label>
    <input type="password" id="api-key" placeholder="sk-ant-...">
    <button id="show-key-btn">Show</button>
  </div>
  <p class="help-text">
    Get your API key from <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>
  </p>

  <div class="form-group">
    <label for="translation-prompt">Custom Translation Prompt:</label>
    <textarea id="translation-prompt" rows="10"></textarea>
    <button id="reset-prompt-btn">Reset to Default</button>
  </div>
  <p class="help-text">
    Use {content} as a placeholder for the text to be translated.
  </p>

  <div class="form-group">
    <label>
      <input type="checkbox" id="preserve-original">
      Always keep original text (saves both original and translated versions)
    </label>
  </div>
</section>
```

## 外部ライブラリのダウンロード

### 1. Mozilla Readability
**URL**: https://raw.githubusercontent.com/mozilla/readability/main/Readability.js
**保存先**: `src/lib/Readability.js`

```bash
curl -o src/lib/Readability.js https://raw.githubusercontent.com/mozilla/readability/main/Readability.js
```

### 2. Turndown.js
**URL**: https://unpkg.com/turndown@7.1.2/dist/turndown.js
**保存先**: `src/lib/turndown.js`

```bash
curl -o src/lib/turndown.js https://unpkg.com/turndown@7.1.2/dist/turndown.js
```

### 3. JSZip
**URL**: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
**保存先**: `src/lib/jszip.min.js`

```bash
curl -o src/lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
```

## 開発環境のセットアップ

### 1. ディレクトリ作成

```bash
mkdir -p src/{popup,content,background,options,lib,modules,utils}
mkdir -p icons
mkdir -p .github/scripts
```

### 2. .gitignore更新

```bash
echo "node_modules/" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "*.log" >> .gitignore
echo "*.swp" >> .gitignore
echo ".vscode/" >> .gitignore
```

### 3. Chrome拡張機能の読み込み

1. Chromeを開く
2. `chrome://extensions/` に移動
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトのルートディレクトリを選択

## テスト方法

### 基本テスト
1. 拡張機能を読み込む
2. テストサイト（例: https://developer.mozilla.org/）を開く
3. 拡張機能アイコンをクリック
4. 「Extract & Convert」ボタンをクリック
5. Markdownが正しく表示されることを確認

### 翻訳機能テスト
1. 設定画面でAPIキーを設定
2. 「Enable translation feature」をON
3. 記事を抽出
4. 「Translate to JP」ボタンをクリック
5. 原文と翻訳の両方が保存されていることを確認
6. UI上で原文/翻訳を切り替えられることを確認

### 画像処理テスト
1. 画像が多い記事（例: Wikipedia）を開く
2. コンテンツを抽出
3. ZIPファイルをエクスポート
4. ZIPを解凍し、imagesフォルダに画像が保存されていることを確認
5. Markdownファイル内の画像パスが `./images/image_1.jpg` 形式になっていることを確認

## エラーハンドリング

### 必須のエラーケース
1. **Readability失敗**: "Could not extract article content. Please try selecting content manually."
2. **APIキー未設定**: "Translation API key is not configured. Please set it in Settings."
3. **翻訳API エラー**: "Translation failed: [error message]. Please try again."
4. **画像ダウンロード失敗**: "Failed to download some images. They will be skipped."
5. **IndexedDB エラー**: "Storage error. Please clear browser data and try again."

## パフォーマンス最適化

### 画像処理
- 並列ダウンロード数: 最大5
- タイムアウト: 10秒/画像
- サイズ制限: 10MB/画像（超えた場合は警告）

### 翻訳API
- レート制限: セクション間500ms待機
- リトライ: 失敗時に3回まで再試行
- タイムアウト: 30秒/リクエスト

### IndexedDB
- トランザクションのバッチ処理
- インデックスの最適化（url, timestamp）

## セキュリティチェックリスト

- [ ] APIキーはChrome Storage Syncに暗号化保存
- [ ] ユーザー入力は必ずサニタイズ
- [ ] `innerHTML` の代わりに `textContent` を使用
- [ ] Content Security Policyに準拠（インラインスクリプト禁止）
- [ ] 外部リソース読み込み時のHTTPSチェック

## ブランチ戦略

**開発ブランチ**: `claude/configure-branch-protection-DYKEg`

### コミット時の注意
- すべてのコミットはこのブランチに対して行う
- プッシュ時は `git push -u origin claude/configure-branch-protection-DYKEg`
- 最後にプルリクエストを作成してmainにマージ

### Git操作の重要なルール ⚠️

**禁止事項:**
- ❌ `git merge --abort` - マージを中断しない
- ❌ `git rebase --abort` - リベースを中断しない
- ❌ `git reset --hard` - 過去のコミットを破棄しない
- ❌ `git checkout .` - 変更を破棄しない
- ❌ **過去をなかったことにする行為は一切禁止**

**正しい姿勢:**
- ✅ **過去の履歴を残したまま、それを受け入れて修正する**
- ✅ コンフリクトが発生したら、コンフリクトを解決してコミット
- ✅ マージに失敗したら、コンフリクトを解決して `git commit`
- ✅ 間違ったコミットをしたら、新しいコミットで修正
- ✅ 間違ったブランチにコミットしたら、`git cherry-pick` で移動

**コンフリクト解決の手順:**
1. コンフリクトが発生したファイルを確認: `git status`
2. コンフリクトを手動で解決（エディタで編集）
3. 解決したファイルをステージング: `git add <file>`
4. マージコミットを作成: `git commit`
5. プッシュ: `git push`

## 完了したアクション

1. ✅ `agents.md` 作成完了
2. ✅ `claude.md` 作成完了（このファイル）
3. ✅ プロジェクト構造の作成
4. ✅ Phase 1: MVP実装完了（PR #2）
   - manifest.json
   - サイドパネルUI (Chrome Side Panel API)
   - Content script（Readability + Turndown）
   - Popup UI
5. ✅ Phase 2: IndexedDB Storage実装完了（PR #10）
   - StorageManager（CRUD操作）
   - ImageDownloader（画像オフライン保存）
   - Service Worker統合
   - Popup UI拡張（記事一覧、View/Delete）

## 次のアクション

**選択可能なフェーズ:**
- Phase 3: ZIP Export（`getAllArticles()` + JSZip）
- Phase 4: AI Translation（Anthropic API + `saveTranslation()`）

どちらも並列開発可能（Phase 2のStorageManager完成により）

## Claude Codeへの指示

このファイルを読んでいるClaude Codeへ：

1. **段階的に進める**: 一度にすべてを実装しようとしないでください。Phase 1から順番に。
2. **確認を取る**: 各Phase完了時にユーザーに確認を取ってください。
3. **テストを忘れない**: 実装後は必ず動作確認してください。
4. **ドキュメントを充実させる**: README.mdを常に最新の状態に保ってください。
5. **翻訳機能**: ON/OFFスイッチ、原文保存、カスタムプロンプトを必ず実装してください。

---

## Phase 2 実装の重要な学び

### Service Workerでのモジュール読み込み

**正しい方法:**
```javascript
/* global importScripts, storageManager, imageDownloader */
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');

// これでstorageManager, imageDownloaderが使用可能
const articles = await storageManager.getAllArticles();
```

**間違った方法:**
```javascript
// ❌ Service Workerでは使えない
import { storageManager } from './storage-manager.js';
const storageManager = require('./storage-manager.js');
```

### IndexedDB のBlob保存

**ポイント:**
1. Blobは直接IndexedDBに保存可能（structuredClone対応）
2. 画像URLではなくBlob自体を保存することでオフライン対応
3. mimeTypeも一緒に保存してData URLへの変換を容易に

```javascript
// 保存
const response = await fetch(imageUrl);
const blob = await response.blob();
await imageStore.add({
  blob,  // Blobを直接保存
  mimeType: response.headers.get('content-type'),
  originalUrl: imageUrl
});

// 読み込みとData URL変換
const imageData = await imageStore.get(id);
const dataUrl = await blobToDataURL(imageData.blob);
```

### Chrome Side Panel API

**設定のポイント:**
1. manifest.jsonに`"sidePanel"`パーミッション追加
2. `side_panel.default_path`を指定
3. `chrome.sidePanel.open({ windowId })`で開く
4. メッセージングで Popup ↔ Side Panel 通信

### ブランチ命名規則（重要！）

**必須フォーマット:**
```
claude/<feature-name>-<sessionID>
```

**例:**
- ✅ `claude/phase2-storage-DYKEg`
- ✅ `claude/side-panel-ui-DYKEg`
- ❌ `feature/phase2-storage` （プッシュ時403エラー）

**理由:**
- GitHubのブランチ保護ルールが`claude/`プレフィックスを要求
- セッションID サフィックスでセッション識別

### CI/CD統合

**GitHub Actions ワークフロー:**
```yaml
jobs:
  test:      # npm run lint && npm test
  validate:  # manifest.json検証、必須ファイルチェック
  security:  # npm audit、シークレットスキャン
```

**ESLint設定:**
- `.eslintignore`でサードパーティライブラリを除外
- グローバル変数は`/* global ... */`で宣言
- `no-unused-vars`は`_`プレフィックスで無視可能

### 並列開発の実現

**成功した戦略:**
1. **インターフェース優先**: StorageManagerのAPIを先に定義
2. **モック準備**: Phase 3/4用のモックStorageManager作成可能
3. **独立モジュール**: 各機能は独自ファイルで完結

**依存関係:**
```
Phase 1 (MVP)
    ↓
Phase 2 (Storage) ← 完了 ✅
    ├→ Phase 3 (ZIP Export)    ← storageManager.getAllArticles()使用
    └→ Phase 4 (Translation)   ← storageManager.saveTranslation()使用
```

### パフォーマンス考慮事項

**画像ダウンロード:**
- 大量の画像は順次ダウンロード（メモリ節約）
- 各画像10秒タイムアウト
- エラーは個別に処理（一部失敗でも継続）

**IndexedDB クエリ:**
- 大量データは`cursor`使用
- インデックスで高速化（timestamp, url, title）
- トランザクションは必要最小限のストアのみ

---

**最終更新日**: 2026-02-11
**作成者**: shimesaba-type0
**Claude Code Version**: Sonnet 4.5
**実装完了フェーズ**: Phase 1-2 ✅
**次期開発**: Phase 3 または Phase 4
