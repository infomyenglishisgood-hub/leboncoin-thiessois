/**
 * Le Bon Coin Thiessois - petites annonces
 * Demarrage : npm install puis npm start  ->  http://localhost:3000
 */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const { db, searchListings, getListing, getImages, listingsByUser, categoryCounts, DATA_DIR } = require('./lib/db');
const SqliteStore = require('./lib/session-store');
const i18n = require('./lib/i18n');
const H = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PER_PAGE = 24;
const MAX_PHOTOS = 5;

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // necessaire derriere un hebergeur (Render, Railway...)

app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
app.use('/photos', express.static(UPLOAD_DIR, { maxAge: '30d' }));

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('\n!! Definissez la variable SESSION_SECRET en production !!\n');
}

app.use(session({
  name: 'lbct.sid',
  secret: process.env.SESSION_SECRET || 'changez-moi-en-production',
  store: new SqliteStore(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
}));

/* ------------------------------------------------------------------ */
/* Middlewares maison : langue, utilisateur, CSRF, messages flash       */
/* ------------------------------------------------------------------ */

app.use((req, res, next) => {
  // Langue : ?lang=wo la memorise dans la session.
  if (req.query.lang && i18n.LOCALES.includes(req.query.lang)) req.session.locale = req.query.lang;
  const locale = req.session.locale || 'fr';

  const user = req.session.userId
    ? db.prepare('SELECT id, name, phone, whatsapp, city, is_admin FROM users WHERE id = ?').get(req.session.userId)
    : null;
  req.user = user;

  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');

  const flash = req.session.flash || null;
  delete req.session.flash;

  Object.assign(res.locals, {
    locale,
    t: (key) => i18n.t(key, locale),
    categories: i18n.categories,
    cities: i18n.cities,
    categoryLabel: (s) => i18n.categoryLabel(s, locale),
    cityLabel: i18n.cityLabel,
    formatPrice: (p) => H.formatPrice(p, locale),
    displayPhone: H.displayPhone,
    whatsappLink: H.whatsappLink,
    timeAgo: (d) => H.timeAgo(d, locale),
    user,
    csrf: req.session.csrf,
    flash,
    query: req.query,
    path: req.path,
    localeNames: i18n.LOCALE_NAMES,
  });
  next();
});

/** Verifie le jeton anti-CSRF. */
const checkCsrf = (req, res, next) => {
  if (req.body?._csrf && req.body._csrf === req.session.csrf) return next();
  res.status(403).render('message', { title: 'Erreur', message: i18n.t('err_forbidden', res.locals.locale) });
};

// Pour les formulaires classiques on verifie ici ; pour les envois de fichiers
// (multipart) le corps n'est lisible qu'apres multer, la verification a donc
// lieu dans la route, juste apres l'upload.
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  if ((req.get('content-type') || '').startsWith('multipart/form-data')) return next();
  checkCsrf(req, res, next);
});

const setFlash = (req, type, key) => { req.session.flash = { type, text: i18n.t(key, req.session.locale || 'fr') }; };

const requireLogin = (req, res, next) => {
  if (req.user) return next();
  setFlash(req, 'error', 'err_login_first');
  res.redirect(`/connexion?suite=${encodeURIComponent(req.originalUrl)}`);
};

/* ------------------------------------------------------------------ */
/* Upload des photos                                                   */
/* ------------------------------------------------------------------ */

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: MAX_PHOTOS },
  // Les fichiers d'un autre type sont simplement ignores (on ne veut pas
  // faire perdre a l'utilisateur tout le texte qu'il vient de saisir).
  fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED[file.mimetype])),
});

const photosUpload = (req, res, next) =>
  upload.array('photos', MAX_PHOTOS)(req, res, (err) => {
    if (err) { setFlash(req, 'error', 'err_upload'); return res.redirect(req.originalUrl); }
    next();
  });

const deletePhotoFile = (filename) =>
  fs.promises.unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});

/* ------------------------------------------------------------------ */
/* Pages publiques                                                     */
/* ------------------------------------------------------------------ */

app.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const filters = {
    q: req.query.q || '',
    category: i18n.categories.some((c) => c.slug === req.query.categorie) ? req.query.categorie : '',
    city: i18n.cities.some((c) => c.slug === req.query.ville) ? req.query.ville : '',
    sort: req.query.tri || 'recent',
  };

  const { rows, total } = searchListings({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  res.render('index', {
    title: i18n.t('site_name', res.locals.locale),
    listings: rows,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PER_PAGE)),
    filters,
    counts: categoryCounts(),
  });
});

app.get('/annonce/:id', (req, res) => {
  const listing = getListing(req.params.id);
  if (!listing) return res.status(404).render('message', { title: '404', message: res.locals.t('err_not_found') });

  // Compteur de vues (on ne compte pas le proprietaire).
  if (!req.user || req.user.id !== listing.user_id) {
    db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(listing.id);
  }

  const similar = db.prepare(`
    SELECT l.*, (SELECT filename FROM images WHERE listing_id = l.id ORDER BY position LIMIT 1) AS cover
    FROM listings l
    WHERE l.status = 'active' AND l.category = ? AND l.id != ?
    ORDER BY l.created_at DESC LIMIT 4
  `).all(listing.category, listing.id);

  res.render('listing', { title: listing.title, listing, images: getImages(listing.id), similar });
});

