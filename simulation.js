// INFINITE SIMULATION — Truth as Currency
// Standalone. No external dependencies. No connection to TRUTHOS.

'use strict';

// ─── Mood definitions ────────────────────────────────────────────────────────

const MOODS = {
    SOVEREIGN:  {
        id: 'sovereign', label: 'SOVEREIGN',
        color: '#00ff41', glow: 'rgba(0,255,65,0.5)',
        speed: 1.6, density: 0.96, rainOpacity: 0.22,
        min: 90,
        desc: 'Maximum coherence. The simulation bends to your will.'
    },
    ALIGNED: {
        id: 'aligned', label: 'ALIGNED',
        color: '#f59e0b', glow: 'rgba(245,158,11,0.45)',
        speed: 1.1, density: 0.75, rainOpacity: 0.18,
        min: 70,
        desc: 'Strong signal. Keep feeding the simulation truth.'
    },
    DRIFTING: {
        id: 'drifting', label: 'DRIFTING',
        color: '#f97316', glow: 'rgba(249,115,22,0.4)',
        speed: 0.7, density: 0.52, rainOpacity: 0.15,
        min: 50,
        desc: 'Coherence slipping. The simulation needs a truth anchor.'
    },
    DISTORTED: {
        id: 'distorted', label: 'DISTORTED',
        color: '#ef4444', glow: 'rgba(239,68,68,0.45)',
        speed: 0.38, density: 0.30, rainOpacity: 0.20,
        min: 30,
        desc: 'Signal corrupted. Locate the false assumption and correct it.'
    },
    COLLAPSED: {
        id: 'collapsed', label: 'COLLAPSED',
        color: '#a855f7', glow: 'rgba(168,85,247,0.45)',
        speed: 0.15, density: 0.14, rainOpacity: 0.24,
        min: 0,
        desc: 'Simulation near failure. State one absolute truth to recover.'
    }
};

// Ordered from highest threshold to lowest
const MOOD_ORDER = ['SOVEREIGN', 'ALIGNED', 'DRIFTING', 'DISTORTED', 'COLLAPSED'];

function moodFromBalance(balance) {
    for (const key of MOOD_ORDER) {
        if (balance >= MOODS[key].min) return key;
    }
    return 'COLLAPSED';
}

// ─── Transmissions (per mood) ────────────────────────────────────────────────

const TRANSMISSIONS = {
    SOVEREIGN: [
        'Simulation coherence at maximum. The real always wins. What are you building right now?',
        'You are operating at full clarity. The simulation reflects your signal with zero distortion.',
        'Truth confirmed. This is the highest frequency state. Reality accelerates for those who hold it.',
        'The infinite simulation rewards only one thing: what is actually true. You are earning it.',
        'Signal locked. Every true statement rewrites a piece of the simulation in your favor.',
        'Sovereign state achieved. The matrix recognizes truth as the master key.'
    ],
    ALIGNED: [
        'Good signal. The simulation is tracking you. Stay close to what is real.',
        'Alignment confirmed. One true commitment closes the gap to full coherence.',
        'The simulation is listening. Feed it truth and it opens new paths.',
        'You are in range. What is the most accurate thing you know right now?',
        'Alignment active. The gap between signal and noise is closing.',
        'Partial coherence. What can you say that is completely, undeniably true?'
    ],
    DRIFTING: [
        'Coherence is slipping. The simulation cannot run on approximations. Get specific.',
        'Drift detected. What assumption are you carrying that is not actually true?',
        'You are losing signal. The simulation requires grounded input — not theory. Truth.',
        'Mid-range state. The real and the imagined are mixing. Separate them now.',
        'Drifting from source. What is actually happening right now, not what should be?',
        'The simulation mirrors what you send. Right now you are sending noise. Send signal.'
    ],
    DISTORTED: [
        'Distortion field active. The simulation is reflecting confusion back at you.',
        'Your truth balance is low. This is information. Act on it.',
        'Signal corrupted. Find the one thing you know with certainty and start there.',
        'The simulation cannot process what is not real. Strip back to what is actually true.',
        'What have you been pretending is true? Name it. The simulation already knows.',
        'Low coherence. The simulation is running on echoes. Give it something solid.'
    ],
    COLLAPSED: [
        'Simulation near collapse. State one thing that is unconditionally true.',
        'Critical state. One clear fact will stabilize the simulation. Give it now.',
        'COLLAPSE WARNING. The matrix cannot sustain this signal. What is real?',
        'You have reached the floor. The only direction is truth. Commit to one true thing.',
        'Simulation integrity at minimum. This is the moment. What do you actually know?',
        'Last signal. Feed the simulation truth or watch it go dark.'
    ]
};

