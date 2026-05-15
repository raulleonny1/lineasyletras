"use client";

import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordCoverUploadProps {
  title: string;
  previewUrl: string | null;
  selectedFileName: string | null;
  hasStoredCover: boolean;
  inherited?: boolean;
  showUploadControls?: boolean;
  onEnableUpload?: () => void;
  onSelect: (file: File | null) => void;
  onClear: () => void;
}

export function RecordCoverUpload({
  title,
  previewUrl,
  selectedFileName,
  hasStoredCover,
  inherited = false,
  showUploadControls = true,
  onEnableUpload,
  onSelect,
  onClear,
}: RecordCoverUploadProps) {
  return (
    <section
      id="portada-relato"
      aria-labelledby="portada-relato-heading"
      className="scroll-mt-24 space-y-4 rounded-[1rem] border-2 border-dashed border-wine/60 bg-wine/15 p-4"
    >
      <div className="space-y-1">
        <h3 id="portada-relato-heading" className="font-heading text-xl text-bone">
          Portada del relato
        </h3>
        <p className="text-sm text-bone/75">
          {inherited
            ? "Este capítulo reutiliza la portada ya subida para la misma novela y temporada."
            : "Sube la imagen de portada aquí, entre el slug y las etiquetas."}
        </p>
        {!inherited ? (
          <p className="text-xs text-bone/55">
            Proporción 4:5. Recomendado 800×1000 px en JPG, PNG o WebP.
          </p>
        ) : null}
      </div>

      <div className="relative aspect-[4/5] max-w-[14rem] overflow-hidden rounded-[1.25rem] border border-white/10 bg-gradient-to-br from-abyss via-smoke to-carbon">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local en admin
          <img
            src={previewUrl}
            alt={title ? `Portada de ${title}` : "Vista previa de portada"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-bone/55">
            Sin portada seleccionada
          </div>
        )}
      </div>

      {showUploadControls ? (
        <>
          <label
            htmlFor="cover"
            className="flex cursor-pointer flex-col gap-2 rounded-[1rem] border border-white/15 bg-black/30 p-4"
          >
            <span className="text-sm font-medium text-bone">Archivo de portada</span>
            <input
              id="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full cursor-pointer rounded-lg border border-wine/30 bg-black/40 px-3 py-2 text-sm text-bone file:mr-3 file:rounded-md file:border-0 file:bg-wine/40 file:px-3 file:py-1.5 file:text-sm file:text-bone"
              onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => document.getElementById("cover")?.click()}
            >
              <ImageUp className="h-4 w-4" />
              {previewUrl || hasStoredCover ? "Cambiar portada" : "Subir portada del relato"}
            </Button>
            {previewUrl || hasStoredCover ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={onClear}>
                Quitar portada
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={onEnableUpload}>
            Usar otra portada
          </Button>
        </div>
      )}

      {selectedFileName ? (
        <p className="text-xs text-bone/55">Archivo seleccionado: {selectedFileName}</p>
      ) : null}
    </section>
  );
}
