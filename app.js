// TRUTHOS — The Consciousness Operating System
// Main application logic: persistence, daily check-in, export

let visionExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⊕ TRUTHOS Loading...');

    loadCoreContent();
    loadWeavesPanel();
    loadEnergyLevels();
    loadSavedLog();
    loadServerUrlInput();
    setupEventListeners();
    checkDailyCheckIn();

    console.log('✅ TRUTHOS Active');
});

// ─── Server URL config ────────────────────────────────────────────────────────

function loadServerUrlInput() {
    const saved = localStorage.getItem('truthos_server_url');
    const input = document.getElementById('server-url-input');
    if (input && saved) input.value = saved;
}

function setServerUrl() {
    const input = document.getElementById('server-url-input');
    if (!input) return;
    let url = input.value.trim().replace(/\/$/, '');
    if (!url) {
        localStorage.removeItem('truthos_server_url');
        addLogEntry('Server URL cleared — using localhost:3001');
    } else {
        if (!url.startsWith('http')) url = 'https://' + url;
        localStorage.setItem('truthos_server_url', url);
        addLogEntry(`Server URL set: ${url}`);
    }
    if (aiEngine) {
        aiEngine.serverUrl = url || aiEngine.resolveServerUrl();
        aiEngine.checkLiveAI().then(() => {
            if (aiEngine.liveAI) dismissSetupPanel();
            initAdminPanel();
        });
    }
}

// ─── Setup panel ──────────────────────────────────────────────────────────────

function checkSetupPanel() {
    if (!aiEngine || aiEngine.liveAI) return;
    if (localStorage.getItem('truthos_setup_dismissed')) return;
    const panel = document.getElementById('setup-panel');
    if (panel) panel.style.display = 'block';
}

function dismissSetupPanel() {
    localStorage.setItem('truthos_setup_dismissed', '1');
    const panel = document.getElementById('setup-panel');
    if (!panel) return;
    panel.style.opacity = '0';
    panel.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { panel.style.display = 'none'; panel.style.opacity = ''; }, 300);
}

