"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProcurementStore } from "@/store/useProcurementStore";

const COLORS = ["#007946", "#10b981", "#0f766e", "#f59e0b", "#2563eb"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function ReportsPage() {
  const memos = useProcurementStore((state) => state.memos);

  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    memos.forEach((memo) => {
      const current = map.get(memo.category) ?? 0;
      map.set(memo.category, current + memo.estimatedTotal);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [memos]);

  const spendBySite = useMemo(() => {
    const map = new Map<string, number>();
    memos.forEach((memo) => {
      const current = map.get(memo.site) ?? 0;
      map.set(memo.site, current + memo.estimatedTotal);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [memos]);

  const emergencyCount = memos.filter((memo) => memo.urgency === "Emergency").length;
  const approvedSpend = memos.filter((memo) => memo.status === "Approved").reduce((sum, memo) => sum + memo.estimatedTotal, 0);
  const averageVendorOnTime = 92;

  return (
    <div className="space-y-6">
      <PageHeader title="รายงาน" subtitle="รายงานการจัดซื้อและการใช้จ่ายจากข้อมูลในระบบ" />
      <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
        <KpiCard label="ยอดอนุมัติแล้ว" value={formatCurrency(approvedSpend)} badge="ปี 2026" />
        <KpiCard label="รายการเร่งด่วน" value={`${emergencyCount} รายการ`} badge="ระบบจัดซื้อ" />
        <KpiCard label="On-time Delivery" value={`${averageVendorOnTime}%`} badge="Vendor KPI" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">การใช้จ่ายตามหมวด</h2>
          <p className="mt-2 text-sm text-slate-500">จัดอันดับหมวดตามยอดใช้งบประมาณรวม</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} initialDimension={{ width: 640, height: 240 }}>
              <BarChart data={spendByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#007946" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">การใช้จ่ายตามไซต์ / โรงงาน</h2>
          <p className="mt-2 text-sm text-slate-500">สรุปค่าใช้จ่ายตามไซต์และโรงงาน</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} initialDimension={{ width: 420, height: 240 }}>
              <PieChart>
                <Pie data={spendBySite} dataKey="value" nameKey="name" innerRadius={40} outerRadius={90} paddingAngle={4}>
                  {spendBySite.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h3 className="text-sm font-semibold tracking-normal text-slate-400">Vendor On-time Delivery</h3>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{averageVendorOnTime}%</p>
          <p className="mt-3 text-sm text-slate-500">สัดส่วนการส่งมอบตรงเวลาในไตรมาสล่าสุด</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h3 className="text-sm font-semibold tracking-normal text-slate-400">Emergency Count</h3>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{emergencyCount}</p>
          <p className="mt-3 text-sm text-slate-500">จำนวน Memo เร่งด่วนที่บันทึกในระบบ</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h3 className="text-sm font-semibold tracking-normal text-slate-400">Budget Utilization</h3>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{Math.round((approvedSpend / 1200000) * 100)}%</p>
          <p className="mt-3 text-sm text-slate-500">เทียบกับ Budget รวมทั้งปี</p>
        </div>
      </div>
    </div>
  );
}
