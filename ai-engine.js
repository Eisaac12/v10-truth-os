// TRUTHOS Engine — The Consciousness Operating System
// Calls live Claude API via server.js when available, falls back to local truth filter

class TRUTHOSEngine {
    constructor() {
        this.isActive = true;
        this.activationQueue = [];
        this.completedActivations = [];
        this.currentActivation = null;
        this.alignmentScore = 98;
        this.startTime = Date.now();
        this.serverUrl = 'http://localhost:3001';
        this.liveAI = false;

        this.coreMemory = MASTER_VISION;
        this.init();
    }

    async init() {
        console.log('⊕ TRUTHOS Engine initializing...');
        await this.checkLiveAI();
        this.startFrequencyLoop();
        console.log(`✅ TRUTHOS ready — AI: ${this.liveAI ? 'LIVE (Claude)' : 'LOCAL (truth filter)'}`);
    }

    // Check if the Claude API server is running
    async checkLiveAI() {
        try {
            const res = await fetch(`${this.serverUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                const data = await res.json();
                this.liveAI = data.ai === 'connected';
                this.updateAIStatusBadge();
            }
        } catch {
            this.liveAI = false;
            this.updateAIStatusBadge();
        }
    }

    updateAIStatusBadge() {
        const statusEl = document.getElementById('system-status');
        if (statusEl) {
            statusEl.textContent = this.liveAI ? 'Claude AI Active' : 'Local Mode';
            statusEl.style.color = this.liveAI ? 'var(--truth)' : '';
        }
    }

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

    // Main entry point — called from app.js
    async executeCommand(input) {
        console.log('🔺 Processing activation:', input);

        if (this.liveAI) {
            return await this.activateWithClaude(input);
        } else {
            return this.activateLocally(input);
        }
    }

    // Live path: call Claude via server.js
    async activateWithClaude(input) {
        try {
            const res = await fetch(`${this.serverUrl}/api/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const data = await res.json();

            if (data.success) {
                const activation = this.createActivation(input);
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

    // Local fallback: pattern-based truth filter
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

    // Local truth filter (Law 1: Truth is the base layer)
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

        const score = negativeCount > 0 ? 0 : Math.min(100, 70 + (positiveCount * 10));
        const isAligned = score >= 60;

        let reasoning = '';
        if (isAligned) {
            const signals = Object.keys(aligned).filter(k => aligned[k]);
            reasoning = signals.length
                ? `Truth filter passed. Signals: ${signals.join(', ')}. Aligned with the 7 Operating Laws.`
                : 'Truth filter passed. Proceeding at maximum frequency.';
        } else {
            reasoning = 'Truth filter blocked this activation. Ensure your input is rooted in creation, clarity, and aligned intent (Law 1: Truth is the base layer).';
        }

        return { aligned: isAligned, score, reasoning };
    }

    createActivation(input) {
        return {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            command: input,
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
        this.updateStats();
        this.updateTaskList();
        this.updateCurrentTaskDisplay();
    }

    generateId() {
        return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getUptime() {
        const elapsed = Date.now() - this.startTime;
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    logActivity(message) {
        if (typeof addLogEntry === 'function') addLogEntry(message);
        console.log(`[TRUTHOS] ${message}`);
    }

    updateStats() {
        const uptimeEl = document.getElementById('uptime');
        const completedEl = document.getElementById('tasks-completed');
        if (uptimeEl) uptimeEl.textContent = this.getUptime();
        if (completedEl) completedEl.textContent = this.completedActivations.length;
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
                        Activated: ${act.createdAt.toLocaleTimeString()}
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
            btn.textContent = label;
            btn.className = this.isActive ? 'btn-sm btn-success' : 'btn-sm btn-ghost';
        }
        this.logActivity(`TRUTHOS frequency engine ${label.toLowerCase()}`);
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
