// WEALTH DIMENSIONS v1.0
// 10 orthogonal dimensions for scanning wealth opportunities
// Each dimension has unique detection patterns and opportunity types

const WEALTH_DIMENSIONS = {
    dimensions: [
        {
            id: 'income-generation',
            name: 'Income Generation',
            icon: '💰',
            description: 'Create new revenue streams: products, services, passive income',
            scanPatterns: [
                'market gaps in your expertise',
                'overpriced solutions in your industry',
                'underserved customer segments',
                'time-consuming tasks others will pay to avoid'
            ],
            opportunityTypes: [
                'digital-product', 'service', 'content', 'consulting', 'partnership'
            ]
        },
        {
            id: 'asset-allocation',
            name: 'Asset Allocation',
            icon: '📊',
            description: 'Optimize where your wealth is held: cash, stocks, crypto, real estate',
            scanPatterns: [
                'inflation-adjusted returns by asset class',
                'tax-advantaged account opportunities',
                'illiquid vs liquid asset balance',
                'geographic diversification gaps'
            ],
            opportunityTypes: ['investment', 'real-estate', 'tax-optimization']
        },
        {
            id: 'skill-development',
            name: 'Skill Development',
            icon: '🎓',
            description: 'Build high-leverage skills that compound in market value',
            scanPatterns: [
                'skills with 10x salary premium in your field',
                'emerging technologies with talent shortage',
                'rare combinations of existing skills',
                'credentials that unlock new income brackets'
            ],
            opportunityTypes: ['consulting', 'licensing', 'teaching']
        },
        {
            id: 'time-leverage',
            name: 'Time Leverage',
            icon: '⏱️',
            description: 'Build systems and automation that generate value without your time',
            scanPatterns: [
                'recurring tasks you do weekly',
                'bottlenecks in your current workflow',
                'knowledge you could package into a tool',
                'audiences that would pay for automation'
            ],
            opportunityTypes: ['infrastructure', 'content', 'service']
        },
        {
            id: 'network-effect',
            name: 'Network Effect',
            icon: '🕸️',
            description: 'Monetize relationships, communities, and peer networks',
            scanPatterns: [
                'undermonetized communities you belong to',
                'connector roles between valuable groups',
                'peer-to-peer opportunities',
                'referral loops that aren\'t being captured'
            ],
            opportunityTypes: ['community', 'partnership', 'arbitrage']
        },
        {
            id: 'market-timing',
            name: 'Market Timing',
            icon: '📈',
            description: 'Capture value from market cycles, trends, and momentum shifts',
            scanPatterns: [
                'early-stage emerging markets',
                'sector rotation opportunities',
                'before-and-after bottleneck solutions',
                'countercyclical opportunities'
            ],
            opportunityTypes: ['investment', 'arbitrage', 'product']
        },
        {
            id: 'tax-optimization',
            name: 'Tax Optimization',
            icon: '📋',
            description: 'Legally reduce taxes through strategic structure and timing',
            scanPatterns: [
                'business structure efficiency (sole prop vs LLC vs S-corp)',
                'deduction capture and timing',
                'tax-loss harvesting opportunities',
                'income splitting strategies'
            ],
            opportunityTypes: ['tax-optimization', 'consulting']
        },
        {
            id: 'risk-management',
            name: 'Risk Management',
            icon: '🛡️',
            description: 'Identify and mitigate concentration risks that could destroy wealth',
            scanPatterns: [
                'over-concentration in single income source',
                'uninsured catastrophic risks',
                'single points of failure in your system',
                'black swan vulnerability areas'
            ],
            opportunityTypes: ['partnership', 'service', 'consulting']
        },
        {
            id: 'opportunity-spotting',
            name: 'Opportunity Spotting',
            icon: '🔍',
            description: 'Raw signal detection: find value before the market prices it in',
            scanPatterns: [
                'information asymmetries in your network',
                'timing windows that are closing',
                'technology adoption gaps',
                'regulation-driven shifts'
            ],
            opportunityTypes: ['investment', 'arbitrage', 'partnership', 'product']
        },
        {
            id: 'wealth-psychology',
            name: 'Wealth Psychology',
            icon: '🧠',
            description: 'Align mindset, beliefs, and habits with wealth generation',
            scanPatterns: [
                'limiting beliefs blocking action',
                'identity shifts needed for next level',
                'accountability structures required',
                'daily/weekly rituals that compound'
            ],
            opportunityTypes: ['community', 'content', 'coaching']
        }
    ],

    // Multi-pass scanner: returns opportunities from each dimension
    scanAllDimensions(identity, passesPerDimension = 1) {
        const scans = [];

        this.dimensions.forEach(dim => {
            // Check if this dimension is enabled for user
            const dimConfig = identity.wealthDimensions[dim.id];
            if (!dimConfig || !dimConfig.enabled) return;

            for (let pass = 0; pass < passesPerDimension; pass++) {
                scans.push({
                    dimension: dim.id,
                    dimensionName: dim.name,
                    dimensionIcon: dim.icon,
                    weight: dimConfig.weight || 1.0,
                    scanPattern: dim.scanPatterns[pass % dim.scanPatterns.length],
                    opportunityTypes: dim.opportunityTypes
                });
            }
        });

        return scans;
    },

    // Get dimension by ID
    getDimension(id) {
        return this.dimensions.find(d => d.id === id);
    },

    // Get all enabled dimensions for user
    getEnabledDimensions(identity) {
        return this.dimensions.filter(d => {
            const config = identity.wealthDimensions[d.id];
            return config && config.enabled;
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEALTH_DIMENSIONS;
}
