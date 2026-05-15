"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminSectionNavProps {
  showUsers: boolean;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AdminSectionNav({ showUsers }: AdminSectionNavProps) {
  return (
    <nav
      aria-label="Secciones de administración"
      className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-bone/45">Ir a</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => scrollToSection("portada-relato")}>
          Portada del relato
        </Button>
        <Button type="button" variant="outline" onClick={() => scrollToSection("personajes-temporada")}>
          Fotos de personajes
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/relatos">Listado de relatos</Link>
        </Button>
        {showUsers ? (
          <Button type="button" variant="outline" onClick={() => scrollToSection("usuarios-admin")}>
            Usuarios y roles
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-bone/60">
        Portada: botón <span className="text-bone">Subir portada del relato</span> en el formulario de
        la derecha. Personajes: <span className="text-bone">Subir foto del personaje</span> en la
        ficha de cada personaje. Borradores: pantalla{" "}
        <span className="text-bone">Listado de relatos</span> con el autor asignado.
      </p>
    </nav>
  );
}
