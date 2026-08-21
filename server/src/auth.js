import crypto from 'node:crypto';

const PIN = process.env.TIMELINE_PIN || '1234';
const sessions = new Map(); // token -> expiresAt
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const COOKIE_NAME = 'timeline_session';

function pruneExpired() {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt < now) sessions.delete(token);
  }
}

export function login(pin) {
  if (pin !== PIN) return null;
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function logout(token) {
  sessions.delete(token);
}

export function isValidSession(token) {
  pruneExpired();
  if (!token) return false;
  const expiresAt = sessions.get(token);
  return !!expiresAt && expiresAt > Date.now();
}

export function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export { COOKIE_NAME };
