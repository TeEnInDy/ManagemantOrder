"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// ✅ ลบ axios ตัวเก่าออก ใช้ api จาก lib/axios
import { api } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, User, ChevronRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    // ✅ เพิ่ม state สำหรับ form data
    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // ✅ แก้จาก api.get เป็น api.post
            // และส่ง form เป็น body (ไม่ต้องใส่ {})
            const res = await api.post("/auth/login", form);

            const data = res.data as any;

            // เก็บ Token ลง Cookie (สำหรับ Middleware)
            // หมายเหตุ: การ set cookie แบบนี้ใช้ได้ แต่ถ้า Production แนะนำให้ใช้ library 'js-cookie' หรือให้ Server set HttpOnly cookie จะปลอดภัยกว่า
            document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;

            // เก็บ User ลง LocalStorage (สำหรับโชว์ชื่อ)
            localStorage.setItem("user", JSON.stringify(data.user));

            // ไปหน้า Dashboard
            router.push("/dashboard");
            router.refresh();

        } catch (err: any) {
            console.error(err);
            // แสดง Error message ที่ได้จาก Backend (ถ้ามี)
            setError(err.response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-zinc-900">

            {/* 🖼️ ฝั่งซ้าย: Logo & Branding Showcase */}
            <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center bg-[#FDFBF7] border-r border-zinc-200">
                {/* Background Pattern (ลายคลื่นญี่ปุ่นจางๆ) */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                <div className="relative z-10 p-12 flex flex-col items-center animate-in fade-in duration-1000 slide-in-from-bottom-4">
                    {/* กรอบล้อมรูปภาพเพื่อให้ดูเหมือนงานศิลปะ */}
                    <div className="p-4 bg-white shadow-xl rounded-sm border border-zinc-100 rotate-1 transition-transform hover:rotate-0 duration-500">
                        <div className="relative w-[280px] h-[500px] overflow-hidden bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo-vertical.jpg"
                                alt="Ebi-zuke Logo"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <h2 className="text-2xl font-bold tracking-widest text-zinc-800 uppercase" style={{ fontFamily: 'serif' }}>
                            EBI-ZUKE
                        </h2>
                        <p className="text-zinc-500 text-sm mt-2 tracking-wide">
                            Premium Pickled Shrimp Management System
                        </p>
                    </div>
                </div>
            </div>

            {/* 🔐 ฝั่งขวา: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-black">
                <div className="w-full max-w-md space-y-8">

                    {/* Header (Mobile Logo fallback) */}
                    <div className="text-center">
                        <div className="lg:hidden mx-auto w-20 h-20 relative mb-4 rounded-full overflow-hidden border-2 border-zinc-100 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo-vertical.jpg" alt="Logo" className="object-cover w-full h-full" />
                        </div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-zinc-500 mt-2 text-sm">
                            เข้าสู่ระบบเพื่อจัดการร้าน Ebi-zuke
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6 mt-8">

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        placeholder="Enter your username"
                                        className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">Forgot password?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-left-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium group"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>

                    </form>

                    {/* Footer */}
                    <div className="text-center text-xs text-zinc-400 mt-8">
                        &copy; {new Date().getFullYear()} Ebi-zuke POS System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}