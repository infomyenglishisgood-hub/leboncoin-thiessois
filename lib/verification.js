/**
 * Verification du numero de telephone par code SMS.
 *
 * Regles anti-abus (importantes : chaque SMS vous coute de l'argent) :
 *   - 60 secondes minimum entre deux envois vers le meme numero
 *   - 3 envois maximum par heure et par numero
 *   - le code expire au bout de 10 minutes
 *   - 5 essais maximum, ensuite il faut redemander un code
 *
 * Le code n'est jamais stocke en clair dans la base de donnees.
 */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const sms = require('./sms');

const CODE_TTL_MS = 10 * 60 * 1000;   // validite du code
const RESEND_WAIT_MS = 60 * 1000;     // attente entre deux envois
const MAX_SENDS_PER_HOUR = 3;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

const getRow = db.prepare('SELECT * FROM otp_codes WHERE phone = ?');
const deleteRow = db.prepare('DELETE FROM otp_codes WHERE phone = ?');
const bumpAttempts = db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?');
const upsertRow = db.prepare(`
  INSERT INTO otp_codes (phone, code_hash, expires_at, attempts, sent_count, last_sent_at, window_start)
  VALUES (:phone, :hash, :expires, 0, :sent, :now, :window)
  ON CONFLICT(phone) DO UPDATE SET
    code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
    sent_count = excluded.sent_count, last_sent_at = excluded.last_sent_at,
    window_start = excluded.window_start
`);

/** Nettoie les codes expires depuis plus d'une heure. */
function purgeOld() {
  db.prepare('DELETE FROM otp_codes WHERE expires_at < ?').run(Date.now() - WINDOW_MS);
}

/**
 * Envoie un code au numero donne.
 * Renvoie { ok:true, devCode? } ou { ok:false, error:'<cle i18n>', wait? }
 */
async function requestCode(phone, locale = 'fr') {
  purgeOld();
  const now = Date.now();
  const row = getRow.get(phone);

  let sentCount = 1;
  let windowStart = now;

  if (row) {
    const sameWindow = now - row.window_start < WINDOW_MS;

    if (now - row.last_sent_at < RESEND_WAIT_MS) {
      return {
        ok: false,
        error: 'err_otp_wait',
        wait: Math.ceil((RESEND_WAIT_MS - (now - row.last_sent_at)) / 1000),
      };
    }
    if (sameWindow && row.sent_count >= MAX_SENDS_PER_HOUR) {
      return { ok: false, error: 'err_otp_too_many_sends' };
    }
    if (sameWindow) {
      sentCount = row.sent_count + 1;
      windowStart = row.window_start;
    }
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const result = await sms.sendCode(phone, code, locale);

  if (!result.ok) return { ok: false, error: 'err_otp_send_failed' };

  upsertRow.run({
    phone,
    hash: await bcrypt.hash(code, 8),
    expires: now + CODE_TTL_MS,
    sent: sentCount,
    now,
    window: windowStart,
  });

  return { ok: true, devCode: result.devCode };
}

/**
 * Verifie le code saisi. En cas de succes, le compte est marque comme verifie.
 * Renvoie { ok:true } ou { ok:false, error:'<cle i18n>' }
 */
async function checkCode(phone, submitted) {
  const row = getRow.get(phone);
  if (!row) return { ok: false, error: 'err_otp_none' };

  if (row.expires_at < Date.now()) {
    deleteRow.run(phone);
    return { ok: false, error: 'err_otp_expired' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    deleteRow.run(phone);
    return { ok: false, error: 'err_otp_too_many_tries' };
  }

  const clean = String(submitted || '').replace(/\D/g, '');
  if (clean.length !== 6 || !(await bcrypt.compare(clean, row.code_hash))) {
    bumpAttempts.run(phone);
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    return { ok: false, error: 'err_otp_wrong', left: Math.max(0, left) };
  }

  db.prepare('UPDATE users SET phone_verified = 1 WHERE phone = ?').run(phone);
  deleteRow.run(phone);
  return { ok: true };
}

module.exports = { requestCode, checkCode, CODE_TTL_MS, MAX_ATTEMPTS, MAX_SENDS_PER_HOUR };
