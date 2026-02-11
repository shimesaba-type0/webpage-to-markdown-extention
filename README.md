# Webpage to Markdown Extension

WebページをクリーンなMarkdown形式に変換するブラウザ拡張機能です。

## 概要

このプロジェクトは、Webページのコンテンツを構造化されたMarkdown形式に変換し、記事の保存、ドキュメント作成、コンテンツのアーカイブを簡単にすることを目的としています。

## 機能（予定）

- Webページの主要コンテンツを自動抽出
- クリーンで読みやすいMarkdown形式に変換
- 画像、リンク、コードブロックなどのリッチコンテンツに対応
- ワンクリックでクリップボードにコピー
- ローカルファイルとして保存

## 開発状況

🚧 **Phase 1 MVP - 基本機能実装完了！** 🚧

**完了した機能:**
- ✅ 基本的なプロジェクト構造
- ✅ コンテンツ抽出（Mozilla Readability）
- ✅ Markdown変換（簡易版Turndown）
- ✅ ポップアップUI
- ✅ 設定ファイル（agents.md, claude.md）

**開発中の機能:**
- 🔄 IndexedDBストレージ（Phase 2）
- 🔄 画像処理とダウンロード（Phase 2）
- 🔄 ZIPエクスポート（Phase 3）
- 🔄 翻訳機能（Anthropic API）（Phase 4）

## ブランチ戦略

このリポジトリでは、以下のブランチ戦略を採用しています：

### mainブランチ

- **保護されたブランチ**: 直接プッシュは禁止されています
- **プルリクエスト必須**: すべての変更はPR経由でマージされます
- **レビュープロセス**: リポジトリオーナーによる承認が必要です

### ブランチ命名規則

開発時は以下の命名規則に従ってブランチを作成してください：

```
feature/<機能名>    - 新機能の開発
fix/<バグ名>        - バグ修正
docs/<ドキュメント名> - ドキュメント更新
refactor/<内容>     - リファクタリング
test/<テスト名>     - テスト追加・修正
```

例:
```bash
git checkout -b feature/markdown-converter
git checkout -b fix/image-extraction-bug
git checkout -b docs/update-readme
```

## コントリビューション

このプロジェクトへの貢献を歓迎します！以下の手順に従ってください。

### 1. リポジトリをフォーク

GitHubの「Fork」ボタンをクリックして、自分のアカウントにリポジトリをフォークします。

### 2. ローカルにクローン

```bash
git clone https://github.com/YOUR_USERNAME/webpage-to-markdown-extention.git
cd webpage-to-markdown-extention
```

### 3. 開発ブランチを作成

```bash
git checkout -b feature/your-feature-name
```

### 4. 変更を加える

コードを編集し、テストを追加し、ドキュメントを更新してください。

### 5. コミット

```bash
git add .
git commit -m "Add: 新機能の説明"
```

コミットメッセージの規約：
- `Add:` - 新機能追加
- `Fix:` - バグ修正
- `Update:` - 既存機能の更新
- `Refactor:` - リファクタリング
- `Docs:` - ドキュメント更新
- `Test:` - テスト追加・修正

### 6. プッシュ

```bash
git push origin feature/your-feature-name
```

### 7. プルリクエストを作成

GitHubでプルリクエストを作成します。以下を含めてください：

- **タイトル**: 変更内容の簡潔な説明
- **説明**: 何を変更したか、なぜ変更したかを詳しく説明
- **関連Issue**: 関連するIssueがあればリンク

### 注意事項

⚠️ **mainブランチへの直接プッシュはできません**

mainブランチはブランチプロテクションルールにより保護されています。すべての変更は必ずプルリクエスト経由でマージしてください。

