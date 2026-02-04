// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. ดึง Token จาก Cookie
  const token = request.cookies.get('token')?.value;

  // 2. เช็คว่าเป็นหน้า Login หรือไม่?
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 3. กรณี: ไม่มี Token แต่อยากเข้าหน้าอื่น (ที่ไม่ใช่ Login) -> ดีดไป Login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. กรณี: มี Token แล้ว แต่อยากเข้าหน้า Login -> ดีดไป Dashboard (ไม่ต้อง Login ซ้ำ)
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. ปล่อยผ่าน
  return NextResponse.next();
}

// กำหนดหน้าที่จะให้ Middleware ทำงาน
export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - uploads (โฟลเดอร์รูป)
       * - .*\.png$, .*\.jpg$, .*\.jpeg$, .*\.gif$ (ยกเว้นไฟล์รูปภาพ) ✅ เพิ่มบรรทัดนี้
       */
      '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
  };