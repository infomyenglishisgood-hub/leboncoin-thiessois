#!/bin/bash
# ---------------------------------------------------------------
#  Le Bon Coin Thiessois - demarrage du site sur votre ordinateur
#
#  Double-cliquez sur ce fichier. Une fenetre noire s'ouvre : c'est
#  normal, c'est le site qui tourne. Laissez-la ouverte tant que vous
#  utilisez le site, et fermez-la quand vous avez fini.
# ---------------------------------------------------------------

cd "$(dirname "$0")" || exit 1

echo ""
echo "  ============================================="
echo "     LE BON COIN THIESSOIS"
echo "  ============================================="
echo ""

# --- 1. Node.js est-il installe ? ---
if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js n'est pas encore installe sur cet ordinateur."
  echo "  C'est gratuit et cela ne prend que quelques minutes."
  echo ""
  echo "  1. La page de telechargement va s'ouvrir"
  echo "  2. Cliquez sur le gros bouton vert (version LTS)"
  echo "  3. Ouvrez le fichier telecharge et suivez les etapes"
  echo "  4. Revenez ici et double-cliquez a nouveau sur ce fichier"
  echo ""
  read -n 1 -s -r -p "  Appuyez sur une touche pour ouvrir la page..."
  open "https://nodejs.org/fr/download"
  exit 0
fi

# --- 2. Version suffisante ? ---
MAJOR=$(node -p "process.versions.node.split('.')[0]")
MINOR=$(node -p "process.versions.node.split('.')[1]")
if [ "$MAJOR" -lt 22 ] || { [ "$MAJOR" -eq 22 ] && [ "$MINOR" -lt 5 ]; }; then
  echo "  Votre version de Node.js ($(node -v)) est trop ancienne."
  echo "  Il faut la version 22.5 ou plus recente."
  echo ""
  read -n 1 -s -r -p "  Appuyez sur une touche pour ouvrir la page de mise a jour..."
  open "https://nodejs.org/fr/download"
  exit 1
fi

# --- 3. Installation des composants (une seule fois) ---
if [ ! -d "node_modules" ]; then
  echo "  Premiere utilisation : installation en cours..."
  echo "  (comptez 1 a 2 minutes, une seule fois)"
  echo ""
  npm install --no-audit --no-fund || {
    echo ""
    echo "  L'installation a echoue. Verifiez votre connexion internet."
    read -n 1 -s -r -p "  Appuyez sur une touche pour fermer..."
    exit 1
  }
  echo ""
fi

# --- 4. Annonces d'exemple au premier lancement ---
if [ ! -f "data/annonces.db" ]; then
  echo "  Ajout de quelques annonces d'exemple pour la demonstration..."
  npm run --silent seed
  echo ""
  echo "  Compte de demonstration : 77 000 00 01  /  demo1234"
  echo ""
fi

# --- 5. Ouverture du navigateur puis demarrage ---
echo "  Le site demarre..."
echo "  Adresse : http://localhost:3000"
echo ""
echo "  Pour arreter le site : fermez cette fenetre."
echo "  ---------------------------------------------"
echo ""

( sleep 2 && open "http://localhost:3000" ) &

npm start
