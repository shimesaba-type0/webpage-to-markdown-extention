# Webpage to Markdown Extension

WebページをクリーンなMarkdown形式に変換するChrome拡張機能です。

## 主な機能

- Webページの本文を自動抽出し、Markdown形式に変換
- IndexedDBによる記事・画像の永続保存
- 画像のオフラインダウンロード（オプション）
- ZIPファイルとしてエクスポート（Markdown + 画像）
- AI翻訳（Anthropic Claude / Google Gemini API対応）
- Chrome Side Panelでの記事閲覧
- テンプレートプロンプトのコピー機能

## 仕組み（How It Works）

1. **本文抽出**: [Mozilla Readability](https://github.com/mozilla/readability)がWebページから本文を抽出し、広告やナビゲーションなどの不要な要素を除去します
2. **Markdown変換**: [Turndown.js](https://github.com/mixmark-io/turndown)が抽出したHTMLをクリーンなMarkdown形式に変換します
3. **バックグラウンド処理**: Service Worker（Manifest V3）がデータの保存・取得・画像ダウンロードなどのバックグラウンド処理を管理します
4. **永続保存**: IndexedDBに記事本文とメタデータ、画像データを保存します
5. **UI表示**: Chrome Side Panel APIを使用して、タブごとに独立したパネルで記事を表示します。Markdownの表示には[Marked](https://github.com/markedjs/marked)でHTMLにレンダリングしています
6. **AI翻訳（任意）**: Anthropic Claude APIまたはGoogle Gemini APIを使って、Markdownをセクション単位で日本語に翻訳します

## インストール方法

### 前提条件

- Google Chrome 116以降（またはMicrosoft Edge 116以降）

### 手順

1. リポジトリをクローンまたはZIPダウンロード:
   ```bash
   git clone https://github.com/shimesaba-type0/webpage-to-markdown-extention.git
   ```

2. Chromeで `chrome://extensions/` を開く

3. 右上の「デベロッパーモード」をONにする

4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、プロジェクトのルートディレクトリ（`manifest.json`があるフォルダ）を選択

5. ツールバーに拡張機能アイコンが表示されれば完了

## 使い方

### 基本操作

1. 変換したいWebページを開く
2. ツールバーの拡張機能アイコンをクリック
3. 「Extract & Convert」ボタンをクリック
4. サイドパネルにMarkdown変換された記事が表示される

### 保存済み記事の管理

- ポップアップの「Saved Articles」セクションから保存済み記事を一覧表示
- 「View」で記事を閲覧、「Export」でZIPエクスポート、「Delete」で削除

### 画像のダウンロード

画像ダウンロードはデフォルトで無効です。有効にするには：

1. ポップアップの「Settings」セクションで「Download images for offline viewing」にチェック
2. または、拡張機能アイコンを右クリック → 「オプション」から設定

### AI翻訳

翻訳機能を使うには、APIキーの設定が必要です：

1. 拡張機能アイコンを右クリック → 「オプション」を開く
2. 「Translation Settings」で翻訳を有効にする
3. 使用するAPIプロバイダー（Anthropic / Gemini）を選択
4. APIキーを入力して保存
   - Anthropic: https://console.anthropic.com/ でAPIキーを取得
   - Gemini: https://aistudio.google.com/apikey でAPIキーを取得
5. 記事抽出時に自動で翻訳されます（サイドパネルで原文/翻訳の切替可能）

## 開発

### セットアップ

```bash
git clone https://github.com/shimesaba-type0/webpage-to-markdown-extention.git
cd webpage-to-markdown-extention
npm install
```

### テスト

```bash
# ユニットテスト
npm test

# Lint
npm run lint

# E2Eテスト
npm run test:e2e:auto
```

### プロジェクト構成

```
├── manifest.json              # Chrome拡張マニフェスト（V3）
├── src/
│   ├── background/            # Service Worker
│   ├── content/               # Content Script（本文抽出）
│   ├── popup/                 # ポップアップUI
│   ├── sidepanel/             # サイドパネルUI
│   ├── options/               # 設定ページ
│   ├── storage/               # IndexedDB管理（StorageManager）
│   ├── export/                # ZIPエクスポート
│   └── lib/                   # 外部ライブラリ（Readability, Turndown, JSZip, Marked）
├── icons/                     # 拡張機能アイコン
└── tests/                     # テストコード
```

## トラブルシューティング

### 「Could not load icon」エラー

PNGアイコンファイルが不足しています。`icons/`ディレクトリに`icon16.png`、`icon48.png`、`icon128.png`が存在することを確認してください。SVGからの生成方法：

```bash
# ImageMagickが必要
convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
```

### 「Content script not loaded」エラー

テスト対象のページをリロード（F5）してから再試行してください。

### コンテンツが抽出できない

Readabilityが本文を抽出できないページ（SNS、動的コンテンツの多いサイト、ログイン必須ページ）では動作しない場合があります。ニュースサイトやブログ記事など、本文が明確なページで試してください。

### Service Workerのログ確認

`chrome://extensions/` → 「Webpage to Markdown」の「サービスワーカー」横の「inspect」リンクをクリックすると、バックグラウンド処理のログを確認できます。

## ライセンス

[MIT License](LICENSE)

## サポート

問題や提案がある場合は、[Issues](https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues)で報告してください。
