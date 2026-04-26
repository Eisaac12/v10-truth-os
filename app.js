// TRUTHOS — The Consciousness Operating System
// Main application logic: persistence, daily check-in, export

let visionExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⊕ TRUTHOS Loading...');

    loadCoreContent();
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
        aiEngine.checkLiveAI();
    }
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

    const btn = document.querySelector('.btn-primary.btn-lg');
    if (btn) { btn.textContent = 'Activating...'; btn.disabled = true; }
    commandInput.value = '';

    const result = await aiEngine.executeCommand(input);
    displayResponse(result);

    if (btn) { btn.innerHTML = '<span>Activate</span><span class="btn-arrow">→</span>'; btn.disabled = false; }
}

function displayResponse(result) {
    const responseEl      = document.getElementById('ai-response');
    const responseContent = document.getElementById('response-content');
    if (!responseEl || !responseContent) return;

    const aiLabel = result.liveAI
        ? '<span style="color:var(--truth);font-size:0.8rem;font-weight:600;">⚡ LIVE — Claude AI</span>'
        : '<span style="color:var(--text-muted);font-size:0.8rem;">LOCAL — truth filter</span>';

    let html = '';

    if (result.success) {
        const formatted = (result.reasoning || '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\n/g, '<br>');

        html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                <div style="color:var(--success);font-weight:600;">✅ Activation accepted</div>
                ${aiLabel}
            </div>
            <div style="line-height:1.8;color:var(--text-secondary);">${formatted}</div>
            ${!result.liveAI ? `<div style="margin-top:1rem;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm);font-size:0.85rem;color:var(--text-muted);">
                Start <code>server.js</code> with your API key for live Claude responses.
            </div>` : ''}
        `;
    } else {
        const formatted = (result.reasoning || '').replace(/\n/g, '<br>');
        html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                <div style="color:var(--danger);font-weight:600;">⚠️ Truth filter blocked</div>
                ${aiLabel}
            </div>
            <div style="margin-bottom:0.5rem;">${result.message}</div>
            <div style="color:var(--text-muted);font-size:0.9rem;">${formatted}</div>
            <div style="margin-top:1rem;padding:0.75rem;background:rgba(239,68,68,0.1);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.3);">
                <strong>Law 1:</strong> Everything runs on truth. Root your activation in creation, clarity, and aligned intent.
            </div>
        `;
    }

    responseContent.innerHTML = html;
    responseEl.style.display  = 'block';

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

function rotateSuggestion() {
    const s     = ACTIVATION_SUGGESTIONS[Math.floor(Math.random() * ACTIVATION_SUGGESTIONS.length)];
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
