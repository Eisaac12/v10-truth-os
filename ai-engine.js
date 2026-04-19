// TRUTHOS Engine — The Consciousness Operating System
// Autonomous frequency engine that runs on the 7 Operating Laws

class TRUTHOSEngine {
    constructor() {
        this.isActive = true;
        this.activationQueue = [];
        this.completedActivations = [];
        this.currentActivation = null;
        this.alignmentScore = 98;
        this.startTime = Date.now();

        // Load TRUTHOS Core as operating memory
        this.coreMemory = MASTER_VISION;

        this.init();
    }

    init() {
        console.log('⊕ TRUTHOS Engine initializing...');
        console.log('📡 7 Operating Laws loaded as core memory');
        console.log('✅ Frequency engine ready');

        this.startFrequencyLoop();
    }

    // Continuous frequency loop
    startFrequencyLoop() {
        setInterval(() => {
            if (this.isActive) {
                this.process();
            }
        }, 5000);
    }

    process() {
        if (this.activationQueue.length > 0 && !this.currentActivation) {
            this.executeNextActivation();
        }
        this.processBackgroundFrequency();
    }

    // Process an activation from the interface
    executeCommand(input) {
        console.log('🔺 Processing activation:', input);

        const evaluation = this.runTruthFilter(input);

        if (evaluation.aligned) {
            const activation = this.createActivation(input);
            this.addActivation(activation);
            return {
                success: true,
                message: `Activation accepted. Truth alignment: ${evaluation.score}%`,
                task: activation,
                reasoning: evaluation.reasoning
            };
        } else {
            return {
                success: false,
                message: "Activation blocked by truth filter",
                reasoning: evaluation.reasoning
            };
        }
    }

    // Truth filter — Law 1 + Law 4: truth is base layer, alignment = acceleration
    runTruthFilter(input) {
        const aligned = {
            creation: /build|create|make|develop|design|generate|activate|manifest/i.test(input),
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
                ? `Truth filter passed. Signals detected: ${signals.join(', ')}. Aligned with the 7 Operating Laws.`
                : 'Truth filter passed. Proceeding at maximum frequency.';
        } else {
            reasoning = 'Truth filter blocked this activation. It does not align with Law 1 (Truth is the Base Layer). Ensure your input is rooted in creation, clarity, and aligned intent.';
        }

        return { aligned: isAligned, score, reasoning };
    }

    // Create an activation from verified input
    createActivation(input) {
        return {
            id: this.generateId(),
            command: input,
            status: 'pending',
            createdAt: new Date(),
            steps: this.buildExecutionSteps(input),
            currentStep: 0
        };
    }

    // TRUTHOS execution steps: truth filter → align → accelerate → execute → verify → manifest
    buildExecutionSteps(input) {
        return [
            { action: 'truth-filter',  description: `Run truth filter: "${input.substring(0, 60)}"` },
            { action: 'align',         description: 'Align energy to intention. Remove friction.' },
            { action: 'accelerate',    description: 'Raise frequency. Move at maximum speed.' },
            { action: 'execute',       description: 'Execute the aligned action.' },
            { action: 'verify-3d',     description: 'Verify output in 3D reality. Check truth continuously.' },
            { action: 'manifest',      description: 'Measure value generated. Log to reality.' }
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
                const step = activation.steps[index];
                this.logActivity(`Step ${index + 1}/${total}: ${step.description}`);
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

    processBackgroundFrequency() {
        // Maintain awareness — background frequency monitoring
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
        if (typeof addLogEntry === 'function') {
            addLogEntry(message);
        }
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
    document.addEventListener('DOMContentLoaded', () => {
        aiEngine = new TRUTHOSEngine();
    });
} else {
    aiEngine = new TRUTHOSEngine();
}

setInterval(() => {
    if (aiEngine) aiEngine.updateStats();
}, 1000);
