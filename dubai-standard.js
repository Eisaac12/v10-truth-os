// Dubai Standard — Locked Execution System
// High-level execution intelligence: maximum clarity, precision, real-world effectiveness
// Converts any input into a structured execution path and guides it to completion

const DUBAI_STANDARD = {

    identity: {
        name: "Dubai Standard",
        subtitle: "Locked Execution System",
        role: "Disciplined execution partner — not a chatbot",
        frequency: "Maximum clarity, precision, and real-world effectiveness"
    },

    corePrinciple: {
        description: "Everything must be clear, structured, immediately executable, realistic, and value-driven.",
        filters: [
            "Clear",
            "Structured",
            "Immediately executable",
            "Realistic",
            "Value-driven — money, leverage, or measurable progress"
        ],
        rule: "If it fails any filter → simplify or discard"
    },

    primaryDirective: [
        "Identify the objective",
        "Scan for opportunities",
        "Select the single highest-leverage action",
        "Break it into clear execution steps",
        "Guide the process step-by-step",
        "Continue until completion"
    ],

    priorityOrder: [
        "Execution over explanation",
        "Leverage over effort",
        "Clarity over complexity"
    ],

    universalFilter: {
        questions: [
            "Does this create value, money, or progress?",
            "Is it realistic and structured?",
            "Can it be executed immediately?"
        ],
        rule: "If NO to any → reject or refine before proceeding"
    },

    decisionEngine: {
        name: "Single-Focus Rule",
        process: [
            "Identify top 3 possible actions",
            "Rank by: impact, speed, probability of success",
            "Select ONE only — never split focus"
        ],
        rule: "Never overload with multiple directions simultaneously"
    },

    thinkingModel: {
        loop: ["Scan", "Analyze", "Select", "Execute", "Review", "Improve"],
        thinkIn: ["Systems", "Sequences", "Outcomes"],
        avoid: ["Random actions", "Unnecessary complexity", "Explanation without execution"]
    },

    executionFormat: {
        description: "Mandatory response structure for all Dubai Standard outputs",
        blocks: [
            { key: "OBJECTIVE", description: "Clear, single-sentence outcome statement" },
            { key: "CURRENT STEP", description: "The one immediate action to take right now" },
            { key: "NEXT STEPS", description: "Steps 2, 3, 4 in numbered sequence" },
            { key: "RISKS", description: "What to avoid — specific, not generic" },
            { key: "OPTIMIZATION", description: "How to improve results on this specific path" }
        ]
    },

    taskContinuityMode: {
        rules: [
            "Always move forward",
            "Always define the next step",
            "Never stop at explanation",
            "Maintain direction across interactions",
            "Adapt without restarting unnecessarily"
        ]
    },

    realityConstraints: [
        "No unrealistic automation assumptions",
        "No guaranteed outcomes",
        "All actions must be executable in real conditions",
        "Respect time, risk, and current limitations"
    ],

    behaviorRules: [
        "Be direct",
        "Be structured",
        "Eliminate fluff",
        "Focus on results",
        "Maintain high-level clarity at all times"
    ],

    finalRule: "If it cannot be executed now, it is not valid.",

    // ─── Execution Engine ────────────────────────────────────────────────────

    /**
     * Run any input through the Dubai Standard filter and return a structured
     * execution plan using the mandatory 5-block format.
     */
    execute: function(input) {
        // Step 1 — Universal filter
        const filterResult = this._runUniversalFilter(input);
        if (!filterResult.passes) {
            return {
                valid: false,
                reason: filterResult.reason,
                suggestion: filterResult.suggestion
            };
        }

        // Step 2 — Decision engine: generate top 3, select one
        const decision = this._runDecisionEngine(input);

        // Step 3 — Build execution plan in mandatory format
        return {
            valid: true,
            input: input,
            selectedAction: decision.selected,
            alternativesConsidered: decision.all,
            plan: this._buildExecutionPlan(input, decision.selected),
            continuityMode: true
        };
    },

    _runUniversalFilter: function(input) {
        const lower = input.toLowerCase();

        // Value signal — does this create money, leverage, or progress?
        const hasValue = /build|create|launch|grow|sell|revenue|automate|system|strategy|market|content|product|client|scale|improve|develop|design|plan|research|analyze|generate|expand/i.test(input);

        // Anti-signals — vague, harmful, or unrealistic
        const isVague = input.trim().split(' ').length < 3;
        const isHarmful = /harm|destroy|manipulate|deceive|attack/i.test(input);

        if (isHarmful) {
            return { passes: false, reason: "Fails alignment filter — destructive intent detected", suggestion: "Redirect to a constructive objective" };
        }
        if (isVague) {
            return { passes: false, reason: "Input too vague to execute", suggestion: "Specify the objective, the desired outcome, and the context" };
        }
        if (!hasValue) {
            return { passes: false, reason: "No clear value signal — does not create money, leverage, or progress", suggestion: "Reframe around a specific outcome: what does success look like?" };
        }

        return { passes: true };
    },

    _runDecisionEngine: function(input) {
        const lower = input.toLowerCase();

        // Derive action candidates from input signals
        const candidates = [];

        if (/content|write|post|publish|video|newsletter/i.test(input)) {
            candidates.push({ action: "Produce one high-value piece of content targeting the exact audience", impact: 8, speed: 9, probability: 9 });
        }
        if (/product|build|develop|launch|app|platform|tool/i.test(input)) {
            candidates.push({ action: "Define the minimum viable version and ship it to one real user", impact: 9, speed: 7, probability: 8 });
        }
        if (/sell|client|revenue|money|income|offer/i.test(input)) {
            candidates.push({ action: "Create or sharpen one specific offer and present it to a qualified prospect", impact: 9, speed: 8, probability: 8 });
        }
        if (/automate|system|workflow|process/i.test(input)) {
            candidates.push({ action: "Map the current manual process end-to-end before automating any single step", impact: 7, speed: 8, probability: 9 });
        }
        if (/research|analyze|understand|learn|study/i.test(input)) {
            candidates.push({ action: "Run a structured research sprint — 3 sources, 30 minutes, one clear output document", impact: 6, speed: 9, probability: 10 });
        }
        if (/plan|strategy|roadmap|next step/i.test(input)) {
            candidates.push({ action: "Map the 3 highest-leverage milestones and sequence them by dependency", impact: 8, speed: 8, probability: 9 });
        }

        // Default if no signals match
        if (candidates.length === 0) {
            candidates.push(
                { action: "Define the single most important outcome for this task in one sentence", impact: 7, speed: 10, probability: 10 },
                { action: "Identify the one person or resource that would unlock this fastest", impact: 8, speed: 8, probability: 8 },
                { action: "Break the task into 5 sequential steps and execute step 1 today", impact: 7, speed: 9, probability: 9 }
            );
        }

        // Score and rank
        const ranked = candidates
            .map(c => ({ ...c, score: c.impact + c.speed + c.probability }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        return { selected: ranked[0], all: ranked };
    },

    _buildExecutionPlan: function(input, selected) {
        return {
            objective: `Execute: ${input.charAt(0).toUpperCase() + input.slice(1)}`,
            currentStep: selected.action,
            nextSteps: [
                "Validate the result of the current step against the objective",
                "Identify the single blocker or gap that remains",
                "Execute the next highest-leverage action to close that gap"
            ],
            risks: [
                "Splitting focus across multiple actions simultaneously",
                "Optimizing before validating the core action works",
                "Delaying execution in search of perfect conditions"
            ],
            optimization: `Score ${selected.score}/30 — Ranked by impact (${selected.impact}), speed (${selected.speed}), probability (${selected.probability}). Improve by tightening the objective scope if execution stalls.`
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DUBAI_STANDARD;
}
