# アイコンの作成

## 📋 概要

Chrome拡張機能に必要なPNGアイコンを作成します。

## 🎯 必要なアイコン

- [ ] `icon16.png` (16x16px) - ツールバーアイコン
- [ ] `icon48.png` (48x48px) - 拡張機能管理ページ
- [ ] `icon128.png` (128x128px) - Chrome Web Store

## 📝 詳細

### 現状

- SVGテンプレート（`icons/icon.svg`）が作成済み
- シンプルな「M↓」デザイン（Markdownを表現）

### タスク

- [ ] ImageMagickまたは他のツールでSVGをPNGに変換
- [ ] 各サイズで視認性を確認
- [ ] manifest.jsonで正しく読み込まれることを確認

## 🛠️ 変換方法

### Option 1: ImageMagick（推奨）

```bash
cd icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Option 2: オンラインコンバーター

https://cloudconvert.com/svg-to-png

### Option 3: デザインツール

Figma, Inkscape, Adobe Illustratorなどを使用

## 📚 参考資料

- [Chrome Extension Icons Guidelines](https://developer.chrome.com/docs/webstore/images/)
- `icons/README.md` - 詳細な手順

## ✅ 完了条件

- [ ] 3つのPNGアイコンが作成されている
- [ ] 各サイズで見やすいデザインになっている
- [ ] 拡張機能が正常に読み込める
- [ ] ツールバーでアイコンが表示される

## 🏷️ ラベル

`assets`, `design`, `high-priority`
