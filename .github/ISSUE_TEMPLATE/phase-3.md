# Phase 3: ZIPエクスポート機能の実装

## 📋 概要

Phase 3では、保存した記事をMarkdownファイルと画像フォルダを含むZIPファイルとしてエクスポートする機能を実装します。

## 🎯 目標

- [ ] JSZipライブラリの統合
- [ ] 単一記事のZIPエクスポート
- [ ] 複数記事の一括エクスポート
- [ ] ポップアップUIにエクスポートボタン追加

## 📝 詳細タスク

### 1. JSZipライブラリの統合

- [ ] JSZipのダウンロード（`src/lib/jszip.min.js`）
- [ ] manifest.jsonへの追加（必要に応じて）
- [ ] ライブラリの動作確認

### 2. File Exporter (`src/modules/file-exporter.js`)

- [ ] `exportArticle(article, images)` の実装
  - [ ] ZIP作成
  - [ ] Markdownファイル追加
  - [ ] imagesフォルダ作成
  - [ ] metadata.json追加（オプション）
- [ ] `exportMultipleArticles(articlesData)` の実装
  - [ ] 複数記事のフォルダ構成
  - [ ] 一括ZIP作成
- [ ] `downloadBlob(blob, filename)` の実装
  - [ ] Chrome Downloads API使用
  - [ ] ダウンロード完了のハンドリング
- [ ] ファイル名のサニタイズ

### 3. Service Worker統合

- [ ] `handleExportAll` の実装
  - [ ] IndexedDBから全記事取得
  - [ ] FileExporterの呼び出し
- [ ] エラーハンドリング

### 4. ポップアップUI更新

- [ ] 「Export All」ボタンの有効化
- [ ] 個別記事のエクスポートボタン追加
- [ ] エクスポート中のローディング表示
- [ ] エクスポート完了メッセージ

## 📚 参考資料

- [JSZip Documentation](https://stuk.github.io/jszip/)
- [Chrome Downloads API](https://developer.chrome.com/docs/extensions/reference/downloads/)
- [Blob API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

## ✅ 完了条件

- [ ] 単一記事をZIPファイルとしてエクスポートできる
- [ ] ZIPファイルにMarkdown + 画像が含まれる
- [ ] 複数記事を一括エクスポートできる
- [ ] ファイル名が適切にサニタイズされる
- [ ] エラー時に適切なメッセージが表示される

## 🔗 関連Issue

- 依存: Phase 2完了

## 🏷️ ラベル

`phase-3`, `enhancement`, `export`, `medium-priority`
