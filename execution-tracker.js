// EXECUTION TRACKER v1.0
// Tracks the 5 concrete steps from opportunity approval through real-world completion
// Provides feedback loops, verification, and outcome recording

const EXECUTION_TRACKER = {
    // Storage key
    STORAGE_KEY: 'wealth_executions',

    // Active execution records
    executions: [],

    // Load executions from storage
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.executions = JSON.parse(saved).map(e => ({
                    ...e,
                    createdAt: new Date(e.createdAt),
                    completedAt: e.completedAt ? new Date(e.completedAt) : null,
                    steps: (e.steps || []).map(s => ({
                        ...s,
                        completedAt: s.completedAt ? new Date(s.completedAt) : null
                    }))
                }));
            }
        } catch (e) {
            console.warn('[Execution Tracker] Load failed:', e.message);
        }
    },

    // Save executions to storage
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.executions));
        } catch (e) {
            console.warn('[Execution Tracker] Save failed:', e.message);
        }
    },

    // Create new execution record from opportunity
    createExecution(opportunity, nextSteps) {
        const execution = {
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            opportunityTitle: opportunity.title,
            opportunityCategory: opportunity.category,
            opportunityScale: `${opportunity.scaleMin} → ${opportunity.scaleMax}`,
            createdAt: new Date(),
            completedAt: null,
            status: 'in-progress', // 'in-progress' | 'completed' | 'abandoned'
            abandonedReason: null,
            steps: nextSteps.map((step, index) => ({
                id: `step_${index + 1}`,
                sequence: index + 1,
                description: step,
                status: 'pending', // 'pending' | 'in-progress' | 'completed' | 'skipped'
                completedAt: null,
                notes: '',
                evidence: null, // URL, screenshot, or text proof
                dueDate: this.calculateDueDate(index)
            }))
        };

        this.executions.push(execution);
        this.save();
        console.log('✓ Execution created:', execution.id);
        return execution;
    },

    // Calculate due date based on step sequence
    calculateDueDate(stepIndex) {
        const now = new Date();
        const dueDates = [
            new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),       // Step 1: today
            new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),       // Step 2: 3 days
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),       // Step 3: 1 week
            new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),      // Step 4: 2 weeks
            new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)       // Step 5: 1 month
        ];
        return dueDates[stepIndex] || dueDates[4];
    },

    // Get execution by ID
    getExecution(id) {
        return this.executions.find(e => e.id === id);
    },

    // Update step status
    updateStepStatus(executionId, stepId, status, notes = '', evidence = null) {
        const execution = this.getExecution(executionId);
        if (!execution) return false;

        const step = execution.steps.find(s => s.id === stepId);
        if (!step) return false;

        step.status = status;
        step.notes = notes;
        step.evidence = evidence;
        if (status === 'completed') {
            step.completedAt = new Date();
        }

        // Check if all steps completed
        if (execution.steps.every(s => s.status === 'completed')) {
            execution.status = 'completed';
            execution.completedAt = new Date();
        }

        this.save();
        console.log(`✓ Step ${stepId} updated to ${status}`);
        return true;
    },

    // Mark execution as abandoned
    abandonExecution(executionId, reason) {
        const execution = this.getExecution(executionId);
        if (!execution) return false;

        execution.status = 'abandoned';
        execution.abandonedReason = reason;
        this.save();
        console.log(`✓ Execution abandoned: ${reason}`);
        return true;
    },

    // Get completion rate for execution
    getCompletionRate(executionId) {
        const execution = this.getExecution(executionId);
        if (!execution) return 0;

        const completed = execution.steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / execution.steps.length) * 100);
    },

    // Get all active executions
    getActiveExecutions() {
        return this.executions.filter(e => e.status === 'in-progress');
    },

    // Get all completed executions
    getCompletedExecutions() {
        return this.executions.filter(e => e.status === 'completed');
    },

    // Get execution stats
    getStats() {
        const total = this.executions.length;
        const completed = this.executions.filter(e => e.status === 'completed').length;
        const inProgress = this.executions.filter(e => e.status === 'in-progress').length;
        const abandoned = this.executions.filter(e => e.status === 'abandoned').length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const avgTimeToComplete = this.getAverageTimeToComplete();

        return {
            total,
            completed,
            inProgress,
            abandoned,
            completionRate,
            avgTimeToComplete
        };
    },

    // Calculate average time from creation to completion
    getAverageTimeToComplete() {
        const completed = this.executions.filter(e => e.status === 'completed' && e.completedAt);
        if (completed.length === 0) return 0;

        const totalTime = completed.reduce((sum, e) => {
            const days = (e.completedAt - e.createdAt) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);

        return Math.round(totalTime / completed.length);
    },

    // Export executions
    export() {
        return {
            exported: new Date().toISOString(),
            executions: this.executions,
            stats: this.getStats()
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXECUTION_TRACKER;
}
