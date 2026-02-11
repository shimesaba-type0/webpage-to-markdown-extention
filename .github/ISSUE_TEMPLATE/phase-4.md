# Phase 4: Anthropic API翻訳機能の実装

## 📋 概要

Phase 4では、Anthropic APIを使用して記事を多言語から日本語に翻訳する機能を実装します。

## 🎯 目標

- [ ] Anthropic API統合
- [ ] 翻訳ON/OFFスイッチ
- [ ] カスタム翻訳プロンプト設定
- [ ] 原文と翻訳の両方保存
- [ ] 設定画面の実装

## 📝 詳細タスク

### 1. Translator モジュール (`src/modules/translator.js`)

- [ ] `Translator` クラスの実装
- [ ] `splitIntoSections(markdown)` - 章ごとの分割
- [ ] `translateSection(sectionContent, customPrompt)` - セクション翻訳
- [ ] `translateMarkdown(markdown, progressCallback, customPrompt)` - 全体翻訳
- [ ] エラーハンドリングとリトライロジック
- [ ] レート制限対策（500ms待機）

### 2. 設定画面 (`src/options/options.*`)

#### HTML (`src/options/options.html`)
- [ ] Translation Settingsセクション
  - [ ] 翻訳ON/OFFチェックボックス
  - [ ] APIキー入力フィールド（パスワード形式）
  - [ ] 原文保存オプション
  - [ ] カスタムプロンプトテキストエリア
  - [ ] プロンプトリセット/プレビューボタン
- [ ] Export Settingsセクション
  - [ ] metadata.json含めるオプション
  - [ ] 自動翻訳オプション

#### JavaScript (`src/options/options.js`)
- [ ] デフォルト翻訳プロンプトの定義
- [ ] 設定の保存・読み込み
- [ ] APIキーの表示/非表示切り替え
- [ ] プロンプトのリセット機能
- [ ] プロンプトのプレビュー機能
- [ ] 全データクリア機能

#### CSS (`src/options/options.css`)
- [ ] 設定画面のスタイリング
- [ ] レスポンシブデザイン
- [ ] ボタン・フォームのスタイル

### 3. Service Worker統合

- [ ] `handleTranslateArticle(articleId)` の実装
  - [ ] 設定チェック（翻訳有効化、APIキー）
  - [ ] 記事の取得
  - [ ] Translatorの呼び出し
  - [ ] 翻訳結果の保存（原文+翻訳）
- [ ] 進捗通知（オプション）

### 4. ポップアップUI更新

- [ ] 「Translate to JP」ボタンの有効化
- [ ] 翻訳状態の表示
- [ ] 原文/翻訳切り替え表示（Phase 5で実装可能）

## 📚 参考資料

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Chrome Storage Sync](https://developer.chrome.com/docs/extensions/reference/storage/#property-sync)
- [Markdown Parsing](https://marked.js.org/)

## ✅ 完了条件

- [ ] APIキーを設定画面で設定できる
- [ ] 翻訳ON/OFFを切り替えられる
- [ ] カスタムプロンプトを編集できる
- [ ] 記事を翻訳できる（章ごと）
- [ ] 原文と翻訳が両方保存される
- [ ] 翻訳中の進捗が表示される
- [ ] エラー時に適切なメッセージが表示される
- [ ] レート制限が適切に処理される

## 🔗 関連Issue

- 依存: Phase 2完了

## 🏷️ ラベル

`phase-4`, `enhancement`, `translation`, `api-integration`, `medium-priority`
