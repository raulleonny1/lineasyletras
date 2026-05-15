"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isRecordReaderPath } from "@/lib/reader-path";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReader = isRecordReaderPath(pathname);

  return (
    <>
      {!isReader && <SiteHeader />}
      <main className="min-w-0 overflow-x-hidden">{children}</main>
      {!isReader && <SiteFooter />}
    </>
  );
}
