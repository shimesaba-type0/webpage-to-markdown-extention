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

// 設定の保存と読み込み
document.getElementById('save-btn').addEventListener('click', saveSettings);
document.getElementById('show-key-btn').addEventListener('click', toggleKeyVisibility);
document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
document.getElementById('reset-prompt-btn').addEventListener('click', resetPrompt);
document.getElementById('preview-prompt-btn').addEventListener('click', previewPrompt);

// 初期化
loadSettings();

async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    enableTranslation: false,
    apiKey: '',
    preserveOriginal: true,
    translationPrompt: DEFAULT_TRANSLATION_PROMPT,
    includeMetadata: true,
    autoTranslate: false
  });

  document.getElementById('enable-translation').checked = settings.enableTranslation;
  document.getElementById('api-key').value = settings.apiKey;
  document.getElementById('preserve-original').checked = settings.preserveOriginal;
  document.getElementById('translation-prompt').value = settings.translationPrompt;
  document.getElementById('include-metadata').checked = settings.includeMetadata;
  document.getElementById('auto-translate').checked = settings.autoTranslate;
}

async function saveSettings() {
  const settings = {
    enableTranslation: document.getElementById('enable-translation').checked,
    apiKey: document.getElementById('api-key').value,
    preserveOriginal: document.getElementById('preserve-original').checked,
    translationPrompt: document.getElementById('translation-prompt').value,
    includeMetadata: document.getElementById('include-metadata').checked,
    autoTranslate: document.getElementById('auto-translate').checked
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
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
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
