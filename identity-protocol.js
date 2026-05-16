// IDENTITY PROTOCOL v1.0
// Anchors the Wealth Ecosystem to user's real identity, goals, and constraints
// Used by all scanning functions to bias opportunity detection

const IDENTITY_PROTOCOL = {
    // User identity fields
    user: {
        name: '',
        email: '',
        currentRole: '', // 'employed' | 'freelance' | 'building' | 'transitioning'
        yearsExperience: 0,
        currentIncome: '$0', // Annual or monthly
        savingsLevel: '$0', // Approximate liquid savings
        primaryGoal: '', // 'survival' | 'growth' | 'freedom' | 'impact'
        timeAvailablePerWeek: 0, // Hours
        riskTolerance: 'moderate', // 'conservative' | 'moderate' | 'aggressive'
        skills: [], // ['writing', 'coding', 'design', 'sales', ...]
        constraints: [], // ['limited capital', 'health issues', 'caregiving', ...]
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date().toISOString()
    },

    // Wealth dimensions the user is interested in
    wealthDimensions: {
        'income-generation': { enabled: true, weight: 1.0 },
        'asset-allocation': { enabled: true, weight: 0.8 },
        'skill-development': { enabled: true, weight: 0.9 },
        'time-leverage': { enabled: true, weight: 0.85 },
        'network-effect': { enabled: true, weight: 0.7 },
        'market-timing': { enabled: false, weight: 0.5 },
        'tax-optimization': { enabled: false, weight: 0.6 },
        'risk-management': { enabled: true, weight: 0.8 },
        'opportunity-spotting': { enabled: true, weight: 0.95 },
        'wealth-psychology': { enabled: true, weight: 0.75 }
    },

    // Store identity in localStorage
    save() {
        try {
            localStorage.setItem('wealth_identity', JSON.stringify(this.user));
            localStorage.setItem('wealth_dimensions', JSON.stringify(this.wealthDimensions));
            console.log('✓ Identity saved:', this.user.name);
        } catch (e) {
            console.warn('[Identity Protocol] Save failed:', e.message);
        }
    },

    // Load identity from localStorage
    load() {
        try {
            const saved = localStorage.getItem('wealth_identity');
            const dims = localStorage.getItem('wealth_dimensions');
            if (saved) this.user = JSON.parse(saved);
            if (dims) this.wealthDimensions = JSON.parse(dims);
            console.log('✓ Identity loaded:', this.user.name || 'anonymous');
            return true;
        } catch (e) {
            console.warn('[Identity Protocol] Load failed:', e.message);
            return false;
        }
    },

    // Check if user has completed onboarding
    isOnboarded() {
        return this.user.name && this.user.name.trim().length > 0 && this.user.primaryGoal;
    },

    // Generate identity context string for AI prompts
    buildContextPrompt() {
        if (!this.isOnboarded()) return '';

        const enabledDims = Object.entries(this.wealthDimensions)
            .filter(([, v]) => v.enabled)
            .map(([k]) => k)
            .join(', ');

        const skillsList = this.user.skills.join(', ') || 'not specified';
        const constraintsList = this.user.constraints.join(', ') || 'none noted';

        return `
===== WEALTH IDENTITY CONTEXT =====
User: ${this.user.name}
Role: ${this.user.currentRole} (${this.user.yearsExperience}y experience)
Current Income: ${this.user.currentIncome}
Savings: ${this.user.savingsLevel}
Goal: ${this.user.primaryGoal}
Available Time: ${this.user.timeAvailablePerWeek}h/week
Risk Tolerance: ${this.user.riskTolerance}

Skills: ${skillsList}
Constraints: ${constraintsList}

Active Wealth Dimensions: ${enabledDims}

Bias opportunity detection toward opportunities that:
1. Match their current role and experience level
2. Require time commitment of ≤ ${this.user.timeAvailablePerWeek}h/week
3. Fit their risk tolerance (${this.user.riskTolerance})
4. Leverage existing skills when possible
5. Respect constraints: ${constraintsList}
6. Align with their primary goal: ${this.user.primaryGoal}
====================================
        `;
    },

    // Get formatted summary for UI
    getSummary() {
        if (!this.isOnboarded()) return 'Identity not configured';
        return `${this.user.name} • ${this.user.currentRole} • ${this.user.primaryGoal}`;
    },

    // Clear identity (reset)
    clear() {
        if (confirm('Clear all identity data? This cannot be undone.')) {
            this.user = {
                name: '',
                email: '',
                currentRole: '',
                yearsExperience: 0,
                currentIncome: '$0',
                savingsLevel: '$0',
                primaryGoal: '',
                timeAvailablePerWeek: 0,
                riskTolerance: 'moderate',
                skills: [],
                constraints: [],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                createdAt: new Date().toISOString()
            };
            localStorage.removeItem('wealth_identity');
            localStorage.removeItem('wealth_dimensions');
            console.log('✓ Identity cleared');
            return true;
        }
        return false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IDENTITY_PROTOCOL;
}
