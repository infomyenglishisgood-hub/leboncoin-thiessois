/**
 * Traductions Francais / Wolof.
 *
 * >>> C'EST LE SEUL FICHIER A MODIFIER POUR CHANGER LES TEXTES DU SITE. <<<
 * Le wolof ecrit varie beaucoup selon les regions : n'hesitez pas a corriger
 * les tournures ci-dessous pour coller a la facon dont on parle a Thies.
 */

const LOCALES = ['fr', 'wo'];
const LOCALE_NAMES = { fr: 'Francais', wo: 'Wolof' };

const strings = {
  // --- Navigation & general ---
  site_name:        { fr: 'Le Bon Coin Thiessois',       wo: 'Le Bon Coin Thiessois' },
  tagline:          { fr: 'Acheter et vendre entre voisins',  wo: 'Jënd ak jaay ci biir dëkk bi' },
  home:             { fr: 'Accueil',                     wo: 'Kër gi' },
  search:           { fr: 'Rechercher',                  wo: 'Seet' },
  search_ph:        { fr: 'Que cherchez-vous ?',         wo: 'Lan ngay seet ?' },
  post_ad:          { fr: 'Deposer une annonce',         wo: 'Génne ab annonce' },
  login:            { fr: 'Se connecter',                wo: 'Dugg' },
  signup:           { fr: "S'inscrire",                  wo: 'Bindu' },
  logout:           { fr: 'Deconnexion',                 wo: 'Génn' },
  my_ads:           { fr: 'Mes annonces',                wo: 'Sama annonce yi' },
  back:             { fr: 'Retour',                      wo: 'Dellu' },
  cancel:           { fr: 'Annuler',                     wo: 'Bàyyi' },
  save:             { fr: 'Enregistrer',                 wo: 'Denc' },
  edit:             { fr: 'Modifier',                    wo: 'Soppi' },
  delete:           { fr: 'Supprimer',                   wo: 'Far' },
  confirm_delete:   { fr: 'Supprimer definitivement cette annonce ?', wo: 'Far annonce bi ba fàww ?' },
  language:         { fr: 'Langue',                      wo: 'Làkk' },

  // --- Accueil ---
  latest_ads:       { fr: 'Dernieres annonces',          wo: 'Annonce yi mujj' },
  all_categories:   { fr: 'Toutes les categories',       wo: 'Xeet yépp' },
  all_cities:       { fr: 'Toutes les villes',           wo: 'Dëkk yépp' },
  categories:       { fr: 'Categories',                  wo: 'Xeet yi' },
  results_count:    { fr: 'annonce(s) trouvee(s)',       wo: 'annonce ñu gis' },
  no_results:       { fr: 'Aucune annonce pour cette recherche.', wo: 'Amul benn annonce ci seet bi.' },
  no_results_hint:  { fr: 'Essayez un autre mot ou une autre categorie.', wo: 'Jéemal beneen baat walla beneen xeet.' },
  sort_by:          { fr: 'Trier par',                   wo: 'Tri' },
  sort_recent:      { fr: 'Plus recentes',               wo: 'Yi gën a bees' },
  sort_old:         { fr: 'Plus anciennes',              wo: 'Yi gën a yàgg' },
  sort_price_asc:   { fr: 'Prix croissant',              wo: 'Njëg wi ci suuf' },
  sort_price_desc:  { fr: 'Prix decroissant',            wo: 'Njëg wi ci kaw' },
  filter:           { fr: 'Filtrer',                     wo: 'Tànn' },
  prev:             { fr: 'Precedent',                   wo: 'Bi jiitu' },
  next:             { fr: 'Suivant',                     wo: 'Bi ci topp' },

  // --- Annonce ---
  price:            { fr: 'Prix',                        wo: 'Njëg' },
  free:             { fr: 'Gratuit',                     wo: 'Amul njëg' },
  negotiable:       { fr: 'Prix a debattre',             wo: 'Njëg li ñuy waxtaan' },
  city:             { fr: 'Ville',                       wo: 'Dëkk' },
  category:         { fr: 'Categorie',                   wo: 'Xeet' },
  condition:        { fr: 'Etat',                        wo: 'Mbir mi' },
  new_item:         { fr: 'Neuf',                        wo: 'Bees' },
  used_item:        { fr: 'Occasion',                    wo: 'Bu ñu jëfandikoo' },
  description:      { fr: 'Description',                 wo: 'Faramfacce' },
  seller:           { fr: 'Vendeur',                     wo: 'Jaaykat bi' },
  member_since:     { fr: 'Membre depuis',               wo: 'Dafa ci nekk li dale' },
  contact_seller:   { fr: 'Contacter le vendeur',        wo: 'Jokkoo ak jaaykat bi' },
  call:             { fr: 'Appeler',                     wo: 'Woo' },
  whatsapp:         { fr: 'WhatsApp',                    wo: 'WhatsApp' },
  views:            { fr: 'vues',                        wo: 'ñu ko seetlu' },
  sold:             { fr: 'Vendu',                       wo: 'Jaay nañu ko' },
  mark_sold:        { fr: 'Marquer comme vendu',         wo: 'Bind ne jaay nañu ko' },
  mark_active:      { fr: 'Remettre en vente',           wo: 'Delloo ko ci jaay' },
  report:           { fr: 'Signaler cette annonce',      wo: 'Yëgle annonce bii' },
  report_done:      { fr: 'Merci, votre signalement a ete envoye.', wo: 'Jërëjëf, yëgle bi dem na.' },
  posted_on:        { fr: 'Publiee le',                  wo: 'Génn na ci' },
  similar_ads:      { fr: 'Annonces similaires',         wo: 'Annonce yu mel ni yii' },

  // --- Formulaire annonce ---
  new_ad:           { fr: 'Nouvelle annonce',            wo: 'Annonce bu bees' },
  edit_ad:          { fr: "Modifier l'annonce",          wo: 'Soppi annonce bi' },
  title:            { fr: 'Titre',                       wo: 'Bopp bi' },
  title_ph:         { fr: 'Ex : Refrigerateur Samsung 2 portes', wo: 'Misaal : Frigo Samsung ñaari bunt' },
  desc_ph:          { fr: "Decrivez l'article : etat, taille, raison de la vente...", wo: 'Wax nu mbir mi mel : ni mu nekk, mbooloom, lu tax ngay jaay...' },
  price_ph:         { fr: 'Ex : 75000 (laisser vide si gratuit)', wo: 'Misaal : 75000 (bàyyi ko neen su amul njëg)' },
  photos:           { fr: 'Photos',                      wo: 'Nataal yi' },
  photos_hint:      { fr: "Jusqu'a 5 photos, 5 Mo maximum chacune. Les annonces avec photos se vendent 3 fois plus vite.", wo: 'Ba ci 5 nataal, 5 Mo ñeel benn. Annonce yu am nataal ñoo gën a gaaw jaay.' },
  current_photos:   { fr: 'Photos actuelles',            wo: 'Nataal yi fi nekk' },
  remove_photo:     { fr: 'Retirer',                     wo: 'Dindi' },
  publish:          { fr: 'Publier',                     wo: 'Génne ko' },
  required:         { fr: 'obligatoire',                 wo: 'war na' },
  optional:         { fr: 'facultatif',                  wo: 'du war' },

  // --- Comptes ---
  name:             { fr: 'Nom complet',                 wo: 'Sa tur wi' },
  phone:            { fr: 'Numero de telephone',         wo: 'Limu telefon' },
  phone_hint:       { fr: 'Sert a vous connecter et a vous joindre. Ex : 77 123 45 67', wo: 'Mooy la may dugg te mooy nu ñu lay woo. Misaal : 77 123 45 67' },
  whatsapp_number:  { fr: 'Numero WhatsApp',             wo: 'Limu WhatsApp' },
  whatsapp_hint:    { fr: 'Si different du telephone. Un bouton WhatsApp apparaitra sur vos annonces.', wo: 'Su wuuteek telefon bi. Bouton WhatsApp dina feeñ ci sa annonce yi.' },
  password:         { fr: 'Mot de passe',                wo: 'Mot de passe' },
  password_hint:    { fr: '6 caracteres minimum.',       wo: 'Ba ci 6 aksara.' },
  password2:        { fr: 'Confirmer le mot de passe',   wo: 'Delloo mot de passe bi' },
  create_account:   { fr: 'Creer mon compte',            wo: 'Sos sama kont' },
  no_account:       { fr: "Pas encore de compte ?",      wo: 'Amoo kont ba tey ?' },
  have_account:     { fr: 'Deja inscrit ?',              wo: 'Bindu nga ba noppi ?' },
  welcome:          { fr: 'Bienvenue',                   wo: 'Dalal ak jamm' },
  dashboard_empty:  { fr: "Vous n'avez pas encore d'annonce.", wo: 'Amoo benn annonce ba tey.' },
  active:           { fr: 'En ligne',                    wo: 'Ci kaw' },

  // --- Messages ---
  err_fields:       { fr: 'Merci de remplir tous les champs obligatoires.', wo: 'Fees-al bépp barab bu war.' },
  err_phone_taken:  { fr: 'Ce numero est deja inscrit. Connectez-vous.', wo: 'Limu bii bindu na ba noppi. Duggal.' },
  err_phone_format: { fr: 'Numero invalide. Format attendu : 77 123 45 67.', wo: 'Limu bi baaxul. Misaal : 77 123 45 67.' },
  err_password_len: { fr: 'Le mot de passe doit faire au moins 6 caracteres.', wo: 'Mot de passe bi war na am 6 aksara ba ci kaw.' },
  err_password_mismatch: { fr: 'Les deux mots de passe ne correspondent pas.', wo: 'Ñaari mot de passe yi wuute nañu.' },
  err_login:        { fr: 'Numero ou mot de passe incorrect.', wo: 'Limu bi walla mot de passe bi baaxul.' },
  err_too_many:     { fr: 'Trop de tentatives. Reessayez dans quelques minutes.', wo: 'Jéem nga lu bare. Xaaral ay simili.' },
  err_not_found:    { fr: 'Annonce introuvable.',        wo: 'Gisunu annonce bi.' },
  err_forbidden:    { fr: "Vous n'avez pas le droit de faire cela.", wo: 'Amoo sañ-sañ ci loolu.' },
  err_upload:       { fr: 'Photo refusee : formats acceptes JPG, PNG, WEBP (5 Mo max).', wo: 'Nataal bi nanguwuñu ko : JPG, PNG, WEBP rekk (5 Mo).' },
  err_login_first:  { fr: 'Connectez-vous pour deposer une annonce.', wo: 'Duggal ngir génne ab annonce.' },
  ok_created:       { fr: 'Votre annonce est en ligne !', wo: 'Sa annonce bi génn na !' },
  ok_updated:       { fr: 'Annonce mise a jour.',        wo: 'Annonce bi soppi nañu ko.' },
  ok_deleted:       { fr: 'Annonce supprimee.',          wo: 'Annonce bi far nañu ko.' },
  page_not_found:   { fr: 'Page introuvable',            wo: 'Gisunu xët bi' },

  // --- Securite / pied de page ---
  safety_title:     { fr: 'Conseils de securite',        wo: 'Digle yu am solo' },
  safety_1:         { fr: 'Rencontrez le vendeur dans un lieu public et frequente.', wo: 'Dajeel ak jaaykat bi ci barab bu am nit.' },
  safety_2:         { fr: "Verifiez l'article avant de payer.", wo: 'Seetal mbir mi bala ngay fey.' },
  safety_3:         { fr: "N'envoyez jamais d'argent d'avance a une personne que vous ne connaissez pas.", wo: 'Bul yónnee xaalis ci nit ku nga xamul.' },
  safety_4:         { fr: 'Ne communiquez jamais vos codes Wave, Orange Money ou votre mot de passe.', wo: 'Bul jox kenn sa kode Wave, Orange Money walla sa mot de passe.' },
  footer_note:      { fr: 'Site communautaire independant, ne le laissez pas devenir un terrain d\'arnaque : signalez les annonces douteuses.', wo: 'Site bii ay mbokk ñoo ko sos : yëgleel annonce yu ñu wóoruwul.' },
};

