// デフォルトコピーテンプレート
const DEFAULT_COPY_TEMPLATES = [
  { id: 'tmpl-summarize', name: '要約 / Summarize', prompt: '以下の記事を日本語で3行に要約してください：' },
  { id: 'tmpl-keypoints', name: '重要点 / Key Points', prompt: '以下の記事の重要なポイントを箇条書きで抽出してください：' },
  { id: 'tmpl-translate', name: '翻訳依頼 / Translate', prompt: '以下の記事を日本語に翻訳してください。Markdown記法は維持してください：' }
];

// デフォルト翻訳プロンプト
const DEFAULT_TRANSLATION_PROMPT = `以下のMarkdown形式のテキストを日本語に翻訳してください。

要件:
- Markdown記法はそのまま保持してください
- 見出し、リスト、コードブロック、リンクなどのフォーマットを維持してください
- 自然で読みやすい日本語に翻訳してください
- 技術用語は適切に日本語化してください（例: "function" → "関数"）
- URLやリンクは変更しないでください
- 画像の参照パス（例: ./images/xxx.jpg）は変更しないでください
- コードブロック内のコードは翻訳しないでください

翻訳対象テキスト:
{content}`;

const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022';

// 設定の保存と読み込み
document.getElementById('save-btn').addEventListener('click', saveSettings);
document.getElementById('show-key-btn').addEventListener('click', toggleKeyVisibility);
document.getElementById('show-gemini-key-btn').addEventListener('click', toggleGeminiKeyVisibility);
document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
document.getElementById('reset-prompt-btn').addEventListener('click', resetPrompt);
document.getElementById('preview-prompt-btn').addEventListener('click', previewPrompt);
document.getElementById('reset-usage-btn').addEventListener('click', resetUsageStats);
// テンプレート管理の初期化
chrome.storage.sync.get({ copyTemplates: DEFAULT_COPY_TEMPLATES }, (data) => {
  renderTemplateList(data.copyTemplates);
});
document.getElementById('add-template-btn').addEventListener('click', () => showTemplateEditor());
document.getElementById('save-template-btn').addEventListener('click', saveTemplate);
document.getElementById('cancel-template-btn').addEventListener('click', hideTemplateEditor);

// 初期化
loadSettings();
loadUsageStats();

async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    enableTranslation: false,
    translationProvider: 'anthropic',
    apiKey: '',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    translationPrompt: DEFAULT_TRANSLATION_PROMPT,
    includeMetadata: true,
    autoTranslate: false,
    downloadImages: false,  // Issue #38: Default to disabled for user consent
    translationModel: DEFAULT_ANTHROPIC_MODEL,  // Issue #99: Default model
    maxOutputTokens: 4096  // Issue #130: Default max output tokens
    // preserveOriginal removed (Issue #138): original is always preserved
  });

  document.getElementById('enable-translation').checked = settings.enableTranslation;
  document.getElementById('translation-provider').value = settings.translationProvider;
  document.getElementById('api-key').value = settings.apiKey;
  document.getElementById('translation-model').value = settings.translationModel;
  document.getElementById('gemini-api-key').value = settings.geminiApiKey;
  document.getElementById('gemini-model').value = settings.geminiModel;
  document.getElementById('translation-prompt').value = settings.translationPrompt;
  document.getElementById('include-metadata').checked = settings.includeMetadata;
  document.getElementById('auto-translate').checked = settings.autoTranslate;
  document.getElementById('download-images').checked = settings.downloadImages;
  document.getElementById('max-output-tokens').value = settings.maxOutputTokens;
}

async function saveSettings() {
  const settings = {
    enableTranslation: document.getElementById('enable-translation').checked,
    translationProvider: document.getElementById('translation-provider').value,
    apiKey: document.getElementById('api-key').value,
    geminiApiKey: document.getElementById('gemini-api-key').value,
    geminiModel: document.getElementById('gemini-model').value,
    translationPrompt: document.getElementById('translation-prompt').value,
    includeMetadata: document.getElementById('include-metadata').checked,
    autoTranslate: document.getElementById('auto-translate').checked,
    downloadImages: document.getElementById('download-images').checked,  // Issue #38
    translationModel: document.getElementById('translation-model').value,  // Issue #99
    maxOutputTokens: parseInt(document.getElementById('max-output-tokens').value, 10) || 4096  // Issue #130
  };

  await chrome.storage.sync.set(settings);

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Settings saved!';
  statusEl.className = 'success';

  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

function toggleKeyVisibility() {
  const input = document.getElementById('api-key');
  const btn = document.getElementById('show-key-btn');

  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = 'Hide <span class="lang-ja">/ 非表示</span>';
  } else {
    input.type = 'password';
    btn.innerHTML = 'Show <span class="lang-ja">/ 表示</span>';
  }
}

function toggleGeminiKeyVisibility() {
  const input = document.getElementById('gemini-api-key');
  const btn = document.getElementById('show-gemini-key-btn');

  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = 'Hide <span class="lang-ja">/ 非表示</span>';
  } else {
    input.type = 'password';
    btn.innerHTML = 'Show <span class="lang-ja">/ 表示</span>';
  }
}

