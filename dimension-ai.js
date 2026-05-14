// Dimension AI — Space-Time Wealth Field Engine
// The $ Angle: Value = (Space × Time) / Field Density
// You are not predicting. You are positioning.

const DIMENSION_AI = {

    identity: {
        name:       "Dimension AI",
        tagline:    "Space-Time Wealth Field Positioning Engine",
        principle:  "You are not predicting. You are positioning.",
        formula:    "Value = (Space × Time) / Field Density",
        axes: [
            { axis: "X (Space)",        measures: "Where value will emerge",         examples: "Geography, platform, niche, network" },
            { axis: "Y (Time)",         measures: "When value will crystallize",      examples: "Lead time, cycle length, compounding rate" },
            { axis: "Z (Field Density)", measures: "How much energy is concentrated", examples: "Saturation, attention flow, capital velocity, competition" }
        ]
    },

    // Default stream configurations — user-editable, persisted in localStorage
    defaultStreams: [
        { id: 'music',        name: 'Music',        space: 'Afrobeat + Lo-fi',       time: '3–7 days',    density: 'Medium',   position: 'ENTER'  },
        { id: 'real-estate',  name: 'Real Estate',  space: 'Midwest US, B/C class',  time: '30–90 days',  density: 'Low',      position: 'SCAN'   },
        { id: 'freelance',    name: 'Freelance',    space: 'AI automation + voice',  time: '24–48 hrs',   density: 'Rising',   position: 'PITCH'  },
        { id: 'content',      name: 'Content',      space: 'Truth + wealth niche',   time: '6–12 months', density: 'Very Low', position: 'BUILD'  },
        { id: 'automation',   name: 'Automation',   space: 'OpenClaw ecosystem',     time: '1–2 weeks',   density: 'Low',      position: 'DEPLOY' }
    ],

    densityValues:   { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'Rising': 4, 'High': 5 },
    positionOptions: ['ENTER', 'BUILD', 'SCAN', 'PITCH', 'DEPLOY', 'HOLD', 'EXIT'],
    densityOptions:  ['Very Low', 'Low', 'Medium', 'Rising', 'High'],

    positionColors: {
        'ENTER':  '#10b981',
        'BUILD':  '#06b6d4',
        'SCAN':   '#f59e0b',
        'PITCH':  '#f97316',
        'DEPLOY': '#3b82f6',
        'HOLD':   '#94a3b8',
        'EXIT':   '#ef4444'
    },

    // $ Angle: find the highest-value stream (lowest density, best opportunity)
    calculateAngle(streams) {
        const dv = this.densityValues;
        const scored = streams.map(s => {
            const densityScore = dv[s.density] || 3;
            const value = Math.max(0, 100 - densityScore * 15);
            return { ...s, value };
        });
        return scored.sort((a, b) => b.value - a.value)[0];
    },

    // Summary of all streams for the system prompt context injection
    buildFieldContext(streams) {
        return streams.map(s =>
            `${s.name}: Space="${s.space}", Time=${s.time}, Density=${s.density}, Position=${s.position}`
        ).join('\n');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DIMENSION_AI;
}
