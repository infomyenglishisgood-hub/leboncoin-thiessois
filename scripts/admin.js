/**
 * Donne (ou retire) les droits d'administrateur a un membre.
 * Un administrateur peut modifier et supprimer n'importe quelle annonce.
 *
 *   npm run admin -- 77 123 45 67          donne les droits
 *   npm run admin -- 77 123 45 67 retirer  retire les droits
 *   npm run admin                          affiche la liste des administrateurs
 */
const { db } = require('../lib/db');
const { normalizePhone, displayPhone } = require('../lib/helpers');

const args = process.argv.slice(2);
const remove = args.some((a) => /^(retirer|remove|off)$/i.test(a));
const raw = args.filter((a) => !/^(retirer|remove|off)$/i.test(a)).join('');

if (!raw) {
  const admins = db.prepare('SELECT name, phone FROM users WHERE is_admin = 1').all();
  if (!admins.length) {
    console.log('Aucun administrateur pour le moment.');
    console.log('Pour en designer un :  npm run admin -- 77 123 45 67');
  } else {
    console.log('Administrateurs :');
    admins.forEach((a) => console.log(`  - ${a.name} (${displayPhone(a.phone)})`));
  }
  process.exit(0);
}

const phone = normalizePhone(raw);
if (!phone) {
  console.error(`Numero invalide : "${raw}"`);
  console.error('Format attendu : 77 123 45 67');
  process.exit(1);
}

const user = db.prepare('SELECT id, name FROM users WHERE phone = ?').get(phone);
if (!user) {
  console.error(`Aucun compte avec le numero ${displayPhone(phone)}.`);
  console.error("Inscrivez-vous d'abord sur le site, puis relancez cette commande.");
  process.exit(1);
}

db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(remove ? 0 : 1, user.id);
console.log(remove
  ? `${user.name} n'est plus administrateur.`
  : `${user.name} est maintenant administrateur.`);
