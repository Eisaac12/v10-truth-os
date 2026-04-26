// TRUTHOS Engine — The Consciousness Operating System
// Persistence, conversation memory, dynamic frequency score, live Claude API
// Auto-detects Vercel (relative /api/) vs local (localhost:3001)

const STORAGE_KEYS = {
    activations:   'truthos_activations',
    energy:        'truthos_energy',
    log:           'truthos_log',
    attempts:      'truthos_attempts',
    accepted:      'truthos_accepted',
    conversation:  'truthos_conversation'
};

class TRUTHOSEngine {
    constructor() {
        this.isActive = true;
        this.activationQueue = [];
        this.completedActivations = [];
        this.currentActivation = null;
        this.startTime = Date.now();
        this.serverUrl = this.resolveServerUrl();
        this.liveAI = false;

        // Conversation memory — passed to Claude on every call
        this.conversationHistory = [];

        // Real frequency tracking
        this.totalAttempts = 0;
        this.acceptedActivations = 0;

        this.coreMemory = MASTER_VISION;
        this.init();
    }

    // Vercel: empty string → relative /api/ calls (same domain, no CORS)
    // Custom: user-saved URL in localStorage
    // Local: localhost:3001
    resolveServerUrl() {
        const custom = localStorage.getItem('truthos_server_url');
        if (custom) return custom.replace(/\/$/, '');
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        return isLocal ? 'http://localhost:3001' : '';
    }

    async init() {
        console.log('⊕ TRUTHOS Engine initializing...');
        this.loadState();
        await this.checkLiveAI();
        this.startFrequencyLoop();
        this.updateAlignmentScore();
        console.log(`✅ TRUTHOS ready — AI: ${this.liveAI ? 'LIVE (Claude)' : 'LOCAL (truth filter)'}`);
    }

