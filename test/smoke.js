/**
 * Test de bout en bout : inscription, depot d'annonce avec photo, recherche,
 * modification, changement de langue, securite (CSRF), suppression.
 *
 * Lancer avec :  npm test
 * Le test utilise une base de donnees temporaire, vos vraies annonces ne
 * sont jamais touchees.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lbct-test-'));
process.env.DATA_DIR = tmp;
process.env.SESSION_SECRET = 'test-secret';

const app = require('../server');

let cookie = '';
let base = '';
const results = [];

function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => results.push(['ok', name]))
    .catch((e) => { results.push(['ECHEC', `${name} -> ${e.message}`]); });
}

async function req(pathname, options = {}) {
  const res = await fetch(base + pathname, {
    redirect: 'manual',
    ...options,
    headers: { ...(options.headers || {}), ...(cookie ? { cookie } : {}) },
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const body = await res.text();
  return { status: res.status, location: res.headers.get('location'), body };
}

const csrfOf = (html) => (html.match(/name="_csrf" value="([^"]+)"/) || [])[1];
const devCodeOf = (html) => (html.match(/class="dev-code">(\d{6})</) || [])[1];

const urlencoded = (obj) => ({
  method: 'POST',
  body: new URLSearchParams(obj),
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
});

/** Un PNG rouge 2x2 valide, suffisant pour tester l'upload. */
const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYEJRIAAFVsCA1dEQ4wAAAAASUVORK5CYII=',
  'base64'
);

