import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. สร้าง Hash Password (รหัสคือ admin1234)
  const password = await bcrypt.hash('admin1234', 10)

  // 2. สร้าง User (ใช้ upsert เพื่อป้องกันการสร้างซ้ำ)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' }, // เช็คว่ามี user นี้หรือยัง
    update: {}, // ถ้ามีแล้วไม่ต้องทำอะไร
    create: {
      username: 'admin',
      password: password,
      role: 'ADMIN', // ⚠️ ถ้าใน Schema ไม่มี field role ให้ลบบรรทัดนี้ออกครับ
    },
  })

  console.log('✅ Seed User created:', admin)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })