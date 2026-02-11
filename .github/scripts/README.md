# Branch Protection Setup Scripts

このディレクトリには、GitHubリポジトリのブランチプロテクション設定を自動化するスクリプトが含まれています。

## スクリプト一覧

### `setup-branch-protection.sh`

mainブランチにブランチプロテクションルールを自動的に適用するBashスクリプトです。

## 目的

このスクリプトは、以下のセキュリティ要件を満たすために作成されました：

- **mainブランチの保護**: 直接プッシュを禁止し、PR経由のマージのみを許可
- **不正なマージの防止**: ブランチプロテクションルールにより、リポジトリオーナーのみがマージ可能
- **一貫性のある設定**: スクリプトで自動化することで、設定ミスを防ぐ

## 前提条件

### GitHub CLIのインストール

このスクリプトは[GitHub CLI (`gh`)](https://cli.github.com/)を使用します。

#### インストール方法

**macOS:**
```bash
brew install gh
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**その他のLinuxディストリビューション:**
https://github.com/cli/cli/blob/trunk/docs/install_linux.md を参照してください。

### GitHub CLIの認証

スクリプトを実行する前に、GitHub CLIで認証を行う必要があります。

```bash
gh auth login
```

プロンプトに従って、GitHubアカウントで認証してください。

### 必要な権限

- **リポジトリの管理者権限**: ブランチプロテクション設定を変更するには、リポジトリの管理者（Admin）権限が必要です

## 実行方法

### 1. スクリプトに実行権限を付与

```bash
chmod +x .github/scripts/setup-branch-protection.sh
```

### 2. スクリプトを実行

```bash
./.github/scripts/setup-branch-protection.sh
```

成功すると、以下のような出力が表示されます：

```
================================================
GitHub Branch Protection Setup
================================================

Repository: shimesaba-type0/webpage-to-markdown-extention
Branch: main

Applying branch protection rules...

✓ Branch protection rules applied successfully

Verifying configuration...

✓ Configuration verified successfully

Applied protection rules:
  ✓ Pull requests required before merging
  ✓ Review approvals: 0 (owner-only repository)
  ✓ Linear history required
  ✓ Force pushes: disabled
  ✓ Branch deletions: disabled
  ✓ Rules enforced for administrators
  ✓ Conversation resolution: recommended

================================================
Branch protection setup completed!
================================================

You can view the settings at:
https://github.com/shimesaba-type0/webpage-to-markdown-extention/settings/branches
```

## 設定されるブランチプロテクションルール

スクリプトは、mainブランチに以下のルールを適用します：

| ルール | 設定値 | 説明 |
|--------|--------|------|
| **Pull requests required** | ✓ 有効 | mainブランチへの直接プッシュを禁止し、PR経由のマージのみを許可 |
| **Required approving reviews** | 0 | リポジトリオーナーのみの想定のため、承認レビューは不要 |
| **Dismiss stale reviews** | ✗ 無効 | 古いレビューを自動却下しない |
| **Require code owner reviews** | ✗ 無効 | CODEOWNERSファイルが設定されていないため無効 |
| **Linear history** | ✓ 有効 | マージコミットの履歴を綺麗に保つ（rebaseまたはsquash mergeを推奨） |
| **Force pushes** | ✗ 禁止 | `git push --force` を防ぐ |
| **Branch deletions** | ✗ 禁止 | mainブランチの誤削除を防ぐ |
| **Enforce for administrators** | ✓ 有効 | 管理者にもルールを適用（オーナーもPR経由でマージ） |
| **Conversation resolution** | ✓ 推奨 | レビューコメントの解決を推奨 |

## 動作確認方法

### 1. GitHub Web UIで確認

ブラウザで以下のURLにアクセスし、設定を確認できます：

```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/settings/branches
```

### 2. コマンドラインで確認

```bash
gh api \
  -H "Accept: application/vnd.github+json" \
  "/repos/shimesaba-type0/webpage-to-markdown-extention/branches/main/protection"
```

### 3. 動作テスト

**テスト1: 直接プッシュの禁止確認（失敗すべき）**

```bash
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "Direct push test"
git push origin main
```

期待される結果: `branch protection rule` に関するエラーメッセージ

**テスト2: PR経由のマージ確認（成功すべき）**

```bash
git checkout -b test/branch-protection
echo "test" > test.txt
git add test.txt
git commit -m "Test commit via PR"
git push origin test/branch-protection
gh pr create --title "Test PR" --body "Testing branch protection"
gh pr merge --merge
```

期待される結果: PRが正常に作成され、マージできる

**テスト3: 強制プッシュの禁止確認（失敗すべき）**

```bash
git push --force origin main
```

期待される結果: エラーメッセージ

## トラブルシューティング

### エラー: "GitHub CLI (gh) is not installed"

**原因**: GitHub CLIがインストールされていません。

**解決方法**: [前提条件](#github-cliのインストール)のセクションを参照し、GitHub CLIをインストールしてください。

### エラー: "Not authenticated with GitHub CLI"

**原因**: GitHub CLIで認証されていません。

**解決方法**:
```bash
gh auth login
```

プロンプトに従って認証してください。

### エラー: "Resource not accessible by integration" または "Insufficient permissions"

**原因**: リポジトリの管理者権限がありません。

**解決方法**: リポジトリオーナーまたは管理者権限を持つユーザーとしてスクリプトを実行してください。必要に応じて、以下のコマンドで権限を更新：

```bash
gh auth refresh -h github.com -s repo
```

### エラー: "Branch not found"

**原因**: mainブランチが存在しません。

**解決方法**: mainブランチが存在することを確認してください。masterブランチからmainへリネームする場合：

```bash
git branch -m master main
git push -u origin main
```

### エラー: "Validation Failed"

**原因**: JSONペイロードの形式エラーまたはGitHub APIの仕様変更。

**解決方法**: スクリプトの内容を確認し、GitHub APIドキュメントと照らし合わせてください。

https://docs.github.com/en/rest/branches/branch-protection

### 設定が反映されない

**原因**: APIの遅延またはブラウザのキャッシュ。

**解決方法**:
1. 数分待ってから再確認
2. ブラウザをハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）
3. 以下のコマンドで直接APIから確認：

```bash
gh api "/repos/shimesaba-type0/webpage-to-markdown-extention/branches/main/protection"
```

## 設定の変更

ブランチプロテクションルールを変更したい場合：

1. `setup-branch-protection.sh` の `PROTECTION_PAYLOAD` セクションを編集
2. スクリプトを再実行（べき等性があるため、何度実行しても安全）

例: レビュー承認を1つ必要にする場合

```bash
"required_approving_review_count": 1,
```

## 参考リンク

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)

## ライセンス

このスクリプトは、リポジトリのライセンス（MIT License）に従います。
