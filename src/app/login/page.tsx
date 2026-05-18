"use client";

import { startTransition, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { mockAccounts } from "@/lib/mock-auth";
import { getRoleLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useProcurementStore((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (nextUsername: string, nextPassword: string) => {
    setIsSubmitting(true);
    setErrorMessage("");

    const result = login(nextUsername, nextPassword);

    if (!result.success) {
      setIsSubmitting(false);
      setErrorMessage(result.error);
      return;
    }

    startTransition(() => {
      const nextRole = useProcurementStore.getState().currentRole;
      router.replace(nextRole === "Vendor" ? "/my-requests?tab=po" : "/");
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleLogin(username, password);
  };

  const handleQuickLogin = (nextUsername: string, nextPassword: string) => {
    setUsername(nextUsername);
    setPassword(nextPassword);
    setIsModalOpen(false);
    handleLogin(nextUsername, nextPassword);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_1.18fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#08628c_0%,#0070a4_28%,#007946_100%)] px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.22),transparent_0,transparent_32%),radial-gradient(circle_at_72%_78%,rgba(15,23,42,0.24),transparent_0,transparent_30%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:18px_18px]" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#007946] shadow-[0_14px_30px_rgba(8,30,51,0.18)]">
                <span className="text-lg font-bold">ห</span>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">ระบบจัดซื้อภายใน</p>
                <p className="mt-1 text-sm text-white/75">HaadThip procurement workspace</p>
              </div>
            </div>

            <div className="mt-16 max-w-xl lg:mt-24">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Mock Login สำหรับเดโมภายใน
              </p>
              <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Procurement System
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
                ระบบติดตามคำขอจัดซื้อ การอนุมัติ การรับสินค้า และการชำระเงินสำหรับกระบวนการ
                Procure-to-Pay
              </p>
            </div>

            <div className="mt-auto space-y-5 pt-12">
              <p className="text-sm text-white/65">© 2026 HaadThip Public Company Limited</p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden px-6 py-10 sm:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,121,70,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,121,70,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,121,70,0.1),transparent_38%)]" />

          <div className="relative z-10 w-full max-w-[27rem] rounded-[32px] border border-[#d9e4dc] bg-white/92 p-7 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-9">
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">Login</h2>
              <p className="mt-3 text-base leading-7 text-slate-500">
                กรุณากรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบเดโม
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2.5 block text-sm font-semibold text-slate-700">ชื่อผู้ใช้</span>
                <span className="flex h-14 items-center gap-3 rounded-[18px] border border-[#cbd9d0] bg-white px-4">
                  <UserCircle2 className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="กรอกชื่อผู้ใช้"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full border-none bg-transparent text-base text-slate-900 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2.5 block text-sm font-semibold text-slate-700">รหัสผ่าน</span>
                <span className="flex h-14 items-center gap-3 rounded-[18px] border border-[#cbd9d0] bg-white px-4">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border-none bg-transparent text-base text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-slate-400 hover:text-[var(--primary)]"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </span>
              </label>

              {errorMessage ? (
                <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center rounded-[18px] bg-[linear-gradient(90deg,#007946_0%,#149b74_100%)] px-4 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(0,121,70,0.28)] hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "Login"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>หรือ</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex h-14 w-full items-center justify-center rounded-[18px] border border-[#cbd9d0] bg-white px-4 text-lg font-semibold text-slate-700 hover:border-[#007946]/35 hover:text-[var(--primary)]"
            >
              ดูบัญชีทดสอบ
            </button>
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-tint)] text-[var(--primary)]">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">บัญชีผู้ใช้ทดสอบ</h3>
                  <p className="mt-2 text-base leading-7 text-slate-500">
                    เลือกบัญชีเพื่อเข้าใช้งานทันที หรือใช้ข้อมูลด้านล่างกรอกในฟอร์ม Login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="ปิดหน้าต่างบัญชีทดสอบ"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {mockAccounts.map((account) => (
                <span
                  key={account.username}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8e8df] bg-[#f7fbf8] px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {account.labelTh}
                  <span className="rounded-full bg-[#e5f5ee] px-2 py-0.5 text-xs text-[var(--primary-ink)]">
                    {account.labelEn}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {mockAccounts.map((account) => (
                <div
                  key={account.username}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#dbe7df] bg-[#f8faf8] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f5ef] text-[var(--primary)]">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{account.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {account.labelTh} • {getRoleLabel(account.role)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{account.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <div className="rounded-2xl border border-[#dde7e0] bg-white px-4 py-3 text-sm text-slate-600">
                      <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">User:</span>
                      <span className="font-semibold text-slate-900">{account.username}</span>
                    </div>
                    <div className="rounded-2xl border border-[#dde7e0] bg-white px-4 py-3 text-sm text-slate-600">
                      <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pass:</span>
                      <span className="font-semibold text-slate-900">{account.password}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin(account.username, account.password)}
                      className="h-12 rounded-[18px] border border-[#cfe1d7] bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#007946]/35 hover:bg-[#eef8f2] hover:text-[var(--primary)]"
                    >
                      เข้าใช้งาน
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
