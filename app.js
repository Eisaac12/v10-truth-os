// TRUTHOS — The Consciousness Operating System
// Main application logic and UI interactions

let visionExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⊕ TRUTHOS Loading...');

    loadCoreContent();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    console.log('✅ TRUTHOS Active');
});

// Load TRUTHOS Core content into the expandable panel
function loadCoreContent() {
    const visionFullEl = document.getElementById('vision-full');
    if (!visionFullEl) return;

    let html = `<h3>The Master Statement</h3>`;
    html += `<p style="font-style: italic; line-height: 1.8;">${MASTER_VISION.masterStatement.replace(/\n/g, '<br>')}</p>`;

    html += `<h3 style="margin-top: 2rem;">The One Equation</h3>`;
    html += `<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">`;
    MASTER_VISION.equation.forEach((step, i) => {
        const isLast = i === MASTER_VISION.equation.length - 1;
        html += `
            <div style="padding: 0.75rem 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid ${isLast ? 'var(--truth)' : 'var(--primary)'};">
                <span style="color: ${isLast ? 'var(--truth)' : 'var(--primary-light)'}; font-weight: 600; font-family: var(--font-mono); font-size: 0.85rem;">${step.node}</span>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem; margin-bottom: 0;">${step.description}</p>
            </div>
            ${!isLast ? '<div style="text-align: center; color: var(--primary-light); opacity: 0.5; font-size: 1.2rem;">↓</div>' : ''}
        `;
    });
    html += `</div>`;

    html += `<h3 style="margin-top: 2rem;">The 7 Operating Laws</h3>`;
    MASTER_VISION.principles.forEach((law) => {
        html += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--primary);">
                <h4 style="color: var(--primary-light); margin-bottom: 0.5rem;">Law ${law.id}: ${law.title}</h4>
                <p style="color: var(--text-secondary); line-height: 1.8; white-space: pre-line; margin: 0;">${law.content}</p>
            </div>
        `;
    });

    html += `<h3 style="margin-top: 2rem;">Frequency Protection</h3>`;
    html += `<ul style="color: var(--text-secondary); line-height: 2; padding-left: 1.5rem;">`;
    MASTER_VISION.energyProtection.forEach(g => {
        html += `<li>${g}</li>`;
    });
    html += `</ul>`;

    visionFullEl.innerHTML = html;
}

// Toggle TRUTHOS Core expansion
function toggleVisionExpand() {
    visionExpanded = !visionExpanded;
    const visionFullEl = document.getElementById('vision-full');
    const expandIcon = document.getElementById('expand-icon');

    if (visionExpanded) {
        visionFullEl.style.display = 'block';
        expandIcon.textContent = '▲';
    } else {
        visionFullEl.style.display = 'none';
        expandIcon.textContent = '▼';
    }
}

// Process an activation
async function executeCommand() {
    const commandInput = document.getElementById('command-input');
    const input = commandInput.value.trim();

    if (!input) {
        alert('Enter an activation — an idea, desire, or problem to run through TRUTHOS.');
        return;
    }

    // Show loading state
    const btn = document.querySelector('.btn-primary.btn-lg');
    if (btn) { btn.textContent = 'Activating...'; btn.disabled = true; }

    commandInput.value = '';

    const result = await aiEngine.executeCommand(input);
    displayResponse(result);

    if (btn) { btn.innerHTML = '<span>Activate</span><span class="btn-arrow">→</span>'; btn.disabled = false; }
}

// Display TRUTHOS response
function displayResponse(result) {
    const responseEl = document.getElementById('ai-response');
    const responseContent = document.getElementById('response-content');

    if (!responseEl || !responseContent) return;

    const aiLabel = result.liveAI
        ? '<span style="color:var(--truth);font-size:0.8rem;font-weight:600;">⚡ LIVE — Claude AI</span>'
        : '<span style="color:var(--text-muted);font-size:0.8rem;">LOCAL — truth filter</span>';

    let html = '';

    if (result.success) {
        // Format Claude's response: preserve line breaks
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
                Start <code>server.js</code> with your API key to get live Claude responses.
            </div>` : ''}
        `;
    } else {
        const formatted = (result.reasoning || '')
            .replace(/\n/g, '<br>');

        html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                <div style="color:var(--danger);font-weight:600;">⚠️ Truth filter blocked</div>
                ${aiLabel}
            </div>
            <div style="margin-bottom:0.5rem;">${result.message}</div>
            <div style="color:var(--text-muted);font-size:0.9rem;">${formatted}</div>
            <div style="margin-top:1rem;padding:0.75rem;background:rgba(239,68,68,0.1);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.3);">
                <strong>Law 1:</strong> Everything runs on truth. Ensure your activation is rooted in creation, clarity, and aligned intent.
            </div>
        `;
    }

    responseContent.innerHTML = html;
    responseEl.style.display = 'block';

    if (result.success && !result.liveAI) {
        setTimeout(() => { responseEl.style.display = 'none'; }, 12000);
    }
}

// Manual activation via prompt
function addTask() {
    const input = prompt('Enter activation — idea, desire, or problem:');
    if (input) {
        aiEngine.executeCommand(input);
    }
}

// Add entry to verification log
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
}

// Clear verification log
function clearLog() {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.innerHTML = '';
        addLogEntry('Verification log cleared');
    }
}

// Recalibrate frequency alignment
function updateEnergy() {
    const questions = [
        'Truth Clarity (0-100): How clear is your truth right now?',
        'Energy Frequency (0-100): How high is your operating frequency?',
        'Consciousness Alignment (0-100): How aligned is your consciousness?',
        'Manifestation Speed (0-100): How fast are you moving toward reality?'
    ];

    const bars = document.querySelectorAll('.energy-fill');

    questions.forEach((q, i) => {
        const val = prompt(q);
        if (val !== null && !isNaN(val)) {
            const pct = Math.max(0, Math.min(100, parseInt(val)));
            if (bars[i]) bars[i].style.width = pct + '%';
        }
    });

    addLogEntry('Frequency alignment recalibrated');
}

function updateDateTime() {
    // Reserved for clock display if added
}

function setupEventListeners() {
    const agentToggle = document.getElementById('agent-toggle');
    if (agentToggle) {
        agentToggle.addEventListener('click', () => aiEngine.toggle());
    }

    const commandInput = document.getElementById('command-input');
    if (commandInput) {
        commandInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') executeCommand();
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('command-input')?.focus();
    }
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearLog();
    }
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        updateEnergy();
    }
});

// Activation suggestions — TRUTHOS domains
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
    const suggestion = ACTIVATION_SUGGESTIONS[Math.floor(Math.random() * ACTIVATION_SUGGESTIONS.length)];
    const input = document.getElementById('command-input');
    if (input && !input.value) {
        input.placeholder = `Example: ${suggestion}`;
    }
}

setInterval(rotateSuggestion, 10000);
setTimeout(rotateSuggestion, 2000);

// Expose globals
window.toggleVisionExpand = toggleVisionExpand;
window.executeCommand = executeCommand;
window.addTask = addTask;
window.addLogEntry = addLogEntry;
window.clearLog = clearLog;
window.updateEnergy = updateEnergy;
