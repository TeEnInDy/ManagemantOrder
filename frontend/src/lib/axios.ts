// src/lib/axios.ts
import axios from "axios";

// อ่านค่าจาก Environment (Docker) ถ้าไม่มีให้ใช้ localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9098/api";

// สร้างตัวแปรสำหรับ URL รูปภาพ (ตัดคำว่า /api ออก)
export const SERVER_URL = API_URL.replace('/api', '');

// สร้างตัวยิง API กลาง
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default api;