const categories = [
  { slug: 'vehicules',     fr: 'Vehicules',              wo: 'Wot yi',            icon: 'car' },
  { slug: 'immobilier',    fr: 'Immobilier',             wo: 'Kër ak suuf',       icon: 'home' },
  { slug: 'telephones',    fr: 'Telephones & tablettes', wo: 'Telefon yi',        icon: 'phone' },
  { slug: 'informatique',  fr: 'Informatique',           wo: 'Ordinatër yi',      icon: 'laptop' },
  { slug: 'electromenager',fr: 'Electromenager',         wo: 'Jumtukaayu kër',    icon: 'plug' },
  { slug: 'maison',        fr: 'Maison & decoration',    wo: 'Kër ak takkaay',    icon: 'sofa' },
  { slug: 'mode',          fr: 'Mode & beaute',          wo: 'Yére ak rafet',     icon: 'shirt' },
  { slug: 'alimentation',  fr: 'Alimentation',           wo: 'Lekk',              icon: 'basket' },
  { slug: 'animaux',       fr: 'Animaux & elevage',      wo: 'Mala yi',           icon: 'paw' },
  { slug: 'materiaux',     fr: 'Materiaux & outils',     wo: 'Jumtukaay yi',      icon: 'tools' },
  { slug: 'services',      fr: 'Services',               wo: 'Sarwis yi',         icon: 'wrench' },
  { slug: 'emploi',        fr: 'Emploi & formation',     wo: 'Liggéey ak njàng',  icon: 'briefcase' },
  { slug: 'autres',        fr: 'Autres',                 wo: 'Yeneen yi',         icon: 'dots' },
];

