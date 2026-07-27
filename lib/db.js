/**
 * Base de donnees SQLite (module natif de Node 22.5+, aucune compilation requise).
 * Le fichier de donnees est cree automatiquement au premier demarrage.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'annonces.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    phone         TEXT    NOT NULL UNIQUE,
    whatsapp      TEXT,
    city          TEXT    NOT NULL DEFAULT 'thies',
    password_hash TEXT    NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    price       INTEGER,
    negotiable  INTEGER NOT NULL DEFAULT 0,
    category    TEXT    NOT NULL,
    city        TEXT    NOT NULL,
    condition   TEXT    NOT NULL DEFAULT 'occasion',
    status      TEXT    NOT NULL DEFAULT 'active',
    views       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    filename   TEXT    NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reports (
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reason     TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  -- Codes de verification envoyes par SMS (jamais stockes en clair).
  CREATE TABLE IF NOT EXISTS otp_codes (
    phone        TEXT PRIMARY KEY,
    code_hash    TEXT    NOT NULL,
    expires_at   INTEGER NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    sent_count   INTEGER NOT NULL DEFAULT 1,
    last_sent_at INTEGER NOT NULL,
    window_start INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
  CREATE INDEX IF NOT EXISTS idx_listings_city     ON listings(city);
  CREATE INDEX IF NOT EXISTS idx_listings_user     ON listings(user_id);
  CREATE INDEX IF NOT EXISTS idx_images_listing    ON images(listing_id, position);
`);

// --- Mises a jour de structure pour les bases creees avant une nouvelle version ---
const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
if (!userColumns.includes('phone_verified')) {
  db.exec('ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0');
}

/** Recherche plein texte simple (LIKE) - suffisant pour quelques milliers d'annonces. */
function searchListings({ q = '', category = '', city = '', sort = 'recent', limit = 24, offset = 0 }) {
  const where = ["l.status = 'active'"];
  const params = {};

  if (q.trim()) {
    where.push('(l.title LIKE :q OR l.description LIKE :q)');
    params.q = `%${q.trim()}%`;
  }
  if (category) { where.push('l.category = :category'); params.category = category; }
  if (city) { where.push('l.city = :city'); params.city = city; }

  const order = {
    recent: 'l.created_at DESC',
    ancien: 'l.created_at ASC',
    prix_asc: 'CASE WHEN l.price IS NULL THEN 1 ELSE 0 END, l.price ASC',
    prix_desc: 'CASE WHEN l.price IS NULL THEN 1 ELSE 0 END, l.price DESC',
  }[sort] || 'l.created_at DESC';

  const clause = where.join(' AND ');

  const rows = db.prepare(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone, u.whatsapp AS seller_whatsapp,
           (SELECT filename FROM images WHERE listing_id = l.id ORDER BY position LIMIT 1) AS cover
    FROM listings l JOIN users u ON u.id = l.user_id
    WHERE ${clause}
    ORDER BY ${order}
    LIMIT :limit OFFSET :offset
  `).all({ ...params, limit, offset });

  const { total } = db.prepare(
    `SELECT COUNT(*) AS total FROM listings l WHERE ${clause}`
  ).get(params);

  return { rows, total };
}

function getListing(id) {
  return db.prepare(`
    SELECT l.*, u.name AS seller_name, u.phone AS seller_phone,
           u.whatsapp AS seller_whatsapp, u.city AS seller_city, u.created_at AS seller_since,
           u.phone_verified AS seller_verified
    FROM listings l JOIN users u ON u.id = l.user_id
    WHERE l.id = ?
  `).get(id);
}

const getImages = (listingId) =>
  db.prepare('SELECT * FROM images WHERE listing_id = ? ORDER BY position').all(listingId);

const listingsByUser = (userId) => db.prepare(`
  SELECT l.*, (SELECT filename FROM images WHERE listing_id = l.id ORDER BY position LIMIT 1) AS cover
  FROM listings l WHERE l.user_id = ? ORDER BY l.created_at DESC
`).all(userId);

const categoryCounts = () => {
  const rows = db.prepare(
    "SELECT category, COUNT(*) AS n FROM listings WHERE status = 'active' GROUP BY category"
  ).all();
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
};

module.exports = { db, searchListings, getListing, getImages, listingsByUser, categoryCounts, DATA_DIR };
