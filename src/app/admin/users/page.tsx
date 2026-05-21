"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { getRoleLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

const roleMenuMap = {
  Requester: ["แดชบอร์ด", "ระบบจัดซื้อ", "ตรวจรับสินค้า", "จ่ายเงิน", "รายงาน", "ตั้งค่าระบบ"],
  Approver: ["แดชบอร์ด", "ระบบจัดซื้อ", "ตรวจรับสินค้า", "จ่ายเงิน", "รายงาน", "ตั้งค่าระบบ"],
  Purchasing: ["แดชบอร์ด", "ระบบจัดซื้อ", "ตรวจรับสินค้า", "จ่ายเงิน", "รายงาน", "ตั้งค่าระบบ"],
  Finance: ["เลิกใช้งาน"],
  Vendor: ["PO / งานจัดส่ง", "ตรวจรับสินค้า"],
  Admin: ["แดชบอร์ด", "รายงาน", "ตั้งค่าระบบ", "ระบบจัดการผู้ใช้"],
} as const;

export default function AdminUsersPage() {
  const users = useProcurementStore((state) => state.users);
  const activeUsers = users.filter((user) => user.role !== "Finance");
  const visibleRoles = Array.from(new Set(activeUsers.map((user) => user.role)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="ระบบจัดการผู้ใช้"
        subtitle="สำหรับผู้ดูแลระบบในการดูรายชื่อผู้ใช้งาน จัดการบทบาท และตรวจสอบสิทธิ์เมนูของแต่ละ role"
      />

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">จัดการผู้ใช้งาน</h2>
            <p className="mt-2 text-sm text-slate-500">แสดงเฉพาะผู้ใช้ที่ยังเปิดใช้งานในระบบปัจจุบัน</p>
          </div>
          <div className="rounded-full bg-[var(--surface-tint)] px-4 py-2 text-sm font-semibold text-[var(--primary-ink)]">
            {activeUsers.length} Users
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">ชื่อผู้ใช้</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">แผนก</th>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{user.name}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#eef8f2] px-3 py-1 text-xs font-semibold text-[var(--primary-ink)]">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{user.department}</td>
                  <td className="px-5 py-4 text-slate-600">{user.site}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700">
                        แก้ไขผู้ใช้
                      </button>
                      <button type="button" className="rounded-xl bg-[#eef8f2] px-3 py-2 font-medium text-[var(--primary-ink)]">
                        จัดการสิทธิ์
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-lg font-semibold text-slate-900">จัดการสิทธิ์ตาม Role</h2>
        <p className="mt-2 text-sm text-slate-500">สรุปขอบเขตเมนูที่แต่ละบทบาทสามารถเข้าถึงได้ใน mockup ปัจจุบัน</p>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {visibleRoles.map((role) => (
            <div key={role} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-900">{getRoleLabel(role)}</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  {roleMenuMap[role].length} เมนู
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {roleMenuMap[role].map((menu) => (
                  <span
                    key={`${role}-${menu}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {menu}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
