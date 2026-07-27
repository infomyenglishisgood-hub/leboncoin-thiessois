# Le Bon Coin Thiessois

Site de petites annonces pour Thiès et le Sénégal : chacun crée un compte avec son
numéro de téléphone, publie ses annonces avec photos, et les acheteurs le contactent
directement par appel ou WhatsApp. Interface en **français et en wolof**.

Pensé pour la réalité du terrain : tout s'affiche sur un petit téléphone, les photos
sont automatiquement réduites avant l'envoi pour économiser la connexion, et le site
fonctionne même si le JavaScript est désactivé.

---

## 1. Essayer le site sur votre ordinateur

**Double-cliquez sur `DEMARRER-LE-SITE.command`.** C'est tout.

Le fichier vérifie ce qui manque, installe ce qu'il faut, ajoute quelques annonces
d'exemple et ouvre le site dans votre navigateur. Une fenêtre noire s'ouvre : c'est
normal, c'est le site qui tourne. Laissez-la ouverte, fermez-la quand vous avez fini.

Compte de démonstration : `77 000 00 01` / `demo1234`

> **Au premier double-clic, macOS peut refuser d'ouvrir le fichier.** Faites alors un
> clic droit dessus → *Ouvrir* → *Ouvrir*. C'est à faire une seule fois. Si Node.js
> n'est pas installé, le fichier vous emmène sur la page de téléchargement (gratuit,
> ~3 minutes) ; relancez-le ensuite.

Tant que le site tourne sur votre ordinateur, vous seul pouvez le voir. C'est fait
pour : testez tranquillement, montrez-le à quelques membres autour de vous, corrigez
ce qui vous gêne, et ne payez un hébergement qu'une fois convaincu.

### Si vous préférez le terminal

```bash
npm install        # à faire une seule fois
npm run seed       # optionnel : ajoute 12 annonces d'exemple
npm start          # puis ouvrez http://localhost:3000
npm test           # vérifie que tout fonctionne (30 tests)
```

---

## 2. Mettre le site en ligne

Le site a besoin d'un hébergeur qui garde un **disque permanent** (pour la base de
données et les photos). Trois options courantes :

| Hébergeur | Coût indicatif | Remarque |
|---|---|---|
| **Render.com** | ~7 $/mois (offre payante + disque 1 Go) | Le plus simple, tout se fait depuis le navigateur |
| **Railway.app** | ~5 $/mois | Similaire à Render |
| **VPS Hetzner / Contabo / OVH** | 4 à 6 €/mois | Moins cher à la longue, demande plus de connaissances |

L'offre gratuite de Render efface le disque à chaque redémarrage : les annonces
seraient perdues. Prenez une offre avec disque persistant dès le départ.

### Marche à suivre sur Render

Le fichier `render.yaml` fourni décrit déjà tout : le disque, les variables secrètes
et les commandes. Vous n'avez donc presque rien à régler.

1. Déposez ce dossier sur GitHub (bouton *Upload files* dans un nouveau dépôt).
2. Sur Render : **New → Blueprint**, choisissez votre dépôt.
3. Render lit `render.yaml`, vous montre ce qu'il va créer, vous confirmez.
4. Render vous donne une adresse en `.onrender.com`. Le site est en ligne.

Si vous passez par **New → Web Service** au lieu de *Blueprint*, il faut alors tout
saisir à la main : Build `npm install`, Start `npm start`, un disque monté sur `/data`,
et les variables `DATA_DIR=/data`, `NODE_ENV=production`, `SESSION_SECRET=<phrase longue>`.

Pour un VPS (Hetzner, Contabo, OVH) ou Railway, un `Dockerfile` est également fourni :
les commandes sont écrites en commentaire tout en haut du fichier.

### Votre propre nom de domaine

Achetez par exemple `leboncointhiessois.sn` ou `.com` (autour de 10 €/an chez
Namecheap, OVH ou Gandi), puis ajoutez-le dans **Settings → Custom Domain** chez
votre hébergeur. Le certificat HTTPS est automatique et gratuit.

---

## 3. Vérification du numéro par SMS

Pour **déposer une annonce**, un membre doit prouver qu'il contrôle bien son
numéro : il reçoit un code à 6 chiffres par SMS. Naviguer et chercher restent
libres — seule la publication est protégée, ce qui limite fortement le nombre
de SMS envoyés (donc le coût).

### En local : rien à configurer

Aucun SMS n'est envoyé et le code s'affiche directement à l'écran. Ce mode test
est **automatiquement désactivé** quand `NODE_ENV=production`, sinon n'importe
qui pourrait valider n'importe quel numéro.

### En ligne : brancher Twilio

1. Créez un compte sur twilio.com et achetez un numéro d'envoi.
2. Chez votre hébergeur, ajoutez ces variables :

   | Nom | Valeur |
   |---|---|
   | `SMS_PROVIDER` | `twilio` |
   | `TWILIO_ACCOUNT_SID` | `AC...` (tableau de bord Twilio) |
   | `TWILIO_AUTH_TOKEN` | votre jeton Twilio |
   | `TWILIO_FROM` | `+1...` votre numéro Twilio |

Comptez environ **30 à 50 FCFA par SMS**, à vérifier sur la grille tarifaire
Twilio pour le Sénégal. C'est un coût par nouveau membre, pas par annonce.

### Tant que Twilio n'est pas branché

Le site **reste utilisable** : les annonces peuvent être publiées sans numéro
vérifié, et le serveur affiche un avertissement au démarrage. La vérification
s'active toute seule dès que vous renseignez les clés Twilio — rien à modifier
dans le code.

Bloquer la publication alors que personne ne peut recevoir de code rendrait le
site inutilisable ; c'est pourquoi ce repli existe. Si vous préférez malgré tout
bloquer dans tous les cas, ajoutez la variable `REQUIRE_VERIFICATION=always`.

