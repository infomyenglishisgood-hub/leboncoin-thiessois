# Utile seulement si vous hebergez sur un VPS (Hetzner, Contabo, OVH...)
# ou sur Railway / Fly.io. Pour Render, le fichier render.yaml suffit.
#
#   docker build -t leboncoin .
#   docker run -d -p 80:3000 -v /srv/lbc-data:/data \
#     -e DATA_DIR=/data -e NODE_ENV=production \
#     -e SESSION_SECRET="votre-phrase-secrete" --restart always leboncoin

FROM node:22-slim

ENV NODE_ENV=production
ENV DATA_DIR=/data

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Les annonces et les photos vivent ici : montez toujours un volume.
VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server.js"]
