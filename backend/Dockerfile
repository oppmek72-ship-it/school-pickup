FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema=src/prisma/schema.prisma && npm start"]
