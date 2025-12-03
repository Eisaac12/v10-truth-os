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
        setInterval(() => {
            if (this.isActive) {
                this.think();
            }
        }, 5000); // Think every 5 seconds
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
                reasoning: evaluation.reasoning
            };
        } else {
            return {
                success: false,
                message: "Command not aligned with Master Vision",
                reasoning: evaluation.reasoning
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

        const score = negativeCount > 0 ? 0 : Math.min(100, 70 + (positiveCount * 10));
        const aligned = score >= 60;

        let reasoning = '';
        if (aligned) {
            reasoning = `This command shows: ${Object.keys(alignmentIndicators).filter(k => alignmentIndicators[k]).join(', ')}. Aligned with Master Vision principles.`;
        } else {
            reasoning = 'This command does not align with the Master Vision principles of creation, truth, and peace.';
        }

        return { aligned, score, reasoning };
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
        // AI planning logic
        const steps = [
            { action: 'analyze', description: `Analyze the command: "${command}"` },
            { action: 'plan', description: 'Create execution plan aligned with Master Vision' },
            { action: 'execute', description: 'Execute the plan step by step' },
            { action: 'verify', description: 'Verify results against goals' },
            { action: 'learn', description: 'Learn and store insights for future tasks' }
        ];

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
        }, 2000); // Each step takes 2 seconds
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