直接プッシュを試みると、以下のようなエラーが表示されます：

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
```

## セキュリティ

### ブランチプロテクション設定

このリポジトリは、以下のセキュリティ対策を実施しています：

- ✅ **プルリクエスト必須**: mainブランチへの直接プッシュを禁止
- ✅ **強制プッシュ禁止**: `git push --force` を防止
- ✅ **ブランチ削除禁止**: mainブランチの誤削除を防止
- ✅ **線形履歴**: クリーンなコミット履歴を維持
- ✅ **管理者にも適用**: すべてのユーザーに同じルールを適用

ブランチプロテクション設定の詳細は、[.github/scripts/README.md](.github/scripts/README.md) を参照してください。

### 自動設定スクリプト

ブランチプロテクションルールは、自動化スクリプトで管理されています：

```bash
./.github/scripts/setup-branch-protection.sh
```

詳細は [.github/scripts/README.md](.github/scripts/README.md) を参照してください。

## 開発環境のセットアップ

### 前提条件

- **ブラウザ**: Google Chrome 88+ または Microsoft Edge 88+
- **ツール**: Git（クローン時）または ZIPダウンロード
- **オプション**: ImageMagick（アイコン生成時）

---

## 📦 インストール方法

### 方法A: Git Clone（推奨・開発者向け）

開発に参加する場合や、最新のコードを追跡したい場合：

```bash
# 1. リポジトリをクローン
git clone https://github.com/shimesaba-type0/webpage-to-markdown-extention.git

# 2. ディレクトリに移動
cd webpage-to-markdown-extention

# 3. ブランチを確認（mainまたは開発ブランチ）
git branch -a
```

### 方法B: ZIP ダウンロード（手軽・試用向け）

単純に試してみたい場合：

1. **GitHubページを開く**
   ```
   https://github.com/shimesaba-type0/webpage-to-markdown-extention
   ```

2. **ZIPをダウンロード**
   - 緑色の「Code」ボタンをクリック
   - 「Download ZIP」を選択
   - ダウンロードした `webpage-to-markdown-extention-main.zip` を解凍

3. **解凍先を確認**
   ```
   解凍後のフォルダ構成:
   webpage-to-markdown-extention-main/
   ├── manifest.json          ← これがあることを確認
   ├── src/
   ├── icons/
   └── README.md
   ```

---

## 🎨 必須: アイコンの作成

**⚠️ 重要**: 拡張機能を読み込むには、PNGアイコンが必須です。

### 現状

プロジェクトには **SVGテンプレート** のみが含まれています：
- `icons/icon.svg` ✅ 存在
- `icons/icon16.png` ❌ 未作成
- `icons/icon48.png` ❌ 未作成
- `icons/icon128.png` ❌ 未作成

### 方法1: ImageMagick で生成（推奨）

#### Linuxの場合:
```bash
# ImageMagickをインストール
sudo apt install imagemagick

# iconsディレクトリに移動
cd icons

# SVGからPNGを生成
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png

# 確認
ls -lh *.png
```

#### Macの場合:
```bash
# Homebrewでインストール
brew install imagemagick

# iconsディレクトリに移動
cd icons

# 同様にconvertコマンドを実行
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

#### Windowsの場合:
1. ImageMagickをダウンロード: https://imagemagick.org/script/download.php#windows
2. インストール後、コマンドプロンプトで上記と同じコマンドを実行

### 方法2: オンラインコンバーター（ImageMagickなし）

1. **CloudConvert を開く**
   ```
   https://cloudconvert.com/svg-to-png
   ```

2. **icon.svg をアップロード**
   - `icons/icon.svg` を選択

3. **サイズを指定して変換**
   - 16x16, 48x48, 128x128 の3つを個別に変換

4. **ダウンロードしてリネーム**
   - ダウンロードしたファイルを `icon16.png`, `icon48.png`, `icon128.png` にリネーム
   - `icons/` ディレクトリに配置

### 方法3: 一時的なダミーアイコン（開発のみ）

**急いでテストしたい場合**（本番環境では非推奨）：

```bash
cd icons

# 任意の画像ファイルをコピーしてリネーム
# 例: デスクトップから適当な画像を持ってくる
cp ~/Desktop/any-image.png icon16.png
cp ~/Desktop/any-image.png icon48.png
cp ~/Desktop/any-image.png icon128.png
```