### Protections contre les abus

Sans ces limites, quelqu'un pourrait demander des milliers de SMS et vider
votre crédit :

- 60 secondes minimum entre deux demandes de code
- 3 codes maximum par heure et par numéro
- code valable 10 minutes, 5 essais maximum
- le code n'est jamais stocké en clair dans la base

### Si le SMS n'arrive pas

```bash
npm run verifier                        # liste les comptes en attente
npm run verifier -- 77 123 45 67        # valide le numéro à la main
npm run verifier -- 77 123 45 67 annuler
```

> **Un numéro vérifié n'est pas une garantie d'honnêteté.** Les cartes SIM sont
> bon marché : un escroc déterminé peut en acheter une. La vérification élève
> nettement la barrière et rend les récidives plus difficiles, mais les conseils
> de sécurité restent indispensables.

---

## 4. Sauvegarder les données

```bash
npm run backup
```

Une copie complète (comptes, annonces, photos) est créée dans `sauvegardes/`.
Copiez-la ensuite ailleurs : clé USB, Google Drive, e-mail à vous-même.

À faire **au moins une fois par semaine**. Sans sauvegarde, une panne du serveur
efface tout le travail des membres du groupe.

Les données d'origine vivent dans le dossier `data/` : `annonces.db` (comptes et
annonces) et `uploads/` (les photos).

---

## 5. Modifier les textes, les catégories et les villes

Tout est regroupé dans un seul fichier : **`lib/i18n.js`**.

- Les textes français et wolof sont en haut, côte à côte.
- Les catégories et les villes sont en bas de ce même fichier.

Le wolof écrit varie beaucoup d'une région à l'autre : relisez et corrigez les
tournures pour qu'elles collent à la façon dont on parle à Thiès. Il suffit de
modifier le texte entre guillemets, puis de redémarrer le site.

Les couleurs et la mise en page sont dans `public/css/style.css` (les couleurs
principales sont tout en haut du fichier).

---

## 6. Devenir administrateur

Un administrateur peut modifier et supprimer **n'importe quelle** annonce, ce qui est
indispensable contre les arnaques. Inscrivez-vous d'abord normalement sur le site,
puis :

```bash
npm run admin -- 77 123 45 67            # donne les droits à ce numéro
npm run admin                            # liste les administrateurs
npm run admin -- 77 123 45 67 retirer    # retire les droits
```

Pour voir les annonces signalées par les visiteurs :

```bash
npm run reports
```

---

## 7. Lancer le site auprès du groupe Facebook

Quelques conseils pour que le site prenne vraiment :

1. **Pré-remplissez-le.** Un site vide décourage. Publiez vous-même 20 à 30 annonces
   reprises du groupe (avec l'accord des vendeurs) avant l'annonce officielle.
2. **Gardez le groupe Facebook actif.** Ne fermez rien : postez chaque jour 2 ou 3
   belles annonces du site avec le lien. Le groupe devient le canal, le site devient
   le catalogue.
3. **Recrutez 2 ou 3 modérateurs** parmi les membres les plus actifs du groupe.
4. **Répétez les règles de sécurité.** Rencontre dans un lieu public, paiement à la
   remise de l'article, jamais d'avance par Wave ou Orange Money.
5. **Restez gratuit au début.** La monétisation (annonces mises en avant, boutiques
   pro) n'a de sens qu'une fois le trafic installé.

---

## Contenu du dossier

```
DEMARRER-LE-SITE.command   >>> Double-cliquez ici pour lancer le site <<<
README.md                  Ce guide

server.js                  Le serveur : toutes les pages et les règles
lib/i18n.js                >>> Tous les textes FR / WO, catégories, villes <<<
lib/db.js                  Base de données et recherche
lib/helpers.js             Format des prix, des numéros, des dates
lib/session-store.js       Sessions (rester connecté)
lib/sms.js                 Envoi des SMS (mode test ou Twilio)
lib/verification.js        Codes de vérification et limites anti-abus
views/                     Les pages HTML
public/css/style.css       Le design (couleurs en haut du fichier)
public/js/app.js           Galerie photo + réduction des images avant envoi

scripts/seed.js            Annonces de démonstration
scripts/admin.js           Gestion des administrateurs
scripts/verifier.js        Validation manuelle d'un numéro
scripts/backup.js          Sauvegarde
scripts/reports.js         Annonces signalées
test/smoke.js              Tests automatiques

render.yaml                Configuration de l'hébergement Render
Dockerfile                 Pour un VPS ou Railway
data/                      Base de données et photos (à sauvegarder)
```

## Toutes les commandes

| Commande | Effet |
|---|---|
| `npm start` | Démarre le site |
| `npm test` | Vérifie que tout fonctionne (30 tests) |
| `npm run seed` | Ajoute 12 annonces d'exemple |
| `npm run backup` | Sauvegarde comptes, annonces et photos |
| `npm run admin -- 77 123 45 67` | Donne les droits d'administrateur |
| `npm run verifier -- 77 123 45 67` | Valide un numéro à la main |
| `npm run reports` | Affiche les annonces signalées |

## Points techniques

- Node.js 22.5+ et Express 5, base SQLite native (aucune compilation, aucun service externe).
- Mots de passe chiffrés avec bcrypt, protection CSRF sur tous les formulaires,
  requêtes SQL paramétrées, échappement HTML systématique, limitation des tentatives
  de connexion (5 essais par 10 minutes).
- Codes de vérification hachés (bcrypt), expiration 10 min, 5 essais, 3 envois/heure.
- Photos : 5 maximum par annonce, JPG/PNG/WEBP, réduites à 1600 px côté navigateur.
