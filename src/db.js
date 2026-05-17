// SQLite persistence layer — messages, settings, tasks, wealth scans
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'truthos.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id     TEXT NOT NULL,
        role        TEXT NOT NULL CHECK(role IN ('user','assistant')),
        content     TEXT NOT NULL,
        expression  TEXT NOT NULL DEFAULT 'truthos',
        created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS user_settings (
        chat_id             TEXT PRIMARY KEY,
        preferred_expression TEXT NOT NULL DEFAULT 'truthos',
        morning_brief       INTEGER NOT NULL DEFAULT 0,
        timezone            TEXT NOT NULL DEFAULT 'UTC',
        morning_time        TEXT NOT NULL DEFAULT '07:00',
        updated_at          INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS wealth_scans (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id     TEXT NOT NULL,
        opportunity TEXT NOT NULL,
        decision    TEXT CHECK(decision IN ('yes','no','pending')) DEFAULT 'pending',
        created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id     TEXT NOT NULL,
        content     TEXT NOT NULL,
        status      TEXT NOT NULL CHECK(status IN ('open','done')) DEFAULT 'open',
        source      TEXT NOT NULL DEFAULT 'manual',
        created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat    ON messages(chat_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_chat       ON tasks(chat_id, status);
    CREATE INDEX IF NOT EXISTS idx_scans_chat       ON wealth_scans(chat_id, created_at DESC);
`);

// ── Messages ───────────────────────────────────────────────────────────────

const _insertMsg = db.prepare(
    `INSERT INTO messages (chat_id, role, content, expression) VALUES (?, ?, ?, ?)`
);
const _getHistory = db.prepare(
    `SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?`
);
const _clearHistory = db.prepare(`DELETE FROM messages WHERE chat_id = ?`);

function saveMessage(chatId, role, content, expression = 'truthos') {
    _insertMsg.run(String(chatId), role, content, expression);
}

function getHistory(chatId, limit = 20) {
    const rows = _getHistory.all(String(chatId), limit);
    return rows.reverse(); // chronological order
}

function clearHistory(chatId) {
    _clearHistory.run(String(chatId));
}

// ── Settings ───────────────────────────────────────────────────────────────

const _upsertSettings = db.prepare(`
    INSERT INTO user_settings (chat_id, preferred_expression, morning_brief, timezone, morning_time, updated_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(chat_id) DO UPDATE SET
        preferred_expression = excluded.preferred_expression,
        morning_brief        = excluded.morning_brief,
        timezone             = excluded.timezone,
        morning_time         = excluded.morning_time,
        updated_at           = unixepoch()
`);
const _getSettings = db.prepare(`SELECT * FROM user_settings WHERE chat_id = ?`);
const _getAllBrief  = db.prepare(`SELECT * FROM user_settings WHERE morning_brief = 1`);

function getSettings(chatId) {
    return _getSettings.get(String(chatId)) || {
        chat_id: String(chatId),
        preferred_expression: 'truthos',
        morning_brief: 0,
        timezone: 'UTC',
        morning_time: '07:00'
    };
}

function setExpression(chatId, expression) {
    const s = getSettings(chatId);
    _upsertSettings.run(String(chatId), expression, s.morning_brief, s.timezone, s.morning_time);
}

function setMorningBrief(chatId, enabled, morningTime = '07:00') {
    const s = getSettings(chatId);
    _upsertSettings.run(String(chatId), s.preferred_expression, enabled ? 1 : 0, s.timezone, morningTime);
}

function getAllBriefSubscribers() {
    return _getAllBrief.all();
}

// ── Tasks ──────────────────────────────────────────────────────────────────

const _addTask      = db.prepare(`INSERT INTO tasks (chat_id, content, source) VALUES (?, ?, ?)`);
const _getOpenTasks = db.prepare(`SELECT * FROM tasks WHERE chat_id = ? AND status = 'open' ORDER BY created_at ASC`);
const _completeTask = db.prepare(`UPDATE tasks SET status = 'done' WHERE id = ? AND chat_id = ?`);

function addTask(chatId, content, source = 'manual') {
    _addTask.run(String(chatId), content.trim(), source);
}

function getOpenTasks(chatId) {
    return _getOpenTasks.all(String(chatId));
}

function completeTask(chatId, taskId) {
    const info = _completeTask.run(String(taskId), String(chatId));
    return info.changes > 0;
}

// ── Wealth Scans ───────────────────────────────────────────────────────────

const _insertScan  = db.prepare(`INSERT INTO wealth_scans (chat_id, opportunity) VALUES (?, ?)`);
const _updateScan  = db.prepare(`UPDATE wealth_scans SET decision = ? WHERE id = ? AND chat_id = ?`);
const _latestScan  = db.prepare(
    `SELECT * FROM wealth_scans WHERE chat_id = ? AND decision = 'pending' ORDER BY created_at DESC LIMIT 1`
);
const _scanById    = db.prepare(`SELECT * FROM wealth_scans WHERE id = ? AND chat_id = ?`);

function saveWealthScan(chatId, opportunityObj) {
    const info = _insertScan.run(String(chatId), JSON.stringify(opportunityObj));
    return info.lastInsertRowid;
}

function updateWealthDecision(chatId, scanId, decision) {
    _updateScan.run(decision, String(scanId), String(chatId));
}

function getLatestPendingScan(chatId) {
    return _latestScan.get(String(chatId)) || null;
}

function getScanById(chatId, scanId) {
    return _scanById.get(String(scanId), String(chatId)) || null;
}

module.exports = {
    saveMessage, getHistory, clearHistory,
    getSettings, setExpression, setMorningBrief, getAllBriefSubscribers,
    addTask, getOpenTasks, completeTask,
    saveWealthScan, updateWealthDecision, getLatestPendingScan, getScanById
};
