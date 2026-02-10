#FROM node:20-alpine
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

EXPOSE 9098

CMD ["npx", "ts-node", "src/index.ts"]