// AI Engine - V10 Truth OS
// Autonomous execution engine that operates based on Master Vision

class V10AIEngine {
    constructor() {
        this.isActive = true;
        this.taskQueue = [];
        this.completedTasks = [];
        this.currentTask = null;
        this.alignmentScore = 98;
        this.startTime = Date.now();
        this.mood = 'advanced';
        this.moodProfiles = {
            advanced: {
                label: 'Advanced',
                thinkIntervalMs: 3500,
                minAlignment: 70,
                depth: 'high',
                description: 'Advanced mode balances autonomous execution, deep planning, and high alignment guardrails.'
            },
            builder: {
                label: 'Builder',
                thinkIntervalMs: 2500,
                minAlignment: 60,
                depth: 'high',
                description: 'Builder mode prioritizes creating systems fast with strong shipping momentum.'
            },
            focus: {
                label: 'Focus',
                thinkIntervalMs: 4500,
                minAlignment: 75,
                depth: 'medium',
                description: 'Focus mode slows output to protect clarity, quality, and purposeful execution.'
            }
        };
        this.thinkingTimer = null;
        this.infinityMode = false;
        this.infinitySeedCommand = null;
        this.infinityCycleCount = 0;

        // Load Master Vision as core memory
        this.coreMemory = MASTER_VISION;

        // Initialize
        this.init();
    }

    init() {
        console.log('🔮 V10 Truth OS AI Engine initializing...');
        console.log('📖 Master Vision loaded as core memory');
        console.log('✅ AI Engine ready');

        // Start autonomous thinking loop
        this.startThinkingLoop();
    }

    // Autonomous thinking loop - runs continuously
    startThinkingLoop() {
        if (this.thinkingTimer) {
            clearInterval(this.thinkingTimer);
        }

        const interval = this.getMoodProfile().thinkIntervalMs;

        this.thinkingTimer = setInterval(() => {
            if (this.isActive) {
                this.think();
            }
        }, interval);
    }

    // Core thinking function
    think() {
        // Check task queue
        if (this.taskQueue.length > 0 && !this.currentTask) {
            this.executeNextTask();
        }

        // Background processing
        this.processBackgroundThoughts();
    }

    // Execute commands from user
    executeCommand(command) {
        console.log('🎯 Executing command:', command);

        // Evaluate command against Master Vision
        const evaluation = this.evaluateAgainstVision(command);

        if (evaluation.aligned) {
            const task = this.createTask(command);
            this.addTask(task);
            return {
                success: true,
                message: `Command accepted. Alignment score: ${evaluation.score}%`,
                task: task,
                reasoning: evaluation.reasoning,
                mood: this.mood
            };
        } else {
            return {
                success: false,
                message: "Command not aligned with Master Vision",
                reasoning: evaluation.reasoning,
                mood: this.mood
            };
        }
    }

    // Evaluate if a command aligns with Master Vision
    evaluateAgainstVision(command) {
        // Check for key alignment indicators
        const alignmentIndicators = {
            creation: /build|create|make|develop|design|generate/i.test(command),
            learning: /learn|research|study|analyze|understand/i.test(command),
            growth: /grow|improve|evolve|upgrade|enhance/i.test(command),
            clarity: /plan|organize|structure|clarify|focus/i.test(command),
            help: /help|assist|support|serve|solve/i.test(command)
        };

        const destructionIndicators = {
            manipulation: /manipulate|deceive|trick|exploit/i.test(command),
            harm: /harm|damage|destroy|break|attack/i.test(command),
            negativity: /hate|revenge|jealous|angry/i.test(command)
        };

        const positiveCount = Object.values(alignmentIndicators).filter(v => v).length;
        const negativeCount = Object.values(destructionIndicators).filter(v => v).length;

        const baseScore = 65 + (positiveCount * 10);
        const score = negativeCount > 0 ? 0 : Math.min(100, baseScore);
        const aligned = score >= this.getMoodProfile().minAlignment;

        let reasoning = '';
        if (aligned) {
            reasoning = `This command shows: ${Object.keys(alignmentIndicators).filter(k => alignmentIndicators[k]).join(', ')}. Aligned with Master Vision principles in ${this.getMoodProfile().label} mood.`;
        } else {
            reasoning = 'This command does not align with the Master Vision principles of creation, truth, and peace.';
        }

        return { aligned, score, reasoning };
    }