### 確認

```bash
cd icons
ls -lh icon*.png
```

**期待される出力**:
```
-rw-r--r-- 1 user user  XXX  Feb 11 12:00 icon16.png
-rw-r--r-- 1 user user  XXX  Feb 11 12:00 icon48.png
-rw-r--r-- 1 user user  XXX  Feb 11 12:00 icon128.png
```

---

## 🚀 Chrome拡張機能の読み込み

### Step 1: Chrome/Edge の拡張機能ページを開く

**Chrome の場合:**
1. Chromeを起動
2. アドレスバーに `chrome://extensions/` を入力してEnter
3. または、メニュー（⋮）→「その他のツール」→「拡張機能」

**Edge の場合:**
1. Edgeを起動
2. アドレスバーに `edge://extensions/` を入力してEnter
3. または、メニュー（…）→「拡張機能」

### Step 2: デベロッパーモードを有効化

1. 拡張機能ページの **右上** にある「デベロッパーモード」のトグルスイッチを探す
2. トグルを **ON** にする（青色になる）
3. 新しいボタンが表示される:
   - 「パッケージ化されていない拡張機能を読み込む」
   - 「拡張機能をパッケージ化」
   - 「拡張機能を更新」

### Step 3: 拡張機能を読み込む

1. **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリック

2. **フォルダ選択ダイアログ** が開く

3. **プロジェクトのルートディレクトリを選択**:
   ```
   選択するフォルダ:
   webpage-to-markdown-extention/     ← このフォルダを選択
   ├── manifest.json                  ← これが見えるフォルダ
   ├── src/
   ├── icons/
   └── README.md

   ❌ 間違った選択:
   webpage-to-markdown-extention/src/  ← srcフォルダは選択しない
   ```

4. **「フォルダーの選択」** をクリック

### Step 4: 読み込み完了の確認

**成功した場合**:
- 拡張機能リストに「Webpage to Markdown」が表示される
- バージョン: `0.1.0`
- ステータス: 「有効」（青いトグル）
- ツールバーに拡張機能アイコンが表示される

**エラーが出た場合**:
- 「Could not load icon」
  → アイコンのPNGファイルが不足しています（上記の「アイコンの作成」参照）

- 「Manifest file is missing or unreadable」
  → 間違ったフォルダを選択しています。`manifest.json` があるフォルダを選択してください

- 「Manifest version 2 is deprecated」
  → このプロジェクトはManifest V3なので、このエラーは出ません

---

## 🧪 動作テスト

### Step 1: テストサイトを開く

以下のいずれかのサイトを開いてください（テスト済み）：

**推奨テストサイト**:
1. **MDN Web Docs**（技術記事）
   ```
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction
   ```

2. **Wikipedia**（一般記事）
   ```
   https://en.wikipedia.org/wiki/Markdown
   ```

3. **Medium記事**（ブログ）
   ```
   https://medium.com/（任意の記事）
   ```

4. **Qiita記事**（日本語技術記事）
   ```
   https://qiita.com/（任意の記事）
   ```

### Step 2: 拡張機能を起動

1. **拡張機能アイコンをクリック**
   - ツールバー（アドレスバーの右側）に表示されているアイコンをクリック
   - アイコンが見えない場合:
     - パズルピースアイコン（拡張機能メニュー）をクリック
     - 「Webpage to Markdown」を探してクリック

2. **ポップアップが開く**
   - タイトル: "Webpage to Markdown"
   - ボタン: "Extract & Convert"
   - セクション: "Saved Articles"（Phase 1では空）

### Step 3: コンテンツを抽出

1. **開発者ツールを開く**（ログ確認用）
   - `F12` キーを押す
   - または、右クリック → 「検証」
   - 「Console」タブを選択

2. **「Extract & Convert」ボタンをクリック**

3. **ステータスメッセージを確認**
   - ポップアップ内に以下のメッセージが順番に表示される:
     ```
     Extracting content...
     Converting to Markdown...
     ✓ Content extracted and saved successfully!
     ```

