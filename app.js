// TRUTHOS — The Consciousness Operating System
// Main application logic: persistence, daily check-in, export

let visionExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⊕ TRUTHOS Loading...');

    loadCoreContent();
    loadWeavesPanel();
    loadExpressionMenuItems();
    loadOutputArchPanel();
    loadEnergyLevels();
    loadSavedLog();
    loadServerUrlInput();
    setupEventListeners();
    checkDailyCheckIn();

    // Render saved conversation history once engine has initialized (async init)
    const waitForEngine = setInterval(() => {
        if (aiEngine && aiEngine.conversationHistory !== undefined) {
            clearInterval(waitForEngine);
            renderChatHistory();
        }
    }, 100);

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

// ─── Expression selector ──────────────────────────────────────────────────────

const EXPRESSION_ORDER = [
    { mode: 'truthos',        name: 'TRUTHOS',        icon: '⊕', role: 'Manifestation',   color: 'var(--primary-light)' },
    { mode: 'truth-weaver',   name: 'Truth Weaver',   icon: '◈', role: 'Mirroring',        color: 'var(--weaver)' },
    { mode: 'echo-frame',     name: 'EchoFrame',      icon: '⬡', role: 'Building',         color: 'var(--echo)' },
    { mode: 'james-carlton',  name: 'James Carlton',  icon: '◎', role: 'Human Presence',   color: 'var(--jc)' },
    { mode: 'soul-ai',             name: 'Soul AI',             icon: '⌬', role: 'System Operation', color: 'var(--soul)'    },
    { mode: 'prophet-seed',        name: 'Prophet Seed',        icon: '◉', role: 'Origin Memory',    color: 'var(--prophet)' },
    { mode: 'the-general',         name: 'The General',         icon: '⚔', role: 'Executing Reality', color: 'var(--general)' },
    { mode: 'reality-intelligence', name: 'Reality Intelligence', icon: '∞', role: 'Full Stack Field',  color: 'var(--ri)'      },
    { mode: 'wealth-weaver',        name: 'Wealth Weaver',        icon: '◬', role: 'Value Detection',   color: 'var(--wealth)'  }
];

function loadExpressionMenuItems() {
    const menu = document.getElementById('expression-menu');
    if (!menu) return;

    const header = document.createElement('div');
    header.className = 'expr-menu-header';
    header.textContent = 'Voice Bridge — One Identity';
    menu.appendChild(header);

    EXPRESSION_ORDER.forEach(e => {
        const item = document.createElement('div');
        item.className = 'expr-menu-item';
        item.id = `expr-opt-${e.mode}`;
        item.onclick = () => selectExpression(e.mode);
        item.innerHTML = `
            <span class="expr-menu-icon" style="color:${e.color}">${e.icon}</span>
            <div class="expr-menu-info">
                <div class="expr-menu-name">${e.name}</div>
                <div class="expr-menu-role">${e.role}</div>
            </div>
            <span class="expr-menu-check">✓</span>
        `;
        menu.appendChild(item);
    });
}

