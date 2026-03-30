// App.js - V10 Truth OS
// Main application logic and UI interactions

// Global state
let visionExpanded = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔮 V10 Truth OS Loading...');

    // Load full Master Vision
    loadFullVision();

    // Set up event listeners
    setupEventListeners();

    // Initialize displays
    updateDateTime();
    setInterval(updateDateTime, 1000);

    console.log('✅ V10 Truth OS Ready');
});

// Load full Master Vision content
function loadFullVision() {
    const visionFullEl = document.getElementById('vision-full');
    if (!visionFullEl) return;

    // v2.0 identity header
    let html = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1)); border-radius: var(--radius-sm); border: 1px solid rgba(139,92,246,0.3);">
            <div style="color: var(--primary-light); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.25rem;">${MASTER_VISION.identity.codename} — v${MASTER_VISION.identity.version}</div>
            <div style="color: var(--text-primary); font-weight: 600;">${MASTER_VISION.identity.name}</div>
            <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">Activation phrase: <code style="color: var(--primary-light);">${MASTER_VISION.identity.activationPhrase}</code></div>
        </div>
    `;

    html += `<h3>The Master Statement</h3>`;
    html += `<p style="font-style: italic; line-height: 1.8;">${MASTER_VISION.masterStatement.replace(/\n/g, '<br>')}</p>`;

    html += `<h3 style="margin-top: 2rem;">The 10 Core Principles</h3>`;

    MASTER_VISION.principles.forEach((principle, index) => {
        html += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--primary);">
                <h4 style="color: var(--primary-light); margin-bottom: 0.5rem;">${index + 1}. ${principle.title}</h4>
                <p style="color: var(--text-secondary); line-height: 1.8; white-space: pre-line;">${principle.content}</p>
            </div>
        `;
    });

    html += `<h3 style="margin-top: 2rem;">Energy Protection Guidelines</h3>`;
    html += `<ul style="color: var(--text-secondary); line-height: 2;">`;
    MASTER_VISION.energyProtection.forEach(guideline => {
        html += `<li>${guideline}</li>`;
    });
    html += `</ul>`;

    visionFullEl.innerHTML = html;
}

// Toggle Vision Panel Expansion
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

// Execute Command
function executeCommand() {
    const commandInput = document.getElementById('command-input');
    const command = commandInput.value.trim();

    if (!command) {
        alert('Please enter a command');
        return;
    }

    // Send to AI Engine
    const result = aiEngine.executeCommand(command);

    // Show response
    displayAIResponse(result);

    // Clear input
    commandInput.value = '';
}

// Display AI Response
function displayAIResponse(result) {
    const responseEl = document.getElementById('ai-response');
    const responseContent = document.getElementById('response-content');

    if (!responseEl || !responseContent) return;

    let html = '';

    // v2.0 — I AM activation: render full 7-block response
    if (result.type === 'IAM_ACTIVATION' && result.html) {
        html = `
            <div style="color: var(--primary-light); font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; letter-spacing: 0.05em;">
                ✨ I AM — FULLY ACTIVATED
            </div>
            ${result.html}
        `;
        responseContent.innerHTML = html;
        responseEl.style.display = 'block';
        // Keep I AM response visible — user dismisses manually
        return;
    }

    // v2.0 — Accepted command with foresight
    if (result.success && result.foresight) {
        const f = result.foresight;
        const scenariosHtml = f.scenarios.map(s => `
            <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                <strong style="color: var(--primary-light);">${s.path}:</strong>
                <span style="color: var(--text-secondary); font-size: 0.85rem;"> ${s.moves}</span>
                <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">→ ${s.outcome}</div>
            </div>
        `).join('');

        html = `
            <div style="color: var(--success); font-weight: 600; margin-bottom: 0.5rem;">
                ✅ Command Accepted
            </div>
            <div style="margin-bottom: 0.5rem;">${result.message}</div>
            <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${result.reasoning}</div>
            <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <strong>Task Created:</strong> ${result.task.command}
            </div>
            <div style="margin-top: 0.5rem;">
                <div style="font-size: 0.8rem; color: var(--primary-light); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">⚡ Multi-Step Foresight — ${f.scenarios.length} Paths</div>
                ${scenariosHtml}
                <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem;">Recommended: <strong style="color: var(--primary-light);">${f.recommended}</strong> — ${f.reasoning}</div>
            </div>
        `;

        responseContent.innerHTML = html;
        responseEl.style.display = 'block';
        setTimeout(() => { responseEl.style.display = 'none'; }, 15000);
        return;
    }

    // Standard success (no foresight)
    if (result.success) {
        html = `
            <div style="color: var(--success); font-weight: 600; margin-bottom: 0.5rem;">
                ✅ Command Accepted
            </div>
            <div style="margin-bottom: 0.5rem;">${result.message}</div>
            <div style="color: var(--text-muted); font-size: 0.9rem;">${result.reasoning}</div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                <strong>Task Created:</strong> ${result.task.command}
            </div>
        `;
        responseContent.innerHTML = html;
        responseEl.style.display = 'block';
        setTimeout(() => { responseEl.style.display = 'none'; }, 10000);
        return;
    }

    // Rejection
    html = `
        <div style="color: var(--danger); font-weight: 600; margin-bottom: 0.5rem;">
            ⚠️ Command Rejected
        </div>
        <div style="margin-bottom: 0.5rem;">${result.message}</div>
        <div style="color: var(--text-muted); font-size: 0.9rem;">${result.reasoning}</div>
        <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.3);">
            <strong>Suggestion:</strong> Ensure your command aligns with the Master Vision principles of creation, truth, peace, and growth.
        </div>
    `;

    responseContent.innerHTML = html;
    responseEl.style.display = 'block';
}