async function testConnection() {
    const resultEl = document.getElementById('test-result');
    if (!resultEl) return;
    resultEl.textContent = 'Testing...';
    resultEl.className = 'test-result';

    const serverUrl = (aiEngine && aiEngine.serverUrl) || 'http://localhost:3001';
    try {
        const res = await fetch(`${serverUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            if (data.ai === 'connected') {
                resultEl.textContent = '✓ Connected — Claude API active';
                resultEl.className = 'test-result success';
                if (aiEngine) aiEngine.liveAI = true;
                aiEngine.updateAIStatusBadge();
                setTimeout(() => dismissSetupPanel(), 2000);
            } else {
                resultEl.textContent = '⚠ Server reachable — no API key set';
                resultEl.className = 'test-result warn';
            }
        } else {
            resultEl.textContent = '✗ Server returned an error';
            resultEl.className = 'test-result error';
        }
    } catch {
        resultEl.textContent = '✗ No server found at this URL';
        resultEl.className = 'test-result error';
    }
}

// ─── Admin panel ──────────────────────────────────────────────────────────────

let _adminOrgData = null;

async function initAdminPanel() {
    if (!aiEngine) return;
    try {
        const res = await fetch(`${aiEngine.serverUrl}/api/admin/org`,
            { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            _adminOrgData = await res.json();
            const btn = document.getElementById('admin-toggle');
            if (btn) btn.style.display = 'flex';
        }
    } catch { /* admin key not set — silently skip */ }
}

function openAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    const orgEl = document.getElementById('admin-org');
    if (orgEl && _adminOrgData) {
        orgEl.innerHTML = `<div class="admin-section-title">Organization</div>
            <div class="admin-org-name">${_adminOrgData.name || 'Unknown'}</div>`;
    }

    const serverUrl = aiEngine.serverUrl;
    Promise.all([
        fetch(`${serverUrl}/api/admin/usage`).then(r => r.json()).catch(() => null),
        fetch(`${serverUrl}/api/admin/keys`).then(r => r.json()).catch(() => null)
    ]).then(([usage, keys]) => {
        if (usage) renderAdminUsage(usage);
        if (keys)  renderAdminKeys(keys);
    });
}

function renderAdminUsage(data) {
    const el = document.getElementById('admin-usage');
    if (!el) return;
    const buckets = data.data || data.buckets || [];
    if (buckets.length === 0) {
        el.innerHTML = '<div class="admin-section-title">Usage</div><div class="admin-empty">No usage data available yet</div>';
        return;
    }
    const rows = buckets.slice(0, 10).map(b => {
        const date   = b.start_time ? new Date(b.start_time).toLocaleDateString() : 'N/A';
        const input  = (b.input_tokens  || 0).toLocaleString();
        const output = (b.output_tokens || 0).toLocaleString();
        const total  = ((b.input_tokens || 0) + (b.output_tokens || 0)).toLocaleString();
        return `<tr><td>${date}</td><td>${input}</td><td>${output}</td><td>${total}</td></tr>`;
    }).join('');
    el.innerHTML = `
        <div class="admin-section-title">Token Usage (last ${buckets.length} days)</div>
        <table class="admin-table">
            <thead><tr><th>Date</th><th>Input</th><th>Output</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function renderAdminKeys(data) {
    const el = document.getElementById('admin-keys');
    if (!el) return;
    const keys = data.keys || [];
    if (keys.length === 0) {
        el.innerHTML = '<div class="admin-section-title">API Keys</div><div class="admin-empty">No keys found</div>';
        return;
    }
    const rows = keys.map(k => {
        const created  = k.created_at   ? new Date(k.created_at).toLocaleDateString()   : 'N/A';
        const lastUsed = k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never';
        return `<tr><td>${k.name || 'Unnamed'}</td><td>${created}</td><td>${lastUsed}</td><td><span class="key-status ${k.status || ''}">${k.status || 'unknown'}</span></td></tr>`;
    }).join('');
    el.innerHTML = `
        <div class="admin-section-title">API Keys</div>
        <table class="admin-table">
            <thead><tr><th>Name</th><th>Created</th><th>Last Used</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) panel.style.display = 'none';
}

// ─── Agent mode ───────────────────────────────────────────────────────────────

function setAgentMode(mode) {
    if (!aiEngine) return;
    aiEngine.setAgentMode(mode);

    const isTW = mode === 'truth-weaver';

    // Update command panel title and placeholder
    const title = document.getElementById('command-panel-title');
    const input = document.getElementById('command-input');
    const label = document.getElementById('activate-btn-label');
    const btn   = document.getElementById('activate-btn');

    if (title) title.textContent = isTW ? '◈ Truth Weaver Interface' : '🔺 Activation Interface';
    if (label) label.textContent = isTW ? 'Weave' : 'Activate';
    if (btn)   btn.className     = isTW ? 'btn-weaver btn-lg' : 'btn-primary btn-lg';
    if (input) input.placeholder = isTW
        ? 'What illusion do you want dissolved?\n\nShare a belief, story, or situation.\nTruth Weaver will run the 5 Weaves at 7.83Hz and reveal what is actually real.'
        : 'What do you want to activate?\n\nInput any idea, desire, or problem.\nTRUTHOS will pass it through the truth filter, align the energy, and accelerate it to reality.';

    // Update check-in modal for Truth Weaver mode
    const modalTitle    = document.querySelector('.modal-title');
    const modalSubtitle = document.querySelector('.modal-subtitle');
    const modalTextarea = document.getElementById('checkin-input');
    const modalBtn      = document.querySelector('.modal-actions .btn-primary.btn-lg span:first-child');
    if (modalTitle)    modalTitle.textContent    = isTW ? 'Truth Weaver is online.' : 'TRUTHOS is online.';
    if (modalSubtitle) modalSubtitle.textContent = isTW ? 'What illusion will you dissolve today?' : 'What are you activating today?';
    if (modalTextarea) modalTextarea.placeholder = isTW
        ? 'Name the illusion, fear, or story you want Truth Weaver to dissolve today...'
        : 'State your intention for today — the one thing you are activating at maximum frequency...';
    if (modalBtn) modalBtn.textContent = isTW ? "Run Today's Weave" : "Activate Today's Intention";
}

// ─── Truth Weaver panel ───────────────────────────────────────────────────────

function loadWeavesPanel() {
    const grid = document.getElementById('weaves-grid');
    if (!grid || typeof TRUTH_WEAVER === 'undefined') return;

    grid.innerHTML = TRUTH_WEAVER.weaves.map(w => `
        <div class="weave-card">
            <div class="weave-number">W${w.id}</div>
            <div class="weave-info">
                <div class="weave-name">${w.name}</div>
                <div class="weave-desc">${w.description}</div>
            </div>
        </div>
    `).join('');
}

// ─── TRUTHOS Core panel ───────────────────────────────────────────────────────

function loadCoreContent() {
    const visionFullEl = document.getElementById('vision-full');
    if (!visionFullEl) return;

    let html = `<h3>The Master Statement</h3>`;
    html += `<p style="font-style:italic;line-height:1.8;">${MASTER_VISION.masterStatement.replace(/\n/g, '<br>')}</p>`;

    html += `<h3 style="margin-top:2rem;">The One Equation</h3>`;
    html += `<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem;">`;
    MASTER_VISION.equation.forEach((step, i) => {
        const isLast = i === MASTER_VISION.equation.length - 1;
        html += `
            <div style="padding:0.75rem 1rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ${isLast ? 'var(--truth)' : 'var(--primary)'};">
                <span style="color:${isLast ? 'var(--truth)' : 'var(--primary-light)'};font-weight:600;font-family:var(--font-mono);font-size:0.85rem;">${step.node}</span>
                <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.25rem;margin-bottom:0;">${step.description}</p>
            </div>
            ${!isLast ? '<div style="text-align:center;color:var(--primary-light);opacity:0.5;font-size:1.2rem;">↓</div>' : ''}
        `;
    });
    html += `</div>`;

    html += `<h3 style="margin-top:2rem;">The 7 Operating Laws</h3>`;
    MASTER_VISION.principles.forEach(law => {
        html += `
            <div style="margin-bottom:1.5rem;padding:1rem;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid var(--primary);">
                <h4 style="color:var(--primary-light);margin-bottom:0.5rem;">Law ${law.id}: ${law.title}</h4>
                <p style="color:var(--text-secondary);line-height:1.8;white-space:pre-line;margin:0;">${law.content}</p>
            </div>
        `;
    });

    html += `<h3 style="margin-top:2rem;">Frequency Protection</h3>`;
    html += `<ul style="color:var(--text-secondary);line-height:2;padding-left:1.5rem;">`;
    MASTER_VISION.energyProtection.forEach(g => { html += `<li>${g}</li>`; });
    html += `</ul>`;

    visionFullEl.innerHTML = html;
}

function toggleVisionExpand() {
    visionExpanded = !visionExpanded;
    const el   = document.getElementById('vision-full');
    const icon = document.getElementById('expand-icon');
    if (visionExpanded) { el.style.display = 'block'; icon.textContent = '▲'; }
    else                { el.style.display = 'none';  icon.textContent = '▼'; }
}

// ─── Activation ───────────────────────────────────────────────────────────────

async function executeCommand() {
    const commandInput = document.getElementById('command-input');
    const input = commandInput.value.trim();

    if (!input) {
        alert('Enter an activation — an idea, desire, or problem to run through TRUTHOS.');
        return;
    }

    const isTW = aiEngine && aiEngine.agentMode === 'truth-weaver';
    const btn = document.getElementById('activate-btn');
    if (btn) {
        btn.innerHTML = `<span>${isTW ? 'Weaving...' : 'Activating...'}</span>`;
        btn.disabled = true;
    }
    commandInput.value = '';

    let streamingActive = false;
    let onStreamDelta = null;

    if (aiEngine && aiEngine.liveAI) {
        onStreamDelta = (delta, opts) => {
            if (opts?.streaming === true && !streamingActive) {
                startStreamingResponse(isTW);
                streamingActive = true;
            }
            if (delta) appendStreamDelta(delta);
        };
    }

    const result = await aiEngine.executeCommand(input, onStreamDelta);

    if (streamingActive) {
        finalizeStreamingResponse(result);
    } else {
        displayResponse(result);
    }

    if (btn) {
        btn.innerHTML = `<span id="activate-btn-label">${isTW ? 'Weave' : 'Activate'}</span><span class="btn-arrow">→</span>`;
        btn.disabled = false;
    }
}

function startStreamingResponse(isTW) {
    const responseEl      = document.getElementById('ai-response');
    const responseContent = document.getElementById('response-content');
    if (!responseEl || !responseContent) return;

    const headerColor = isTW ? 'var(--weaver)' : 'var(--primary-light)';
    const badgeText   = isTW ? '◈ streaming at 7.83Hz' : '⚡ streaming';

    responseContent.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <span class="stream-badge" style="color:${headerColor};font-weight:600;font-size:0.85rem;">● ${badgeText}</span>
        </div>
        <div style="line-height:1.8;color:var(--text-secondary);border-left:2px solid ${headerColor};padding-left:1rem;">
            <span id="stream-text"></span><span class="stream-cursor">▋</span>
        </div>
    `;
    responseEl.style.display = 'block';
    responseEl.className = `ai-response${isTW ? ' tw-response' : ''}`;
}

function appendStreamDelta(delta) {
    const streamText = document.getElementById('stream-text');
    if (!streamText) return;
    const span = document.createElement('span');
    span.textContent = delta;
    streamText.appendChild(span);
}

function finalizeStreamingResponse(result) {
    document.querySelector('.stream-cursor')?.remove();
    const isTW  = result.agent === 'truth-weaver';
    const badge = document.querySelector('.stream-badge');
    if (badge) {
        badge.textContent = isTW ? '◈ Weave complete — truth revealed' : '✅ Activation accepted';
        badge.style.color = isTW ? 'var(--weaver)' : 'var(--success)';
    }
}

function displayResponse(result) {
    const responseEl      = document.getElementById('ai-response');
    const responseContent = document.getElementById('response-content');
    if (!responseEl || !responseContent) return;

    const isTW = result.agent === 'truth-weaver';

    const aiLabel = result.liveAI
        ? isTW
            ? `<span style="color:var(--weaver);font-size:0.8rem;font-weight:600;">◈ LIVE — Truth Weaver 7.83Hz</span>`
            : `<span style="color:var(--truth);font-size:0.8rem;font-weight:600;">⚡ LIVE — Claude AI</span>`
        : isTW
            ? `<span style="color:var(--weaver-muted);font-size:0.8rem;">◈ LOCAL — 7.83Hz scan</span>`
            : `<span style="color:var(--text-muted);font-size:0.8rem;">LOCAL — truth filter</span>`;

    const formatted = (result.reasoning || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\n/g, '<br>');

    let html = '';

    if (result.success) {
        const headerColor = isTW ? 'var(--weaver)' : 'var(--success)';
        const headerText  = isTW ? '◈ Weave complete — truth revealed' : '✅ Activation accepted';
        const borderColor = isTW ? 'var(--weaver)' : 'var(--success)';

        html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                <div style="color:${headerColor};font-weight:600;">${headerText}</div>
                ${aiLabel}
            </div>
            <div style="line-height:1.8;color:var(--text-secondary);border-left:2px solid ${borderColor};padding-left:1rem;">${formatted}</div>
            ${!result.liveAI ? `<div style="margin-top:1rem;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm);font-size:0.85rem;color:var(--text-muted);">
                Start <code>server.js</code> with your API key for live ${isTW ? 'Truth Weaver' : 'Claude'} responses.
            </div>` : ''}
        `;
    } else {
        const headerText  = isTW ? '◈ Illusion patterns detected' : '⚠️ Truth filter blocked';
        const headerColor = isTW ? 'var(--weaver)' : 'var(--danger)';
        const bgColor     = isTW ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239,68,68,0.1)';
        const borderColor = isTW ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
        const footerText  = isTW
            ? '<strong>7.83Hz:</strong> At this frequency, illusions cannot sustain. Name the real obstacle.'
            : '<strong>Law 1:</strong> Everything runs on truth. Root your activation in creation, clarity, and aligned intent.';

        html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                <div style="color:${headerColor};font-weight:600;">${headerText}</div>
                ${aiLabel}
            </div>
            <div style="margin-bottom:0.5rem;color:var(--text-secondary);">${result.message}</div>
            <div style="color:var(--text-muted);font-size:0.9rem;line-height:1.8;">${formatted}</div>
            <div style="margin-top:1rem;padding:0.75rem;background:${bgColor};border-radius:var(--radius-sm);border:1px solid ${borderColor};">
                ${footerText}
            </div>
        `;
    }

    responseContent.innerHTML = html;
    responseEl.style.display  = 'block';
    responseEl.className = `ai-response${isTW ? ' tw-response' : ''}`;

    if (result.success && !result.liveAI) {
        setTimeout(() => { responseEl.style.display = 'none'; }, 12000);
    }
}

function addTask() {
    const input = prompt('Enter activation — idea, desire, or problem:');
    if (input) aiEngine.executeCommand(input);
}

// ─── Daily check-in modal ─────────────────────────────────────────────────────

function checkDailyCheckIn() {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastCheckin = localStorage.getItem('truthos_last_checkin');
    if (lastCheckin === todayKey) return;

    // Small delay so engine finishes initializing
    setTimeout(() => showCheckInModal(), 1200);
}

function showCheckInModal() {
    const modal = document.getElementById('checkin-modal');
    if (modal) modal.style.display = 'flex';
}

function hideCheckInModal() {
    const modal = document.getElementById('checkin-modal');
    if (modal) modal.style.display = 'none';
}

async function submitCheckIn() {
    const input = document.getElementById('checkin-input')?.value?.trim();
    const todayKey = new Date().toISOString().slice(0, 10);

    localStorage.setItem('truthos_last_checkin', todayKey);
    hideCheckInModal();

    if (input) {
        // Pre-fill the activation interface and run it
        const commandInput = document.getElementById('command-input');
        if (commandInput) commandInput.value = input;
        await executeCommand();
    }
}

function dismissCheckIn() {
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem('truthos_last_checkin', todayKey);
    hideCheckInModal();
}

// ─── Log ──────────────────────────────────────────────────────────────────────

function addLogEntry(message) {
    const logContainer = document.getElementById('log-container');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">${new Date().toLocaleTimeString()}</span>
        <span class="log-message">${message}</span>
    `;
    logContainer.insertBefore(entry, logContainer.firstChild);

    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }

    // Persist log
    try {
        const entries = Array.from(logContainer.querySelectorAll('.log-entry')).slice(0, 50).map(el => ({
            time: el.querySelector('.log-time')?.textContent,
            msg:  el.querySelector('.log-message')?.textContent
        }));
        localStorage.setItem('truthos_log', JSON.stringify(entries));
    } catch {}
}

function loadSavedLog() {
    try {
        const saved = localStorage.getItem('truthos_log');
        if (!saved) return;
        const entries = JSON.parse(saved);
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;
        logContainer.innerHTML = '';
        entries.forEach(e => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.innerHTML = `<span class="log-time">${e.time}</span><span class="log-message">${e.msg}</span>`;
            logContainer.appendChild(div);
        });
    } catch {}
}

