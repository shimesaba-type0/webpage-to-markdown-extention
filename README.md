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

🚧 **このプロジェクトは現在開発初期段階です** 🚧

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

🚧 **Coming Soon** - 開発環境のセットアップ手順は後日追加予定です。

## テスト

🚧 **Coming Soon** - テスト実行方法は後日追加予定です。

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下でライセンスされています。

## サポート

質問や問題がある場合は、[Issues](https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues) で報告してください。

---

**Happy Coding!** 🚀