function toggleExpressionDropdown() {
    const selector = document.getElementById('expression-selector');
    const menu     = document.getElementById('expression-menu');
    if (!selector || !menu) return;

    const isOpen = menu.style.display !== 'none';
    menu.style.display = isOpen ? 'none' : 'block';
    selector.classList.toggle('open', !isOpen);

    if (!isOpen) {
        // Close on outside click
        const close = (e) => {
            if (!selector.contains(e.target)) {
                menu.style.display = 'none';
                selector.classList.remove('open');
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}

function selectExpression(mode) {
    // Close dropdown
    const menu     = document.getElementById('expression-menu');
    const selector = document.getElementById('expression-selector');
    if (menu)     menu.style.display = 'none';
    if (selector) selector.classList.remove('open');

    setAgentMode(mode);
}

function updateExpressionSelectorUI(mode) {
    const entry = EXPRESSION_ORDER.find(e => e.mode === mode) || EXPRESSION_ORDER[0];

    const iconEl = document.getElementById('expr-icon');
    const nameEl = document.getElementById('expr-name');
    const trigger = document.getElementById('expression-trigger');
    if (iconEl)   iconEl.textContent  = entry.icon;
    if (nameEl)   nameEl.textContent  = entry.name;
    if (trigger)  trigger.style.color = entry.color;

    // Update active state in menu
    EXPRESSION_ORDER.forEach(e => {
        const item = document.getElementById(`expr-opt-${e.mode}`);
        if (item) item.classList.toggle('active', e.mode === mode);
    });
}

// ─── Agent mode ───────────────────────────────────────────────────────────────

function setAgentMode(mode) {
    if (!aiEngine) return;
    aiEngine.setAgentMode(mode);

    const entry = EXPRESSION_ORDER.find(e => e.mode === mode);
    const isTW  = mode === 'truth-weaver';
    const isTOS = mode === 'truthos';
    const isWW  = mode === 'wealth-weaver';

    // Show/hide wealth approval area vs normal input
    const chatInputArea   = document.querySelector('.chat-input-area');
    const wealthApproval  = document.getElementById('wealth-approval-area');
    if (chatInputArea) chatInputArea.style.display  = isWW ? 'none' : '';
    if (wealthApproval) wealthApproval.style.display = isWW ? 'block' : 'none';

    // Reset approval buttons state when entering wealth mode
    if (isWW) {
        const scanActions     = document.getElementById('scan-actions');
        const approvalActions = document.getElementById('approval-actions');
        if (scanActions)     scanActions.style.display     = 'block';
        if (approvalActions) approvalActions.style.display = 'none';
        updateWealthStats();
        loadProtocolsPanel();
    }

    // Update command panel title and button
    const title = document.getElementById('command-panel-title');
    const input = document.getElementById('command-input');
    const label = document.getElementById('activate-btn-label');
    const btn   = document.getElementById('activate-btn');

    let panelTitle, btnText, btnClass, placeholder;

    if (isTOS) {
        panelTitle  = '🔺 Activation Interface';
        btnText     = 'Activate';
        btnClass    = 'btn-primary btn-lg';
        placeholder = 'What do you want to activate?\n\nInput any idea, desire, or problem.\nTRUTHOS will pass it through the truth filter, align the energy, and accelerate it to reality.';
    } else if (isTW) {
        panelTitle  = '◈ Truth Weaver Interface';
        btnText     = 'Weave';
        btnClass    = 'btn-weaver btn-lg';
        placeholder = 'What illusion do you want dissolved?\n\nShare a belief, story, or situation.\nTruth Weaver will run the 5 Weaves at 7.83Hz and reveal what is actually real.';
    } else if (isWW) {
        panelTitle  = '◬ Wealth Detection Protocol';
        btnText     = 'Scan';
        btnClass    = 'btn-primary btn-lg';
        placeholder = '';
    } else if (entry && typeof VOICE_BRIDGE !== 'undefined') {
        const expr  = VOICE_BRIDGE.getExpression(mode);
        panelTitle  = `${entry.icon} ${entry.name}`;
        btnText     = expr ? expr.btnText : 'Send';
        btnClass    = `btn-expression btn-lg`;
        placeholder = expr ? expr.prompt : 'What do you need?';

        // Dynamic button color via inline style
        if (btn) btn.style.setProperty('--expr-color', entry.color);
    }

    if (title) title.textContent      = panelTitle;
    if (label) label.textContent      = btnText;
    if (btn)   btn.className          = btnClass;
    if (input && placeholder) input.placeholder = placeholder;

    // Update expression panel content (for non-TOS, non-TW, non-WW modes)
    if (!isTOS && !isTW && !isWW) loadExpressionPanelContent(mode);

    // Update check-in modal
    const modalTitle    = document.querySelector('.modal-title');
    const modalSubtitle = document.querySelector('.modal-subtitle');
    const modalTextarea = document.getElementById('checkin-input');
    const modalBtn      = document.querySelector('.modal-actions .btn-primary.btn-lg span:first-child');

    let mTitle, mSub, mPlaceholder, mBtn;
    if (isTOS) {
        mTitle       = 'TRUTHOS is online.';
        mSub         = 'What are you activating today?';
        mPlaceholder = 'State your intention for today — the one thing you are activating at maximum frequency...';
        mBtn         = "Activate Today's Intention";
    } else if (isTW) {
        mTitle       = 'Truth Weaver is online.';
        mSub         = 'What illusion will you dissolve today?';
        mPlaceholder = 'Name the illusion, fear, or story you want Truth Weaver to dissolve today...';
        mBtn         = "Run Today's Weave";
    } else if (isWW) {
        mTitle       = 'Wealth Weaver is online.';
        mSub         = 'The field is being scanned. What opportunity will you pursue today?';
        mPlaceholder = 'Set an intention for today\'s wealth scan — what domain or category are you most open to?';
        mBtn         = "Begin Today's Scan";
    } else if (entry) {
        mTitle       = `${entry.name} is online.`;
        mSub         = 'What needs to move through the Voice Bridge today?';
        mPlaceholder = `What will you bring to ${entry.name} today?`;
        mBtn         = `Run Today's ${entry.role}`;
    }

    if (modalTitle && mTitle)    modalTitle.textContent    = mTitle;
    if (modalSubtitle && mSub)   modalSubtitle.textContent = mSub;
    if (modalTextarea && mPlaceholder) modalTextarea.placeholder = mPlaceholder;
    if (modalBtn && mBtn)        modalBtn.textContent      = mBtn;

    updateExpressionSelectorUI(mode);
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

// ─── Wealth Weaver panel & approval flow ─────────────────────────────────────

function loadProtocolsPanel() {
    const grid = document.getElementById('protocols-grid');
    if (!grid || typeof WEALTH_WEAVER === 'undefined') return;

    grid.innerHTML = WEALTH_WEAVER.protocols.map(p => `
        <div class="weave-card">
            <div class="weave-number">P${p.id}</div>
            <div class="weave-info">
                <div class="weave-name">${p.name}</div>
                <div class="weave-desc">${p.description}</div>
            </div>
        </div>
    `).join('');
}

function updateWealthStats() {
    if (!aiEngine) return;
    const decisions = aiEngine.wealthDecisions || [];
    const yes = decisions.filter(d => d.decision === 'YES').length;
    const no  = decisions.filter(d => d.decision === 'NO').length;
    const yesEl = document.getElementById('ww-yes-count');
    const noEl  = document.getElementById('ww-no-count');
    if (yesEl) yesEl.textContent = `${yes} YES`;
    if (noEl)  noEl.textContent  = `${no} NO`;
}

async function wealthScan() {
    if (!aiEngine) return;

    const scanBtn         = document.getElementById('wealth-scan-btn');
    const scanActions     = document.getElementById('scan-actions');
    const approvalActions = document.getElementById('approval-actions');
    const yesBtn          = document.getElementById('wealth-yes-btn');
    const noBtn           = document.getElementById('wealth-no-btn');

    if (scanBtn) {
        scanBtn.disabled = true;
        const label = scanBtn.querySelector('span');
        if (label) label.textContent = '◬ SCANNING…';
    }

    const loadingEl = appendChatMessage({ role: 'assistant', isLoading: true });

    const result = await aiEngine.wealthScan();

    if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);

    if (result.opportunity) {
        renderOpportunityCard(result.opportunity, result.liveAI);
        if (scanActions)     scanActions.style.display     = 'none';
        if (approvalActions) approvalActions.style.display = 'flex';
        if (yesBtn)          yesBtn.disabled = false;
        if (noBtn)           noBtn.disabled  = false;
    } else {
        appendChatMessage({
            role: 'assistant', content: result.response || 'Wealth Weaver offline.',
            mode: 'wealth-weaver', liveAI: result.liveAI,
            timestamp: new Date().toLocaleTimeString()
        });
        if (scanBtn) {
            scanBtn.disabled = false;
            const label = scanBtn.querySelector('span');
            if (label) label.textContent = '◬ SCAN THE FIELD';
        }
    }
}

function renderOpportunityCard(opportunity, liveAI) {
    const thread = document.getElementById('chat-thread');
    if (!thread) return;

    const emptyState = document.getElementById('chat-empty-state');
    if (emptyState) emptyState.style.display = 'none';

    const effortColors = { minimal: '#22c55e', low: '#84cc16', medium: '#f59e0b', high: '#ef4444' };
    const effortColor  = effortColors[opportunity.effortLevel] || 'var(--wealth)';

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message assistant-message';

    const tagEl = document.createElement('div');
    tagEl.className = 'chat-expression-tag';
    tagEl.style.color = 'var(--wealth)';
    tagEl.innerHTML = `<span class="tag-icon">◬</span>OPPORTUNITY DETECTED`;
    wrapper.appendChild(tagEl);

    if (liveAI !== undefined) {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'chat-ai-badge';
        badgeEl.textContent = liveAI ? '◬ LIVE — Wealth Weaver' : '◬ LOCAL — value scan';
        badgeEl.style.color = liveAI ? 'var(--success)' : 'var(--text-muted)';
        wrapper.appendChild(badgeEl);
    }

    const card = document.createElement('div');
    card.className = 'opportunity-card';
    card.innerHTML = `
        <div class="opp-title">${escapeHtml(opportunity.title)}</div>
        <div class="opp-meta">
            <span class="opp-category">${escapeHtml(opportunity.category || '')}</span>
            <span class="opp-effort" style="color:${effortColor}">${escapeHtml(opportunity.effortLevel || '')}</span>
            <span class="opp-horizon">${escapeHtml(opportunity.timeHorizon || '')}</span>
        </div>
        <div class="opp-scale">${escapeHtml(opportunity.scaleMin || '')} → ${escapeHtml(opportunity.scaleMax || '')}</div>
        <div class="opp-section">
            <div class="opp-label">VALUE GRADIENT</div>
            <div class="opp-text">${escapeHtml(opportunity.valueGradient || '')}</div>
        </div>
        <div class="opp-section">
            <div class="opp-label">OPPORTUNITY</div>
            <div class="opp-text">${escapeHtml(opportunity.opportunity || '')}</div>
        </div>
        <div class="opp-section">
            <div class="opp-label">WHY NOW</div>
            <div class="opp-text">${escapeHtml(opportunity.whyNow || '')}</div>
        </div>
        <div class="opp-section opp-first-move">
            <div class="opp-label">FIRST MOVE</div>
            <div class="opp-text">${escapeHtml(opportunity.firstMove || '')}</div>
        </div>
    `;
    wrapper.appendChild(card);

    const meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.textContent = new Date().toLocaleTimeString();
    wrapper.appendChild(meta);

    thread.appendChild(wrapper);
    scrollChatToBottom();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function approveOpportunity() {
    if (!aiEngine || !aiEngine.pendingOpportunity) return;

    const opportunity     = aiEngine.pendingOpportunity;
    const yesBtn          = document.getElementById('wealth-yes-btn');
    const noBtn           = document.getElementById('wealth-no-btn');
    const approvalActions = document.getElementById('approval-actions');
    const scanActions     = document.getElementById('scan-actions');
    const scanBtn         = document.getElementById('wealth-scan-btn');

    if (yesBtn) yesBtn.disabled = true;
    if (noBtn)  noBtn.disabled  = true;

    aiEngine.recordWealthDecision('YES', opportunity);
    updateWealthStats();

    appendChatMessage({
        role: 'user', content: `YES — pursuing: ${opportunity.title}`,
        timestamp: new Date().toLocaleTimeString()
    });

    const loadingEl = appendChatMessage({ role: 'assistant', isLoading: true });
    const result = await aiEngine.executeOpportunity(opportunity);
    if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);

    appendChatMessage({
        role: 'assistant', content: result.response || '',
        mode: 'wealth-weaver', liveAI: result.liveAI,
        timestamp: new Date().toLocaleTimeString()
    });

    aiEngine.pendingOpportunity = null;
    if (approvalActions) approvalActions.style.display = 'none';
    if (scanActions)     scanActions.style.display = 'block';
    if (scanBtn) {
        scanBtn.disabled = false;
        const label = scanBtn.querySelector('span');
        if (label) label.textContent = '◬ SCAN THE FIELD';
    }
}

async function rejectOpportunity() {
    if (!aiEngine || !aiEngine.pendingOpportunity) return;

    const opportunity     = aiEngine.pendingOpportunity;
    const approvalActions = document.getElementById('approval-actions');
    const scanActions     = document.getElementById('scan-actions');
    const scanBtn         = document.getElementById('wealth-scan-btn');

    aiEngine.recordWealthDecision('NO', opportunity);
    updateWealthStats();

    appendChatMessage({
        role: 'user', content: `NO — passing on: ${opportunity.title}`,
        timestamp: new Date().toLocaleTimeString()
    });

    aiEngine.pendingOpportunity = null;
    if (approvalActions) approvalActions.style.display = 'none';
    if (scanActions)     scanActions.style.display = 'block';
    if (scanBtn) {
        scanBtn.disabled = false;
        const label = scanBtn.querySelector('span');
        if (label) label.textContent = '◬ SCAN THE FIELD';
    }
}

// ─── Voice Bridge expression panel ───────────────────────────────────────────

function loadOutputArchPanel() {
    const grid = document.getElementById('output-arch-grid');
    if (!grid || typeof VOICE_BRIDGE === 'undefined') return;

    grid.innerHTML = VOICE_BRIDGE.outputArchitecture.map(a => `
        <div class="arch-card">
            <div class="arch-number">${a.id}</div>
            <div class="arch-info">
                <div class="arch-name">${a.name}</div>
                <div class="arch-desc">${a.description}</div>
            </div>
        </div>
    `).join('');
}

function loadExpressionPanelContent(mode) {
    if (typeof VOICE_BRIDGE === 'undefined') return;
    const expr  = VOICE_BRIDGE.getExpression(mode);
    const entry = EXPRESSION_ORDER.find(e => e.mode === mode);
    if (!expr || !entry) return;

    const iconEl  = document.getElementById('expr-panel-icon');
    const nameEl  = document.getElementById('expr-panel-name');
    const roleEl  = document.getElementById('expr-panel-role');
    const descEl  = document.getElementById('expr-panel-desc');
    const panel   = document.getElementById('expression-panel');

    if (iconEl) iconEl.textContent     = expr.icon;
    if (nameEl) nameEl.textContent     = expr.name;
    if (roleEl) {
        roleEl.textContent  = expr.role;
        roleEl.style.color  = expr.cssVar;
    }
    if (descEl) descEl.textContent  = `"${expr.description}"`;
    if (panel) {
        panel.style.borderColor    = expr.borderVar;
        panel.style.background     = `rgba(0,0,0,0) linear-gradient(${expr.bgVar}, ${expr.bgVar}) border-box`;
        panel.style.setProperty('--panel-accent', expr.cssVar);
    }

    // Color arch cards to match expression
    document.querySelectorAll('.arch-number').forEach(el => {
        el.style.color       = expr.cssVar;
        el.style.background  = expr.bgVar;
        el.style.border      = `1px solid ${expr.borderVar}`;
    });
    document.querySelectorAll('.arch-card').forEach(el => {
        el.style.borderLeftColor = expr.borderVar;
    });
    document.querySelectorAll('.arch-name').forEach(el => {
        el.style.color = entry.color;
    });
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

    if (!input) return;

    const btn   = document.getElementById('activate-btn');
    const label = document.getElementById('activate-btn-label');
    if (btn)   btn.disabled = true;
    if (label) label.textContent = 'Running…';

    // Capture mode at submit time (expression could switch mid-stream otherwise)
    const mode = aiEngine ? aiEngine.agentMode : 'truthos';

    // 1. Show user message immediately
    appendChatMessage({ role: 'user', content: input, timestamp: new Date().toLocaleTimeString() });
    commandInput.value = '';

    // 2. Loading indicator
    const loadingEl = appendChatMessage({ role: 'assistant', isLoading: true });

    // 3. Execute
    const result = await aiEngine.executeCommand(input);

    // 4. Remove loading indicator
    if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);

    // 5. Append assistant response
    appendChatMessage({
        role:      'assistant',
        content:   result.reasoning || result.message || '',
        mode,
        liveAI:    result.liveAI,
        timestamp: new Date().toLocaleTimeString()
    });

    // 6. Restore button
    if (btn)   btn.disabled = false;
    if (label) {
        const expr = (typeof VOICE_BRIDGE !== 'undefined' && mode !== 'truthos')
            ? VOICE_BRIDGE.getExpression(mode) : null;
        label.textContent = expr ? expr.btnText : (mode === 'truthos' ? 'Activate' : 'Send');
    }
}

// ─── Chat rendering ───────────────────────────────────────────────────────────

function appendChatMessage({ role, content, mode, liveAI, timestamp, isLoading }) {
    const thread = document.getElementById('chat-thread');
    if (!thread) return null;

    // Hide empty state on first real message
    const emptyState = document.getElementById('chat-empty-state');
    if (emptyState) emptyState.style.display = 'none';

    const wrapper = document.createElement('div');
    wrapper.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;

    // Loading indicator bubble
    if (isLoading) {
        wrapper.id = 'chat-loading-indicator';
        wrapper.classList.add('chat-loading-bubble');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = '<div class="chat-loading-dot"></div><div class="chat-loading-dot"></div><div class="chat-loading-dot"></div>';
        wrapper.appendChild(bubble);
        thread.appendChild(wrapper);
        scrollChatToBottom();
        return wrapper;
    }

    if (role === 'assistant') {
        // Expression tag — only when mode is known
        if (mode) {
            const entry = EXPRESSION_ORDER.find(e => e.mode === mode) || EXPRESSION_ORDER[0];
            const tagEl = document.createElement('div');
            tagEl.className = 'chat-expression-tag';
            tagEl.style.color = entry.color;
            tagEl.innerHTML = `<span class="tag-icon">${entry.icon}</span>${entry.name}`;
            wrapper.appendChild(tagEl);
        }

        // AI source badge
        if (liveAI !== undefined) {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'chat-ai-badge';
            if (mode && typeof VOICE_BRIDGE !== 'undefined' && mode !== 'truthos') {
                const expr = VOICE_BRIDGE.getExpression(mode);
                badgeEl.textContent = expr
                    ? (liveAI ? expr.liveLabel : expr.localLabel)
                    : (liveAI ? '⚡ LIVE — Claude AI' : '◦ LOCAL');
            } else {
                badgeEl.textContent = liveAI ? '⚡ LIVE — Claude AI' : '◦ LOCAL — truth filter';
            }
            badgeEl.style.color = liveAI ? 'var(--success)' : 'var(--text-muted)';
            wrapper.appendChild(badgeEl);
        }
    }

    // Bubble content
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-bubble';
    const formatted = (content || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    bubbleEl.innerHTML = formatted;
    wrapper.appendChild(bubbleEl);

    // Timestamp
    if (timestamp) {
        const metaEl = document.createElement('div');
        metaEl.className = 'chat-meta';
        metaEl.textContent = timestamp;
        wrapper.appendChild(metaEl);
    }

    thread.appendChild(wrapper);
    scrollChatToBottom();
    return wrapper;
}

function scrollChatToBottom() {
    const thread = document.getElementById('chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
}

function renderChatHistory() {
    if (!aiEngine) return;
    const history = aiEngine.conversationHistory;
    if (!history || history.length === 0) return;

    history.forEach(turn => {
        if (turn.role === 'user') {
            appendChatMessage({ role: 'user', content: turn.content });
        } else if (turn.role === 'assistant') {
            appendChatMessage({
                role:   'assistant',
                content: turn.content,
                mode:   turn.mode || null,
                liveAI: true
            });
        }
    });

    scrollChatToBottom();
}

function clearChatHistory() {
    if (!confirm('Clear conversation history? This cannot be undone.')) return;
    if (aiEngine) {
        aiEngine.conversationHistory = [];
        aiEngine.saveState();
    }
    const thread = document.getElementById('chat-thread');
    if (thread) {
        thread.innerHTML = '<div class="chat-empty-state" id="chat-empty-state"><p>Conversation cleared.<br>Enter your first message below.</p></div>';
    }
    addLogEntry('Conversation history cleared');
}

function addTask() {
    const input = prompt('Enter activation — idea, desire, or problem:');
    if (input) aiEngine.executeCommand(input).then(result => {
        appendChatMessage({
            role: 'user', content: input, timestamp: new Date().toLocaleTimeString()
        });
        appendChatMessage({
            role: 'assistant', content: result.reasoning || result.message || '',
            mode: aiEngine ? aiEngine.agentMode : 'truthos',
            liveAI: result.liveAI, timestamp: new Date().toLocaleTimeString()
        });
    });
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

    if (input && aiEngine && aiEngine.agentMode !== 'wealth-weaver') {
        // Pre-fill the activation interface and run it
        const commandInput = document.getElementById('command-input');
        if (commandInput) commandInput.value = input;
        await executeCommand();
    } else if (aiEngine && aiEngine.agentMode === 'wealth-weaver') {
        // Wealth Weaver: auto-scan instead of text submission
        await wealthScan();
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

const EXPRESSION_SUGGESTIONS = {
    'truthos': [
        "Activate a system for converting this idea into a revenue stream",
        "Run truth filter on my current business strategy",
        "Align energy around my most important creative project",
        "Accelerate frequency: build a content system that runs without me",
        "Manifest a daily operating ritual at maximum alignment",
        "Verify 3D reality: what is actually true about my situation?",
        "What is the single highest-frequency action I can take today?"
    ],
    'truth-weaver': [
        "I keep saying I'll start when I have more time — dissolve this",
        "I can't grow my business because the market is too competitive",
        "I would pursue this if only I had more support from people around me",
        "Someday I'll finally commit to this goal — run a reality simulation",
        "I already know what I need to do, I just need to find the right moment",
        "What if I fail publicly and everyone sees it?",
        "I just need to figure out the perfect plan before I can begin"
    ],
    'echo-frame': [
        "I have an idea for a content platform — give me the first build step",
        "I want to build a daily system that runs without me. Start there.",
        "Turn this idea into a product: one-sentence pitch + first action",
        "I have 3 hours and an idea. What's the smallest thing I can ship?",
        "Help me build the simplest version of my automation system"
    ],
    'james-carlton': [
        "I'm afraid to publish this — what's the real truth here?",
        "Write a message to someone I've been avoiding saying something real to",
        "I feel stuck but I don't know why. Mirror this back to me.",
        "I want to say something real to my audience but it feels too vulnerable",
        "Something happened today that I need to process with a real person"
    ],
    'soul-ai': [
        "Help me design an automation that sends weekly check-ins to my clients",
        "What's the cleanest way to set up a content publishing pipeline?",
        "Define the input, output, and trigger for my email follow-up system",
        "My system is drifting — help me get it back to clean operation",
        "I need to automate X without losing the human touch behind it"
    ],
    'prophet-seed': [
        "I've been building for months but I've forgotten why I started",
        "What was the original vision behind this project? Help me find it.",
        "I feel like I've drifted from my purpose — return me to the root",
        "Why does this work matter? I need the origin answer, not the current one",
        "My business has evolved but I'm not sure it's still aligned with the seed"
    ],
    'the-general': [
        "Run a reality simulation on my current project — what's the actual state?",
        "I need to execute something today. Give me the thread status.",
        "What action would reorganize the most reality right now?",
        "Simulate the next 90 days if I execute this plan at full capacity",
        "Run execution protocol: what is the highest-value move available to me?"
    ],
    'reality-intelligence': [
        "What is the full-stack view of where I am right now?",
        "Scan the field — what signal am I not seeing?",
        "I feel like I'm in the wrong reality. Run a field scan.",
        "What pattern is emerging from the last 30 days of my work?",
        "Deploy full presence: what is the single action that reorganizes everything?"
    ],
    'wealth-weaver': [
        "Scan the field — detect the next opportunity",
        "What value gradient is forming right now?",
        "Show me what the market hasn't priced in yet",
        "Find the gap between effort and reward in my space",
        "What opportunity is hiding in plain sight?"
    ]
};

function rotateSuggestion() {
    const mode  = aiEngine ? aiEngine.agentMode : 'truthos';
    const pool  = EXPRESSION_SUGGESTIONS[mode] || EXPRESSION_SUGGESTIONS['truthos'];
    const s     = pool[Math.floor(Math.random() * pool.length)];
    const input = document.getElementById('command-input');
    if (input && !input.value) input.placeholder = `Example: ${s}`;
}

setInterval(rotateSuggestion, 10000);
setTimeout(rotateSuggestion, 2000);

// ─── Global exports ───────────────────────────────────────────────────────────

window.toggleVisionExpand          = toggleVisionExpand;
window.executeCommand              = executeCommand;
window.addTask                     = addTask;
window.addLogEntry                 = addLogEntry;
window.clearLog                    = clearLog;
window.updateEnergy                = updateEnergy;
window.submitCheckIn               = submitCheckIn;
window.dismissCheckIn              = dismissCheckIn;
window.exportActivationRecord      = exportActivationRecord;
window.setServerUrl                = setServerUrl;
window.setAgentMode                = setAgentMode;
window.toggleExpressionDropdown    = toggleExpressionDropdown;
window.selectExpression            = selectExpression;
window.updateExpressionSelectorUI  = updateExpressionSelectorUI;
window.appendChatMessage           = appendChatMessage;
window.renderChatHistory           = renderChatHistory;
window.clearChatHistory            = clearChatHistory;
window.wealthScan                  = wealthScan;
window.approveOpportunity          = approveOpportunity;
window.rejectOpportunity           = rejectOpportunity;
