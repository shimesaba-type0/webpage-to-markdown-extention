# サイドパネルUI: ウェブページ横にマークダウンプレビューを表示

## 概要
現在はポップアップ方式ですが、より使いやすいサイドパネルUIに変更する。

## 現在の実装
- 拡張機能アイコンをクリック → ポップアップが表示される
- コンソールにログが出力される
- マークダウンはダウンロードのみ

## 理想的な実装
- 拡張機能アイコンをクリック → ウェブページの**右側**にサイドパネルが表示される
- **左側**: 元のウェブページ（原文）
- **右側**: マークダウン化された記事（リアルタイムプレビュー）
- サイドバイサイド表示で原文と変換結果を比較しながら確認できる

## UIイメージ
```
┌─────────────────────┬──────────────┐
│                     │              │
│  元のウェブページ    │  マークダウン │
│  (原文)             │  プレビュー   │
│                     │              │
│                     │  [閉じる]    │
└─────────────────────┴──────────────┘
    70%                    30%
```

## 技術的な実装方針

### Option 1: Chrome Side Panel API (推奨)
Chrome Extension Manifest V3の公式Side Panel APIを使用
- `chrome.sidePanel` API
- manifest.jsonに`side_panel`設定を追加
- ブラウザネイティブのサイドパネルとして実装

**メリット:**
- ブラウザネイティブのUI
- タブ管理が自動
- セキュリティが高い

**デメリット:**
- Chrome 114以降が必要
- カスタマイズ性が限定的

### Option 2: Content Script でカスタムサイドパネル注入
Content Scriptで`<div>`を動的に挿入し、CSSでレイアウト調整

**メリット:**
- 完全なカスタマイズ可能
- Chrome バージョン依存なし
- リッチなUI実装が可能

**デメリット:**
- ページのCSSと競合する可能性
- パフォーマンスへの影響

## 実装タスク
- [ ] Side Panel APIの調査
- [ ] マークダウンレンダラーの選定（marked.js / markdown-it）
- [ ] サイドパネルのHTML/CSS作成
- [ ] 開閉アニメーション実装
- [ ] 幅調整機能（ドラッグ&リサイズ）
- [ ] 原文とマークダウンの同期スクロール
- [ ] レスポンシブ対応（モバイルでは全画面表示）

## 参考リンク
- [Chrome Side Panel API Documentation](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [marked.js - Markdown Parser](https://marked.js.org/)
- [Chrome Extension Samples - Side Panel](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/sample.sidepanel-site-specific)

## 優先度
**Medium** - 基本機能は動作しているが、UXの大幅な改善になる

## ラベル
enhancement, ui, user-experience
