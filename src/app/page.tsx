"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { CheckCircle2, Database, PackageCheck, Search, ShieldCheck } from "lucide-react";

const chartColors = ["#007946", "#4f86d9", "#f6c343", "#67b7dc", "#d9824b", "#7ca7df"];

const filterChips = ["ทั้งหมด", "วัตถุดิบ", "บรรจุภัณฑ์", "อะไหล่", "งานบริการ", "Emergency"];

const kpis = [
  { label: "Spend", value: "฿182.06M" },
  { label: "Suppliers", value: "2,792" },
  { label: "Transactions", value: "18,960" },
  { label: "PO Count", value: "6,209" },
  { label: "PR Count", value: "6,811" },
  { label: "Invoice Count", value: "10,387" },
];

const level1Spend = [
  { name: "Production Parts", value: 85.54 },
  { name: "Facilities", value: 37.91 },
  { name: "IT & Telecoms", value: 23.89 },
  { name: "Marketing", value: 17.69 },
  { name: "Human Resources", value: 11.63 },
  { name: "Travel", value: 5.4 },
];

const level3Spend = [
  { name: "Gas System Components", spend: 16810785, transactions: 1685, suppliers: 8 },
  { name: "Control Boards", spend: 16033564, transactions: 134, suppliers: 1 },
  { name: "Printed Publications", spend: 14361685, transactions: 579, suppliers: 151 },
  { name: "Knobs, Bezels & Endcaps", spend: 9913795, transactions: 1463, suppliers: 3 },
  { name: "Harness", spend: 8307556, transactions: 2477, suppliers: 3 },
  { name: "Educational Supplies", spend: 7198050, transactions: 163, suppliers: 32 },
  { name: "Stationery", spend: 6522287, transactions: 777, suppliers: 215 },
];

const level2Spend = [
  { name: "Mechanical", spend: 47833116 },
  { name: "Electrical & Elec.", spend: 26694031 },
  { name: "Office Equipm.", spend: 14678201 },
  { name: "Publications", spend: 14361685 },
  { name: "Employee Ben.", spend: 11573935 },
];

const level4Spend = [
  { name: "Paper", spend: 2575976 },
  { name: "HVAC Installat.", spend: 2330088 },
  { name: "Security Servi.", spend: 1744412 },
  { name: "Security Equip.", spend: 1382026 },
  { name: "Pallets and Cr.", spend: 1372436 },
];

const suppliers = [
  { name: "ELAN INDUSTRIAL", spend: 19.1 },
  { name: "ECI-ELECTRIC", spend: 8.88 },
  { name: "ROBERTSHAW", spend: 7.2 },
];

const categoryTree = ["Appliances", "Facilities", "Human Resources", "IT & Telecoms", "Logistics"];

const bracketColors = ["#4f86d9", "#405c92", "#f6c343", "#d95757", "#33a474", "#8bc4e6", "#df9356", "#9a6ca6"];
const spendBracket = [
  { label: "$0 - $1k", value: 3 },
  { label: "$1k - $2k", value: 10 },
  { label: "$2k - $5k", value: 12 },
  { label: "$5k - $10k", value: 17 },
  { label: "$10k - $25k", value: 16 },
  { label: "$25k - $50k", value: 17 },
  { label: "$50k - $100k", value: 18 },
  { label: "$100k+", value: 7 },
];
const transactionBracket = [
  { label: "$0 - $1k", value: 16 },
  { label: "$1k - $2k", value: 19 },
  { label: "$2k - $5k", value: 31 },
  { label: "$5k - $10k", value: 16 },
  { label: "$10k - $25k", value: 10 },
  { label: "$25k - $50k", value: 4 },
  { label: "$50k - $100k", value: 2 },
  { label: "$100k+", value: 2 },
];

const workflowSteps = ["Memo", "Approval", "PR", "Vendor Selection", "PO", "Receiving/QC", "Payment"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatBaht = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-h-[240px] flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      <h2 className="mb-2 text-sm font-semibold text-[#c65353]">{title}</h2>
      {children}
    </section>
  );
}

