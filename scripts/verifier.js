/**
 * Valide un numero a la main, sans passer par le SMS.
 *
 * Utile quand le SMS n'arrive pas (probleme de reseau, numero etranger,
 * membre de confiance que vous connaissez personnellement).
 *
 *   npm run verifier -- 77 123 45 67           marque le numero comme verifie
 *   npm run verifier -- 77 123 45 67 annuler   retire la verification
 *   npm run verifier                           liste les comptes non verifies
 */
const { db } = require('../lib/db');
const { normalizePhone, displayPhone } = require('../lib/helpers');

const args = process.argv.slice(2);
const cancel = args.some((a) => /^(annuler|cancel|off)$/i.test(a));
const raw = args.filter((a) => !/^(annuler|cancel|off)$/i.test(a)).join('');

if (!raw) {
  const pending = db.prepare(
    'SELECT name, phone, created_at FROM users WHERE phone_verified = 0 ORDER BY created_at DESC'
  ).all();
  if (!pending.length) {
    console.log('Tous les comptes ont un numero verifie.');
  } else {
    console.log(`${pending.length} compte(s) en attente de verification :`);
    pending.forEach((u) => console.log(`  - ${u.name} (${displayPhone(u.phone)}) inscrit le ${u.created_at}`));
    console.log('\nPour en valider un :  npm run verifier -- 77 123 45 67');
  }
  process.exit(0);
}

const phone = normalizePhone(raw);
if (!phone) {
  console.error(`Numero invalide : "${raw}"  (format attendu : 77 123 45 67)`);
  process.exit(1);
}

const user = db.prepare('SELECT id, name FROM users WHERE phone = ?').get(phone);
if (!user) {
  console.error(`Aucun compte avec le numero ${displayPhone(phone)}.`);
  process.exit(1);
}

db.prepare('UPDATE users SET phone_verified = ? WHERE id = ?').run(cancel ? 0 : 1, user.id);
db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);

console.log(cancel
  ? `Le numero de ${user.name} n'est plus marque comme verifie.`
  : `Le numero de ${user.name} est maintenant verifie. Il peut deposer des annonces.`);
