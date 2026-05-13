"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CalendarRange, FilePlus2, PackageSearch, Shapes, TimerReset, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useProcurementStore } from "@/store/useProcurementStore";

const chartColors = ["#007946", "#3a8f66", "#5d7ecf", "#c38f3c", "#c35d66", "#8a6ec4", "#d17b4f", "#5291a4"];
const cardClassName = "rounded-[30px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

const toDateOnly = (value: string) => value.slice(0, 10);

function DashboardKpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${cardClassName} flex h-36 flex-col justify-between p-5`}>
      <p className="text-sm font-medium tracking-normal text-slate-500">{label}</p>
      <p className="text-[clamp(1.5rem,2vw,2rem)] font-bold leading-tight tracking-normal text-[var(--primary)]">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  value,
  icon: Icon,
  muted = false,
}: {
  href?: string;
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  muted?: boolean;
}) {
  const content: ReactNode = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className={`rounded-2xl p-3 ${muted ? "bg-slate-100 text-slate-500" : "bg-[var(--surface-tint)] text-[var(--primary)]"}`}>
          <Icon className="h-5 w-5" />
        </div>
        {!muted ? <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--primary)]" /> : null}
      </div>
      <div className="space-y-2">
        <p className="text-base font-semibold tracking-normal text-slate-900">{title}</p>
        <p className={`text-3xl font-bold leading-none tracking-normal ${muted ? "text-slate-500" : "text-[var(--primary)]"}`}>{value}</p>
      </div>
    </>
  );

  const className = `${cardClassName} group flex h-48 flex-col justify-between p-5 transition ${
    muted ? "cursor-default" : "hover:-translate-y-0.5 hover:border-[#007946]/20 hover:shadow-[var(--shadow-md)]"
  }`;

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function DashboardPage() {
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const paymentRequests = useProcurementStore((state) => state.paymentRequests);

  const allDates = useMemo(
    () =>
      [
        ...memos.map((memo) => toDateOnly(memo.requestDate || memo.createdAt)),
        ...purchaseOrders.map((po) => toDateOnly(po.createdAt)),
        ...paymentRequests.map((payment) => toDateOnly(payment.createdAt)),
      ].sort(),
    [memos, paymentRequests, purchaseOrders],
  );

  const minDate = allDates[0] ?? new Date().toISOString().slice(0, 10);
  const maxDate = allDates[allDates.length - 1] ?? new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);
  const isChartReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const filteredMemos = useMemo(
    () =>
      memos.filter((memo) => {
        const date = toDateOnly(memo.requestDate || memo.createdAt);
        return date >= startDate && date <= endDate;
      }),
    [endDate, memos, startDate],
  );

  const filteredPurchaseOrders = useMemo(
    () =>
      purchaseOrders.filter((po) => {
        const date = toDateOnly(po.createdAt);
        return date >= startDate && date <= endDate;
      }),
    [endDate, purchaseOrders, startDate],
  );

  const filteredPayments = useMemo(
    () =>
      paymentRequests.filter((payment) => {
        const date = toDateOnly(payment.createdAt);
        return date >= startDate && date <= endDate;
      }),
    [endDate, paymentRequests, startDate],
  );

  const pieData = useMemo(() => {
    const grouped = filteredMemos.reduce<Record<string, number>>((acc, memo) => {
      acc[memo.category] = (acc[memo.category] ?? 0) + memo.estimatedTotal;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, value) => sum + value, 0);

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        percent: total === 0 ? 0 : (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMemos]);

  const memoCount = filteredMemos.length;
  const prCount = filteredPurchaseOrders.length;
  const poCount = filteredPurchaseOrders.filter((po) => ["PO Created", "Sent to Vendor", "Pending Receiving", "Received", "QC Passed"].includes(po.procurementStatus)).length;
  const transactionCount = memoCount + prCount + filteredPayments.length;
  const budgetAmount = filteredMemos.reduce((sum, memo) => sum + memo.budgetRemaining, 0);
  const spentAmount = filteredPurchaseOrders.reduce((sum, po) => sum + po.amount, 0);

  const memoActionCount = memos.filter(
    (memo) =>
      memo.requesterId === currentUserId &&
      (memo.status === "Draft" || memo.status === "Revision Required" || memo.status === "Pending Approval"),
  ).length;
  const approvalsLeft = memos.filter((memo) => memo.assignedApproverId === currentUserId && memo.status === "Pending Approval").length;
  const vendorSelectionsLeft = purchaseOrders.filter((po) => {
    const sourceMemo = memos.find((memo) => memo.id === po.memoId);
    return sourceMemo?.requesterId === currentUserId && ["Waiting for Purchasing to Propose Vendors", "Pending Vendor Approval"].includes(po.procurementStatus);
  }).length;

  const topCategory = pieData[0] ?? null;
  const secondCategory = pieData[1] ?? null;
  const topCategoryGap = topCategory && secondCategory ? topCategory.percent - secondCategory.percent : null;
  const categoryInsight = !topCategory
    ? "ยังไม่มีข้อมูลเพียงพอสำหรับสรุปแนวโน้มการใช้จ่าย"
    : topCategory.percent >= 45
      ? `การใช้จ่ายกระจุกอยู่ในหมวด ${topCategory.name} ค่อนข้างมาก ควรติดตาม Budget และแผนจัดซื้อต่อเนื่อง`
      : `สัดส่วนการใช้จ่ายค่อนข้างกระจาย โดยหมวด ${topCategory.name} ยังเป็นหมวดหลักของช่วงเวลานี้`;
  const suggestedAction = !topCategory
    ? "ขยายช่วงวันที่หรือเพิ่มรายการ Memo เพื่อดูภาพรวมให้ชัดขึ้น"
    : `ตรวจสอบรายการในหมวด ${topCategory.name} และวางแผนจัดซื้อล่วงหน้าเพื่อลดงานเร่งด่วน`;

  return (
    <div className="space-y-6 text-slate-900">
      <section className={`${cardClassName} overflow-hidden px-5 py-5 sm:px-6`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[var(--surface-tint)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--primary-ink)]">แดชบอร์ด</p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-900 md:text-4xl">ภาพรวมการจัดซื้อ</h1>
            <p className="mt-2 text-sm leading-6 tracking-normal text-slate-500">
              ติดตาม KPI งานค้างและโครงสร้างการใช้จ่ายตามช่วงวันที่ที่เลือก โดยอ้างอิงข้อมูลชุดเดิมของระบบ
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
            <div className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface-tint)] px-4 text-sm font-medium tracking-normal text-slate-700">
              <CalendarRange className="h-4 w-4 text-[var(--primary)]" />
              ช่วงวันที่
            </div>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-sm font-medium tracking-normal text-slate-700 shadow-[var(--shadow-sm)]"
            />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-sm font-medium tracking-normal text-slate-700 shadow-[var(--shadow-sm)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <DashboardKpiCard label="จำนวน Memo" value={memoCount.toString()} />
        <DashboardKpiCard label="จำนวน PR" value={prCount.toString()} />
        <DashboardKpiCard label="จำนวน PO" value={poCount.toString()} />
        <DashboardKpiCard label="จำนวนรายการรวม" value={transactionCount.toString()} />
        <DashboardKpiCard label="Budget รวม" value={formatCurrency(budgetAmount)} />
        <DashboardKpiCard label="ยอดใช้จ่าย" value={formatCurrency(spentAmount)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className={`${cardClassName} p-6`}>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-sm font-medium tracking-normal text-[var(--primary)]">งานที่ต้องดำเนินการ</p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal text-slate-900">งานที่รอดำเนินการจากฉัน</h2>
              </div>
              <div className="hidden rounded-2xl bg-[var(--surface-tint)] p-3 text-[var(--primary)] md:block">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ActionCard href="/my-requests" title="Create Memo" value={memoActionCount.toString()} icon={FilePlus2} />
              <ActionCard href="/my-requests" title="รออนุมัติ" value={approvalsLeft.toString()} icon={TimerReset} />
              <ActionCard href="/pr-po" title="คัดเลือก Vendor" value={vendorSelectionsLeft.toString()} icon={PackageSearch} />
              <ActionCard title="SAP (Mock)" value="0" icon={Shapes} muted />
            </div>
          </section>

          <section className={`${cardClassName} p-6`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium tracking-normal text-[var(--primary)]">สถานะระบบ</p>
                <h2 className="mt-1 text-xl font-bold tracking-normal text-slate-900">ERP / Inventory Status</h2>
              </div>
              <span className="inline-flex rounded-full bg-[var(--surface-tint)] px-3 py-1 text-xs font-medium tracking-normal text-[var(--primary-ink)]">พร้อมใช้งาน</span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { label: "ERP Sync", value: "Connected" },
                { label: "Inventory", value: "อัปเดตเมื่อ 5 นาทีที่แล้ว" },
                { label: "Vendor Master", value: "พร้อมใช้งาน" },
                { label: "Budget Control", value: "Active" },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-xs font-medium tracking-normal text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold tracking-normal text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className={`${cardClassName} overflow-hidden p-6`}>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium tracking-normal text-[var(--primary)]">Spend Insight</p>
            <h2 className="text-xl font-bold tracking-normal text-slate-900">สัดส่วนการใช้จ่ายตามหมวด</h2>
            <p className="text-sm leading-6 tracking-normal text-slate-500">
              กราฟสรุปสัดส่วนการใช้จ่ายตามหมวดจัดซื้อในช่วงวันที่ที่เลือก พร้อมข้อความสรุปเพื่อช่วยมองเห็นความเสี่ยงและแนวทางดำเนินการ
            </p>
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
            <div className="h-[320px]">
              {isChartReady ? (
                pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={116} paddingAngle={3}>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-[var(--surface-strong)] text-sm tracking-normal text-slate-400">
                    ยังไม่มีข้อมูลในช่วงวันที่ที่เลือก
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-[var(--surface-strong)] text-sm tracking-normal text-slate-400">
                  กำลังเตรียมกราฟ...
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold tracking-normal text-slate-900">คำอธิบายกราฟ</h3>
              <div className="grid gap-3">
                <div className="rounded-[22px] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-medium tracking-normal text-slate-500">หมวดที่ใช้จ่ายสูงสุด</p>
                  <p className="mt-2 text-sm font-semibold tracking-normal text-slate-900">
                    {topCategory
                      ? `${topCategory.name} คิดเป็น ${topCategory.percent.toFixed(1)}% ของยอดใช้จ่ายรวม (${formatCurrency(topCategory.value)})`
                      : "ยังไม่มีข้อมูลในช่วงวันที่ที่เลือก"}
                  </p>
                </div>
                <div className="rounded-[22px] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-medium tracking-normal text-slate-500">Insight</p>
                  <p className="mt-2 text-sm leading-6 tracking-normal text-slate-700">
                    {topCategory && topCategoryGap !== null && topCategoryGap > 15
                      ? `${categoryInsight} โดยมีสัดส่วนสูงกว่าหมวดรองลงมา ${topCategoryGap.toFixed(1)} จุด`
                      : categoryInsight}
                  </p>
                </div>
                <div className="rounded-[22px] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-medium tracking-normal text-slate-500">ข้อเสนอแนะ</p>
                  <p className="mt-2 text-sm leading-6 tracking-normal text-slate-700">{suggestedAction}</p>
                </div>
              </div>
            </div>

            {pieData.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {pieData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-[22px] bg-[var(--surface-strong)] px-4 py-3 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <div>
                        <p className="text-sm font-semibold tracking-normal text-slate-900">{item.name}</p>
                        <p className="text-xs tracking-normal text-slate-500">{formatCurrency(item.value)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tracking-normal text-[var(--primary)]">{item.percent.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}
