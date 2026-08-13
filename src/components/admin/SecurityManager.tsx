import { useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, LogOut } from "lucide-react";
import { changeAdminPassword, logoutAdmin, ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-auth";

const field = "w-full border border-border bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brass";
const label = "mb-1.5 block text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase";

export function SecurityManager({ onLogout }: { onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
      toast.error(`يجب أن تتكون كلمة السر من ${ADMIN_PASSWORD_MIN_LENGTH} حرفاً أو أكثر`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      await changeAdminPassword({ data: { currentPassword, newPassword } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("تم تغيير كلمة السر");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تغيير كلمة السر");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    onLogout();
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="border border-border p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <LockKeyhole className="h-5 w-5 text-brass" />
          <div>
            <p className="eyebrow">الأمان</p>
            <h2 className="mt-2 font-display text-3xl text-brass-soft">تغيير كلمة السر</h2>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          <label className="block">
            <span className={label}>كلمة السر الحالية</span>
            <input type="password" className={field} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="block">
            <span className={label}>كلمة السر الجديدة</span>
            <input type="password" className={field} autoComplete="new-password" minLength={ADMIN_PASSWORD_MIN_LENGTH} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </label>
          <label className="block">
            <span className={label}>تأكيد كلمة السر الجديدة</span>
            <input type="password" className={field} autoComplete="new-password" minLength={ADMIN_PASSWORD_MIN_LENGTH} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>
          <p className="text-xs text-muted-foreground">الحد الأدنى {ADMIN_PASSWORD_MIN_LENGTH} حرفاً. بعد الحفظ تبقى الجلسة الحالية فعالة.</p>
          <button type="submit" disabled={busy} className="bg-primary px-6 py-3 text-sm text-primary-foreground disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "حفظ كلمة السر"}</button>
        </form>
      </section>
      <aside className="border border-border p-5 sm:p-7">
        <p className="eyebrow">الجلسة</p>
        <h2 className="mt-2 font-display text-3xl text-brass-soft">الخروج من لوحة التحكم</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">ينهي الخروج الجلسة الآمنة الحالية على هذا المتصفح.</p>
        <button type="button" onClick={() => void handleLogout()} className="mt-6 inline-flex items-center gap-2 border border-border px-5 py-3 text-sm transition-colors hover:border-brass">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </aside>
    </div>
  );
}