### Step 4: コンソールログを確認

**期待されるログ出力**:

```javascript
[Webpage to Markdown] Content script loaded
[Webpage to Markdown] Starting content extraction...
[Webpage to Markdown] Content extracted successfully
[Webpage to Markdown] Markdown conversion completed
[Webpage to Markdown] Found X images
[Webpage to Markdown] Metadata collected: {title: "...", author: "...", ...}
[Service Worker] Saving article: Article Title
Article metadata: {title: "...", url: "...", ...}
Markdown length: XXXX
Images: X
[Service Worker] Article saved with ID: 1234567890
```

### Step 5: 結果の確認

**Phase 1（現在）の動作**:
- ✅ コンテンツが抽出される
- ✅ Markdownに変換される
- ✅ コンソールにログが出力される
- ✅ メタデータが収集される
- ❌ **記事は保存されません**（Phase 2で実装予定）
- ❌ **画像はダウンロードされません**（Phase 2で実装予定）

**確認すべきポイント**:

1. **コンソールログに以下が含まれている**:
   - `Content extracted successfully` ✅
   - `Markdown conversion completed` ✅
   - 記事のタイトルが正しい ✅
   - URLが正しい ✅

2. **エラーが出ていない**:
   - 赤いエラーメッセージがない ✅

3. **ステータス表示**:
   - 緑色の成功メッセージが表示される ✅

---

## 📝 テスト結果の例

### 成功例（MDN）

**入力サイト**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction

**コンソール出力**:
```
[Webpage to Markdown] Content extracted successfully
[Webpage to Markdown] Markdown conversion completed
[Webpage to Markdown] Found 3 images
[Webpage to Markdown] Metadata collected: {
  title: "JavaScript Guide - Introduction",
  author: null,
  url: "https://developer.mozilla.org/...",
  siteName: "MDN Web Docs"
}
```

**Markdown長**: 約5000文字

**ステータス**: ✅ 成功

### 成功例（Wikipedia）

**入力サイト**: https://en.wikipedia.org/wiki/Markdown

**コンソール出力**:
```
[Webpage to Markdown] Content extracted successfully
[Webpage to Markdown] Markdown conversion completed
[Webpage to Markdown] Found 8 images
[Webpage to Markdown] Metadata collected: {
  title: "Markdown - Wikipedia",
  author: null,
  url: "https://en.wikipedia.org/wiki/Markdown"
}
```

**Markdown長**: 約15000文字

**ステータス**: ✅ 成功

---

## 🐛 トラブルシューティング

### エラー: "Could not load icon"

**原因**: PNGアイコンファイルが不足

**解決方法**:
1. 上記の「アイコンの作成」セクションを参照
2. `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` を作成
3. 拡張機能を再読み込み（拡張機能ページの「更新」ボタンをクリック）

### エラー: "Content script not loaded"

**原因**: ページがリロードされていない、またはコンテンツスクリプトが注入されていない

**解決方法**:
1. テストページを**リロード**（F5）
2. 拡張機能アイコンをクリック
3. 再度「Extract & Convert」をクリック

### エラー: "Could not extract article content"

**原因**: ReadabilityがコンテンツをPage抽出できなかった

**対象サイト**:
- SNS（Twitter, Facebookなど）
- 動的コンテンツの多いサイト
- ログインが必要なページ

**解決方法**:
1. 別のテストサイト（MDN, Wikipediaなど）で試す
2. 記事本文が含まれるページで試す
3. Phase 5で手動選択機能を追加予定

### ボタンをクリックしても何も起きない

**原因**: JavaScript エラー、または拡張機能が正しく読み込まれていない

**解決方法**:
1. **コンソールを確認**（F12 → Console）
2. **赤いエラーメッセージ**を探す
3. 拡張機能を**再読み込み**:
   - `chrome://extensions/` に移動
   - 「更新」ボタン（円形の矢印）をクリック
