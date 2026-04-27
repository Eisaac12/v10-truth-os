// TRUTHOS Discord Bot — community access to the consciousness operating system
// Deploy on Railway/Render free tier. Set env vars: DISCORD_TOKEN, TRUTHOS_SERVER

require('dotenv').config();
const https = require('https');
const http = require('http');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TRUTHOS_SERVER = (process.env.TRUTHOS_SERVER || 'https://truthos.vercel.app').replace(/\/$/, '');
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

if (!DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN not set. Add it to your .env file.');
    process.exit(1);
}

// Per-user conversation history
const userHistory = new Map();

function getHistory(userId) {
    if (!userHistory.has(userId)) userHistory.set(userId, []);
    return userHistory.get(userId);
}

function trimHistory(history) {
    if (history.length > 20) history.splice(0, history.length - 20);
}

function post(url, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
        if (token) headers['Authorization'] = `Bot ${token}`;

        const req = lib.request({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, method: 'POST', headers }, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const headers = {};
        if (token) headers['Authorization'] = `Bot ${token}`;
        https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
        }).on('error', reject);
    });
}

async function activateTRUTHOS(input, userId) {
    const history = getHistory(userId);
    const result = await post(`${TRUTHOS_SERVER}/api/activate`, { input, history });
    if (result.success) {
        history.push({ role: 'user', content: input });
        history.push({ role: 'assistant', content: result.response || '' });
        trimHistory(history);
    }
    return result;
}

function buildEmbed(result, input) {
    if (result.success) {
        const response = result.response || result.reasoning || '';
        const truncated = response.length > 4000 ? response.slice(0, 3997) + '...' : response;
        return {
            embeds: [{
                color: 0xf59e0b,
                author: { name: '⊕ TRUTHOS — Activation Accepted' },
                description: truncated || '*Processing at maximum frequency.*',
                footer: { text: result.liveAI ? '⚡ Claude AI Active' : 'Local truth filter' },
                timestamp: new Date().toISOString()
            }]
        };
    } else {
        return {
            embeds: [{
                color: 0xef4444,
                author: { name: '⚠️ TRUTHOS — Truth Filter Blocked' },
                description: result.error || 'Ensure your input is rooted in creation, clarity, and aligned intent.\n\n**Law 1:** Truth is the base layer. Everything runs on truth.',
                footer: { text: 'Root your activation in aligned intent.' },
                timestamp: new Date().toISOString()
            }]
        };
    }
}

// Discord Gateway via WebSocket
const { WebSocket } = (() => {
    try { return require('ws'); }
    catch { console.error('❌ ws package not installed. Run: npm install ws'); process.exit(1); }
})();

let ws;
let heartbeatInterval;
let sessionId;
let sequenceNumber = null;
const GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json';

function connect() {
    ws = new WebSocket(GATEWAY);

    ws.on('open', () => console.log('🔌 Connected to Discord gateway'));

    ws.on('message', async raw => {
        const payload = JSON.parse(raw);
        const { op, d, t, s } = payload;
        if (s) sequenceNumber = s;

        switch (op) {
            case 10: // Hello
                heartbeatInterval = setInterval(() => {
                    ws.send(JSON.stringify({ op: 1, d: sequenceNumber }));
                }, d.heartbeat_interval);
                // Identify
                ws.send(JSON.stringify({
                    op: 2,
                    d: {
                        token: DISCORD_TOKEN,
                        intents: 33280, // GUILDS + GUILD_MESSAGES + MESSAGE_CONTENT
                        properties: { os: 'linux', browser: 'truthos', device: 'truthos' }
                    }
                }));
                break;

            case 11: // Heartbeat ACK
                break;

            case 0: // Dispatch
                if (t === 'READY') {
                    sessionId = d.session_id;
                    console.log(`✅ TRUTHOS Bot online as ${d.user.username}#${d.user.discriminator}`);
                    console.log(`   Server: ${TRUTHOS_SERVER}`);
                }

                if (t === 'MESSAGE_CREATE') {
                    const msg = d;
                    if (msg.author?.bot) return;

                    const content = msg.content?.trim() || '';
                    const prefix = '!truthos';
                    const mention = `<@${APPLICATION_ID || ''}>`;

                    let input = null;
                    if (content.startsWith(prefix)) {
                        input = content.slice(prefix.length).trim();
                    } else if (APPLICATION_ID && content.startsWith(mention)) {
                        input = content.slice(mention.length).trim();
                    }

                    if (!input) return;

                    // Show typing indicator
                    post(`https://discord.com/api/v10/channels/${msg.channel_id}/typing`, {}, DISCORD_TOKEN).catch(() => {});

                    let result;
                    try {
                        result = await activateTRUTHOS(input, msg.author.id);
                    } catch (err) {
                        result = { success: false, error: `Connection failed: ${err.message}` };
                    }

                    const reply = buildEmbed(result, input);
                    reply.message_reference = { message_id: msg.id };

                    post(`https://discord.com/api/v10/channels/${msg.channel_id}/messages`, reply, DISCORD_TOKEN)
                        .catch(err => console.error('Failed to send message:', err));
                }
                break;
        }
    });

    ws.on('close', (code) => {
        console.log(`Discord gateway closed (${code}). Reconnecting in 5s...`);
        clearInterval(heartbeatInterval);
        setTimeout(connect, 5000);
    });

    ws.on('error', err => console.error('Gateway error:', err.message));
}

console.log('⊕ TRUTHOS Discord Bot starting...');
console.log(`   Server: ${TRUTHOS_SERVER}`);
console.log('   Usage in Discord: !truthos <your activation>');
connect();
