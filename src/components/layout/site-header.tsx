"use client";

import Link from "next/link";
import { isRecordReaderPath } from "@/lib/reader-path";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME } from "@/lib/constants";
import { isStaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const publicLinks = [
  { href: "/archive", label: "Archivo" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const isReader = isRecordReaderPath(pathname);
  const links = role && isStaffRole(role)
    ? [...publicLinks, { href: "/admin", label: "Admin" }]
    : publicLinks;

  if (isReader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-carbon/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <BrandMark variant="icon" />
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-medium text-bone sm:text-xl">
              {SITE_NAME}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.28em] text-bone/40 sm:block">
              archivo clasificado
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-bone/65 transition hover:bg-white/5 hover:text-bone",
                pathname === link.href && "bg-white/5 text-bone",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-sm text-bone/60 md:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" className="hidden lg:inline-flex" onClick={() => signOut()}>
                Salir
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden lg:inline-flex">
              <Link href="/login">Acceder</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex border-white/10 bg-carbon">
              <SheetHeader>
                <SheetTitle className="font-heading text-2xl text-bone">
                  Navegación
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-bone/80 hover:bg-white/5",
                      pathname === link.href && "bg-white/5 text-bone",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto border-t border-white/10 pt-6">
                {user ? (
                  <div className="space-y-3">
                    <p className="break-all px-1 text-sm text-bone/60">{user.email}</p>
                    <Button variant="outline" className="w-full rounded-full" onClick={() => signOut()}>
                      Salir
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full rounded-full">
                    <Link href="/login">Acceder</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
