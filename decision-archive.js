// DECISION ARCHIVE v1.0
// Maintains history of all wealth decisions (YES/NO) and extracts patterns
// Enables learning loops, bias detection, and performance analytics

const DECISION_ARCHIVE = {
    STORAGE_KEY: 'wealth_decision_archive',

    // Archive of decisions
    decisions: [],

    // Load decisions from storage
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.decisions = JSON.parse(saved).map(d => ({
                    ...d,
                    decidedAt: new Date(d.decidedAt),
                    outcomeRecordedAt: d.outcomeRecordedAt ? new Date(d.outcomeRecordedAt) : null
                }));
            }
        } catch (e) {
            console.warn('[Decision Archive] Load failed:', e.message);
        }
    },

    // Save decisions to storage
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.decisions));
        } catch (e) {
            console.warn('[Decision Archive] Save failed:', e.message);
        }
    },

    // Record a YES/NO decision
    recordDecision(decision, opportunity, executionId = null) {
        const record = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            decision, // 'YES' | 'NO'
            opportunityTitle: opportunity.title,
            opportunityCategory: opportunity.category,
            opportunityEffort: opportunity.effortLevel,
            opportunityTimeHorizon: opportunity.timeHorizon,
            opportunityScale: `${opportunity.scaleMin} → ${opportunity.scaleMax}`,
            decidedAt: new Date(),
            executionId,
            outcome: null, // 'success' | 'partial' | 'failure' | 'abandoned' | null
            outcomeNotes: '',
            outcomeRecordedAt: null,
            actualValue: null, // $amount or null
            learnings: ''
        };

        this.decisions.push(record);
        this.save();
        console.log(`✓ Decision recorded: ${decision} - ${opportunity.title}`);
        return record;
    },

    // Record outcome for a decision (after execution attempt)
    recordOutcome(decisionId, outcome, actualValue = null, notes = '') {
        const decision = this.decisions.find(d => d.id === decisionId);
        if (!decision) return false;

        decision.outcome = outcome; // 'success' | 'partial' | 'failure' | 'abandoned'
        decision.actualValue = actualValue;
        decision.outcomeNotes = notes;
        decision.outcomeRecordedAt = new Date();

        this.save();
        console.log(`✓ Outcome recorded: ${outcome}`);
        return true;
    },

    // Extract patterns from decision history
    getPatterns() {
        const yesDecisions = this.decisions.filter(d => d.decision === 'YES');
        const noDecisions = this.decisions.filter(d => d.decision === 'NO');

        const categoryBreakdown = {};
        const effortBreakdown = {};
        const horizonBreakdown = {};

        // Build category patterns
        this.decisions.forEach(d => {
            const cat = d.opportunityCategory;
            if (!categoryBreakdown[cat]) {
                categoryBreakdown[cat] = { yes: 0, no: 0, successRate: 0 };
            }
            if (d.decision === 'YES') categoryBreakdown[cat].yes++;
            else categoryBreakdown[cat].no++;
        });

        // Calculate success rates
        yesDecisions.forEach(d => {
            if (d.outcome) {
                const cat = d.opportunityCategory;
                if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { yes: 0, no: 0, successRate: 0 };
                const outcomes = yesDecisions.filter(y => y.opportunityCategory === cat && y.outcome);
                const successes = outcomes.filter(o => o.outcome === 'success' || o.outcome === 'partial');
                categoryBreakdown[cat].successRate = outcomes.length > 0 ? Math.round((successes.length / outcomes.length) * 100) : 0;
            }
        });

        // Build effort patterns
        this.decisions.forEach(d => {
            const effort = d.opportunityEffort;
            if (!effortBreakdown[effort]) {
                effortBreakdown[effort] = { yes: 0, no: 0 };
            }
            if (d.decision === 'YES') effortBreakdown[effort].yes++;
            else effortBreakdown[effort].no++;
        });

        // Build time horizon patterns
        this.decisions.forEach(d => {
            const horizon = d.opportunityTimeHorizon;
            if (!horizonBreakdown[horizon]) {
                horizonBreakdown[horizon] = { yes: 0, no: 0 };
            }
            if (d.decision === 'YES') horizonBreakdown[horizon].yes++;
            else horizonBreakdown[horizon].no++;
        });

        return {
            totalDecisions: this.decisions.length,
            yesRate: Math.round((yesDecisions.length / this.decisions.length) * 100),
            noRate: Math.round((noDecisions.length / this.decisions.length) * 100),
            categoryBreakdown,
            effortBreakdown,
            horizonBreakdown,
            mostPursued: this.getMostPursuedCategory(),
            mostRejected: this.getMostRejectedCategory(),
            highestSuccessCategory: this.getHighestSuccessCategory(categoryBreakdown)
        };
    },

    // Find most pursued category
    getMostPursuedCategory() {
        const categories = {};
        this.decisions.filter(d => d.decision === 'YES').forEach(d => {
            categories[d.opportunityCategory] = (categories[d.opportunityCategory] || 0) + 1;
        });
        return Object.keys(categories).length > 0
            ? Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0]
            : null;
    },

    // Find most rejected category
    getMostRejectedCategory() {
        const categories = {};
        this.decisions.filter(d => d.decision === 'NO').forEach(d => {
            categories[d.opportunityCategory] = (categories[d.opportunityCategory] || 0) + 1;
        });
        return Object.keys(categories).length > 0
            ? Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0]
            : null;
    },

    // Find category with highest success rate
    getHighestSuccessCategory(breakdown) {
        let best = null;
        let bestRate = 0;
        Object.entries(breakdown).forEach(([cat, data]) => {
            if (data.successRate > bestRate) {
                bestRate = data.successRate;
                best = cat;
            }
        });
        return best;
    },

    // Get decision timeline
    getTimeline(days = 30) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return this.decisions
            .filter(d => d.decidedAt > cutoff)
            .sort((a, b) => b.decidedAt - a.decidedAt);
    },

    // Calculate total value generated from executed opportunities
    getTotalValueGenerated() {
        const withValue = this.decisions.filter(d => d.decision === 'YES' && d.actualValue);
        if (withValue.length === 0) return 0;
        return withValue.reduce((sum, d) => sum + (parseInt(d.actualValue) || 0), 0);
    },

    // Get success statistics
    getSuccessStats() {
        const withOutcome = this.decisions.filter(d => d.outcome !== null);
        if (withOutcome.length === 0) return {};

        const successful = withOutcome.filter(d => d.outcome === 'success' || d.outcome === 'partial');
        const failed = withOutcome.filter(d => d.outcome === 'failure');
        const abandoned = withOutcome.filter(d => d.outcome === 'abandoned');

        return {
            tracked: withOutcome.length,
            successful: successful.length,
            partial: withOutcome.filter(d => d.outcome === 'partial').length,
            failed: failed.length,
            abandoned: abandoned.length,
            successRate: Math.round((successful.length / withOutcome.length) * 100)
        };
    },

    // Export archive
    export() {
        return {
            exported: new Date().toISOString(),
            decisions: this.decisions,
            patterns: this.getPatterns(),
            successStats: this.getSuccessStats(),
            totalValue: this.getTotalValueGenerated()
        };
    },

    // Clear archive
    clear() {
        if (confirm('Clear entire decision archive? This cannot be undone.')) {
            this.decisions = [];
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('✓ Decision archive cleared');
            return true;
        }
        return false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DECISION_ARCHIVE;
}
