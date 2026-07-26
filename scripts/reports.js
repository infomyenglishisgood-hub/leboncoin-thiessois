/**
 * Affiche les annonces signalees par les visiteurs (arnaques, doublons...).
 *
 *   npm run reports
 */
const { db } = require('../lib/db');

const rows = db.prepare(`
  SELECT r.created_at, r.reason, l.id, l.title, u.name AS vendeur
  FROM reports r
  LEFT JOIN listings l ON l.id = r.listing_id
  LEFT JOIN users u ON u.id = l.user_id
  ORDER BY r.created_at DESC LIMIT 50
`).all();

if (!rows.length) {
  console.log('Aucun signalement. Tout va bien.');
  process.exit(0);
}

console.log(`${rows.length} signalement(s), du plus recent au plus ancien :\n`);
for (const r of rows) {
  console.log(`[${r.created_at}] annonce #${r.id ?? '(supprimee)'} - ${r.title ?? ''}`);
  if (r.vendeur) console.log(`  vendeur : ${r.vendeur}`);
  if (r.reason) console.log(`  motif   : ${r.reason}`);
  console.log('');
}
