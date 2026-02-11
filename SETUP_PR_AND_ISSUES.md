# PR と Issue の作成手順

## 📋 概要

Phase 1 MVP が完了し、以下のファイルが準備されています：

- ✅ PR テンプレート（`.github/pull_request_template.md`）
- ✅ PR ドラフト（`PR_DRAFT.md`）
- ✅ Issue テンプレート（4つ）
- ✅ 分散コーディングガイド（`agents.md`）

## 🚀 Step 1: Pull Request の作成

### オプション A: GitHub Web UI（推奨）

1. **GitHubリポジトリを開く**
   ```
   https://github.com/shimesaba-type0/webpage-to-markdown-extention
   ```

2. **PR作成画面に移動**
   - 「Pull requests」タブをクリック
   - 「New pull request」ボタンをクリック

3. **ブランチを選択**
   - **base**: `main`
   - **compare**: `claude/configure-branch-protection-DYKEg`

4. **PR情報を入力**
   - タイトル: `Phase 1 MVP - Basic Webpage to Markdown Conversion`
   - 本文: `PR_DRAFT.md` の内容をコピー&ペースト

5. **作成**
   - 「Create pull request」ボタンをクリック

### オプション B: GitHub CLI（利用可能な場合）

```bash
gh pr create \
  --title "Phase 1 MVP - Basic Webpage to Markdown Conversion" \
  --body-file PR_DRAFT.md \
  --base main \
  --head claude/configure-branch-protection-DYKEg
```

### オプション C: 直接URL

以下のURLにアクセスすると、PR作成画面が開きます：

```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/compare/main...claude/configure-branch-protection-DYKEg
```

---

## 📝 Step 2: Issue の作成

以下の4つのIssueを作成してください：

### Issue 1: Phase 2 - IndexedDBストレージと画像処理

**テンプレート**: `.github/ISSUE_TEMPLATE/phase-2.md`

#### 作成手順:
1. https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues/new
2. タイトル: `Phase 2: IndexedDBストレージと画像処理の実装`
3. 本文: `phase-2.md` の内容をコピー
4. ラベル: `phase-2`, `enhancement`, `storage`, `high-priority`
5. マイルストーン: Phase 2（必要に応じて作成）

#### 直接リンク（テンプレート使用）:
```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues/new?template=phase-2.md
```

---

### Issue 2: Phase 3 - ZIPエクスポート機能

**テンプレート**: `.github/ISSUE_TEMPLATE/phase-3.md`

#### 作成手順:
1. タイトル: `Phase 3: ZIPエクスポート機能の実装`
2. 本文: `phase-3.md` の内容をコピー
3. ラベル: `phase-3`, `enhancement`, `export`, `medium-priority`
4. マイルストーン: Phase 3

#### 直接リンク:
```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues/new?template=phase-3.md
```

---

### Issue 3: Phase 4 - Anthropic API翻訳機能

**テンプレート**: `.github/ISSUE_TEMPLATE/phase-4.md`

#### 作成手順:
1. タイトル: `Phase 4: Anthropic API翻訳機能の実装`
2. 本文: `phase-4.md` の内容をコピー
3. ラベル: `phase-4`, `enhancement`, `translation`, `api-integration`, `medium-priority`
4. マイルストーン: Phase 4

#### 直接リンク:
```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues/new?template=phase-4.md
```

---

### Issue 4: アイコンの作成

**テンプレート**: `.github/ISSUE_TEMPLATE/create-icons.md`

#### 作成手順:
1. タイトル: `アイコンの作成（icon16.png, icon48.png, icon128.png）`
2. 本文: `create-icons.md` の内容をコピー
3. ラベル: `assets`, `design`, `high-priority`
4. マイルストーン: Phase 1（またはPhase 2）

#### 直接リンク:
```
https://github.com/shimesaba-type0/webpage-to-markdown-extention/issues/new?template=create-icons.md
```

---

## 🏷️ ラベルの作成（必要に応じて）

GitHubリポジトリで以下のラベルを作成してください：

1. **フェーズ別**
   - `phase-1` (色: #0052CC)
   - `phase-2` (色: #0052CC)
   - `phase-3` (色: #0052CC)
   - `phase-4` (色: #0052CC)

2. **タイプ別**
   - `enhancement` (色: #84b6eb)
   - `bug` (色: #d73a4a)
   - `documentation` (色: #0075ca)

3. **優先度別**
   - `high-priority` (色: #d93f0b)
   - `medium-priority` (色: #fbca04)
   - `low-priority` (色: #0e8a16)

4. **カテゴリ別**
   - `storage` (色: #5319e7)
   - `export` (色: #5319e7)
   - `translation` (色: #5319e7)
   - `api-integration` (色: #5319e7)
   - `assets` (色: #c5def5)
   - `design` (色: #c5def5)

---

## 📊 マイルストーンの作成（推奨）

1. **Phase 1 MVP** ✅ 完了
2. **Phase 2: Storage** 🔄 進行中
3. **Phase 3: Export**
4. **Phase 4: Translation**
5. **Phase 5: UI/UX**
6. **Phase 6: Testing**
7. **Phase 7: Release**

---

## ✅ 完了確認チェックリスト

- [ ] PR「Phase 1 MVP」を作成した
- [ ] Issue「Phase 2: ストレージ」を作成した
- [ ] Issue「Phase 3: エクスポート」を作成した
- [ ] Issue「Phase 4: 翻訳」を作成した
- [ ] Issue「アイコン作成」を作成した
- [ ] 必要なラベルを作成した
- [ ] マイルストーンを設定した

---

## 🔄 次のステップ

1. **PRのレビュー**: PRを自己レビューまたは他の開発者にレビュー依頼
2. **PRのマージ**: レビュー完了後、mainブランチにマージ
3. **Phase 2の開始**: Issue「Phase 2」をアサインして実装開始
4. **アイコン作成**: 拡張機能を使用可能にするため、優先的に対応

---

## 📞 サポート

質問や問題がある場合は、リポジトリのDiscussionsまたはIssueで質問してください。

**Happy Coding!** 🚀
