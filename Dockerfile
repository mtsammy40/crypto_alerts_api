# Dockerfile

FROM node:20-alpine3.20
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json processes.json ./
COPY dist/ .
RUN npm install --omit=dev
EXPOSE 5001
CMD [ "npm", "run", "pm2:prod"]