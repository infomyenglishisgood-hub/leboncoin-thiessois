/** Petites fonctions utilitaires partagees par le serveur et les pages. */

/** 75000 -> "75 000 FCFA" */
function formatPrice(price, locale = 'fr') {
  if (price === null || price === undefined || price === '') return null;
  const n = Number(price);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return locale === 'wo' ? 'Amul njëg' : 'Gratuit';
  return `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

/**
 * Normalise un numero senegalais vers le format international 221XXXXXXXXX.
 * Accepte : 771234567 / 77 123 45 67 / +221 77 123 45 67 / 00221771234567
 * Renvoie null si le numero n'est pas valide.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  let d = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (d.startsWith('221')) d = d.slice(3);
  if (!/^(7[05678])\d{7}$/.test(d)) return null; // 70, 75, 76, 77, 78
  return `221${d}`;
}

/** 221771234567 -> "77 123 45 67" */
function displayPhone(normalized) {
  if (!normalized) return '';
  const d = normalized.startsWith('221') ? normalized.slice(3) : normalized;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`.trim();
}

const whatsappLink = (normalized, text = '') =>
  `https://wa.me/${normalized}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** "il y a 3 jours" / "3 fan ci ginnaaw" */
function timeAgo(sqlDate, locale = 'fr') {
  const then = new Date(`${sqlDate.replace(' ', 'T')}Z`).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  const L = {
    fr: { now: "a l'instant", min: 'il y a %d min', hour: 'il y a %d h', day: 'il y a %d j', month: 'il y a %d mois' },
    wo: { now: 'leegi', min: '%d simili ci ginnaaw', hour: '%d waxtu ci ginnaaw', day: '%d fan ci ginnaaw', month: '%d weer ci ginnaaw' },
  }[locale] || {};
  if (mins < 2) return L.now;
  if (mins < 60) return L.min.replace('%d', mins);
  if (mins < 1440) return L.hour.replace('%d', Math.round(mins / 60));
  if (mins < 43200) return L.day.replace('%d', Math.round(mins / 1440));
  return L.month.replace('%d', Math.round(mins / 43200));
}

/** Supprime les espaces superflus et coupe a une longueur maximale. */
const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Meme chose mais en conservant les retours a la ligne (descriptions). */
const cleanMultiline = (v, max) =>
  String(v ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

module.exports = { formatPrice, normalizePhone, displayPhone, whatsappLink, timeAgo, clean, cleanMultiline };
