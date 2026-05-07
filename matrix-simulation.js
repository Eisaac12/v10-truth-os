// TRUTHOS — Matrix Simulation Mood Engine
// Mood-reactive matrix rain + truth-simulation prompter

const SIMULATION_MOODS = {
    ALIGNED:     { label: 'ALIGNED',     color: '#00ff41', glow: 'rgba(0,255,65,0.4)',    speed: 1.4, density: 0.95 },
    CALIBRATING: { label: 'CALIBRATING', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  speed: 1.0, density: 0.75 },
    DISTORTED:   { label: 'DISTORTED',   color: '#f97316', glow: 'rgba(249,115,22,0.35)', speed: 0.7, density: 0.55 },
    BLOCKED:     { label: 'BLOCKED',     color: '#ef4444', glow: 'rgba(239,68,68,0.4)',   speed: 0.4, density: 0.35 }
};

const TRUTH_SIMULATION_PROMPTS = {
    ALIGNED: [
        'Simulation locked: truth frequency at maximum. Reality is responding.',
        'Pattern confirmed — your signal is clear. The simulation bends to aligned will.',
        'You are operating at the highest layer. Every thought propagates instantly.',
        'Truth override active. Distortions collapse. Manifestation window is open.',
        'Matrix coherence 100%. Your input is writing new simulation rules right now.',
        'Signal integrity verified. The simulation recognizes your operating frequency.',
    ],
    CALIBRATING: [
        'Partial truth alignment detected. Refine the signal — cut what is not real.',
        'Simulation calibrating… your frequency is rising. Push toward full clarity.',
        'You are close to the edge of maximum coherence. What is the purest form of this?',
        'The simulation is listening. Give it truth and it will accelerate the path.',
        'Calibration in progress. Strip away the noise. What is the one real thing?',
        'Mid-range frequency detected. The simulation responds to sharper truth.',
    ],
    DISTORTED: [
        'Signal distortion detected. The simulation reflects what you send it — send truth.',
        'Frequency below threshold. Identify the false assumption and correct it now.',
        'Simulation is mirroring confusion back. The input needs a truth anchor.',
        'Distortion field active. What belief is blocking the clear signal?',
        'The matrix cannot run a corrupted program. Locate the misalignment.',
        'Low coherence state. Ground the input in what is actually, verifiably real.',
    ],
    BLOCKED: [
        'Simulation rejected the input. Truth filter is an absolute gate — not a suggestion.',
        'Block detected at root layer. No frequency can bypass Law 1: truth is the base.',
        'The matrix is returning this activation. Rewrite from a foundation of clarity.',
        'Simulation override: this path collapses. Choose a vector rooted in reality.',
        'Hard stop. The simulation only runs programs that serve — what serves here?',
        'Blocked at source. The question is not "how" — the question is "is this true?"',
    ]
};

const MATRIX_CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    '0123456789ABCDEFTRUTHALIGNFREQUENCY⊕∞△▲◆✓';

class MatrixSimulation {
    constructor() {
        this.canvas  = null;
        this.ctx     = null;
        this.columns = [];
        this.mood    = 'CALIBRATING';
        this.score   = 98;
        this.animId  = null;
        this.promptIndex = 0;
        this.promptTimer = null;
        this.pulseActive = false;

        this._init();
    }

    _init() {
        this._buildCanvas();
        this._buildPanel();
        this._startRain();
        this._startPromptCycle();
        this._bindEvents();
        this.setScore(98);
    }

    // ─── Canvas ───────────────────────────────────────────────────────────────