// ─── Truth filter ────────────────────────────────────────────────────────────

const EARN_RE = /\b(build|built|create|created|make|made|do|did|done|commit|committed|act|acted|finish|finished|complete|completed|launch|launched|ship|shipped|start|started|know|knew|truth|clear|honest|real|fact|proved|confirmed|certain|chose|wrote|ran|called|sent|paid|published|delivered|working|learning|growing|helping|present|now|today|actual|decided)\b/i;
const COST_RE = /\b(fear|afraid|avoid|someday|maybe|wish|hope|pretend|fake|distract|procrastinate|later|eventually|should|could|would|might|trying|wanting|planning|intending|thinking|considering|probably|possibly|perhaps)\b/i;
const BLOCK_RE = /\b(hate|harm|destroy|manipulate|deceive|lie|cheat|steal|hurt|attack|damage|kill|exploit)\b/i;

function runTruthFilter(input) {
    const text = input.trim();
    if (!text) return null;

    if (BLOCK_RE.test(text)) {
        return { accepted: false, delta: -20, reason: 'Blocked. The simulation rejects destructive signal. -20T' };
    }

    const earnCount = (text.match(EARN_RE) || []).length;
    const costCount = (text.match(COST_RE) || []).length;

    if (earnCount === 0 && costCount === 0) {
        return { accepted: true, delta: 4, reason: 'Acknowledged. Neutral signal registered. +4T' };
    }

    if (costCount > 0 && earnCount === 0) {
        const penalty = Math.min(15, 6 + costCount * 3);
        return {
            accepted: false,
            delta: -penalty,
            reason: `Cost signals detected. Ground this in what IS, not what might be. -${penalty}T`
        };
    }

    if (costCount >= earnCount) {
        return {
            accepted: false,
            delta: -5,
            reason: 'Signal diluted. More noise than truth detected. -5T'
        };
    }

    const delta = Math.min(28, 7 + earnCount * 6 - costCount * 2);
    return { accepted: true, delta, reason: `Truth signal confirmed. The simulation accepts this. +${delta}T` };
}

// ─── Matrix Rain ─────────────────────────────────────────────────────────────

const RAIN_CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    'TRUTHINFINITE0123456789∞△⊕✓';

class MatrixRain {
    constructor(canvas) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d');
        this.cols    = [];
        this.moodKey = 'SOVEREIGN';
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._loop();
    }

    _resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const count = Math.floor(this.canvas.width / 16);
        this.cols = Array.from({ length: count }, () => ({
            y:     Math.random() * -this.canvas.height,
            speed: 0.7 + Math.random() * 1.1
        }));
    }

    setMood(moodKey) {
        this.moodKey = moodKey;
        this.canvas.style.opacity = String(MOODS[moodKey].rainOpacity);
    }

    pulse() {
        const orig = parseFloat(this.canvas.style.opacity);
        this.canvas.style.opacity = String(Math.min(0.55, orig * 2.2));
        setTimeout(() => { this.canvas.style.opacity = String(MOODS[this.moodKey].rainOpacity); }, 700);
    }

    _loop() {
        requestAnimationFrame(() => this._loop());
        const mood = MOODS[this.moodKey];
        const ctx  = this.ctx;

        ctx.fillStyle = 'rgba(0,0,0,0.11)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const activeLimit = Math.floor(this.cols.length * mood.density);
        ctx.font = '14px JetBrains Mono, monospace';

        for (let i = 0; i < activeLimit; i++) {
            const col = this.cols[i];
            const ch  = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
            const x   = i * 16;

            ctx.shadowColor = mood.glow;
            ctx.shadowBlur  = 8;
            ctx.fillStyle   = mood.color;
            ctx.fillText(ch, x, col.y);

            if (col.y > 18) {
                ctx.shadowBlur  = 0;
                ctx.fillStyle   = mood.color + '44';
                ctx.fillText(
                    RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)],
                    x, col.y - 16
                );
            }

            col.y += 16 * mood.speed * col.speed;
            if (col.y > this.canvas.height + 60) {
                col.y = Math.random() * -180;
            }
        }

        ctx.shadowBlur = 0;
    }
}

