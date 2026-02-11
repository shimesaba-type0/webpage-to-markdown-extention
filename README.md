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

- Google Chrome または Microsoft Edge ブラウザ
- Git

### インストール手順

1. **リポジトリのクローン**

```bash
git clone https://github.com/shimesaba-type0/webpage-to-markdown-extention.git
cd webpage-to-markdown-extention
```

2. **アイコンの準備（重要）**

現在、PNGアイコンが不足しています。以下のいずれかの方法でアイコンを作成してください：

**方法1: SVGからPNGを生成（推奨）**

```bash
cd icons
# ImageMagickを使用（要インストール）
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

**方法2: 一時的なダミーアイコンを作成**

開発中は、任意の小さなPNG画像を `icons/` ディレクトリに以下の名前でコピーしてください：
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

詳細は `icons/README.md` を参照してください。

3. **Chromeに拡張機能を読み込む**

1. Chrome/Edgeを開く
2. `chrome://extensions/` に移動
3. 「デベロッパーモード」を有効化（右上のトグル）
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトのルートディレクトリ（`manifest.json`があるフォルダ）を選択

4. **動作確認**

- 任意のWebページを開く
- 拡張機能アイコンをクリック
- 「Extract & Convert」ボタンをクリック
- コンソールログで動作を確認（F12で開発者ツールを開く）

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