app.post('/annonce/:id/signaler', (req, res) => {
  const listing = getListing(req.params.id);
  if (listing) {
    db.prepare('INSERT INTO reports (listing_id, reason) VALUES (?, ?)').run(listing.id, H.clean(req.body.reason, 300));
  }
  setFlash(req, 'ok', 'report_done');
  res.redirect(`/annonce/${req.params.id}`);
});

app.get('/securite', (req, res) => res.render('safety', { title: res.locals.t('safety_title') }));

/* ------------------------------------------------------------------ */
/* Comptes                                                             */
/* ------------------------------------------------------------------ */

app.get('/inscription', (req, res) =>
  req.user ? res.redirect('/mes-annonces') : res.render('signup', { title: res.locals.t('signup'), form: {} }));

app.post('/inscription', async (req, res) => {
  const locale = res.locals.locale;
  const form = {
    name: H.clean(req.body.name, 80),
    phone: H.clean(req.body.phone, 25),
    whatsapp: H.clean(req.body.whatsapp, 25),
    city: i18n.cities.some((c) => c.slug === req.body.city) ? req.body.city : 'thies',
  };
  const fail = (key) =>
    res.status(400).render('signup', { title: i18n.t('signup', locale), form, error: i18n.t(key, locale) });

  if (!form.name || !form.phone || !req.body.password) return fail('err_fields');

  const phone = H.normalizePhone(form.phone);
  if (!phone) return fail('err_phone_format');

  const whatsapp = form.whatsapp ? H.normalizePhone(form.whatsapp) : phone;
  if (form.whatsapp && !whatsapp) return fail('err_phone_format');

  if (String(req.body.password).length < 6) return fail('err_password_len');
  if (req.body.password !== req.body.password2) return fail('err_password_mismatch');
  if (db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)) return fail('err_phone_taken');

  const hash = await bcrypt.hash(req.body.password, 12);
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO users (name, phone, whatsapp, city, password_hash) VALUES (?, ?, ?, ?, ?)'
  ).run(form.name, phone, whatsapp, form.city, hash);

  req.session.userId = Number(lastInsertRowid);
  res.redirect('/deposer');
});

app.get('/connexion', (req, res) =>
  req.user ? res.redirect('/mes-annonces') : res.render('login', { title: res.locals.t('login'), form: {} }));

// Limitation simple des tentatives de connexion (5 essais / 10 min par numero).
const attempts = new Map();
function tooManyAttempts(key) {
  const now = Date.now();
  const rec = attempts.get(key)?.filter((t) => now - t < 10 * 60 * 1000) || [];
  attempts.set(key, rec);
  return rec.length >= 5;
}

app.post('/connexion', async (req, res) => {
  const locale = res.locals.locale;
  const form = { phone: H.clean(req.body.phone, 25) };
  const fail = (key) =>
    res.status(401).render('login', { title: i18n.t('login', locale), form, error: i18n.t(key, locale) });

  const phone = H.normalizePhone(form.phone);
  if (!phone) return fail('err_login');
  if (tooManyAttempts(phone)) return fail('err_too_many');

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.password_hash));
  if (!ok) {
    attempts.get(phone).push(Date.now());
    return fail('err_login');
  }

  attempts.delete(phone);
  req.session.userId = user.id;
  const next = typeof req.body.suite === 'string' && req.body.suite.startsWith('/') ? req.body.suite : '/mes-annonces';
  res.redirect(next);
});

app.post('/deconnexion', (req, res) => req.session.destroy(() => res.redirect('/')));

app.get('/mes-annonces', requireLogin, (req, res) =>
  res.render('dashboard', { title: res.locals.t('my_ads'), listings: listingsByUser(req.user.id) }));

/* ------------------------------------------------------------------ */
/* Deposer / modifier une annonce                                      */
/* ------------------------------------------------------------------ */

app.get('/deposer', requireLogin, (req, res) =>
  res.render('form', { title: res.locals.t('new_ad'), listing: null, images: [], action: '/deposer' }));

/** Valide et nettoie les champs du formulaire d'annonce. */
function readListingForm(body, userCity) {
  const price = String(body.price ?? '').replace(/[^\d]/g, '');
  return {
    title: H.clean(body.title, 100),
    description: H.cleanMultiline(body.description, 4000),
    price: price === '' ? null : Math.min(Number(price), 9_999_999_999),
    negotiable: body.negotiable ? 1 : 0,
    category: i18n.categories.some((c) => c.slug === body.category) ? body.category : '',
    city: i18n.cities.some((c) => c.slug === body.city) ? body.city : userCity,
    condition: ['neuf', 'occasion'].includes(body.condition) ? body.condition : 'occasion',
  };
}

