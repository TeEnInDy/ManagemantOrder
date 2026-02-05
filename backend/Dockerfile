FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# ติดตั้ง Dependencies
RUN npm install

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

# RUN npm run build 

EXPOSE 9098

# ✅ เปลี่ยนคำสั่งรัน เป็นใช้ ts-node แทน
CMD ["npx", "ts-node", "src/index.ts"]