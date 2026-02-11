# 🧪 Chrome Extension Manual Testing Guide

## 前提条件

- Google Chrome または Chromium ブラウザ（バージョン 114以降）
- Node.js と npm（依存関係のビルド用）

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd /path/to/webpage-to-markdown-extention
npm install
```

### 2. アイコンの生成（必要な場合）

```bash
# ImageMagickを使用
convert -background none -resize 16x16 icons/icon.svg icons/icon16.png
convert -background none -resize 48x48 icons/icon.svg icons/icon48.png
convert -background none -resize 128x128 icons/icon.svg icons/icon128.png

# または、オンラインコンバーター（CloudConvert等）を使用
# または、ダミーアイコンを手動作成
```

### 3. Chrome拡張機能のロード

1. Chromeを開く
2. アドレスバーに `chrome://extensions/` を入力
3. 右上の「デベロッパーモード」をオン
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトのルートディレクトリを選択

✅ 拡張機能が正常にロードされました！

---

## 📋 テストチェックリスト

### Phase 1: 基本機能テスト

#### ✅ コンテンツ抽出
- [ ] 1. テストページを開く: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction
- [ ] 2. 拡張機能アイコンをクリック
- [ ] 3. ポップアップが表示される
- [ ] 4. 「Extract」ボタンをクリック
- [ ] 5. サイドパネルが右側に開く ⭐️ **NEW Feature**
- [ ] 6. マークダウンプレビューが表示される

**期待される結果:**
- サイドパネルが開く
- タイトル: "Introduction - JavaScript | MDN"
- メタデータ（著者、URL）が表示される
- マークダウンがHTMLレンダリングされて表示される

#### ✅ サイドパネルUI機能

**表示モード切り替え:**
- [ ] 1. 「Preview」タブをクリック → HTMLレンダリングされた記事が表示
- [ ] 2. 「Markdown」タブをクリック → 生のマークダウンテキストが表示
- [ ] 3. タブが正しくハイライトされる

**アクションボタン:**
- [ ] 1. 📋 **Copy**ボタンをクリック
  - マークダウンがクリップボードにコピーされる
  - エディタにペーストして確認
- [ ] 2. ⬇️ **Download**ボタンをクリック
  - `.md`ファイルがダウンロードされる
  - ファイル名: `introduction-javascript-mdn-2026-02-11.md`
  - 内容が正しい

**UI状態:**
- [ ] ローディング状態が表示される（抽出中）
- [ ] コンテンツが表示される（抽出成功）
- [ ] エラー状態が表示される（抽出失敗時）

---

### Phase 2: 複数サイトテスト

以下のサイトで正常に動作することを確認：

#### Wikipedia
- [ ] URL: https://en.wikipedia.org/wiki/Markdown
- [ ] 見出し、リスト、リンクが正しく表示される
- [ ] 画像のalt textが保持される

#### Medium
- [ ] URL: https://medium.com/@example（任意の記事）
- [ ] 著者名が抽出される
- [ ] コードブロックが正しく表示される

#### Qiita
- [ ] URL: https://qiita.com/example（任意の記事）
- [ ] 日本語コンテンツが正しく処理される
- [ ] マークダウンのフォーマットが保持される

#### GitHub README
- [ ] URL: https://github.com/example/repo
- [ ] READMEが抽出される
- [ ] コードブロックの言語指定が保持される

---

### Phase 3: エラーハンドリング

#### コンテンツ抽出失敗
- [ ] 1. 抽出できないページ（例: `chrome://extensions/`）を開く
- [ ] 2. 拡張機能を実行
- [ ] 3. エラーメッセージが表示される
- [ ] 4. 「Retry」ボタンが表示される

#### Content Scriptが未ロード
- [ ] 1. ページをリフレッシュせずに拡張機能を実行
- [ ] 2. 適切なエラーメッセージ: "Content script not loaded. Please refresh..."

---

### Phase 4: 設定画面テスト

#### オプションページ
- [ ] 1. 拡張機能を右クリック → 「オプション」
- [ ] 2. 設定画面が開く
- [ ] 3. 「Translation Settings」セクションが表示される
- [ ] 4. APIキー入力欄が password type
- [ ] 5. 「Show」ボタンでAPIキーの表示/非表示を切り替え
- [ ] 6. 「Save Settings」で保存
- [ ] 7. ページをリロード → 設定が保持されている

---

### Phase 5: マークダウン品質チェック

#### フォーマット検証
- [ ] **見出し**: `#`, `##`, `###` が正しく変換される
- [ ] **リスト**:
  - `- item` (unordered)
  - `1. item` (ordered)
- [ ] **リンク**: `[text](url)` 形式
- [ ] **画像**: `![alt](url)` 形式
- [ ] **コードブロック**:
  ```language
  code here
  ```
- [ ] **インラインコード**: `code`
- [ ] **引用**: `> quote`
- [ ] **太字/斜体**: `**bold**`, `*italic*`

#### コンテンツの完全性
- [ ] 記事の全文が抽出されている
- [ ] 広告やナビゲーションが除外されている
- [ ] 画像URLが絶対パスに変換されている
- [ ] 内部リンクが保持されている

---

## 🐛 既知の制限事項

1. **Chrome 114以降が必要**: Side Panel API使用のため
2. **特定のサイトで動作しない可能性**:
   - 動的コンテンツの多いサイト（SPA）
   - Readabilityで解析できないサイト
3. **画像**: 現時点ではURLのみ（Phase 2でダウンロード実装予定）

---

## 📊 テスト結果レポート

### 環境情報
- Chrome バージョン: `_____`
- OS: `_____`
- 拡張機能バージョン: `0.1.0`

### テスト結果サマリー
- ✅ 成功: `___` / `___`
- ❌ 失敗: `___` / `___`
- ⚠️  警告: `___` / `___`

### 発見されたバグ
1. ...
2. ...

### 改善提案
1. ...
2. ...

---

## 🔧 トラブルシューティング

### 問題: サイドパネルが開かない
**解決策:**
- Chrome 114以降を使用しているか確認
- 拡張機能を再読み込み
- ページをリフレッシュ

### 問題: コンソールエラー
**解決策:**
1. DevToolsを開く（F12）
2. Consoleタブを確認
3. エラーメッセージをGitHub Issueで報告

### 問題: マークダウンが崩れる
**解決策:**
- 特定のサイトでのみ発生するか確認
- GitHub Issueで報告（サイトURLを含む）

---

## 📝 フィードバック

テスト結果やバグを発見した場合は、以下にIssueを作成してください：
https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues

---

**Happy Testing! 🚀**
