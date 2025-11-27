FROM node:18-alpine as frontend-build

WORKDIR /frontend
COPY ../package*.json ../index.html ../main.js ../gate.js ../dashboard.js ../style.css ./
RUN npm install && npm run build

FROM node:18-alpine

WORKDIR /app

COPY ./server/package*.json ./
RUN npm install

COPY ./server/server.js ./
COPY ./server/.env* ./
COPY --from=frontend-build /frontend/dist ./dist

EXPOSE 3001

CMD ["npm", "start"]