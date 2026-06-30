"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/stories", label: "Historias", icon: "📚" },
  { href: "/admin/escribir", label: "Escribir", icon: "✍️" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 safe-top">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/admin/stories" className="font-bold text-slate-900 font-serif text-sm sm:text-base truncate">
            Admin · Líneas y Letras
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              href="/"
              className="text-xs sm:text-sm text-slate-500 hover:text-indigo-600 px-2 sm:px-3 py-2 touch-target"
            >
              Ver sitio
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 px-2 sm:px-3 py-2 rounded-lg touch-target"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="hidden lg:flex max-w-6xl mx-auto px-4 pb-3 items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Barra inferior admin — móvil / iPad */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 mobile-tab-bar">
        <div className="flex max-w-lg mx-auto">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href === "/admin/stories" && pathname.includes("/edit"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 touch-target text-xs font-semibold ${
                  active ? "text-indigo-600 bg-indigo-50/80" : "text-slate-500"
                }`}
              >
                <span className="text-lg leading-none">{link.icon}</span>
                <span className="mt-1">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
