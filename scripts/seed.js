/**
 * Remplit le site avec quelques annonces d'exemple, pour voir a quoi il
 * ressemble avant l'ouverture au public.
 *
 *   node scripts/seed.js
 *
 * Compte de demonstration cree : 77 000 00 01 / demo1234
 * Supprimez le fichier data/annonces.db pour repartir de zero.
 */
const bcrypt = require('bcryptjs');
const { db } = require('../lib/db');

const hash = bcrypt.hashSync('demo1234', 10);

const users = [
  ['Awa Diop',    '221770000001', 'thies'],
  ['Modou Fall',  '221770000002', 'mbour'],
  ['Fatou Ndiaye','221770000003', 'tivaouane'],
];

const listings = [
  ['Refrigerateur Samsung 2 portes', "Tres bon etat, achete il y a 2 ans. Fonctionne parfaitement, cause demenagement.\nA venir chercher au quartier Grand Thies.", 75000, 1, 'electromenager', 'thies', 'occasion'],
  ['Toyota Corolla 2012 essence', "Kilometrage 148 000 km, papiers a jour, visite technique valable jusqu'en mars. Pneus neufs.", 4500000, 1, 'vehicules', 'thies', 'occasion'],
  ['iPhone 12 64 Go', 'Batterie 89%, ecran sans rayure, avec chargeur et coque. Debloque tous operateurs.', 165000, 0, 'telephones', 'mbour', 'occasion'],
  ['Chambre meublee a louer', 'Chambre avec salle de bain privee, eau et electricite comprises. Quartier calme, proche du marche.', 60000, 0, 'immobilier', 'thies', 'occasion'],
  ['Machine a coudre Singer', 'Machine mecanique robuste, ideale pour un atelier de couture. Livree avec pedale.', 45000, 1, 'materiaux', 'tivaouane', 'occasion'],
  ['Lot de 20 poulets de chair', 'Poulets eleves a la ferme, prets pour la vente. Prix pour le lot complet.', 90000, 1, 'animaux', 'thies', 'neuf'],
  ['Cours de soutien maths et physique', "Professeur experimente, niveau college et lycee. Deplacement possible dans Thies. Tarif mensuel.", 25000, 0, 'services', 'thies', 'neuf'],
  ['Canape 3 places en tissu', 'Bon etat general, quelques traces d usage sur les accoudoirs. Tres confortable.', 55000, 1, 'maison', 'mbour', 'occasion'],
  ['Ordinateur portable HP i5', '8 Go de RAM, SSD 256 Go, Windows 11 installe. Autonomie environ 4 heures.', 210000, 1, 'informatique', 'thies', 'occasion'],
  ['Sacs de riz brise 50 kg', 'Vente en gros et en detail. Livraison possible dans Thies et environs.', 21000, 0, 'alimentation', 'thies', 'neuf'],
  ['Robe wax sur mesure', 'Confection sur mesure, tissu wax de qualite au choix. Delai 5 jours.', null, 0, 'mode', 'tivaouane', 'neuf'],
  ['Recherche apprenti mecanicien', "Garage a Thies recherche un apprenti motive. Formation assuree, petite indemnite mensuelle.", null, 0, 'emploi', 'thies', 'neuf'],
];

// Les comptes de demonstration sont deja verifies : aucun SMS n'est envoye.
const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (name, phone, whatsapp, city, password_hash, phone_verified) VALUES (?, ?, ?, ?, ?, 1)'
);
users.forEach(([name, phone, city]) => insertUser.run(name, phone, phone, city, hash));

const ids = db.prepare('SELECT id FROM users ORDER BY id LIMIT 3').all().map((r) => r.id);

const insertListing = db.prepare(`
  INSERT INTO listings (user_id, title, description, price, negotiable, category, city, condition, views, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

listings.forEach((l, i) => {
  insertListing.run(ids[i % ids.length], l[0], l[1], l[2], l[3], l[4], l[5], l[6],
    Math.floor(Math.random() * 90), `-${i * 7} hours`);
});

console.log(`${listings.length} annonces de demonstration ajoutees.`);
console.log('Connexion demo : 77 000 00 01  /  demo1234');
