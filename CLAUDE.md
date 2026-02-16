# CLAUDE.md - Development Workflow Guide

## Version
0.1.0 (2024-01-XX)

---

## 目次

1. [概要](#概要)
2. [自律的開発ワークフロー](#自律的開発ワークフロー)
3. [多チーム開発体制](#多チーム開発体制)
4. [開発者の実装プロセス](#開発者の実装プロセス)
5. [レビュワーの審査プロセス](#レビュワーの審査プロセス)
6. [コンダクターの管理プロセス](#コンダクターの管理プロセス)
7. [コード品質基準](#コード品質基準)
8. [アーキテクチャパターン](#アーキテクチャパターン)
9. [よくある落とし穴と対策](#よくある落とし穴と対策)
10. [実装テンプレート](#実装テンプレート)

---

## 概要

本ドキュメントは、Webpage to Markdown ブラウザ拡張機能の開発において、自律的かつ高品質な実装を実現するためのワークフローとベストプラクティスを定義します。

### 基本原則

1. **役割分担の明確化**: Developer、Reviewer、Conductorの3つのロールを明確に分離
2. **事前計画の徹底**: コードを書く前に必ず実装プランを作成
3. **変更の可視化**: 編集後に変更理由と効果を明記
4. **並列開発の推進**: 独立したタスクは並列で実行
5. **コンフリクトの早期発見**: レビューとテストで問題を事前検出
6. **継続的学習と改善**: 失敗から学んだこと、次回以降の自律実行に活かせる知見をAGENTS.mdに記録（重複は除く）

---

## 自律的開発ワークフロー

### フェーズ1: 計画

```
Issue作成 → 実装プラン策定 → 並列性分析 → チーム編成
```

**コンダクターの責任:**
- Issue内容の分析
- 実装の並列性評価
- 必要なチーム数の決定
- 開発戦略の策定

### フェーズ2: 実装

```
開発者: 実装プラン作成 → コード実装 → 変更サマリ作成
レビュワー: コードレビュー → フィードバック提供
開発者: フィードバック適用 → 最終確認
```

**開発者の責任:**
1. 実装プラン作成（テンプレート使用）
2. コード実装
3. 変更サマリ作成
4. フィードバック対応

**レビュワーの責任:**
1. コードレビュー（品質基準に基づく）
2. アーキテクチャ整合性確認
3. 潜在的問題の指摘
4. 改善提案の提供

### フェーズ3: マージ

```
PR作成 → マージ戦略策定 → コンフリクト検出 → 解決 → マージ実行
```

**コンダクターの責任:**
- マージ順序の決定
- コンフリクト検出と解決指揮
- 関連Issue のクローズ
- 統合テストの確認

---

## 多チーム開発体制

### 組織構造

```
Conductor (統括マネージャー)
├── Team Alpha: Developer Alpha + Reviewer Alpha
├── Team Beta: Developer Beta + Reviewer Beta
├── Team Gamma: Developer Gamma + Reviewer Gamma
└── Resolution Team (必要に応じて): Developer + Reviewer
```

### チーム編成の基準

**並列開発が可能な条件:**
- ファイルの編集箇所が重複しない
- 機能が独立している
- データフローに依存関係がない

**直列開発が必要な条件:**
- 同一ファイルの同一箇所を編集
- 機能間に強い依存関係がある
- アーキテクチャ変更が他の実装に影響する

### 実績例: Issues #25, #26, #27

**分析結果:**
- Issue #25: 画像表示（独立）
- Issue #26: Viewボタン修正（独立）
- Issue #27: アーキテクチャ統合（#25, #26に依存）

**戦略:**
- Team A, B で #25, #26 を並列実装
- Team C で #27 を実装し、A, Bの変更を統合
- PR #31 として一括マージ

---

## 開発者の実装プロセス

### ステップ1: 実装プラン作成

**テンプレート:**

```markdown
# 実装プラン: [Issue #XX - タイトル]

## 担当
Developer [名前]

## 目的
[Issue で解決すべき問題を1-2文で記述]

## 分析
[現状の問題点を詳しく分析]
- 問題1: [詳細]
- 問題2: [詳細]

## 解決アプローチ
[どのように問題を解決するか]

## 実装詳細

### 修正対象ファイル
1. `path/to/file1.js`
   - 関数: `functionName()`
   - 変更内容: [詳細]
   - 理由: [なぜこの変更が必要か]

2. `path/to/file2.js`
   - 関数: `functionName()`
   - 変更内容: [詳細]
   - 理由: [なぜこの変更が必要か]

### 追加する機能
- 機能1: [詳細]
- 機能2: [詳細]

## 技術的考慮事項
- API互換性: [chrome.XXX のバージョン確認など]
- メモリ管理: [リソースのクリーンアップ]
- エラーハンドリング: [想定されるエラーと対処]

## テスト観点
- [ ] 基本動作確認
- [ ] エッジケース
- [ ] エラーケース

## 実装完了後の確認事項
- [ ] コンソールエラーなし
- [ ] 機能が期待通り動作
- [ ] 既存機能に影響なし
```

### ステップ2: コード実装

**実装時の注意点:**
1. プランに従って順次実装
2. コメントで変更理由を明記
3. JSDocで重要な決定を文書化
4. エラーハンドリングを必ず追加

**例: Issue #24 (Tab-specific SidePanel)**

```javascript
/**
 * Extract content and save to database
 *
 * Architecture Decision (Issue #24):
 * - Configure SidePanel as tab-specific using chrome.sidePanel.setOptions()
 * - This prevents SidePanel from persisting across tabs
 * - API available in Chrome 116+, gracefully degrades in older versions
 */
async function handleExtract() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // ... existing extraction logic ...

    // Configure tab-specific SidePanel (Issue #24)
    if (chrome.sidePanel && chrome.sidePanel.setOptions) {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: 'src/sidepanel/sidepanel.html',
        enabled: true
      });
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      // Fallback for older Chrome versions
      console.warn('[Popup] chrome.sidePanel.setOptions not available');
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    console.error('[Popup] Extract failed:', error);
    throw error;
  }
}
```

### ステップ3: 変更サマリ作成

**テンプレート:**

```markdown
# 変更サマリ: [Issue #XX]

## 修正ファイル
1. `src/popup/popup.js`
2. `src/sidepanel/sidepanel.js`
3. `src/background/service-worker.js`

## 主な変更内容

### 1. `src/popup/popup.js` - handleExtract()
**変更:**
```javascript
// Before
await chrome.sidePanel.open({ windowId: tab.windowId });

// After
if (chrome.sidePanel && chrome.sidePanel.setOptions) {
  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'src/sidepanel/sidepanel.html',
    enabled: true
  });
  await chrome.sidePanel.open({ tabId: tab.id });
}
```

**理由:**
- SidePanel をタブごとに独立させる
- タブを切り替えてもSidePanelが残らないようにする

**効果:**
- ユーザー体験の向上（タブごとに適切なコンテンツ表示）
- メモリ使用量の削減

### 2. `src/sidepanel/sidepanel.js` - cleanupBlobUrls()
**変更:**
新規関数を追加

**理由:**
- Blob URLのメモリリークを防ぐ
- 新しい記事を表示する前に古いURLを解放

**効果:**
- メモリ効率の向上
- 長時間使用時のパフォーマンス安定

## テスト結果
- [x] 基本動作: タブごとにSidePanelが独立
- [x] エッジケース: 複数タブで同時に抽出
- [x] エラーケース: 古いChromeバージョンでフォールバック動作

## 備考
- Chrome 116+ で完全に動作
- 古いバージョンでは従来通りウィンドウごとのSidePanel
```

---

## レビュワーの審査プロセス

### レビュー観点

**1. コード品質**
- [ ] 実装プランに沿っているか
- [ ] コードは読みやすく、保守しやすいか
- [ ] 適切なコメントとJSDocがあるか
- [ ] エラーハンドリングが適切か

**2. アーキテクチャ整合性**
- [ ] 既存のアーキテクチャパターンに従っているか
- [ ] データフローが正しいか
- [ ] メッセージベース通信を使用しているか
- [ ] 不要な状態管理を避けているか

**3. セキュリティと性能**
- [ ] メモリリークの可能性はないか
- [ ] API互換性チェックがあるか
- [ ] 適切なリソース解放があるか

**4. テスト可能性**
- [ ] 単体テストが可能な構造か
- [ ] エッジケースを考慮しているか

### レビューレポートテンプレート

```markdown
# レビューレポート: [Issue #XX]

## 担当
Reviewer [名前]

## 総合評価
[ ] Approved（承認）
[ ] Approved with Recommendations（条件付き承認）
[ ] Changes Requested（修正依頼）

## レビュー結果

### ✅ 良い点
1. [具体的な良い実装]
2. [適切な技術的判断]

### ⚠️ 改善提案
1. **[カテゴリ]**: [具体的な提案]
   - 現状: [問題点]
   - 提案: [改善案]
   - 理由: [なぜ改善が必要か]

### ❌ 必須修正
1. **[カテゴリ]**: [具体的な問題]
   - 影響: [どのような影響があるか]
   - 修正案: [具体的な修正方法]

## コード例

### 改善提案例

**現状:**
```javascript
setTimeout(async () => {
  await chrome.runtime.sendMessage({ action: 'displayMarkdown', data });
}, 500);
window.close(); // タイミング問題: メッセージ送信前にクローズする可能性
```

**提案:**
```javascript
setTimeout(async () => {
  try {
    await chrome.runtime.sendMessage({ action: 'displayMarkdown', data });
  } finally {
    window.close(); // メッセージ送信後に確実にクローズ
  }
}, 500);
```

## 次のステップ
- [ ] Developer が改善提案を確認
- [ ] 必須修正を適用
- [ ] 再レビュー不要 / 再レビュー必要
```

### 実績例: Reviewer Beta (Issue #26)

```markdown
# レビューレポート: Issue #26

## 総合評価
[x] Approved with Recommendations

## レビュー結果

### ✅ 良い点
1. メッセージベース通信への移行が適切
2. 画像データの統合が正しく実装されている
3. storage.local.set() のフォールバックを保持

### ⚠️ 改善提案

1. **タイミング制御**: window.close() の位置
   - 現状: setTimeout外でclose()を呼び出し
   - 提案: finallyブロック内に移動
   - 理由: メッセージ送信完了を保証

2. **エラーハンドリング**: sendMessage失敗時の処理
   - 提案: try-catchでエラーをキャッチし、ユーザーに通知

### 次のステップ
- [x] Conductorが改善提案を適用
- [x] 再レビュー不要
```

---

## コンダクターの管理プロセス

### 役割と責任

**プロジェクトマネジメント:**
- Issue分析と優先順位付け
- 並列性分析とチーム編成
- 開発戦略の策定
- 進捗管理

**技術リーダーシップ:**
- アーキテクチャ決定のレビュー
- チーム間の調整
- コンフリクト解決の指揮
- 品質基準の維持

**コミュニケーション:**
- チーム間の情報共有
- フィードバックの統合
- 最終判断と意思決定

### Issue分析テンプレート

```markdown
# Issue分析: [Issue #XX]

## Conductor [名前]

## Issue概要
[Issue内容を簡潔にまとめる]

## 影響範囲分析

### 修正対象ファイル
1. `src/popup/popup.js`
   - 関数: handleExtract(), viewArticle()
   - 影響度: 中

2. `src/sidepanel/sidepanel.js`
   - 関数: displayMarkdown()
   - 影響度: 高

### 依存関係
- Issue #25 との関係: [記述]
- Issue #26 との関係: [記述]

## 並列性評価

### 並列開発可能性
[ ] 完全に並列可能
[ ] 部分的に並列可能
[ ] 直列のみ

### 理由
[並列/直列の判断理由]

## チーム編成

### Team Alpha
- 担当: Issue #25
- Developer: Alpha
- Reviewer: Alpha

### Team Beta
- 担当: Issue #26
- Developer: Beta
- Reviewer: Beta

### Team Gamma
- 担当: Issue #27
- Developer: Gamma
- Reviewer: Gamma
- 備考: Team Alpha, Beta の成果物を統合

## 開発戦略

### フェーズ1: 並列実装
- Team Alpha: Issue #25 実装
- Team Beta: Issue #26 実装
- 期間: 同時進行

### フェーズ2: 統合
- Team Gamma: Issue #27 実装（Alpha, Beta の変更を統合）

### フェーズ3: マージ
- PR #31 として一括マージ
- 関連 Issue (#25, #26, #27) をクローズ

## リスク管理

### 想定リスク
1. コンフリクト発生の可能性: 中
2. API互換性問題: 低
3. 統合時のバグ: 中

### 対策
1. 早期のコードレビュー
2. API バージョンチェックの徹底
3. 統合テストの実施
```

### マージ戦略テンプレート

```markdown
# マージ戦略: [複数PR]

## Conductor [名前]

## 対象PR
- PR #28: Issue #24 (Tab-specific SidePanel)
- PR #31: Issues #25, #26, #27 (統合PR)

## 依存関係分析

```
PR #28 (独立)
  ↓
PR #31 (PR #28 の変更に依存)
```

## マージ順序

### ステップ1: PR #28
- 優先度: 最高
- 理由: 独立した変更、他のPRに影響なし
- 担当: Merge Reviewer Alpha

### ステップ2: PR #31
- 優先度: 高
- 理由: 複数Issueの統合、PR #28 の変更を含む必要あり
- 担当: Merge Reviewer Beta
- 注意: PR #28 マージ後にコンフリクトチェック

## コンフリクト対応

### 予想されるコンフリクト
- ファイル: `src/popup/popup.js`
- 箇所: handleExtract(), viewArticle()
- 原因: PR #28 と PR #31 が同じ関数を編集

### 解決戦略
1. PR #28 を先にマージ
2. PR #31 のブランチを main から更新
3. Resolution Team がコンフリクトを解決
4. Merge Reviewer Beta が最終確認

## 実行計画

1. Merge Reviewer Alpha: PR #28 をレビュー・マージ
2. Conductor: PR #31 のコンフリクトを確認
3. Resolution Team: コンフリクト解決（必要な場合）
4. Merge Reviewer Beta: PR #31 をレビュー・マージ
5. Conductor: 関連 Issue をクローズ

## チェックリスト
- [ ] PR #28 マージ完了
- [ ] Issue #24 クローズ
- [ ] PR #31 コンフリクトチェック
- [ ] PR #31 マージ完了
- [ ] Issues #25, #26, #27 クローズ
```

---

## コード品質基準

### 1. コメントとドキュメント

**必須:**
- すべての関数に目的を説明するコメント
- 重要なアーキテクチャ決定にはJSDoc
- 複雑なロジックには行コメント

**JSDoc テンプレート:**

```javascript
/**
 * [関数の目的を1文で]
 *
 * Architecture Decision (Issue #XX):
 * - [重要な設計判断]
 * - [なぜこのアプローチを選んだか]
 * - [制約や前提条件]
 *
 * @param {Type} paramName - パラメータの説明
 * @returns {Type} 戻り値の説明
 * @throws {ErrorType} エラー条件
 */
function functionName(paramName) {
  // 実装
}
```

**例: Issue #27 (checkPendingExtraction)**

```javascript
/**
 * Check for pending extraction data on page load
 *
 * Architecture Decision (Issue #27):
 * - Primary: Listen for 'displayMarkdown' message from popup (Issue #26)
 * - Fallback: Check storage.local for viewingArticle on startup
 * - Message-based approach is preferred for real-time communication
 * - Storage polling is kept as backup for edge cases
 *
 * Flow:
 * 1. User clicks "View" in popup
 * 2. Popup sends message to SidePanel (if already open)
 * 3. SidePanel receives message and displays content immediately
 * 4. If SidePanel not open, popup stores data and opens panel
 * 5. Panel checks storage on startup as fallback
 */
async function checkPendingExtraction() {
  // 実装
}
```

### 2. エラーハンドリング

**原則:**
- すべての非同期処理に try-catch
- エラーログに十分なコンテキスト
- ユーザーにわかりやすいエラーメッセージ

**テンプレート:**

```javascript
async function someAsyncFunction() {
  try {
    // メイン処理
    const result = await someOperation();
    return result;
  } catch (error) {
    // 詳細なエラーログ（開発者向け）
    console.error('[Component] Operation failed:', {
      operation: 'someOperation',
      error: error.message,
      stack: error.stack
    });

    // ユーザー向けエラーメッセージ
    throw new Error('Failed to complete operation. Please try again.');
  }
}
```

### 3. API互換性チェック

**原則:**
- 新しいAPIを使用する前に存在確認
- 古いバージョン向けのフォールバック提供
- 警告ログで非推奨機能を通知

**テンプレート:**

```javascript
// Chrome 116+ の新しいAPI使用例
if (chrome.sidePanel && chrome.sidePanel.setOptions) {
  // 新しいAPIを使用
  await chrome.sidePanel.setOptions({ tabId: tab.id, enabled: true });
} else {
  // 古いバージョン向けフォールバック
  console.warn('[Component] chrome.sidePanel.setOptions not available, using fallback');
  await legacyApproach();
}
```

### 4. メモリ管理

**原則:**
- Blob URLは使用後に必ず解放
- イベントリスナーは不要になったら削除
- 大きなデータは適切にクリーンアップ

**テンプレート:**

```javascript
let currentBlobUrls = []; // Blob URL追跡用

function cleanupBlobUrls() {
  for (const url of currentBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('[Component] Failed to revoke blob URL:', url, error);
    }
  }
  currentBlobUrls = [];
}

function createBlobUrl(blob) {
  const url = URL.createObjectURL(blob);
  currentBlobUrls.push(url); // 追跡リストに追加
  return url;
}

// 新しいデータ表示前にクリーンアップ
function displayNewData(data) {
  cleanupBlobUrls(); // 古いURLを解放
  // 新しいデータ処理
}
```

### 5. テスト

**原則:**
- すべてのコード変更後にユニットテストを実行
- UI変更やユーザーインタラクションの変更時はE2Eテストを実行
- マージ前に必ずテストが通過していることを確認

**テストの種類:**

#### ユニットテスト（必須）
```bash
npm test
```
- Jest で実装
- 全17テスト必須通過
- コード変更後は常に実行

#### E2Eテスト（必要に応じて実行）
```bash
# 自動テスト（推奨）
npm run test:e2e:auto

# 手動テスト（30秒間ブラウザ操作可能）
npm run test:e2e
```

**E2Eテスト実行が必要な場合:**
- UI変更（popup, sidepanel HTMLやCSS）
- ユーザーインタラクション（ボタン、フォーム）の追加/変更
- データフロー（抽出、保存、表示、翻訳）に影響する変更
- 拡張機能のコアロジック修正
- 重要なバグ修正
- **判断に迷ったら実行する（安全側に倒す）**

**期待結果:**
- ユニットテスト: 17/17 通過
- E2Eテスト: 5/5 通過（100%成功率）

**実行タイミング:**
- コミット前（推奨）
- PR作成前（推奨）
- マージ前（必須、ただしGitHub Actionsで自動実行されない場合）

---

## アーキテクチャパターン

### 1. メッセージベース通信（推奨）

**原則:**
- コンポーネント間の通信は chrome.runtime.sendMessage を使用
- storage はフォールバックとしてのみ使用
- リアルタイム性が必要な場合は必ずメッセージング

**パターン:**

```javascript
// Sender (popup.js)
async function sendDataToSidePanel(data) {
  try {
    // Primary: Direct message
    await chrome.runtime.sendMessage({
      action: 'displayMarkdown',
      data: data
    });
  } catch (error) {
    // Fallback: Storage
    console.warn('[Sender] Message failed, using storage fallback:', error);
    await chrome.storage.local.set({ viewingArticle: data });
  }
}

// Receiver (sidepanel.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'displayMarkdown') {
    displayMarkdown(request.data);
    sendResponse({ success: true });
  }
});

// Fallback: Check storage on startup
async function init() {
  const { viewingArticle } = await chrome.storage.local.get('viewingArticle');
  if (viewingArticle) {
    displayMarkdown(viewingArticle);
    await chrome.storage.local.remove('viewingArticle');
  }
}
```

**理由:**
- リアルタイム通信が可能
- ストレージの読み書き回数を削減
- データの同期問題を回避

### 2. Primary/Fallback パターン

**原則:**
- 新しいAPI（Primary）と古いAPI（Fallback）を両方サポート
- 機能検出でどちらを使うか判断
- フォールバックでも基本機能は動作すること

**パターン:**

```javascript
async function openSidePanel(tabId) {
  // Primary: Tab-specific API (Chrome 116+)
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        path: 'src/sidepanel/sidepanel.html',
        enabled: true
      });
      await chrome.sidePanel.open({ tabId: tabId });
      return 'primary';
    } catch (error) {
      console.error('[Primary] Failed:', error);
      // Fallback へ
    }
  }

  // Fallback: Window-level API
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.sidePanel.open({ windowId: tab.windowId });
    return 'fallback';
  } catch (error) {
    console.error('[Fallback] Failed:', error);
    throw new Error('Failed to open SidePanel');
  }
}
```

### 3. データ統合パターン

**原則:**
- データは Service Worker で一元管理
- 複数のストアからデータを取得して統合
- 呼び出し側はシンプルなインターフェースでアクセス

**パターン:**

```javascript
// Service Worker (service-worker.js)
async function handleGetArticle(articleId) {
  try {
    // 記事本体を取得
    const article = await storageManager.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // 画像を取得して統合
    const images = await storageManager.getArticleImages(articleId);
    console.log(`[Service Worker] Retrieved ${images.length} images`);

    // 統合したデータを返す
    return { ...article, images };
  } catch (error) {
    console.error('[Service Worker] handleGetArticle failed:', error);
    throw error;
  }
}

// Caller (popup.js)
async function viewArticle(articleId) {
  const response = await chrome.runtime.sendMessage({
    action: 'getArticle',
    articleId: articleId
  });

  // 統合済みデータを受け取る
  const { metadata, markdown, images } = response.article;

  // SidePanelに渡す
  await sendToSidePanel({ metadata, markdown, images });
}
```

**理由:**
- データアクセスロジックの一元化
- 呼び出し側のコードがシンプルに
- テストとメンテナンスが容易

---

## よくある落とし穴と対策

### 1. タイミング問題

**問題:**
```javascript
setTimeout(async () => {
  await chrome.runtime.sendMessage({ action: 'display', data });
}, 500);
window.close(); // メッセージ送信前にクローズされる可能性
```

**対策:**
```javascript
setTimeout(async () => {
  try {
    await chrome.runtime.sendMessage({ action: 'display', data });
  } finally {
    window.close(); // 送信完了を保証
  }
}, 500);
```

**教訓: Issue #26**
- 非同期処理の完了を待つ
- finally で確実にクリーンアップ

### 2. ハードコードされたタイムアウト

**問題:**
```javascript
setTimeout(() => checkStorage(), 100); // なぜ100ms?
```

**対策:**
```javascript
// メッセージベース通信に置き換え
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'dataReady') {
    processData(request.data);
  }
});
```

**教訓: Issue #27**
- タイムアウトはアンチパターン
- イベント駆動アーキテクチャを使用

### 3. 状態管理の重複

**問題:**
```javascript
// Popup と SidePanel で同じデータを storage に保存
await chrome.storage.local.set({ currentArticle: article }); // Popup
await chrome.storage.local.set({ displayingArticle: article }); // SidePanel
```

**対策:**
```javascript
// Service Worker で一元管理
// Popup と SidePanel はメッセージングのみ
await chrome.runtime.sendMessage({
  action: 'setCurrentArticle',
  article: article
});
```

**教訓: Issue #27**
- データの single source of truth を確立
- storage は永続化のみに使用

### 4. メモリリーク

**問題:**
```javascript
function displayImage(blob) {
  const url = URL.createObjectURL(blob);
  imgElement.src = url;
  // URL が解放されない
}
```

**対策:**
```javascript
let currentBlobUrls = [];

function displayImage(blob) {
  const url = URL.createObjectURL(blob);
  currentBlobUrls.push(url);
  imgElement.src = url;
}

function cleanup() {
  currentBlobUrls.forEach(url => URL.revokeObjectURL(url));
  currentBlobUrls = [];
}

// 新しい画像を表示する前にクリーンアップ
function displayNewArticle(article) {
  cleanup();
  // 新しい画像を表示
}
```

**教訓: Issue #25**
- Blob URL は必ず追跡
- 不要になったら即座に解放

### 5. エラーコンテキストの不足

**問題:**
```javascript
catch (error) {
  console.error('Error:', error);
  // どの処理で失敗したか不明
}
```

**対策:**
```javascript
catch (error) {
  console.error('[Component] Operation failed:', {
    operation: 'saveArticle',
    articleId: articleId,
    error: error.message,
    stack: error.stack
  });
  throw new Error(`Failed to save article ${articleId}: ${error.message}`);
}
```

**教訓: 全Issue共通**
- エラーログに十分なコンテキスト
- デバッグしやすいログ形式

---

## 実装テンプレート

### 1. 新規機能追加テンプレート

```javascript
/**
 * [Feature Name]
 *
 * Architecture Decision (Issue #XX):
 * - [Why this feature is needed]
 * - [How it integrates with existing code]
 * - [Any trade-offs or considerations]
 *
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 */
async function newFeature(param) {
  try {
    // Step 1: Validate input
    if (!param) {
      throw new Error('Parameter is required');
    }

    // Step 2: Check API availability
    if (!chrome.someApi) {
      console.warn('[Component] API not available, using fallback');
      return await fallbackApproach(param);
    }

    // Step 3: Main logic
    const result = await chrome.someApi.doSomething(param);

    // Step 4: Return result
    return result;

  } catch (error) {
    console.error('[Component] newFeature failed:', {
      param: param,
      error: error.message
    });
    throw error;
  }
}
```

### 2. バグ修正テンプレート

```javascript
/**
 * [Function Name]
 *
 * Bug Fix (Issue #XX):
 * - Problem: [Description of the bug]
 * - Root Cause: [Why the bug occurred]
 * - Solution: [How the fix resolves it]
 *
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 */
async function fixedFunction(param) {
  try {
    // BEFORE (Bug):
    // await someOperation();
    // window.close(); // Closed before operation completes

    // AFTER (Fix):
    try {
      await someOperation();
    } finally {
      window.close(); // Ensure operation completes first
    }

  } catch (error) {
    console.error('[Component] fixedFunction failed:', error);
    throw error;
  }
}
```

### 3. リファクタリングテンプレート

```javascript
/**
 * [Function Name]
 *
 * Refactoring (Issue #XX):
 * - Previous Approach: [Old implementation description]
 * - New Approach: [New implementation description]
 * - Benefits: [Why the new approach is better]
 *   - Performance: [Performance improvements]
 *   - Maintainability: [Code quality improvements]
 *   - Reliability: [Bug fixes or edge case handling]
 *
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 */
async function refactoredFunction(param) {
  // Old approach (commented for reference):
  // const data = await chrome.storage.local.get('key');
  // setTimeout(() => process(data), 100);

  // New approach:
  return new Promise((resolve) => {
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'dataReady') {
        resolve(request.data);
      }
    });
  });
}
```

---

## プロジェクト固有の設定

### プロジェクト情報

**プロジェクト名**: Webpage to Markdown Extension
**リポジトリ**: `webpage-to-markdown-extention`
**言語**: JavaScript (ES6+)
**プラットフォーム**: Chrome Extensions (Manifest V3)

### 実装フェーズ

#### Phase 1: MVP (完了 ✅)
- manifest.json
- サイドパネルUI (Chrome Side Panel API)
- Content script（Readability + Turndown）
- Popup UI

#### Phase 2: IndexedDB Storage (完了 ✅)
- StorageManager（CRUD操作）
- ImageDownloader（画像オフライン保存）
- Service Worker統合
- Popup UI拡張（記事一覧、View/Delete）

#### Phase 3: ZIP Export（実装可能）
- `getAllArticles()` + JSZip
- Markdown + 画像をZIP形式でエクスポート

#### Phase 4: AI Translation（実装可能）
- Anthropic API統合
- 原文と翻訳の両方保存
- カスタム翻訳プロンプト

### 外部ライブラリ

#### 1. Mozilla Readability
**URL**: https://raw.githubusercontent.com/mozilla/readability/main/Readability.js
**保存先**: `src/lib/Readability.js`

```bash
curl -o src/lib/Readability.js https://raw.githubusercontent.com/mozilla/readability/main/Readability.js
```

#### 2. Turndown.js
**URL**: https://unpkg.com/turndown@7.1.2/dist/turndown.js
**保存先**: `src/lib/turndown.js`

```bash
curl -o src/lib/turndown.js https://unpkg.com/turndown@7.1.2/dist/turndown.js
```

#### 3. JSZip
**URL**: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
**保存先**: `src/lib/jszip.min.js`

```bash
curl -o src/lib/jszip.min.js https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
```

### 翻訳機能の要件（Phase 4）

#### 必須機能
1. **翻訳ON/OFFスイッチ**: 設定画面とポップアップUIに配置、デフォルトはOFF
2. **原文と翻訳の両方保存**: IndexedDBで管理、UI上で切り替え可能
3. **APIキー設定**: Chrome Storage Syncに安全に保存、パスワード形式で表示
4. **カスタム翻訳プロンプト**: デフォルトプロンプト提供、設定画面で編集可能

#### デフォルト翻訳プロンプト

```
以下のMarkdown形式のテキストを日本語に翻訳してください。

要件:
- Markdown記法はそのまま保持してください
- 見出し、リスト、コードブロック、リンクなどのフォーマットを維持してください
- 自然で読みやすい日本語に翻訳してください
- 技術用語は適切に日本語化してください（例: "function" → "関数"）
- URLやリンクは変更しないでください
- 画像の参照パス（例: ./images/xxx.jpg）は変更しないでください
- コードブロック内のコードは翻訳しないでください

翻訳対象テキスト:
{content}
```

### セキュリティチェックリスト

- [ ] APIキーはChrome Storage Syncに暗号化保存
- [ ] ユーザー入力は必ずサニタイズ
- [ ] `innerHTML` の代わりに `textContent` を使用（XSS対策）
- [ ] Content Security Policyに準拠（インラインスクリプト禁止）
- [ ] 外部リソース読み込み時のHTTPSチェック

### Chrome Side Panel API の重要ポイント

#### manifest.json設定
```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "src/sidepanel/sidepanel.html"
  }
}
```

#### タブ固有SidePanel（Issue #24）
```javascript
// Chrome 116+ でタブごとに独立したSidePanelを設定
await chrome.sidePanel.setOptions({
  tabId: tab.id,
  path: 'src/sidepanel/sidepanel.html',
  enabled: true
});
await chrome.sidePanel.open({ tabId: tab.id });
```

### Service Worker モジュール読み込み

**正しい方法:**
```javascript
/* global importScripts, storageManager, imageDownloader */
importScripts('../storage/storage-manager.js', '../storage/image-downloader.js');
```

**間違った方法:**
```javascript
// ❌ Service Workerでは使えない
import { storageManager } from './storage-manager.js';
```

### ブランチ命名規則（重要！）

**必須フォーマット:**
```
claude/<feature-name>-<sessionID>
```

**例:**
- ✅ `claude/phase2-storage-DYKEg`
- ✅ `claude/enable-clickable-links-sidepanel-DYKEg`
- ❌ `feature/phase2-storage` （プッシュ時403エラー）

**理由:**
- GitHubのブランチ保護ルールが`claude/`プレフィックスを要求
- セッションID サフィックスでセッション識別

### パフォーマンス最適化

#### 画像処理
- 並列ダウンロード数: 最大5
- タイムアウト: 10秒/画像
- サイズ制限: 10MB/画像（超えた場合は警告）

#### 翻訳API
- レート制限: セクション間500ms待機
- リトライ: 失敗時に3回まで再試行
- タイムアウト: 30秒/リクエスト

#### IndexedDB
- トランザクションのバッチ処理
- インデックスの最適化（url, timestamp）
- 大量データは`cursor`使用

---

## まとめ

本ドキュメントで定義した開発ワークフローとベストプラクティスに従うことで、以下が実現できます:

✅ **高品質なコード**: 一貫した品質基準とレビュープロセス
✅ **効率的な開発**: 並列開発とロール分担による生産性向上
✅ **保守性の向上**: 詳細なドキュメントと明確なアーキテクチャ
✅ **バグの早期発見**: 段階的レビューとテストプロセス
✅ **知見の蓄積**: 実装パターンと落とし穴の文書化

### 継続的改善

このドキュメントは、プロジェクトの進化とともに更新されます:
- 新しいパターンの追加
- 落とし穴の事例追加
- テンプレートの改善

#### 学びの記録ルール

**AGENTS.mdへの記録:**
- 失敗から学んだこと
- 次回以降の自律実行に活かせる知見
- ユーザーフィードバックから得られた洞察
- UI/UXの判断基準

**記録の基準:**
- ✅ **記録する**: 新しい学び、重要な判断基準、頻繁に発生する問題
- ❌ **記録しない**: 既にドキュメント化されている内容、一度限りの特殊ケース
- 📝 **更新する**: 既存の学びに新しい視点や事例を追加

**記録のタイミング:**
- Issue/PR完了後
- 重要な技術的判断の後
- ユーザーフィードバック受領後

**記録フォーマット:**
```markdown
## [カテゴリ] - [タイトル]

**学んだこと:**
- [具体的な学び]

**次回への活かし方:**
- [実践的なアクション]

**関連Issue/PR:**
- Issue #XX, PR #YY
```

---

**最終更新**: 2026-02-13
**バージョン**: 0.2.0 (Issue #58 - claude.md統合)
