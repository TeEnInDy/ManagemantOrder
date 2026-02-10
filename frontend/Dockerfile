FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js
RUN npm run build

# เปิด Port 3000
EXPOSE 3000

# คำสั่งรัน Next.js
CMD ["npm", "start"]