function SegmentationBar({ data }: { data: typeof spendBracket }) {
  return (
    <div className="flex h-11 w-full overflow-hidden rounded-sm border border-white bg-slate-100">
      {data.map((item, index) => (
        <div
          key={item.label}
          className="flex min-w-6 items-center justify-center text-[11px] font-semibold text-white"
          style={{ width: `${item.value}%`, background: bracketColors[index % bracketColors.length] }}
          title={`${item.label}: ${item.value}%`}
        >
          {item.value >= 3 ? `${item.value}%` : ""}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-3 text-slate-800">
      <div className="rounded-b-lg bg-[#2f285f] px-4 py-3 text-white shadow-sm">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <p className="text-xs text-white/70">หน้าหลัก</p>
            <h1 className="text-2xl font-semibold">Category Console</h1>
          </div>
          <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`h-10 min-w-32 rounded-md px-4 text-sm font-medium shadow-sm transition ${
                    index === 0 || chip === "Emergency"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["2019", "01/01/2019", "31/12/2019"].map((filter) => (
                <button key={filter} type="button" className="h-10 min-w-24 rounded-md bg-white/15 px-4 text-sm text-white">
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex h-20 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
            <p className="text-sm font-semibold text-[#c65353]">{kpi.label}</p>
            <p className="mt-1 text-xl font-semibold text-[#007946]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid auto-rows-fr gap-3 xl:grid-cols-3">
        <Panel title="Spend by Category Level 1">
          <div className="grid min-h-0 flex-1 grid-cols-[130px_1fr] gap-2">
            <div className="space-y-2 pt-2 text-xs text-slate-600">
              {level1Spend.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: chartColors[index] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} initialDimension={{ width: 360, height: 180 }}>
              <PieChart>
                <Pie data={level1Spend} dataKey="value" nameKey="name" outerRadius={78} strokeWidth={0}>
                  {level1Spend.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `฿${Number(value).toFixed(2)}M`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Spend by Category Level 3">
          <div className="overflow-hidden rounded border border-slate-200 text-xs">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr] bg-[#4f86d9] px-2 py-1.5 font-semibold text-white">
              <span>Category Level 3</span>
              <span>Spend</span>
              <span>Transactions</span>
              <span>Suppliers</span>
            </div>
            <div className="max-h-[190px] divide-y divide-slate-100 overflow-auto">
              {level3Spend.map((row, index) => (
                <div key={row.name} className="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr] items-center px-2 py-1 text-slate-600">
                  <span className="truncate">{row.name}</span>
                  <span>{formatBaht(row.spend)}</span>
                  <span className="bg-blue-100 px-1 text-right">{row.transactions}</span>
                  <span className={`${index % 2 === 0 ? "bg-red-100" : "bg-green-100"} px-1 text-right`}>{row.suppliers}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Category Search">
          <div className="mb-2 flex h-10 items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search" />
          </div>
          <div className="space-y-2 overflow-auto text-sm text-slate-600">
            {categoryTree.map((item) => (
              <div key={item} className="flex h-7 items-center gap-2">
                <span className="text-lg leading-none text-slate-500">+</span>
                <span className="h-4 w-4 border border-sky-600 bg-white" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Spend by Category Level 2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} initialDimension={{ width: 480, height: 180 }}>
            <BarChart data={level2Spend} layout="vertical" margin={{ top: 4, right: 34, bottom: 12, left: 86 }}>
              <CartesianGrid stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `$${Number(value) / 1000000}M`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={86} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="spend" fill="#4f86d9" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Spend by Category Level 4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} initialDimension={{ width: 480, height: 180 }}>
            <BarChart data={level4Spend} layout="vertical" margin={{ top: 4, right: 34, bottom: 12, left: 86 }}>
              <CartesianGrid stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `$${Number(value) / 1000000}M`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={86} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="spend" fill="#4f86d9" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Supplier Search">
          <div className="mb-4 flex h-10 items-center gap-2 rounded border border-slate-300 bg-white px-3">
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search" />
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div key={supplier.name} className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-xs text-slate-600">
                <span className="truncate">{supplier.name}</span>
                <div className="h-5 rounded-sm bg-[#4f86d9]" style={{ width: `${Math.max(28, supplier.spend * 4)}%` }} />
                <span className="font-semibold text-[#4f86d9]">${supplier.spend.toFixed(2)}M</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Spend Segmentation by Value Bracket" className="min-h-[140px]">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {spendBracket.slice(0, 6).map((item, index) => (
              <span key={item.label} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ background: bracketColors[index] }} />
                {item.label}
              </span>
            ))}
          </div>
          <SegmentationBar data={spendBracket} />
        </Panel>
        <Panel title="Transactions Segmentation by Value Bracket" className="min-h-[140px]">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {transactionBracket.slice(0, 6).map((item, index) => (
              <span key={item.label} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ background: bracketColors[index] }} />
                {item.label}
              </span>
            ))}
          </div>
          <SegmentationBar data={transactionBracket} />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel title="Procurement Workflow" className="min-h-[120px]">
          <div className="flex flex-wrap items-center gap-2">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex h-10 min-w-28 items-center justify-center rounded-md border border-[#007946]/20 bg-[#f0f9f6] px-3 text-xs font-semibold text-[#007946]">
                  {step}
                </div>
                {index !== workflowSteps.length - 1 ? <span className="text-slate-300">→</span> : null}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="ERP / Inventory Status" className="min-h-[120px]">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "ERP Sync", value: "Connected", icon: Database },
              { label: "Inventory", value: "Updated 5 mins ago", icon: PackageCheck },
              { label: "Vendor Master", value: "Ready", icon: ShieldCheck },
              { label: "Budget Control", value: "Active", icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex h-12 items-center gap-3 rounded-md bg-slate-50 px-3 text-sm">
                  <Icon className="h-4 w-4 text-[#007946]" />
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="font-semibold text-slate-800">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