function resetPrompt() {
  document.getElementById('translation-prompt').value = DEFAULT_TRANSLATION_PROMPT;

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Prompt reset to default.';
  statusEl.className = 'info';

  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

function previewPrompt() {
  const prompt = document.getElementById('translation-prompt').value;
  const sampleContent = '# Sample Heading\\n\\nThis is a sample paragraph.';
  const previewText = prompt.replace('{content}', sampleContent);

  alert('Preview of prompt that will be sent to API:\\n\\n' + previewText);
}

// --- Copy Template Management ---

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

function renderTemplateList(templates) {
  const list = document.getElementById('template-list');
  if (!list) return;
  list.innerHTML = '';

  if (!templates || templates.length === 0) {
    list.innerHTML = '<p class="help-text">No templates yet. / テンプレートがありません。</p>';
    return;
  }

  templates.forEach(tmpl => {
    const item = document.createElement('div');
    item.className = 'template-item';
    const preview = tmpl.prompt.length > 60 ? tmpl.prompt.substring(0, 60) + '...' : tmpl.prompt;
    item.innerHTML = `
      <div class="template-info">
        <span class="template-name">${escapeHtml(tmpl.name)}</span>
        <span class="template-prompt-preview">${escapeHtml(preview)}</span>
      </div>
      <div class="template-actions">
        <button class="btn btn-small edit-btn" data-id="${tmpl.id}">Edit / 編集</button>
        <button class="btn btn-small btn-danger delete-btn" data-id="${tmpl.id}">Delete / 削除</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => editTemplate(btn.dataset.id))
  );
  list.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteTemplate(btn.dataset.id))
  );
}

function showTemplateEditor(id = null, name = '', prompt = '') {
  document.getElementById('editing-template-id').value = id || '';
  document.getElementById('template-name-input').value = name;
  document.getElementById('template-prompt-input').value = prompt;
  document.getElementById('template-editor').style.display = 'block';
  document.getElementById('add-template-btn').style.display = 'none';
}

function hideTemplateEditor() {
  document.getElementById('template-editor').style.display = 'none';
  document.getElementById('add-template-btn').style.display = 'inline-flex';
}

function editTemplate(id) {
  chrome.storage.sync.get({ copyTemplates: DEFAULT_COPY_TEMPLATES }, (data) => {
    const tmpl = data.copyTemplates.find(t => t.id === id);
    if (tmpl) showTemplateEditor(tmpl.id, tmpl.name, tmpl.prompt);
  });
}

function deleteTemplate(id) {
  if (!confirm('Delete this template? / このテンプレートを削除しますか？')) return;
  chrome.storage.sync.get({ copyTemplates: DEFAULT_COPY_TEMPLATES }, (data) => {
    const updated = data.copyTemplates.filter(t => t.id !== id);
    chrome.storage.sync.set({ copyTemplates: updated }, () => {
      renderTemplateList(updated);
      showStatus('Template deleted. / テンプレートを削除しました。');
    });
  });
}

function saveTemplate() {
  const id = document.getElementById('editing-template-id').value;
  const name = document.getElementById('template-name-input').value.trim();
  const prompt = document.getElementById('template-prompt-input').value.trim();

  if (!name || !prompt) {
    showStatus('Please fill in all fields. / すべての項目を入力してください。', 'error');
    return;
  }

  chrome.storage.sync.get({ copyTemplates: DEFAULT_COPY_TEMPLATES }, (data) => {
    let templates = data.copyTemplates;
    if (id) {
      templates = templates.map(t => t.id === id ? { ...t, name, prompt } : t);
    } else {
      templates = [...templates, { id: 'tmpl-' + Date.now(), name, prompt }];
    }
    chrome.storage.sync.set({ copyTemplates: templates }, () => {
      renderTemplateList(templates);
      hideTemplateEditor();
      showStatus('Template saved. / テンプレートを保存しました。');
    });
  });
}

/**
 * Load and display cumulative token usage statistics (Issue #129)
 */
async function loadUsageStats() {
  const { tokenUsage = {} } = await chrome.storage.local.get('tokenUsage');

  const inputEl = document.getElementById('stat-input-tokens');
  const outputEl = document.getElementById('stat-output-tokens');
  const costEl = document.getElementById('stat-cost');
  const updatedEl = document.getElementById('stat-last-updated');

  if (!tokenUsage.lastUpdated) {
    inputEl.textContent = '0';
    outputEl.textContent = '0';
    costEl.textContent = '$0.000000';
    updatedEl.textContent = 'No data yet / データなし';
    return;
  }

  inputEl.textContent = (tokenUsage.totalInputTokens || 0).toLocaleString();
  outputEl.textContent = (tokenUsage.totalOutputTokens || 0).toLocaleString();
  costEl.textContent = `$${(tokenUsage.estimatedCostUSD || 0).toFixed(6)}`;
  updatedEl.textContent = new Date(tokenUsage.lastUpdated).toLocaleString();
}

/**
 * Reset cumulative usage statistics (Issue #129)
 */
async function resetUsageStats() {
  if (!confirm('Reset all translation usage statistics? / 翻訳使用統計をリセットしますか？')) return;
  await chrome.storage.local.remove('tokenUsage');
  await loadUsageStats();
  showStatus('Usage statistics reset. / 使用統計をリセットしました。');
}

async function clearAllData() {
  if (!confirm('Are you sure you want to delete all saved articles? This cannot be undone.')) {
    return;
  }

  // IndexedDBをクリア
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('WebpageToMarkdownDB');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'All data cleared!';
  statusEl.className = 'success';
}