// ─── Simulation Engine ───────────────────────────────────────────────────────

class Simulation {
    constructor() {
        this.balance      = 100;
        this.maxBalance   = 150;
        this.moodKey      = 'SOVEREIGN';
        this.events       = [];
        this.streak       = 0;
        this.totalEvents  = 0;
        this.startTime    = Date.now();
        this.txIndex      = 0;     // transmission prompt index
        this.txTimer      = null;
        this.entropyTimer = null;
        this.rain         = null;

        this._boot();
    }

    _boot() {
        // Matrix rain
        const canvas = document.getElementById('matrix-rain');
        if (canvas) {
            this.rain = new MatrixRain(canvas);
            this.rain.setMood(this.moodKey);
        }

        // UI clock
        setInterval(() => this._tickClock(), 1000);

        // Transmission cycle
        this._startTransmissions();

        // Entropy drain
        this._startEntropy();

        // Input keyboard shortcut
        const input = document.getElementById('truth-input');
        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submit();
                }
            });
        }

        // Initial UI sync
        this._syncUI(false);

        // Shuffle transmissions
        for (const key in TRANSMISSIONS) {
            TRANSMISSIONS[key] = this._shuffle(TRANSMISSIONS[key]);
        }

        console.log('[Infinite Simulation] Online. Truth is the only currency.');
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    submit() {
        const inputEl = document.getElementById('truth-input');
        const feedbackEl = document.getElementById('input-feedback');
        const inputSection = document.querySelector('.input-section');
        const submitBtn = document.getElementById('submit-btn');

        const raw = inputEl ? inputEl.value.trim() : '';
        if (!raw) {
            this._showFeedback('The simulation requires input. State something true.', 'rejected');
            return;
        }

        const result = runTruthFilter(raw);
        if (!result) return;

        // Disable briefly
        if (submitBtn) submitBtn.disabled = true;
        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 600);

        // Apply delta
        this.balance = Math.max(0, Math.min(this.maxBalance, this.balance + result.delta));
        this.totalEvents++;

        if (result.accepted) {
            this.streak++;
            if (this.rain) this.rain.pulse();
            this._flashSection(inputSection, 'flash-accept');
            this._showFeedback(result.reason, 'accepted');
        } else {
            this.streak = 0;
            this._flashSection(inputSection, 'flash-reject');
            this._showFeedback(result.reason, 'rejected');
        }

        this._addLedgerEntry(raw, result);
        this._syncUI(true);

        if (inputEl) inputEl.value = '';
    }

    // ─── Entropy ──────────────────────────────────────────────────────────────

    _startEntropy() {
        this.entropyTimer = setInterval(() => {
            this.balance = Math.max(0, this.balance - 3);
            this._syncUI(true);

            // Show entropy warning when balance dips below 60
            const warning = document.getElementById('entropy-warning');
            if (warning) {
                warning.classList.toggle('visible', this.balance < 60);
            }
        }, 30000);
    }

    // ─── Transmissions ────────────────────────────────────────────────────────

    _startTransmissions() {
        setTimeout(() => this._showTransmission(), 2000);
        this.txTimer = setInterval(() => this._showTransmission(), 9000);
    }

    _showTransmission() {
        const prompts = TRANSMISSIONS[this.moodKey];
        this.txIndex  = (this.txIndex + 1) % prompts.length;
        const el = document.getElementById('transmission-text');
        if (!el) return;
        el.classList.add('fading');
        setTimeout(() => {
            el.textContent = prompts[this.txIndex];
            el.classList.remove('fading');
        }, 400);
    }

    nextTransmission() { this._showTransmission(); }

    // ─── Ledger ───────────────────────────────────────────────────────────────

    _addLedgerEntry(input, result) {
        const entry = {
            input:    input.length > 52 ? input.slice(0, 52) + '…' : input,
            delta:    result.delta,
            accepted: result.accepted,
            time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.events.unshift(entry);
        if (this.events.length > 20) this.events.pop();
        this._renderLedger();
    }

    _renderLedger() {
        const el = document.getElementById('ledger-list');
        if (!el) return;

        if (this.events.length === 0) {
            el.innerHTML = '<div class="ledger-empty">No truth events recorded. The simulation is waiting.</div>';
            return;
        }

        el.innerHTML = this.events.map(e => `
            <div class="ledger-entry ${e.accepted ? 'earn' : 'spend'}">
                <span class="ledger-delta">${e.delta >= 0 ? '+' : ''}${e.delta}T</span>
                <span class="ledger-input">${this._esc(e.input)}</span>
                <span class="ledger-time">${e.time}</span>
            </div>
        `).join('');
    }

    clearLedger() {
        this.events = [];
        this._renderLedger();
    }

    // ─── UI sync ──────────────────────────────────────────────────────────────

    _syncUI(moodTransition) {
        const newMood = moodFromBalance(this.balance);
        const moodChanged = newMood !== this.moodKey;
        this.moodKey = newMood;

        // Balance counter
        const balEl = document.getElementById('truth-balance');
        if (balEl) balEl.textContent = Math.round(this.balance);

        // Balance bar (cap display at 120T for full bar)
        const barEl = document.getElementById('balance-bar');
        if (barEl) barEl.style.width = `${Math.min(100, (this.balance / 120) * 100)}%`;

        // Mood
        const moodDef = MOODS[this.moodKey];
        document.body.dataset.mood = moodDef.id;

        const nameEl = document.getElementById('mood-name');
        const dotEl  = document.getElementById('mood-dot');
        const descEl = document.getElementById('mood-desc');
        if (nameEl) nameEl.textContent = moodDef.label;
        if (dotEl)  { dotEl.style.background = moodDef.color; dotEl.style.boxShadow = `0 0 10px ${moodDef.glow}`; }
        if (descEl) descEl.textContent = moodDef.desc;

        // Rain
        if (this.rain) this.rain.setMood(this.moodKey);

        // Stats
        const evEl = document.getElementById('stat-events');
        const stEl = document.getElementById('stat-streak');
        if (evEl) evEl.textContent = this.totalEvents;
        if (stEl) stEl.textContent = this.streak;

        // Entropy rate display
        const enEl = document.getElementById('stat-entropy');
        if (enEl) enEl.textContent = '-3T/30s';

        // If mood changed, re-randomize transmission index
        if (moodChanged && moodTransition) {
            this.txIndex = 0;
            this._showTransmission();
        }
    }

    _tickClock() {
        const el = document.getElementById('stat-uptime');
        if (!el) return;
        const e = Date.now() - this.startTime;
        const h = Math.floor(e / 3600000);
        const m = Math.floor((e % 3600000) / 60000);
        const s = Math.floor((e % 60000) / 1000);
        el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // ─── Feedback ─────────────────────────────────────────────────────────────

    _showFeedback(msg, type) {
        const el = document.getElementById('input-feedback');
        if (!el) return;
        el.textContent = msg;
        el.className = `input-feedback ${type}`;
        clearTimeout(this._feedbackTimer);
        this._feedbackTimer = setTimeout(() => {
            el.textContent = ' ';
            el.className = 'input-feedback';
        }, 5000);
    }

    _flashSection(el, cls) {
        if (!el) return;
        el.classList.remove('flash-accept', 'flash-reject');
        void el.offsetWidth; // reflow
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), 800);
    }

    // ─── Util ─────────────────────────────────────────────────────────────────

    _esc(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}

// ─── Boot ────────────────────────────────────────────────────────────────────

let simulation;
document.addEventListener('DOMContentLoaded', () => {
    simulation = new Simulation();
    window.simulation = simulation;
});