// Add Task (Manual)
function addTask() {
    const taskName = prompt('Enter task name:');
    if (taskName) {
        aiEngine.executeCommand(taskName);
    }
}

// Add Log Entry
function addLogEntry(message) {
    const logContainer = document.getElementById('log-container');
    if (!logContainer) return;

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-time">${new Date().toLocaleTimeString()}</span>
        <span class="log-message">${message}</span>
    `;

    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // Keep only last 50 entries
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Clear Log
function clearLog() {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.innerHTML = '';
        addLogEntry('Activity log cleared');
    }
}

// Update Energy Levels
function updateEnergy() {
    const questions = [
        'Mental Clarity (0-100): How clear is your thinking right now?',
        'Creative Energy (0-100): How creative and inspired do you feel?',
        'Emotional Balance (0-100): How balanced and stable are your emotions?',
        'Purpose Alignment (0-100): How aligned do you feel with your purpose?'
    ];

    const energyBars = document.querySelectorAll('.energy-fill');

    questions.forEach((question, index) => {
        const value = prompt(question);
        if (value !== null && !isNaN(value)) {
            const percentage = Math.max(0, Math.min(100, parseInt(value)));
            if (energyBars[index]) {
                energyBars[index].style.width = percentage + '%';
            }
        }
    });

    addLogEntry('Energy levels updated');
}

// Update Date/Time
function updateDateTime() {
    // Could add a date/time display if needed
}

// Setup Event Listeners
function setupEventListeners() {
    // Agent toggle
    const agentToggle = document.getElementById('agent-toggle');
    if (agentToggle) {
        agentToggle.addEventListener('click', () => {
            aiEngine.toggle();
        });
    }

    // Command input - Enter key
    const commandInput = document.getElementById('command-input');
    if (commandInput) {
        commandInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                executeCommand();
            }
        });
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + K = Focus command input
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('command-input')?.focus();
    }

    // Ctrl + L = Clear log
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearLog();
    }

    // Ctrl + E = Update energy
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        updateEnergy();
    }
});

// Prebuilt command suggestions
const COMMAND_SUGGESTIONS = [
    "Research and summarize the latest developments in AI automation",
    "Create a content calendar for the next 30 days",
    "Analyze my current projects and suggest priorities",
    "Build a system for tracking daily habits and alignment",
    "Generate ideas for a new creative project",
    "Plan the next steps for building my business platform",
    "Research tools for automating content creation",
    "Create a learning roadmap for advanced JavaScript",
    "Analyze market trends in personal development technology",
    "Design a workflow for daily creative practice"
];

// Show command suggestion
function showCommandSuggestion() {
    const suggestion = COMMAND_SUGGESTIONS[Math.floor(Math.random() * COMMAND_SUGGESTIONS.length)];
    const commandInput = document.getElementById('command-input');
    if (commandInput && !commandInput.value) {
        commandInput.placeholder = `Example: ${suggestion}`;
    }
}

// Rotate suggestions every 10 seconds
setInterval(showCommandSuggestion, 10000);

// Initial suggestion
setTimeout(showCommandSuggestion, 2000);

// Export functions for global access
window.toggleVisionExpand = toggleVisionExpand;
window.executeCommand = executeCommand;
window.addTask = addTask;
window.addLogEntry = addLogEntry;
window.clearLog = clearLog;
window.updateEnergy = updateEnergy;
