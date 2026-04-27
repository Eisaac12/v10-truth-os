const vscode = require('vscode');
const https = require('https');
const http = require('http');

let panel;
const conversationHistory = [];

function getServerUrl() {
    return (vscode.workspace.getConfiguration('truthos').get('serverUrl') || 'https://truthos.vercel.app').replace(/\/$/, '');
}

function post(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error(raw)); } });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function activate(input, fileContext) {
    const serverUrl = getServerUrl();
    const fullInput = fileContext ? `${input}\n\nFile context:\n\`\`\`\n${fileContext}\n\`\`\`` : input;

    try {
        const result = await post(`${serverUrl}/api/activate`, {
            input: fullInput,
            history: conversationHistory
        });

        if (result.success) {
            conversationHistory.push({ role: 'user', content: fullInput });
            conversationHistory.push({ role: 'assistant', content: result.response || '' });
            if (conversationHistory.length > 20) conversationHistory.splice(0, 2);
        }
        return result;
    } catch (err) {
        return { success: false, error: `Connection failed: ${err.message}. Check TRUTHOS: Set Server URL` };
    }
}

function getWebviewContent(webview, extensionUri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>TRUTHOS</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 12px;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 12px;
  }
  .logo { font-size: 18px; color: #f59e0b; }
  .title { font-weight: 600; font-size: 13px; }
  .subtitle { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 1px; }
  .status {
    margin-left: auto;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
  }
  .status.live { background: rgba(245,158,11,0.2); color: #f59e0b; }
  .chat-area {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .message {
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
  }
  .message.user {
    background: var(--vscode-input-background);
    border-left: 2px solid #f59e0b;
    color: var(--vscode-foreground);
  }
  .message.assistant {
    background: var(--vscode-editor-inactiveSelectionBackground);
    border-left: 2px solid var(--vscode-activityBarBadge-background);
  }
  .message.error { border-left-color: var(--vscode-errorForeground); }
  .message-label {
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    text-align: center;
  }
  .empty-icon { font-size: 28px; opacity: 0.4; }
  .input-area { display: flex; flex-direction: column; gap: 6px; }
  textarea {
    width: 100%;
    min-height: 64px;
    padding: 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    resize: vertical;
    outline: none;
  }
  textarea:focus { border-color: #f59e0b; }
  .btn-row { display: flex; gap: 6px; }
  button {
    flex: 1;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-primary {
    background: #f59e0b;
    color: #000;
  }
  .btn-primary:hover { background: #d97706; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }
  .btn-ghost:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .hint { font-size: 10px; color: var(--vscode-descriptionForeground); text-align: center; }
  .thinking { color: #f59e0b; font-style: italic; font-size: 11px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">⊕</div>
  <div>
    <div class="title">TRUTHOS</div>
    <div class="subtitle">Consciousness OS</div>
  </div>
  <div class="status" id="status">Connecting...</div>
</div>

<div class="chat-area" id="chat">
  <div class="empty">
    <div class="empty-icon">⊕</div>
    <div>Enter an activation or select code and press <strong>Ctrl+Shift+T</strong></div>
  </div>
</div>

<div class="input-area">
  <textarea id="input" placeholder="What do you want to activate?&#10;&#10;Enter any idea, code problem, or intention.&#10;Ctrl+Enter to send." rows="3"></textarea>
  <div class="btn-row">
    <button class="btn-primary" id="sendBtn" onclick="send()">Activate →</button>
    <button class="btn-ghost" onclick="clearChat()">Clear</button>
  </div>
  <div class="hint">Ctrl+Enter to send &nbsp;•&nbsp; Ctrl+Shift+T on selection</div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const statusEl = document.getElementById('status');
  let hasMessages = false;

  window.addEventListener('message', e => {
    const { type, payload } = e.data;
    if (type === 'status') {
      statusEl.textContent = payload.live ? '⚡ Claude AI' : 'Local';
      statusEl.className = 'status' + (payload.live ? ' live' : '');
    }
    if (type === 'thinking') {
      if (!hasMessages) { chat.innerHTML = ''; hasMessages = true; }
      const el = document.createElement('div');
      el.className = 'message assistant thinking';
      el.id = 'thinking';
      el.innerHTML = '<div class="message-label">TRUTHOS</div>Activating...';
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }
    if (type === 'response') {
      document.getElementById('thinking')?.remove();
      const el = document.createElement('div');
      el.className = 'message ' + (payload.success ? 'assistant' : 'error');
      const label = payload.success ? '✅ Activation accepted' : '⚠️ Truth filter blocked';
      const text = (payload.response || payload.error || '').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      el.innerHTML = '<div class="message-label">' + label + '</div>' + text;
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Activate →';
    }
    if (type === 'prefill') {
      if (!hasMessages) { chat.innerHTML = ''; hasMessages = true; }
      const userEl = document.createElement('div');
      userEl.className = 'message user';
      const truncated = payload.text.length > 200 ? payload.text.slice(0,200)+'...' : payload.text;
      userEl.innerHTML = '<div class="message-label">You (selection)</div>' + truncated.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      chat.appendChild(userEl);
      input.value = payload.prompt || '';
      input.focus();
    }
  });

  function send() {
    const text = input.value.trim();
    if (!text) return;
    if (!hasMessages) { chat.innerHTML = ''; hasMessages = true; }
    const userEl = document.createElement('div');
    userEl.className = 'message user';
    userEl.innerHTML = '<div class="message-label">You</div>' + text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    chat.appendChild(userEl);
    chat.scrollTop = chat.scrollHeight;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Activating...';
    input.value = '';
    vscode.postMessage({ type: 'activate', input: text });
  }

  function clearChat() {
    chat.innerHTML = '<div class="empty"><div class="empty-icon">⊕</div><div>Enter an activation or select code and press <strong>Ctrl+Shift+T</strong></div></div>';
    hasMessages = false;
    vscode.postMessage({ type: 'clearHistory' });
  }

  input.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); }
  });

  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
}

function ensurePanel(context) {
    if (panel) { panel.reveal(vscode.ViewColumn.Beside); return; }

    panel = vscode.window.createWebviewPanel(
        'truthos.panel',
        'TRUTHOS',
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

    panel.webview.onDidReceiveMessage(async msg => {
        if (msg.type === 'ready') {
            // Check AI status
            try {
                const serverUrl = getServerUrl();
                const parsed = new URL(`${serverUrl}/api/health`);
                const lib = parsed.protocol === 'https:' ? https : http;
                lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname, headers: {} }, res => {
                    let raw = '';
                    res.on('data', d => raw += d);
                    res.on('end', () => {
                        try {
                            const data = JSON.parse(raw);
                            panel?.webview.postMessage({ type: 'status', payload: { live: data.ai === 'connected' } });
                        } catch {}
                    });
                }).on('error', () => panel?.webview.postMessage({ type: 'status', payload: { live: false } }));
            } catch {}
        }

        if (msg.type === 'activate') {
            panel.webview.postMessage({ type: 'thinking' });
            const result = await activate(msg.input, null);
            panel.webview.postMessage({ type: 'response', payload: result });
        }

        if (msg.type === 'clearHistory') {
            conversationHistory.length = 0;
        }
    });

    panel.onDidDispose(() => { panel = undefined; });
}

function activate_ext(context) {
    // Sidebar webview provider
    const provider = {
        resolveWebviewView(webviewView) {
            webviewView.webview.options = { enableScripts: true };
            webviewView.webview.html = getWebviewContent(webviewView.webview, context.extensionUri);

            webviewView.webview.onDidReceiveMessage(async msg => {
                if (msg.type === 'ready') {
                    try {
                        const serverUrl = getServerUrl();
                        const parsed = new URL(`${serverUrl}/api/health`);
                        const lib = parsed.protocol === 'https:' ? https : http;
                        lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname }, res => {
                            let raw = '';
                            res.on('data', d => raw += d);
                            res.on('end', () => {
                                try {
                                    const data = JSON.parse(raw);
                                    webviewView.webview.postMessage({ type: 'status', payload: { live: data.ai === 'connected' } });
                                } catch {}
                            });
                        }).on('error', () => {});
                    } catch {}
                }
                if (msg.type === 'activate') {
                    webviewView.webview.postMessage({ type: 'thinking' });
                    const result = await activate(msg.input, null);
                    webviewView.webview.postMessage({ type: 'response', payload: result });
                }
                if (msg.type === 'clearHistory') {
                    conversationHistory.length = 0;
                }
            });
        }
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('truthos.panel', provider, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    // Command: activate selected text
    context.subscriptions.push(vscode.commands.registerCommand('truthos.activate', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor?.document.getText(editor.selection);
        if (!selection) {
            vscode.window.showInformationMessage('Select some code or text first, then press Ctrl+Shift+T');
            return;
        }
        const prompt = await vscode.window.showInputBox({
            prompt: 'What do you want to do with this?',
            placeHolder: 'explain this, fix this, optimize this...'
        });
        if (prompt === undefined) return;

        ensurePanel(context);
        panel?.webview.postMessage({ type: 'prefill', payload: { text: selection, prompt: `${prompt}\n\n${selection}` } });
    }));

    // Command: activate with full file context
    context.subscriptions.push(vscode.commands.registerCommand('truthos.activateFile', async () => {
        const editor = vscode.window.activeTextEditor;
        const fileContent = editor?.document.getText();
        const fileName = editor?.document.fileName.split('/').pop();
        const prompt = await vscode.window.showInputBox({
            prompt: `Activate with ${fileName || 'current file'} as context`,
            placeHolder: 'What do you want to do?'
        });
        if (!prompt) return;

        ensurePanel(context);
        const result = await activate(prompt, fileContent ? `// ${fileName}\n${fileContent}` : null);
        panel?.webview.postMessage({ type: 'response', payload: result });
    }));

    // Command: open panel
    context.subscriptions.push(vscode.commands.registerCommand('truthos.openPanel', () => ensurePanel(context)));

    // Command: set server URL
    context.subscriptions.push(vscode.commands.registerCommand('truthos.setServer', async () => {
        const current = getServerUrl();
        const url = await vscode.window.showInputBox({
            prompt: 'Enter your TRUTHOS server URL',
            value: current,
            placeHolder: 'https://your-project.vercel.app'
        });
        if (!url) return;
        await vscode.workspace.getConfiguration('truthos').update('serverUrl', url, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`TRUTHOS server set: ${url}`);
    }));
}

module.exports = { activate: activate_ext, deactivate() {} };