4. ページを**リロード**（F5）
5. 再試行

### 拡張機能アイコンが表示されない

**原因**: ツールバーに固定されていない

**解決方法**:
1. ツールバーの**パズルピースアイコン**をクリック
2. 「Webpage to Markdown」を探す
3. **ピンアイコン**（📌）をクリックしてツールバーに固定

---

## 🔍 詳細なログの確認

### Service Worker ログの確認

拡張機能のバックグラウンド処理を確認したい場合:

1. `chrome://extensions/` を開く
2. 「Webpage to Markdown」を探す
3. 「サービスワーカー」の横にある **「inspect」** リンクをクリック
4. 新しいDevToolsウィンドウが開く
5. Consoleタブでログを確認

### Content Script ログの確認

Webページ上のコンテンツスクリプトのログを確認:

1. テストページで **F12** を押す
2. **Console** タブを選択
3. `[Webpage to Markdown]` で始まるログをフィルタ

---

## ✅ テスト完了チェックリスト

Phase 1のテストを完了するには、以下を確認してください:

- [ ] アイコンを作成した（icon16.png, icon48.png, icon128.png）
- [ ] 拡張機能を Chrome/Edge に読み込んだ
- [ ] 拡張機能がエラーなく読み込まれた
- [ ] MDN または Wikipedia でテストした
- [ ] 「Extract & Convert」ボタンをクリックした
- [ ] コンソールログを確認した
- [ ] 「Content extracted successfully」が表示された
- [ ] 「Markdown conversion completed」が表示された
- [ ] エラーメッセージが出ていない
- [ ] ステータスメッセージが緑色で表示された

すべてチェックできたら、Phase 1のテストは完了です！🎉

---

## 📚 次のステップ

Phase 1のテストが完了したら:

1. **Issue #3**: アイコンを正式に作成（デザインの改善）
2. **Issue #4**: Phase 2の実装（IndexedDB + 画像処理）
3. **PR #2**: Phase 1のコードレビュー・マージ

### トラブルシューティング

#### エラー: "Could not load icon"

→ `icons/` ディレクトリにPNGアイコンがありません。上記の「アイコンの準備」手順を実行してください。

#### エラー: "Content script not loaded"

→ ページをリロード（F5）してから再試行してください。

#### ボタンをクリックしても何も起きない

→ ブラウザのコンソール（F12）でエラーログを確認してください。

## テスト

### Phase 1 MVP テスト項目

1. **基本的なコンテンツ抽出**
   - [ ] ニュースサイト（例: NHK, BBC）で動作
   - [ ] ブログ記事で動作
   - [ ] 技術記事（例: Qiita, Medium）で動作

2. **Markdown変換**
   - [ ] 見出しが正しく変換される
   - [ ] リストが正しく変換される
   - [ ] リンクが正しく変換される
   - [ ] コードブロックが正しく変換される

3. **UI動作**
   - [ ] ポップアップが正常に開く
   - [ ] ボタンクリックで処理が開始される
   - [ ] ステータスメッセージが表示される

### テスト方法

```bash
# 1. 拡張機能を読み込む（上記の「開発環境のセットアップ」参照）

# 2. テストサイトを開く
# 例: https://developer.mozilla.org/en-US/docs/Web/JavaScript

# 3. 拡張機能アイコンをクリック

# 4. 「Extract & Convert」ボタンをクリック

# 5. 開発者コンソールでログを確認
# - F12キーを押して開発者ツールを開く
# - Consoleタブを選択
# - "[Webpage to Markdown]" で始まるログを確認
```

### 既知の問題（Phase 1）

- **画像ダウンロード**: Phase 2で実装予定
- **記事の保存**: Phase 2で実装予定（IndexedDB）
- **翻訳機能**: Phase 4で実装予定
- **エクスポート機能**: Phase 3で実装予定

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下でライセンスされています。

## サポート

質問や問題がある場合は、[Issues](https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues) で報告してください。

---

**Happy Coding!** 🚀