function clearLog() {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.innerHTML = '';
        localStorage.removeItem('truthos_log');
        addLogEntry('Verification log cleared');
    }
}

// ─── Frequency Alignment (energy bars) ───────────────────────────────────────

function updateEnergy() {
    const questions = [
        'Truth Clarity (0-100): How clear is your truth right now?',
        'Energy Frequency (0-100): How high is your operating frequency?',
        'Consciousness Alignment (0-100): How aligned is your consciousness?',
        'Manifestation Speed (0-100): How fast are you moving toward reality?'
    ];

    const bars = document.querySelectorAll('.energy-fill');
    const values = [];

    questions.forEach((q, i) => {
        const val = prompt(q);
        if (val !== null && !isNaN(val)) {
            const pct = Math.max(0, Math.min(100, parseInt(val)));
            if (bars[i]) bars[i].style.width = pct + '%';
            values[i] = pct;
        }
    });

    saveEnergyLevels();
    addLogEntry('Frequency alignment recalibrated');
}

function saveEnergyLevels() {
    try {
        const bars = document.querySelectorAll('.energy-fill');
        const levels = Array.from(bars).map(b => parseInt(b.style.width) || 0);
        localStorage.setItem('truthos_energy', JSON.stringify(levels));
    } catch {}
}

function loadEnergyLevels() {
    try {
        const saved = localStorage.getItem('truthos_energy');
        if (!saved) return;
        const levels = JSON.parse(saved);
        const bars = document.querySelectorAll('.energy-fill');
        bars.forEach((bar, i) => {
            if (levels[i] !== undefined) bar.style.width = levels[i] + '%';
        });
    } catch {}
}

