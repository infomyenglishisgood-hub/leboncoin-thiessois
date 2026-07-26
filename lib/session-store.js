/**
 * Stockage des sessions dans SQLite : les utilisateurs restent connectes
 * meme apres un redemarrage du serveur.
 */
const { Store } = require('express-session');
const { db } = require('./db');

const get = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?');
const upsert = db.prepare(
  `INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
   ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at`
);
const destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
const purge = db.prepare('DELETE FROM sessions WHERE expires_at < ?');

class SqliteStore extends Store {
  constructor(ttlMs = 1000 * 60 * 60 * 24 * 30) {
    super();
    this.ttlMs = ttlMs;
    // Nettoyage des sessions expirees toutes les heures.
    this.timer = setInterval(() => purge.run(Date.now()), 60 * 60 * 1000);
    this.timer.unref?.();
  }

  get(sid, cb) {
    try {
      const row = get.get(sid);
      if (!row) return cb(null, null);
      if (row.expires_at < Date.now()) { destroyStmt.run(sid); return cb(null, null); }
      cb(null, JSON.parse(row.data));
    } catch (e) { cb(e); }
  }

  set(sid, sess, cb) {
    try {
      const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + this.ttlMs;
      upsert.run(sid, JSON.stringify(sess), expires);
      cb(null);
    } catch (e) { cb(e); }
  }

  touch(sid, sess, cb) { this.set(sid, sess, cb); }

  destroy(sid, cb) {
    try { destroyStmt.run(sid); cb(null); } catch (e) { cb(e); }
  }
}

module.exports = SqliteStore;