    getMoodProfile() {
        return this.moodProfiles[this.mood] || this.moodProfiles.advanced;
    }

    setMood(mood) {
        if (!this.moodProfiles[mood]) {
            return {
                mood: this.mood,
                label: this.getMoodProfile().label,
                description: this.getMoodProfile().description
            };
        }

        this.mood = mood;
        this.startThinkingLoop();

        this.logActivity(`Mood set to ${this.getMoodProfile().label}`);

        return {
            mood: this.mood,
            label: this.getMoodProfile().label,
            description: this.getMoodProfile().description
        };
    }

    activateInfinityMode(seedCommand) {
        this.infinityMode = true;
        this.infinitySeedCommand = seedCommand;
        this.infinityCycleCount = 0;

        const command = `Infinity Mission: ${seedCommand}`;
        const result = this.executeCommand(command);

        if (!result.success) {
            this.infinityMode = false;
            return {
                success: false,
                message: 'Infinity mode could not start because the mission did not pass alignment checks.'
            };
        }

        this.logActivity('♾️ Infinity mode activated');

        return {
            success: true,
            message: 'Infinity mode active. Computer is executing continuously with adaptive planning.'
        };
    }

    deactivateInfinityMode() {
        this.infinityMode = false;
        this.infinitySeedCommand = null;
        this.infinityCycleCount = 0;
        this.logActivity('Infinity mode deactivated');
    }

    queueNextInfinityTask() {
        if (!this.infinityMode || !this.infinitySeedCommand) return;

        this.infinityCycleCount += 1;
        const cycleTask = this.createTask(`Infinity Cycle ${this.infinityCycleCount}: ${this.infinitySeedCommand}`);
        this.addTask(cycleTask);
    }

    // Create a task from a command
    createTask(command) {
        return {
            id: this.generateTaskId(),
            command: command,
            status: 'pending',
            createdAt: new Date(),
            steps: this.breakDownIntoSteps(command),
            currentStep: 0
        };
    }

    // Break down command into executable steps
    breakDownIntoSteps(command) {
        const profile = this.getMoodProfile();
        const isOnlineComputerTask = /online|agent|automation|system|computer|active/i.test(command);

        const steps = [
            { action: 'analyze', description: `Analyze the command: "${command}"` },
            { action: 'plan', description: `Create ${profile.depth}-depth execution plan aligned with Master Vision` },
            { action: 'execute', description: 'Execute the plan step by step' },
            { action: 'verify', description: 'Verify results against goals and alignment metrics' },
            { action: 'learn', description: 'Learn and store insights for future tasks' }
        ];

        if (isOnlineComputerTask) {
            steps.splice(2, 0,
                { action: 'orchestrate', description: 'Orchestrate online-computer modules (memory, execution, monitoring)' },
                { action: 'activate', description: 'Activate autonomous agent routines for continuous operation' }
            );
        }

        if (profile.depth === 'high') {
            steps.splice(steps.length - 1, 0, {
                action: 'optimize',
                description: 'Optimize workflow for speed, quality, and reliable handoff'
            });
        }

        return steps;
    }

    // Add task to queue
    addTask(task) {
        this.taskQueue.push(task);
        this.logActivity(`New task added: ${task.command.substring(0, 50)}...`);

        // Update UI
        this.updateTaskList();
    }

    // Execute next task in queue
    executeNextTask() {
        if (this.taskQueue.length === 0) return;

        this.currentTask = this.taskQueue.shift();
        this.currentTask.status = 'running';

        this.logActivity(`Executing: ${this.currentTask.command}`);
        this.updateCurrentTaskDisplay();

        // Simulate task execution with steps
        this.processTaskSteps(this.currentTask);
    }