app.post('/deposer', requireLogin, photosUpload, checkCsrf, (req, res) => {
  const data = readListingForm(req.body, req.user.city);

  if (!data.title || !data.description || !data.category) {
    (req.files || []).forEach((f) => deletePhotoFile(f.filename));
    return res.status(400).render('form', {
      title: res.locals.t('new_ad'), listing: { ...data }, images: [],
      action: '/deposer', error: res.locals.t('err_fields'),
    });
  }

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO listings (user_id, title, description, price, negotiable, category, city, condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, data.title, data.description, data.price, data.negotiable, data.category, data.city, data.condition);

  const insertImage = db.prepare('INSERT INTO images (listing_id, filename, position) VALUES (?, ?, ?)');
  (req.files || []).forEach((f, i) => insertImage.run(Number(lastInsertRowid), f.filename, i));

  setFlash(req, 'ok', 'ok_created');
  res.redirect(`/annonce/${lastInsertRowid}`);
});

/** Charge l'annonce et verifie que l'utilisateur connecte en est bien le proprietaire. */
function ownedListing(req, res) {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) { res.status(404).render('message', { title: '404', message: res.locals.t('err_not_found') }); return null; }
  if (listing.user_id !== req.user.id && !req.user.is_admin) {
    res.status(403).render('message', { title: 'Erreur', message: res.locals.t('err_forbidden') });
    return null;
  }
  return listing;
}

app.get('/annonce/:id/modifier', requireLogin, (req, res) => {
  const listing = ownedListing(req, res);
  if (!listing) return;
  res.render('form', {
    title: res.locals.t('edit_ad'), listing, images: getImages(listing.id),
    action: `/annonce/${listing.id}/modifier`,
  });
});

app.post('/annonce/:id/modifier', requireLogin, photosUpload, checkCsrf, (req, res) => {
  const listing = ownedListing(req, res);
  if (!listing) { (req.files || []).forEach((f) => deletePhotoFile(f.filename)); return; }

  const data = readListingForm(req.body, req.user.city);
  if (!data.title || !data.description || !data.category) {
    (req.files || []).forEach((f) => deletePhotoFile(f.filename));
    return res.status(400).render('form', {
      title: res.locals.t('edit_ad'), listing: { ...listing, ...data }, images: getImages(listing.id),
      action: `/annonce/${listing.id}/modifier`, error: res.locals.t('err_fields'),
    });
  }

  db.prepare(`
    UPDATE listings SET title = ?, description = ?, price = ?, negotiable = ?,
           category = ?, city = ?, condition = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(data.title, data.description, data.price, data.negotiable, data.category, data.city, data.condition, listing.id);

  // Photos retirees par l'utilisateur.
  const removeIds = [].concat(req.body.remove_image || []).map(Number).filter(Boolean);
  for (const imgId of removeIds) {
    const img = db.prepare('SELECT * FROM images WHERE id = ? AND listing_id = ?').get(imgId, listing.id);
    if (img) { db.prepare('DELETE FROM images WHERE id = ?').run(imgId); deletePhotoFile(img.filename); }
  }

  // Nouvelles photos, dans la limite de MAX_PHOTOS au total.
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM images WHERE listing_id = ?').get(listing.id);
  const insertImage = db.prepare('INSERT INTO images (listing_id, filename, position) VALUES (?, ?, ?)');
  (req.files || []).forEach((f, i) => {
    if (n + i < MAX_PHOTOS) insertImage.run(listing.id, f.filename, n + i);
    else deletePhotoFile(f.filename);
  });

  setFlash(req, 'ok', 'ok_updated');
  res.redirect(`/annonce/${listing.id}`);
});

app.post('/annonce/:id/statut', requireLogin, (req, res) => {
  const listing = ownedListing(req, res);
  if (!listing) return;
  const status = listing.status === 'active' ? 'vendu' : 'active';
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, listing.id);
  res.redirect(req.body.suite === 'dashboard' ? '/mes-annonces' : `/annonce/${listing.id}`);
});

app.post('/annonce/:id/supprimer', requireLogin, (req, res) => {
  const listing = ownedListing(req, res);
  if (!listing) return;
  getImages(listing.id).forEach((img) => deletePhotoFile(img.filename));
  db.prepare('DELETE FROM listings WHERE id = ?').run(listing.id); // les images suivent (ON DELETE CASCADE)
  setFlash(req, 'ok', 'ok_deleted');
  res.redirect('/mes-annonces');
});

/* ------------------------------------------------------------------ */
/* Erreurs                                                             */
/* ------------------------------------------------------------------ */

app.use((req, res) =>
  res.status(404).render('message', { title: '404', message: res.locals.t('page_not_found') }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('message', { title: 'Erreur', message: 'Une erreur est survenue. Reessayez.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Le Bon Coin Thiessois -> http://localhost:${PORT}`));
}

module.exports = app;
