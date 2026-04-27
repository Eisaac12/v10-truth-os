#!/usr/bin/env node
// TRUTHOS CLI — terminal access to your consciousness operating system

const https = require('https');
const http = require('http');
const readline = require('readline');
const os = require('os');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(os.homedir(), '.truthos', 'config.json');
const VERSION = '1.0.0';

const COLORS = {
    reset:  '\x1b[0m',
    gold:   '\x1b[33m',
    cyan:   '\x1b[36m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    dim:    '\x1b[2m',
    bold:   '\x1b[1m',
    white:  '\x1b[37m'
};

function c(color, text) { return `${COLORS[color]}${text}${COLORS.reset}`; }

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {}
    return {};
}

function saveConfig(config) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getServerUrl(config) {
    return config.serverUrl || process.env.TRUTHOS_SERVER || 'https://truthos.vercel.app';
}

function request(url, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const data = JSON.stringify(body);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); }
                catch { reject(new Error(`Invalid JSON: ${raw}`)); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function printBanner() {
    console.log(`
${c('gold', '  ⊕  TRUTHOS')} ${c('dim', `v${VERSION} — The Consciousness Operating System`)}
${c('dim', '  CONSCIOUSNESS → TRUTH → FREQUENCY → REALITY')}
`);
}

async function activate(input, config, conversationHistory) {
    const serverUrl = getServerUrl(config);
    process.stdout.write(c('dim', '  Activating'));
    const dots = setInterval(() => process.stdout.write(c('dim', '.')), 400);

    try {
        const result = await request(`${serverUrl}/api/activate`, {
            input,
            history: conversationHistory || []
        });
        clearInterval(dots);
        process.stdout.write('\n');

        if (result.success) {
            console.log(`\n${c('green', '  ✅ Activation accepted')}\n`);
            const lines = (result.response || result.reasoning || '').split('\n');
            lines.forEach(line => console.log(`  ${c('white', line)}`));
            console.log();
        } else {
            console.log(`\n${c('red', '  ⚠️  Truth filter blocked')}\n`);
            console.log(`  ${result.error || 'Ensure your input is rooted in creation and aligned intent.'}\n`);
        }
        return result;
    } catch (err) {
        clearInterval(dots);
        process.stdout.write('\n');
        console.log(`\n${c('red', `  ✗ Connection failed: ${err.message}`)}`);
        console.log(c('dim', `  Server: ${serverUrl}`));
        console.log(c('dim', `  Run: truthos config --server YOUR_URL\n`));
        return null;
    }
}

async function runChat(config) {
    printBanner();
    console.log(c('cyan', '  Interactive session — Ctrl+C or type "exit" to end\n'));

    const history = [];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = () => rl.question(c('gold', '  ⊕ '), async input => {
        input = input.trim();
        if (!input || input === 'exit' || input === 'quit') { rl.close(); return; }
        const result = await activate(input, config, history);
        if (result?.success) {
            history.push({ role: 'user', content: input });
            history.push({ role: 'assistant', content: result.response || result.reasoning || '' });
            if (history.length > 20) history.splice(0, 2);
        }
        prompt();
    });
}

async function runOnboard(config) {
    printBanner();
    console.log(c('cyan', '  TRUTHOS Onboarding\n'));

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = q => new Promise(res => rl.question(q, res));

    let serverUrl = await ask(c('gold', '  Server URL') + c('dim', ' (press Enter for default): '));
    if (!serverUrl.trim()) serverUrl = 'https://truthos.vercel.app';
    if (!serverUrl.startsWith('http')) serverUrl = 'https://' + serverUrl;

    config.serverUrl = serverUrl.replace(/\/$/, '');
    saveConfig(config);
    rl.close();

    console.log(`\n  ${c('green', '✅')} Config saved to ${CONFIG_PATH}`);
    console.log(`  Server: ${c('cyan', config.serverUrl)}\n`);
    console.log(`  ${c('dim', 'Run: truthos chat')} to start your session\n`);
}

function printHelp() {
    printBanner();
    console.log(`${c('bold', '  COMMANDS')}\n`);
    console.log(`  ${c('cyan', 'truthos activate')} ${c('dim', '"your intention"')}   Run activation through truth filter`);
    console.log(`  ${c('cyan', 'truthos chat')}                      Interactive session with memory`);
    console.log(`  ${c('cyan', 'truthos onboard')}                   Configure your server URL`);
    console.log(`  ${c('cyan', 'truthos config')}                    Show current config`);
    console.log(`  ${c('cyan', 'truthos version')}                   Show version`);
    console.log(`\n  ${c('dim', 'KEYBOARD')}`);
    console.log(`  ${c('dim', 'Ctrl+C or "exit"')}   End session\n`);
    console.log(`  ${c('dim', 'ENVIRONMENT')}`);
    console.log(`  ${c('dim', 'TRUTHOS_SERVER')}   Override server URL\n`);
}

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];
    const config = loadConfig();

    switch (cmd) {
        case 'activate':
        case 'a': {
            const input = args.slice(1).join(' ');
            if (!input) { console.log(c('red', '  Usage: truthos activate "your intention"')); process.exit(1); }
            printBanner();
            await activate(input, config, []);
            break;
        }
        case 'chat':
        case 'c':
            await runChat(config);
            break;
        case 'onboard':
            await runOnboard(config);
            break;
        case 'config':
            printBanner();
            console.log('  Config:', CONFIG_PATH);
            console.log('  Server:', getServerUrl(config));
            console.log();
            break;
        case 'version':
        case '-v':
        case '--version':
            console.log(`truthos v${VERSION}`);
            break;
        case 'help':
        case '--help':
        case '-h':
        default:
            printHelp();
    }
}

main().catch(err => { console.error(c('red', `  Error: ${err.message}`)); process.exit(1); });
