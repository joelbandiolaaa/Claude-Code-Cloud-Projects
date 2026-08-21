import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import { login, logout, requireAuth, isValidSession, COOKIE_NAME } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4001;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

// ---------- Auth ----------
app.post('/api/login', (req, res) => {
  const { pin } = req.body || {};
  const token = login(pin);
  if (!token) return res.status(401).json({ error: 'Incorrect PIN' });
  res.cookie(COOKIE_NAME, token, cookieOpts);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  logout(req.cookies[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: isValidSession(req.cookies[COOKIE_NAME]) });
});

app.use('/api', requireAuth);

// ---------- Tags ----------
app.get('/api/tags', (req, res) => {
  const tags = db.prepare('SELECT * FROM tags ORDER BY name COLLATE NOCASE').all();
  res.json(tags);
});

app.post('/api/tags', (req, res) => {
  const { name, color } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tag name required' });
  const stmt = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET color=excluded.color');
  stmt.run(name.trim(), color || '#6b7280');
  const tag = db.prepare('SELECT * FROM tags WHERE name = ? COLLATE NOCASE').get(name.trim());
  res.json(tag);
});

app.delete('/api/tags/:id', (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Entries ----------
const getTagsForEntry = db.prepare(`
  SELECT t.* FROM tags t
  JOIN entry_tags et ON et.tag_id = t.id
  WHERE et.entry_id = ?
  ORDER BY t.name COLLATE NOCASE
`);

const getAttachmentsForEntry = db.prepare(`
  SELECT id, mime, entry_id FROM attachments WHERE entry_id = ?
`);

function hydrateEntry(entry) {
  return {
    ...entry,
    tags: getTagsForEntry.all(entry.id),
    attachments: getAttachmentsForEntry.all(entry.id),
  };
}

app.get('/api/entries', (req, res) => {
  const { tag, from, to, q } = req.query;
  let sql = 'SELECT DISTINCT e.* FROM entries e';
  const clauses = [];
  const params = [];

  if (tag) {
    sql += ' JOIN entry_tags et ON et.entry_id = e.id JOIN tags t ON t.id = et.tag_id';
    clauses.push('t.name = ? COLLATE NOCASE');
    params.push(tag);
  }
  if (from) {
    clauses.push('e.occurred_at >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('e.occurred_at <= ?');
    params.push(to);
  }
  if (q) {
    clauses.push('e.body LIKE ?');
    params.push(`%${q}%`);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY e.occurred_at DESC, e.id DESC';

  const entries = db.prepare(sql).all(...params);
  res.json(entries.map(hydrateEntry));
});

app.get('/api/entries/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json(hydrateEntry(entry));
});

const insertEntry = db.prepare(`
  INSERT INTO entries (occurred_at, body) VALUES (@occurred_at, @body)
`);
const linkTag = db.prepare('INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)');
const insertAttachment = db.prepare('INSERT INTO attachments (entry_id, mime, data) VALUES (?, ?, ?)');
const findOrCreateTag = db.prepare('SELECT id FROM tags WHERE name = ? COLLATE NOCASE');
const createTag = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');

function resolveTagIds(tagNames = []) {
  const ids = [];
  for (const name of tagNames) {
    const trimmed = String(name).trim();
    if (!trimmed) continue;
    let row = findOrCreateTag.get(trimmed);
    if (!row) {
      const info = createTag.run(trimmed, '#6b7280');
      ids.push(info.lastInsertRowid);
    } else {
      ids.push(row.id);
    }
  }
  return ids;
}

const createEntryTx = db.transaction((body, tagNames, attachments) => {
  const info = insertEntry.run(body);
  const entryId = info.lastInsertRowid;
  for (const tagId of resolveTagIds(tagNames)) linkTag.run(entryId, tagId);
  for (const att of attachments || []) {
    insertAttachment.run(entryId, att.mime, att.data);
  }
  return entryId;
});

app.post('/api/entries', (req, res) => {
  const { occurred_at, body, tags, attachments } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });
  const occurredAt = occurred_at || new Date().toISOString();
  const entryId = createEntryTx({ occurred_at: occurredAt, body: body.trim() }, tags || [], attachments || []);
  res.status(201).json(hydrateEntry(db.prepare('SELECT * FROM entries WHERE id = ?').get(entryId)));
});

const updateEntryStmt = db.prepare(`
  UPDATE entries SET occurred_at = @occurred_at, body = @body, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = @id
`);
const clearTagsForEntry = db.prepare('DELETE FROM entry_tags WHERE entry_id = ?');

const updateEntryTx = db.transaction((id, occurred_at, body, tagNames, newAttachments) => {
  updateEntryStmt.run({ id, occurred_at, body });
  clearTagsForEntry.run(id);
  for (const tagId of resolveTagIds(tagNames)) linkTag.run(id, tagId);
  for (const att of newAttachments || []) insertAttachment.run(id, att.mime, att.data);
});

app.put('/api/entries/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { occurred_at, body, tags, attachments } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });
  updateEntryTx(
    existing.id,
    occurred_at || existing.occurred_at,
    body.trim(),
    tags || [],
    attachments
  );
  res.json(hydrateEntry(db.prepare('SELECT * FROM entries WHERE id = ?').get(existing.id)));
});

app.delete('/api/entries/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Attachments ----------
app.get('/api/attachments/:id', (req, res) => {
  const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!att) return res.status(404).end();
  const buf = Buffer.from(att.data, 'base64');
  res.setHeader('Content-Type', att.mime);
  res.send(buf);
});

app.delete('/api/attachments/:id', (req, res) => {
  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Timeline server listening on http://localhost:${PORT}`);
});