    // Process task steps
    processTaskSteps(task) {
        const totalSteps = task.steps.length;
        let stepIndex = 0;

        const perStepMs = this.infinityMode ? 1200 : 2000;

        const stepInterval = setInterval(() => {
            if (stepIndex < totalSteps) {
                const step = task.steps[stepIndex];
                this.logActivity(`Step ${stepIndex + 1}/${totalSteps}: ${step.description}`);
                stepIndex++;
                task.currentStep = stepIndex;
            } else {
                // Task completed
                clearInterval(stepInterval);
                this.completeTask(task);
            }
        }, perStepMs);
    }

    // Complete a task
    completeTask(task) {
        task.status = 'completed';
        task.completedAt = new Date();
        this.completedTasks.push(task);
        this.currentTask = null;

        this.logActivity(`✅ Task completed: ${task.command.substring(0, 50)}...`);

        // Update stats
        this.updateStats();
        this.updateTaskList();
        this.updateCurrentTaskDisplay();

        if (this.infinityMode) {
            this.queueNextInfinityTask();
        }
    }

    // Background processing
    processBackgroundThoughts() {
        // Simulate AI thinking in the background
        // This is where autonomous actions would happen

        // For now, just maintain awareness
        const uptime = this.getUptime();
        // Could add: pattern recognition, idea generation, optimization suggestions
    }

    // Generate unique task ID
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get system uptime
    getUptime() {
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Logging
    logActivity(message) {
        const logEntry = {
            timestamp: new Date(),
            message: message
        };

        // Add to activity log in UI
        if (typeof addLogEntry === 'function') {
            addLogEntry(message);
        }

        console.log(`[V10 AI] ${message}`);
    }

    // Update UI displays
    updateStats() {
        const uptimeEl = document.getElementById('uptime');
        const completedEl = document.getElementById('tasks-completed');

        if (uptimeEl) uptimeEl.textContent = this.getUptime();
        if (completedEl) completedEl.textContent = this.completedTasks.length;
    }

    updateCurrentTaskDisplay() {
        const taskEl = document.getElementById('current-task');
        if (taskEl) {
            if (this.currentTask) {
                taskEl.textContent = this.currentTask.command.substring(0, 40) + '...';
            } else {
                taskEl.textContent = 'Monitoring & Planning';
            }
        }
    }

    updateTaskList() {
        const taskListEl = document.getElementById('task-list');
        if (!taskListEl) return;

        const allTasks = [...this.taskQueue, ...this.completedTasks];

        if (this.currentTask) {
            allTasks.unshift(this.currentTask);
        }

        if (allTasks.length === 0) {
            taskListEl.innerHTML = '<div class="empty-state"><p>No active tasks. The AI is ready to execute.</p></div>';
            return;
        }

        taskListEl.innerHTML = allTasks.map(task => `
            <div class="task-item">
                <div class="task-info">
                    <h4>${task.command.substring(0, 60)}${task.command.length > 60 ? '...' : ''}</h4>
                    <div class="task-meta">
                        Created: ${task.createdAt.toLocaleTimeString()}
                        ${task.currentStep ? ` • Step ${task.currentStep}/${task.steps.length}` : ''}
                    </div>
                </div>
                <div class="task-status ${task.status}">${task.status.toUpperCase()}</div>
            </div>
        `).join('');
    }

    // Toggle AI on/off
    toggle() {
        this.isActive = !this.isActive;
        const statusText = this.isActive ? 'Active' : 'Paused';

        document.getElementById('agent-toggle').textContent = statusText;
        document.getElementById('agent-toggle').className = this.isActive ? 'btn-sm btn-success' : 'btn-sm btn-ghost';

        this.logActivity(`AI Engine ${statusText.toLowerCase()}`);
    }
}

// Initialize global AI engine
let aiEngine;

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        aiEngine = new V10AIEngine();
    });
} else {
    aiEngine = new V10AIEngine();
}

// Update uptime every second
setInterval(() => {
    if (aiEngine) {
        aiEngine.updateStats();
    }
}, 1000);