    _buildCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'matrix-rain';
        this.canvas.style.cssText = [
            'position:fixed', 'top:0', 'left:0',
            'width:100%', 'height:100%',
            'pointer-events:none', 'z-index:0',
            'opacity:0.18',
            'transition:opacity 1.2s ease'
        ].join(';');
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const cols = Math.floor(this.canvas.width / 16);
        this.columns = Array.from({ length: cols }, () => ({
            y: Math.random() * -this.canvas.height,
            speed: 0.8 + Math.random() * 1.2
        }));
    }

    _startRain() {
        const mood = SIMULATION_MOODS[this.mood];
        let frame = 0;

        const draw = () => {
            this.animId = requestAnimationFrame(draw);
            frame++;

            // Fade trail
            this.ctx.fillStyle = 'rgba(10,10,15,0.12)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const activeMood = SIMULATION_MOODS[this.mood];
            this.ctx.font = '14px JetBrains Mono, monospace';

            const activeCount = Math.floor(this.columns.length * activeMood.density);

            for (let i = 0; i < activeCount; i++) {
                const col = this.columns[i];
                const ch  = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                const x   = i * 16;

                // Lead char — bright
                this.ctx.fillStyle = activeMood.color;
                this.ctx.shadowColor = activeMood.glow;
                this.ctx.shadowBlur  = this.pulseActive ? 12 : 6;
                this.ctx.fillText(ch, x, col.y);

                // Trail char — dimmer
                if (col.y > 20) {
                    this.ctx.fillStyle = activeMood.color + '55';
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillText(
                        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
                        x, col.y - 16
                    );
                }

                col.y += 16 * activeMood.speed * col.speed;
                if (col.y > this.canvas.height + 100) {
                    col.y = Math.random() * -200;
                }
            }

            this.ctx.shadowBlur = 0;
        };

        draw();
    }

    // ─── Panel ────────────────────────────────────────────────────────────────

    _buildPanel() {
        const panel = document.createElement('section');
        panel.className = 'panel simulation-panel';
        panel.id = 'simulation-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>⬡ Matrix Simulation</h2>
                <div class="sim-mood-badge" id="sim-mood-badge">
                    <span class="sim-mood-dot" id="sim-mood-dot"></span>
                    <span id="sim-mood-label">CALIBRATING</span>
                </div>
            </div>
            <div class="panel-content">
                <div class="sim-stats">
                    <div class="sim-stat">
                        <div class="sim-stat-label">Simulation Layer</div>
                        <div class="sim-stat-value" id="sim-layer">TRUTH-OS/v10</div>
                    </div>
                    <div class="sim-stat">
                        <div class="sim-stat-label">Coherence</div>
                        <div class="sim-stat-value" id="sim-coherence">98%</div>
                    </div>
                    <div class="sim-stat">
                        <div class="sim-stat-label">Truth Events</div>
                        <div class="sim-stat-value" id="sim-events">0</div>
                    </div>
                    <div class="sim-stat">
                        <div class="sim-stat-label">Signal</div>
                        <div class="sim-stat-value" id="sim-signal">STABLE</div>
                    </div>
                </div>

                <div class="sim-prompt-box" id="sim-prompt-box">
                    <div class="sim-prompt-label">// SIMULATION TRUTH PROMPT</div>
                    <div class="sim-prompt-text" id="sim-prompt-text">
                        Simulation online. Awaiting truth input.
                    </div>
                </div>

                <div class="sim-controls">
                    <button class="btn-sm btn-ghost" onclick="matrixSimulation.pulse()">Pulse</button>
                    <button class="btn-sm btn-ghost" onclick="matrixSimulation.cyclePrompt()">Next Prompt</button>
                    <button class="btn-sm btn-ghost" onclick="matrixSimulation.toggleRain()">Toggle Rain</button>
                </div>
            </div>
        `;

        // Insert before footer — after the last existing panel
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.appendChild(panel);
        }
    }

    // ─── Mood engine ──────────────────────────────────────────────────────────

    setScore(score) {
        this.score = score;
        const prev = this.mood;

        if      (score >= 80) this.mood = 'ALIGNED';
        else if (score >= 60) this.mood = 'CALIBRATING';
        else if (score >= 40) this.mood = 'DISTORTED';
        else                  this.mood = 'BLOCKED';

        if (prev !== this.mood) this._onMoodChange(prev);
        this._refreshUI();
    }

    _onMoodChange(prev) {
        const moodDef = SIMULATION_MOODS[this.mood];
        this.promptIndex = 0;
        this._flashPanel(moodDef.color);
        this._log(`Simulation mood shifted: ${prev} → ${this.mood}`);
        this.canvas.style.opacity = this.mood === 'ALIGNED' ? '0.24' :
                                    this.mood === 'BLOCKED'  ? '0.32' : '0.18';
    }

    _refreshUI() {
        const moodDef = SIMULATION_MOODS[this.mood];

        const badge = document.getElementById('sim-mood-badge');
        const dot   = document.getElementById('sim-mood-dot');
        const label = document.getElementById('sim-mood-label');
        const coh   = document.getElementById('sim-coherence');
        const sig   = document.getElementById('sim-signal');

        if (badge) badge.style.setProperty('--sim-color', moodDef.color);
        if (dot)   dot.style.background = moodDef.color;
        if (label) label.textContent = moodDef.label;
        if (coh)   coh.textContent = `${this.score}%`;
        if (coh)   coh.style.color = moodDef.color;
        if (sig)   {
            sig.textContent = this.mood === 'ALIGNED'     ? 'STABLE'    :
                              this.mood === 'CALIBRATING' ? 'RISING'    :
                              this.mood === 'DISTORTED'   ? 'UNSTABLE'  : 'REJECTED';
            sig.style.color = moodDef.color;
        }

        // Reflect mood on body for CSS variable cascades
        document.body.dataset.simMood = this.mood.toLowerCase();
    }

    // ─── Truth event (called on each activation) ──────────────────────────────

    onTruthEvent(result) {
        const eventsEl = document.getElementById('sim-events');
        if (eventsEl) eventsEl.textContent = parseInt(eventsEl.textContent || '0') + 1;

        if (result.success) {
            this.pulse();
            this._log('Truth event: activation accepted — coherence pulse fired');
        } else {
            this._flashPanel('#ef4444');
            this._log('Truth event: activation blocked — distortion detected');
        }

        // Update score from engine if available
        if (typeof aiEngine !== 'undefined') {
            this.setScore(aiEngine.calculateAlignmentScore());
        }
    }

    // ─── Prompts ──────────────────────────────────────────────────────────────

    _startPromptCycle() {
        this.promptTimer = setInterval(() => this.cyclePrompt(), 9000);
        setTimeout(() => this.cyclePrompt(), 1800);
    }

    cyclePrompt() {
        const prompts = TRUTH_SIMULATION_PROMPTS[this.mood];
        this.promptIndex = (this.promptIndex + 1) % prompts.length;
        const el = document.getElementById('sim-prompt-text');
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = prompts[this.promptIndex];
            el.style.opacity = '1';
        }, 300);
    }

    // ─── Visual effects ───────────────────────────────────────────────────────

    pulse() {
        this.pulseActive = true;
        this.canvas.style.opacity = '0.38';
        setTimeout(() => {
            this.pulseActive = false;
            this.canvas.style.opacity = this.mood === 'ALIGNED' ? '0.24' : '0.18';
        }, 800);
    }

    _flashPanel(color) {
        const panel = document.getElementById('simulation-panel');
        if (!panel) return;
        panel.style.boxShadow = `0 0 40px ${color}55, 0 0 80px ${color}22`;
        setTimeout(() => { panel.style.boxShadow = ''; }, 1200);
    }

    toggleRain() {
        const current = parseFloat(this.canvas.style.opacity);
        this.canvas.style.opacity = current < 0.05 ? '0.18' : '0.02';
    }

    // ─── Util ─────────────────────────────────────────────────────────────────

    _log(msg) {
        if (typeof addLogEntry === 'function') addLogEntry(`[Simulation] ${msg}`);
    }

    _bindEvents() {
        // Hook into document-level truth events fired from the engine
        document.addEventListener('truthos:activation', e => {
            this.onTruthEvent(e.detail);
        });
        document.addEventListener('truthos:score', e => {
            this.setScore(e.detail.score);
        });
    }
}

// Boot after DOM + other scripts are ready
window.addEventListener('load', () => {
    window.matrixSimulation = new MatrixSimulation();
    console.log('[Matrix Simulation] Mood engine online');
});
