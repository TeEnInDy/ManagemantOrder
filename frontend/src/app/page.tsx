import { redirect } from "next/navigation";

export default function RootPage() {
    // พอเข้าหน้าแรกปุ๊บ ให้ดีดไปหน้า /order (หรือ /login) ทันที
    redirect("/order");
}