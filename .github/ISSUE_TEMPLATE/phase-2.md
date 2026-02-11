# Phase 2: IndexedDBストレージと画像処理の実装

## 📋 概要

Phase 2では、抽出したコンテンツを永続的に保存するためのIndexedDBストレージと、画像のダウンロード・管理機能を実装します。

## 🎯 目標

- [ ] IndexedDB wrapperの実装
- [ ] 記事データの保存・取得・削除
- [ ] 画像のダウンロードと保存
- [ ] Markdownの画像パス更新
- [ ] ポップアップUIでの記事一覧表示

## 📝 詳細タスク

### 1. IndexedDB Wrapper (`src/modules/db.js`)

- [ ] データベース初期化
- [ ] スキーマ定義（articles, images, translations）
- [ ] CRUD操作の実装
  - [ ] `saveArticle(articleData)`
  - [ ] `getArticle(id)`
  - [ ] `getAllArticles()`
  - [ ] `deleteArticle(id)`
- [ ] トランザクション管理
- [ ] エラーハンドリング

### 2. 画像ハンドラー (`src/modules/image-handler.js`)

- [ ] 画像ダウンロード機能
  - [ ] `downloadImage(url)`
  - [ ] `downloadImages(imageList)`
- [ ] 画像データの変換（Blob → ArrayBuffer）
- [ ] Markdownの画像参照更新
  - [ ] `updateMarkdownImagePaths(markdown, imageMap)`
- [ ] MIME typeからファイル拡張子の取得
- [ ] 並列ダウンロード制御（最大5並列）

### 3. Service Worker統合 (`src/background/service-worker.js`)

- [ ] `handleSaveArticle` の実装
  - [ ] 画像ダウンロード
  - [ ] Markdownパス更新
  - [ ] IndexedDBへの保存
- [ ] `handleGetArticles` の実装
- [ ] エラーハンドリングの強化

### 4. ポップアップUI更新 (`src/popup/popup.js`)

- [ ] 保存済み記事の一覧表示
- [ ] 記事アイテムのレンダリング
- [ ] 記事クリックでの詳細表示（簡易版）
- [ ] 削除機能の追加

## 📚 参考資料

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

## ✅ 完了条件

- [ ] 記事を抽出して保存できる
- [ ] 画像が正しくダウンロードされる
- [ ] ポップアップで保存済み記事の一覧が表示される
- [ ] 記事をクリックして内容を確認できる
- [ ] 記事を削除できる
- [ ] エラー時に適切なメッセージが表示される

## 🔗 関連Issue

- 依存: #1 Phase 1 MVP完了

## 🏷️ ラベル

`phase-2`, `enhancement`, `storage`, `high-priority`
