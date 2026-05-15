import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-carbon/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <BrandMark variant="footer" />
          <div>
            <p className="font-heading text-2xl text-bone">{SITE_NAME}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-bone/55">
              {SITE_TAGLINE}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-bone/60">
          <Link href="/archive" className="hover:text-bone">
            Archivo
          </Link>
          <Link href="/dashboard" className="hover:text-bone">
            Dashboard
          </Link>
          <Link href="/login" className="hover:text-bone">
            Acceso
          </Link>
          <Link href="/register" className="hover:text-bone">
            Registro
          </Link>
        </div>
      </div>
    </footer>
  );
}
