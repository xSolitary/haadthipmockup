"use client";

import { PageHeader } from "@/components/ui/PageHeader";

const cards = [
  { title: "Approval Flow Settings", description: "กำหนดลำดับและระดับการอนุมัติของระบบ" },
  { title: "Cost Center Settings", description: "จัดการรหัส Cost Center สำหรับแต่ละฝ่ายและโครงการ" },
  { title: "Plant / Site Settings", description: "ตั้งค่าไซต์ โรงงาน และพื้นที่กระจายสินค้า" },
  { title: "Vendor Master Sync", description: "ติดตามการเชื่อมต่อฐานข้อมูล Vendor และสถานะการซิงก์" },
  { title: "User Role Management", description: "จัดการสิทธิ์ผู้ใช้งานและ Role ภายในระบบ" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="ตั้งค่าระบบ" subtitle="พื้นที่จัดเก็บสำหรับการตั้งค่าระบบและการจัดการองค์กร" />
      <div className="grid gap-6 xl:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            <button type="button" className="mt-6 inline-flex h-10 items-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              ดูการตั้งค่า
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