// Thies et sa region en premier, puis les grandes villes du Senegal.
const cities = [
  { slug: 'thies',        name: 'Thies' },
  { slug: 'mbour',        name: 'Mbour' },
  { slug: 'saly',         name: 'Saly' },
  { slug: 'tivaouane',    name: 'Tivaouane' },
  { slug: 'pout',         name: 'Pout' },
  { slug: 'khombole',     name: 'Khombole' },
  { slug: 'mekhe',        name: 'Mekhe' },
  { slug: 'kayar',        name: 'Kayar' },
  { slug: 'joal',         name: 'Joal-Fadiouth' },
  { slug: 'ngaparou',     name: 'Ngaparou / Somone' },
  { slug: 'dakar',        name: 'Dakar' },
  { slug: 'rufisque',     name: 'Rufisque' },
  { slug: 'saint-louis',  name: 'Saint-Louis' },
  { slug: 'kaolack',      name: 'Kaolack' },
  { slug: 'ziguinchor',   name: 'Ziguinchor' },
  { slug: 'touba',        name: 'Touba' },
  { slug: 'autre',        name: 'Autre ville' },
];

function t(key, locale = 'fr') {
  const entry = strings[key];
  if (!entry) return key;
  return entry[locale] || entry.fr;
}

const categoryLabel = (slug, locale = 'fr') => {
  const c = categories.find((x) => x.slug === slug);
  return c ? (c[locale] || c.fr) : slug;
};

const cityLabel = (slug) => (cities.find((x) => x.slug === slug) || { name: slug }).name;

module.exports = { LOCALES, LOCALE_NAMES, t, categories, cities, categoryLabel, cityLabel };