(async () => {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;

  await check("l'accueil repond", async () => {
    const r = await req('/');
    assert.equal(r.status, 200);
    assert.ok(r.body.includes('Le Bon Coin Thiessois'));
  });

  await check("l'accueil est vide au depart", async () => {
    const r = await req('/');
    assert.ok(r.body.includes('Aucune annonce') || r.body.includes('Dernieres annonces'));
  });

  await check('inscription avec un numero senegalais', async () => {
    const page = await req('/inscription');
    const body = new URLSearchParams({
      _csrf: csrfOf(page.body), name: 'Awa Diop', phone: '77 123 45 67',
      city: 'thies', password: 'motdepasse', password2: 'motdepasse',
    });
    const r = await req('/inscription', {
      method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 302);
    assert.equal(r.location, '/deposer');
  });

  await check('un numero invalide est refuse', async () => {
    const jar = cookie; cookie = ''; // visiteur non connecte
    const page = await req('/inscription');
    const body = new URLSearchParams({
      _csrf: csrfOf(page.body), name: 'Test', phone: '12345',
      password: 'motdepasse', password2: 'motdepasse',
    });
    const r = await req('/inscription', {
      method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 400);
    assert.ok(r.body.includes('Numero invalide'));
    cookie = jar;
  });

  await check('un numero non verifie ne peut pas deposer d annonce', async () => {
    const r = await req('/deposer');
    assert.equal(r.status, 302);
    assert.equal(r.location, '/verification');
  });

  await check('un mauvais code est refuse', async () => {
    const page = await req('/verification');
    await req('/verification/envoyer', urlencoded({ _csrf: csrfOf(page.body) }));
    const withCode = await req('/verification');
    const realCode = devCodeOf(withCode.body);
    const wrong = realCode === '000000' ? '111111' : '000000';
    const r = await req('/verification', urlencoded({ _csrf: csrfOf(withCode.body), code: wrong }));
    assert.equal(r.status, 400);
    assert.ok(r.body.includes('Code incorrect'));
    assert.ok(r.body.includes('essai'), 'le nombre d essais restants est affiche');
  });

  await check('un nouveau code ne peut pas etre demande immediatement', async () => {
    const page = await req('/verification');
    const r = await req('/verification/envoyer', urlencoded({ _csrf: csrfOf(page.body) }));
    assert.equal(r.status, 429, 'le renvoi immediat doit etre bloque (cout des SMS)');
    assert.ok(r.body.includes('Patientez'));
  });

  await check('le bon code verifie le numero', async () => {
    // Le code precedent est toujours valable : on le relit et on le saisit.
    const page = await req('/verification');
    const code = devCodeOf(page.body);
    const r = await req('/verification', urlencoded({ _csrf: csrfOf(page.body), code }));
    assert.equal(r.status, 302);
    assert.equal(r.location, '/deposer');
    assert.equal((await req('/deposer')).status, 200, 'le depot est desormais accessible');
  });

  let listingId;
  await check('depot d une annonce avec photo', async () => {
    const page = await req('/deposer');
    assert.equal(page.status, 200);
    const fd = new FormData();
    fd.set('_csrf', csrfOf(page.body));
    fd.set('title', 'Refrigerateur Samsung 2 portes');
    fd.set('description', 'Tres bon etat, achete il y a 2 ans.\nA venir chercher a Thies.');
    fd.set('price', '75000');
    fd.set('negotiable', '1');
    fd.set('category', 'electromenager');
    fd.set('city', 'thies');
    fd.set('condition', 'occasion');
    fd.append('photos', new Blob([pngBytes], { type: 'image/png' }), 'frigo.png');

    const r = await req('/deposer', { method: 'POST', body: fd });
    assert.equal(r.status, 302);
    listingId = r.location.split('/').pop();
    assert.ok(Number(listingId) > 0);
  });

  await check("la photo est bien enregistree sur le disque", async () => {
    const files = fs.readdirSync(path.join(tmp, 'uploads'));
    assert.equal(files.length, 1);
  });

  await check("l'annonce s'affiche avec son prix formate", async () => {
    const r = await req(`/annonce/${listingId}`);
    assert.equal(r.status, 200);
    assert.ok(r.body.includes('Refrigerateur Samsung'));
    assert.ok(r.body.includes('75 000 FCFA'), 'prix formate en FCFA');
  });

  await check('le badge "numero verifie" apparait sur l annonce', async () => {
    const r = await req(`/annonce/${listingId}`);
    assert.ok(r.body.includes('Numero verifie'));
  });

  await check('le code de test reste cache en production', async () => {
    const smsModule = require('../lib/sms');
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.equal(smsModule.testModeAvailable(), false, 'jamais de code a l ecran en production');
    process.env.NODE_ENV = before;
    assert.equal(smsModule.testModeAvailable(), true);
  });

  await check('sans fournisseur SMS en ligne, le site reste utilisable', async () => {
    // Repli de securite : mieux vaut un site sans verification qu'un site
    // ou plus personne ne peut publier.
    const smsModule = require('../lib/sms');
    const before = process.env.NODE_ENV;

    process.env.NODE_ENV = 'production';
    assert.equal(smsModule.verificationPossible(), false, 'aucun SMS possible sans Twilio');

    process.env.SMS_PROVIDER = 'twilio';
    assert.equal(smsModule.verificationPossible(), false, 'Twilio sans cles = inutilisable');

    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM = '+15550000000';
    assert.equal(smsModule.verificationPossible(), true, 'Twilio complet = verification active');

    delete process.env.SMS_PROVIDER;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM;
    process.env.NODE_ENV = before;
  });

  await check("l'annonce apparait sur l'accueil", async () => {
    const r = await req('/');
    assert.ok(r.body.includes('Refrigerateur Samsung'));
  });

  await check('recherche par mot-cle', async () => {
    const hit = await req('/?q=samsung');
    assert.ok(hit.body.includes('Refrigerateur Samsung'));
    const miss = await req('/?q=bicyclette');
    assert.ok(miss.body.includes('Aucune annonce'));
  });

  await check('filtre par categorie et par ville', async () => {
    assert.ok((await req('/?categorie=electromenager')).body.includes('Refrigerateur'));
    assert.ok((await req('/?categorie=vehicules')).body.includes('Aucune annonce'));
    assert.ok((await req('/?ville=thies')).body.includes('Refrigerateur'));
    assert.ok((await req('/?ville=dakar')).body.includes('Aucune annonce'));
  });

  await check('bascule en wolof', async () => {
    const r = await req('/?lang=wo');
    assert.equal(r.status, 200);
    assert.ok(r.body.includes('Jënd ak jaay'), 'le slogan est traduit');
    await req('/?lang=fr');
  });

  await check("modification de l'annonce", async () => {
    const page = await req(`/annonce/${listingId}/modifier`);
    assert.equal(page.status, 200);
    const fd = new FormData();
    fd.set('_csrf', csrfOf(page.body));
    fd.set('title', 'Refrigerateur Samsung - baisse de prix');
    fd.set('description', 'Tres bon etat.');
    fd.set('price', '60000');
    fd.set('category', 'electromenager');
    fd.set('city', 'thies');
    fd.set('condition', 'occasion');
    const r = await req(`/annonce/${listingId}/modifier`, { method: 'POST', body: fd });
    assert.equal(r.status, 302);
    const after = await req(`/annonce/${listingId}`);
    assert.ok(after.body.includes('baisse de prix'));
    assert.ok(after.body.includes('60 000 FCFA'));
  });

  await check('marquer comme vendu puis remettre en vente', async () => {
    const page = await req(`/annonce/${listingId}`);
    const body = new URLSearchParams({ _csrf: csrfOf(page.body) });
    await req(`/annonce/${listingId}/statut`, {
      method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.ok((await req(`/annonce/${listingId}`)).body.includes('Vendu'));
    assert.ok(!(await req('/')).body.includes('Refrigerateur'), 'une annonce vendue sort de la liste');
    await req(`/annonce/${listingId}/statut`, {
      method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.ok((await req('/')).body.includes('Refrigerateur'));
  });

  await check('un formulaire sans jeton CSRF est rejete', async () => {
    const r = await req(`/annonce/${listingId}/supprimer`, {
      method: 'POST', body: new URLSearchParams({}),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 403);
  });

  await check('deconnexion puis reconnexion', async () => {
    const page = await req('/');
    await req('/deconnexion', {
      method: 'POST', body: new URLSearchParams({ _csrf: csrfOf(page.body) }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal((await req('/mes-annonces')).status, 302, 'acces refuse une fois deconnecte');

    const loginPage = await req('/connexion');
    const r = await req('/connexion', {
      method: 'POST',
      body: new URLSearchParams({ _csrf: csrfOf(loginPage.body), phone: '+221 77 123 45 67', password: 'motdepasse' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 302);
    assert.equal((await req('/mes-annonces')).status, 200);
  });

  await check('un mauvais mot de passe est refuse', async () => {
    const jar = cookie; cookie = '';
    const loginPage = await req('/connexion');
    const r = await req('/connexion', {
      method: 'POST',
      body: new URLSearchParams({ _csrf: csrfOf(loginPage.body), phone: '77 123 45 67', password: 'faux' }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 401);
    cookie = jar;
  });

  await check("un autre utilisateur ne peut pas modifier l'annonce", async () => {
    const jar = cookie; cookie = '';
    const page = await req('/inscription');
    await req('/inscription', {
      method: 'POST',
      body: new URLSearchParams({
        _csrf: csrfOf(page.body), name: 'Modou Fall', phone: '78 987 65 43',
        city: 'mbour', password: 'autrepass', password2: 'autrepass',
      }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const r = await req(`/annonce/${listingId}/modifier`);
    assert.equal(r.status, 403);
    cookie = jar;
  });

  await check("les caracteres speciaux ne cassent pas la page (XSS)", async () => {
    const page = await req('/deposer');
    const fd = new FormData();
    fd.set('_csrf', csrfOf(page.body));
    fd.set('title', '<script>alert(1)</script> Table');
    fd.set('description', 'Test & "guillemets"');
    fd.set('category', 'maison');
    fd.set('city', 'thies');
    const r = await req('/deposer', { method: 'POST', body: fd });
    const view = await req(r.location);
    assert.ok(!view.body.includes('<script>alert(1)</script>'), 'le HTML est echappe');
    assert.ok(view.body.includes('&lt;script&gt;'));
  });

  await check("suppression de l'annonce et de sa photo", async () => {
    const page = await req(`/annonce/${listingId}`);
    const r = await req(`/annonce/${listingId}/supprimer`, {
      method: 'POST', body: new URLSearchParams({ _csrf: csrfOf(page.body) }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(r.status, 302);
    assert.equal((await req(`/annonce/${listingId}`)).status, 404);
    await new Promise((r2) => setTimeout(r2, 120));
    assert.equal(fs.readdirSync(path.join(tmp, 'uploads')).length, 0, 'la photo est effacee du disque');
  });

  await check('pas plus de 3 SMS par heure et par numero', async () => {
    // Protection du portefeuille : sans cela, quelqu'un pourrait demander des
    // milliers de SMS et vider le credit Twilio.
    const { db } = require('../lib/db');
    const v = require('../lib/verification');
    const phone = '221781111111';

    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    const rewind = () =>
      db.prepare('UPDATE otp_codes SET last_sent_at = last_sent_at - 120000 WHERE phone = ?').run(phone);

    assert.equal((await v.requestCode(phone)).ok, true, '1er envoi accepte');
    rewind();
    assert.equal((await v.requestCode(phone)).ok, true, '2e envoi accepte');
    rewind();
    assert.equal((await v.requestCode(phone)).ok, true, '3e envoi accepte');
    rewind();

    const fourth = await v.requestCode(phone);
    assert.equal(fourth.ok, false, '4e envoi bloque');
    assert.equal(fourth.error, 'err_otp_too_many_sends');
  });

  await check('5 mauvais essais invalident le code', async () => {
    const { db } = require('../lib/db');
    const v = require('../lib/verification');
    const phone = '221782222222';

    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    await v.requestCode(phone);

    for (let i = 0; i < 5; i++) {
      const r = await v.checkCode(phone, '000001');
      assert.equal(r.ok, false);
    }
    const after = await v.checkCode(phone, '000001');
    assert.equal(after.error, 'err_otp_too_many_tries');
    assert.equal(db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone), undefined,
      'le code est efface apres trop d essais');
  });

  await check('un code expire est refuse', async () => {
    const { db } = require('../lib/db');
    const v = require('../lib/verification');
    const phone = '221783333333';

    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    await v.requestCode(phone);
    db.prepare('UPDATE otp_codes SET expires_at = ? WHERE phone = ?').run(Date.now() - 1000, phone);

    const r = await v.checkCode(phone, '123456');
    assert.equal(r.error, 'err_otp_expired');
  });

  await check('page inconnue -> 404', async () => {
    assert.equal((await req('/nimporte-quoi')).status, 404);
  });

  server.close();

  const failed = results.filter((r) => r[0] !== 'ok');
  for (const [state, name] of results) console.log(`${state === 'ok' ? ' OK ' : 'FAIL'}  ${name}`);
  console.log(`\n${results.length - failed.length}/${results.length} tests reussis`);
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
})();