// ─── Export activation record ─────────────────────────────────────────────────

function exportActivationRecord() {
    if (!aiEngine) return;
    const record = aiEngine.exportRecord();
    const json   = JSON.stringify(record, null, 2);
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `truthos-record-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLogEntry('Activation record exported');
}

// ─── Event listeners & shortcuts ─────────────────────────────────────────────

function setupEventListeners() {
    document.getElementById('agent-toggle')?.addEventListener('click', () => aiEngine.toggle());
    document.getElementById('command-input')?.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') executeCommand();
    });
    document.getElementById('checkin-input')?.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') submitCheckIn();
    });
    document.getElementById('admin-panel')?.addEventListener('click', e => {
        if (e.target === document.getElementById('admin-panel')) closeAdminPanel();
    });
    document.addEventListener('truthos:aiready', () => {
        checkSetupPanel();
        initAdminPanel();
    });
}

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); document.getElementById('command-input')?.focus(); }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); clearLog(); }
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); updateEnergy(); }
});

// ─── Activation suggestions ───────────────────────────────────────────────────

const ACTIVATION_SUGGESTIONS = [
    "Activate a system for converting this idea into a revenue stream",
    "Run truth filter on my current business strategy",
    "Align energy around my most important creative project",
    "Accelerate frequency: build a content system that runs without me",
    "Manifest a daily operating ritual at maximum alignment",
    "Verify 3D reality: what is actually true about my situation?",
    "Activate leadership frequency: what would I do if I operated at 100% truth?",
    "Build a system that scales my impact while I focus on creation",
    "Align relationships to truth: who deserves my energy?",
    "Accelerate: what is the single highest-frequency action I can take today?"
];

const WEAVER_SUGGESTIONS = [
    "I keep saying I'll start when I have more time — dissolve this",
    "I can't grow my business because the market is too competitive",
    "I would pursue this if only I had more support from the people around me",
    "Someday I'll finally commit to this goal — run a reality simulation",
    "I already know what I need to do, I just need to find the right moment",
    "What if I fail publicly and everyone sees it?",
    "I just need to figure out the perfect plan before I can begin"
];

function rotateSuggestion() {
    const isTW  = aiEngine && aiEngine.agentMode === 'truth-weaver';
    const pool  = isTW ? WEAVER_SUGGESTIONS : ACTIVATION_SUGGESTIONS;
    const s     = pool[Math.floor(Math.random() * pool.length)];
    const input = document.getElementById('command-input');
    if (input && !input.value) input.placeholder = `Example: ${s}`;
}

setInterval(rotateSuggestion, 10000);
setTimeout(rotateSuggestion, 2000);

// ─── Global exports ───────────────────────────────────────────────────────────

window.toggleVisionExpand       = toggleVisionExpand;
window.executeCommand           = executeCommand;
window.addTask                  = addTask;
window.addLogEntry              = addLogEntry;
window.clearLog                 = clearLog;
window.updateEnergy             = updateEnergy;
window.submitCheckIn            = submitCheckIn;
window.dismissCheckIn           = dismissCheckIn;
window.exportActivationRecord   = exportActivationRecord;
window.setServerUrl             = setServerUrl;
window.setAgentMode             = setAgentMode;
window.dismissSetupPanel        = dismissSetupPanel;
window.testConnection           = testConnection;
window.openAdminPanel           = openAdminPanel;
window.closeAdminPanel          = closeAdminPanel;
