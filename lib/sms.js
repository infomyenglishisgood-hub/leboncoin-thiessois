/**
 * Envoi des SMS de verification.
 *
 * DEUX MODES :
 *
 * 1. Mode test (par defaut, gratuit)
 *    Aucun SMS n'est envoye : le code s'affiche directement a l'ecran et
 *    dans la console. Parfait pour essayer le site sur votre ordinateur.
 *    Ce mode est AUTOMATIQUEMENT DESACTIVE en production, sinon n'importe
 *    qui pourrait valider n'importe quel numero.
 *
 * 2. Mode Twilio (payant, environ 30 a 50 FCFA par SMS)
 *    Ajoutez ces variables d'environnement chez votre hebergeur :
 *
 *      SMS_PROVIDER        = twilio
 *      TWILIO_ACCOUNT_SID  = AC.... (tableau de bord Twilio)
 *      TWILIO_AUTH_TOKEN   = ....   (tableau de bord Twilio)
 *      TWILIO_FROM         = +1XXXXXXXXXX  (votre numero Twilio)
 *
 *    Variante : TWILIO_MESSAGING_SERVICE_SID au lieu de TWILIO_FROM.
 */

const provider = () => (process.env.SMS_PROVIDER || 'console').toLowerCase();
const isProduction = () => process.env.NODE_ENV === 'production';

/** Le mode test affiche-t-il le code a l'ecran ? Jamais en production. */
const testModeAvailable = () => provider() === 'console' && !isProduction();

/**
 * Peut-on reellement verifier un numero en ce moment ?
 *
 * - en local : oui, le code s'affiche a l'ecran
 * - en ligne avec Twilio correctement configure : oui
 * - en ligne sans fournisseur SMS : NON
 *
 * Dans ce dernier cas, le site laisse quand meme publier les annonces
 * (voir REQUIRE_VERIFICATION dans server.js) : bloquer tout le monde alors
 * que personne ne peut recevoir de code rendrait le site inutilisable.
 */
function verificationPossible() {
  if (provider() === 'twilio') {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID)
    );
  }
  return !isProduction(); // mode test : utilisable hors production uniquement
}

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const service = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!sid || !token || (!from && !service)) {
    console.error('SMS: configuration Twilio incomplete (SID, TOKEN, FROM).');
    return { ok: false, reason: 'config' };
  }

  const params = new URLSearchParams({ To: `+${to}`, Body: body });
  if (service) params.set('MessagingServiceSid', service);
  else params.set('From', from);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`SMS: Twilio a refuse l'envoi (${res.status}) ${detail.slice(0, 300)}`);
      return { ok: false, reason: 'provider' };
    }
    return { ok: true };
  } catch (err) {
    console.error('SMS: envoi impossible -', err.message);
    return { ok: false, reason: 'network' };
  }
}

/**
 * Envoie le code. Renvoie { ok, devCode? }.
 * devCode n'est renseigne qu'en mode test hors production.
 */
async function sendCode(phone, code, locale = 'fr') {
  const body = locale === 'wo'
    ? `Le Bon Coin Thiessois : sa kode mooy ${code}. Bul ko jox kenn.`
    : `Le Bon Coin Thiessois : votre code est ${code}. Ne le communiquez a personne.`;

  if (provider() === 'twilio') return sendViaTwilio(phone, body);

  // Mode test
  if (isProduction()) {
    console.error(
      "SMS: aucun fournisseur configure alors que le site est en production.\n" +
      "     Definissez SMS_PROVIDER=twilio et les cles Twilio, sinon la\n" +
      "     verification par SMS est impossible."
    );
    return { ok: false, reason: 'config' };
  }

  console.log(`\n  [MODE TEST] Code de verification pour +${phone} : ${code}\n`);
  return { ok: true, devCode: code };
}

module.exports = { sendCode, testModeAvailable, verificationPossible, provider };