    // ─── Persistence ──────────────────────────────────────────────────────────

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.activations);
            if (saved) {
                this.completedActivations = JSON.parse(saved).map(a => ({
                    ...a,
                    createdAt: new Date(a.createdAt),
                    completedAt: a.completedAt ? new Date(a.completedAt) : null
                }));
            }

            const attempts = localStorage.getItem(STORAGE_KEYS.attempts);
            const accepted = localStorage.getItem(STORAGE_KEYS.accepted);
            if (attempts) this.totalAttempts = parseInt(attempts, 10);
            if (accepted) this.acceptedActivations = parseInt(accepted, 10);

            const conv = localStorage.getItem(STORAGE_KEYS.conversation);
            if (conv) this.conversationHistory = JSON.parse(conv);

            this.logActivity(`Loaded ${this.completedActivations.length} saved activations`);
        } catch (e) {
            console.warn('[TRUTHOS] Could not load saved state:', e);
        }
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEYS.activations,
                JSON.stringify(this.completedActivations.slice(-100)));
            localStorage.setItem(STORAGE_KEYS.attempts,   String(this.totalAttempts));
            localStorage.setItem(STORAGE_KEYS.accepted,   String(this.acceptedActivations));
            localStorage.setItem(STORAGE_KEYS.conversation,
                JSON.stringify(this.conversationHistory.slice(-20)));
        } catch (e) {
            console.warn('[TRUTHOS] Could not save state:', e);
        }
    }

    // ─── Live AI ──────────────────────────────────────────────────────────────

    async checkLiveAI() {
        try {
            const res = await fetch(`${this.serverUrl}/api/health`,
                { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                const data = await res.json();
                this.liveAI = data.ai === 'connected';
            }
        } catch {
            this.liveAI = false;
        }
        this.updateAIStatusBadge();
    }

    updateAIStatusBadge() {
        const el = document.getElementById('system-status');
        if (el) {
            el.textContent = this.liveAI ? 'Claude AI Active' : 'Local Mode';
            el.style.color  = this.liveAI ? 'var(--truth)' : '';
        }
    }

    // ─── Frequency score ──────────────────────────────────────────────────────

    calculateAlignmentScore() {
        if (this.totalAttempts === 0) return 98; // default before any activations
        return Math.round((this.acceptedActivations / this.totalAttempts) * 100);
    }

    updateAlignmentScore() {
        const score = this.calculateAlignmentScore();
        const el = document.getElementById('alignment-score');
        if (el) el.textContent = `${score}%`;
    }

    // ─── Core execution ───────────────────────────────────────────────────────

    startFrequencyLoop() {
        setInterval(() => {
            if (this.isActive) this.process();
        }, 5000);
    }

    process() {
        if (this.activationQueue.length > 0 && !this.currentActivation) {
            this.executeNextActivation();
        }
    }

    async executeCommand(input) {
        console.log('🔺 Processing activation:', input);
        this.totalAttempts++;

        let result;
        if (this.liveAI) {
            result = await this.activateWithClaude(input);
        } else {
            result = this.activateLocally(input);
        }

        if (result.success) this.acceptedActivations++;
        this.saveState();
        this.updateAlignmentScore();
        return result;
    }

    // Live path — calls Claude with full conversation history
    async activateWithClaude(input) {
        try {
            const res = await fetch(`${this.serverUrl}/api/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input, history: this.conversationHistory })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            if (data.success) {
                // Store this turn in conversation memory
                this.conversationHistory.push({ role: 'user', content: input });
                this.conversationHistory.push({ role: 'assistant', content: data.response });
                if (this.conversationHistory.length > 20) {
                    this.conversationHistory = this.conversationHistory.slice(-20);
                }

                const activation = this.createActivation(input, data.response);
                this.addActivation(activation);
                return {
                    success: true,
                    message: 'Activation accepted by Claude. Running through The One Equation.',
                    task: activation,
                    reasoning: data.response,
                    liveAI: true
                };
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            this.logActivity(`Live AI error: ${err.message} — falling back to local`);
            return this.activateLocally(input);
        }
    }

    // Local fallback — pattern truth filter
    activateLocally(input) {
        const evaluation = this.runTruthFilter(input);

        if (evaluation.aligned) {
            const activation = this.createActivation(input);
            this.addActivation(activation);
            return {
                success: true,
                message: `Activation accepted. Truth alignment: ${evaluation.score}%`,
                task: activation,
                reasoning: evaluation.reasoning,
                liveAI: false
            };
        } else {
            return {
                success: false,
                message: 'Activation blocked by truth filter',
                reasoning: evaluation.reasoning,
                liveAI: false
            };
        }
    }

    runTruthFilter(input) {
        const aligned = {
            creation:  /build|create|make|develop|design|generate|activate|manifest/i.test(input),
            learning:  /learn|research|study|analyze|understand|explore/i.test(input),
            growth:    /grow|improve|evolve|upgrade|enhance|scale/i.test(input),
            clarity:   /plan|organize|structure|clarify|focus|align/i.test(input),
            service:   /help|assist|support|serve|solve|contribute/i.test(input)
        };
        const blocked = {
            deception:    /manipulate|deceive|trick|exploit|lie/i.test(input),
            destruction:  /harm|damage|destroy|break|attack/i.test(input),
            lowFrequency: /hate|revenge|jealous|drag|drain/i.test(input)
        };

        const positiveCount = Object.values(aligned).filter(Boolean).length;
        const negativeCount = Object.values(blocked).filter(Boolean).length;
        const score   = negativeCount > 0 ? 0 : Math.min(100, 70 + positiveCount * 10);
        const isAligned = score >= 60;

        const signals  = Object.keys(aligned).filter(k => aligned[k]);
        const reasoning = isAligned
            ? signals.length
                ? `Truth filter passed. Signals: ${signals.join(', ')}. Aligned with the 7 Operating Laws.`
                : 'Truth filter passed. Proceeding at maximum frequency.'
            : 'Truth filter blocked this activation. Ensure your input is rooted in creation, clarity, and aligned intent (Law 1: Truth is the base layer).';

        return { aligned: isAligned, score, reasoning };
    }

    // ─── Activation lifecycle ─────────────────────────────────────────────────

    createActivation(input, claudeResponse = null) {
        return {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            command: input,
            claudeResponse,
            status: 'pending',
            createdAt: new Date(),
            steps: this.buildExecutionSteps(input),
            currentStep: 0
        };
    }

    buildExecutionSteps(input) {
        return [
            { action: 'truth-filter',  description: `Truth filter: "${input.substring(0, 50)}"` },
            { action: 'align',         description: 'Align energy to intention. Remove friction.' },
            { action: 'accelerate',    description: 'Raise frequency. Move at maximum speed.' },
            { action: 'execute',       description: 'Execute the aligned action.' },
            { action: 'verify-3d',     description: 'Verify output in 3D reality.' },
            { action: 'manifest',      description: 'Measure value. Log to reality.' }
        ];
    }

    addActivation(activation) {
        this.activationQueue.push(activation);
        this.logActivity(`New activation queued: ${activation.command.substring(0, 50)}...`);
        this.updateTaskList();
    }

    executeNextActivation() {
        if (this.activationQueue.length === 0) return;
        this.currentActivation = this.activationQueue.shift();
        this.currentActivation.status = 'running';
        this.logActivity(`Activating: ${this.currentActivation.command}`);
        this.updateCurrentTaskDisplay();
        this.processSteps(this.currentActivation);
    }

    processSteps(activation) {
        const total = activation.steps.length;
        let index = 0;
        const interval = setInterval(() => {
            if (index < total) {
                this.logActivity(`Step ${index + 1}/${total}: ${activation.steps[index].description}`);
                index++;
                activation.currentStep = index;
            } else {
                clearInterval(interval);
                this.completeActivation(activation);
            }
        }, 2000);
    }

    completeActivation(activation) {
        activation.status = 'completed';
        activation.completedAt = new Date();
        this.completedActivations.push(activation);
        this.currentActivation = null;

        this.logActivity(`✅ Manifested: ${activation.command.substring(0, 50)}...`);
        this.saveState();
        this.updateStats();
        this.updateTaskList();
        this.updateCurrentTaskDisplay();
    }

    // ─── UI updates ───────────────────────────────────────────────────────────

    getUptime() {
        const e = Date.now() - this.startTime;
        const h = Math.floor(e / 3600000);
        const m = Math.floor((e % 3600000) / 60000);
        const s = Math.floor((e % 60000) / 1000);
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    logActivity(message) {
        if (typeof addLogEntry === 'function') addLogEntry(message);
        console.log(`[TRUTHOS] ${message}`);
    }

    updateStats() {
        const uptimeEl    = document.getElementById('uptime');
        const completedEl = document.getElementById('tasks-completed');
        if (uptimeEl)    uptimeEl.textContent    = this.getUptime();
        if (completedEl) completedEl.textContent = this.completedActivations.length;
        this.updateAlignmentScore();
    }

    updateCurrentTaskDisplay() {
        const el = document.getElementById('current-task');
        if (el) {
            el.textContent = this.currentActivation
                ? this.currentActivation.command.substring(0, 40) + '...'
                : 'Aligning';
        }
    }

    updateTaskList() {
        const taskListEl = document.getElementById('task-list');
        if (!taskListEl) return;

        const all = [...this.activationQueue, ...this.completedActivations];
        if (this.currentActivation) all.unshift(this.currentActivation);

        if (all.length === 0) {
            taskListEl.innerHTML = '<div class="empty-state"><p>No active manifestations. TRUTHOS is ready to activate.</p></div>';
            return;
        }

        taskListEl.innerHTML = all.map(act => `
            <div class="task-item">
                <div class="task-info">
                    <h4>${act.command.substring(0, 60)}${act.command.length > 60 ? '...' : ''}</h4>
                    <div class="task-meta">
                        ${act.createdAt.toLocaleTimeString()}
                        ${act.currentStep ? ` &nbsp;•&nbsp; Step ${act.currentStep}/${act.steps.length}` : ''}
                    </div>
                </div>
                <div class="task-status ${act.status}">${act.status.toUpperCase()}</div>
            </div>
        `).join('');
    }

    toggle() {
        this.isActive = !this.isActive;
        const label = this.isActive ? 'Active' : 'Paused';
        const btn = document.getElementById('agent-toggle');
        if (btn) {
            btn.textContent  = label;
            btn.className    = this.isActive ? 'btn-sm btn-success' : 'btn-sm btn-ghost';
        }
        this.logActivity(`TRUTHOS frequency engine ${label.toLowerCase()}`);
    }

    // Export full activation record
    exportRecord() {
        return {
            exported: new Date().toISOString(),
            totalAttempts:       this.totalAttempts,
            acceptedActivations: this.acceptedActivations,
            alignmentScore:      this.calculateAlignmentScore(),
            activations: this.completedActivations.map(a => ({
                id:            a.id,
                command:       a.command,
                claudeResponse: a.claudeResponse || null,
                createdAt:     a.createdAt,
                completedAt:   a.completedAt,
                status:        a.status
            }))
        };
    }
}

// Initialize global engine
let aiEngine;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { aiEngine = new TRUTHOSEngine(); });
} else {
    aiEngine = new TRUTHOSEngine();
}

setInterval(() => { if (aiEngine) aiEngine.updateStats(); }, 1000);
