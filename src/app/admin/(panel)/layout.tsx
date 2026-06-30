import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6 mobile-main-pad">{children}</main>
    </div>
  );
}
