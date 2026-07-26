/**
 * Sauvegarde complete : annonces, comptes et photos.
 *
 *   npm run backup                  cree une sauvegarde dans ./sauvegardes
 *   npm run backup -- /chemin/vers  cree la sauvegarde ailleurs (cle USB...)
 *
 * A faire au moins une fois par semaine. Sans sauvegarde, une panne du
 * serveur efface tout le travail des membres du groupe.
 */
const fs = require('node:fs');
const path = require('node:path');
const { db, DATA_DIR } = require('../lib/db');

const target = process.argv[2] || path.join(__dirname, '..', 'sauvegardes');
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const dest = path.join(target, `sauvegarde-${stamp}`);

fs.mkdirSync(dest, { recursive: true });

// La commande VACUUM INTO produit une copie propre et coherente de la base,
// meme si le site est en train de tourner.
db.exec(`VACUUM INTO '${path.join(dest, 'annonces.db').replace(/'/g, "''")}'`);

const uploads = path.join(DATA_DIR, 'uploads');
let photos = 0;
if (fs.existsSync(uploads)) {
  fs.cpSync(uploads, path.join(dest, 'uploads'), { recursive: true });
  photos = fs.readdirSync(uploads).length;
}

const { users } = db.prepare('SELECT COUNT(*) AS users FROM users').get();
const { ads } = db.prepare('SELECT COUNT(*) AS ads FROM listings').get();

console.log(`Sauvegarde terminee : ${dest}`);
console.log(`  ${users} compte(s), ${ads} annonce(s), ${photos} photo(s)`);
console.log('\nPensez a copier ce dossier ailleurs (cle USB, Google Drive...).');
