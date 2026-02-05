# ใช้ Node.js เวอร์ชัน LTS
FROM node:20-alpine

# สร้างโฟลเดอร์ทำงาน
WORKDIR /app

# ก๊อปปี้ไฟล์ package.json ไปก่อน (เพื่อให้ Docker cache layer นี้ไว้)
COPY package*.json ./
COPY prisma ./prisma/

# ติดตั้ง Dependencies
RUN npm install

# ก๊อปปี้โค้ดทั้งหมด
COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

# Build โค้ด (ถ้าเป็น TypeScript)
RUN npm run build

# เปิด Port 4000
EXPOSE 4000

# คำสั่งรัน Server
CMD ["npm", "start"]