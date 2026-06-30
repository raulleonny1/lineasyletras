"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  COVER_ASPECT,
  COVER_OUTPUT_HEIGHT,
  COVER_OUTPUT_WIDTH,
  cropCoverToBlob,
  getDisplayedImageSize,
  getInitialCropState,
  readImageFile,
  type CoverCropState,
} from "@/lib/image/crop-cover";

type Props = {
  currentUrl?: string;
  onChange: (blob: Blob | null, previewUrl: string | null) => void;
};

const PREVIEW_W = 320;
const PREVIEW_H = Math.round(PREVIEW_W / COVER_ASPECT);

function revokeIfBlob(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function CoverImageCropper({ currentUrl, onChange }: Props) {
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CoverCropState>(getInitialCropState());
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    return () => {
      revokeIfBlob(previewUrl);
      revokeIfBlob(sourceUrl);
    };
  }, [previewUrl, sourceUrl]);

  const applyCrop = useCallback(
    async (img: HTMLImageElement, state: CoverCropState) => {
      setProcessing(true);
      try {
        const blob = await cropCoverToBlob(img, PREVIEW_W, PREVIEW_H, state);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          revokeIfBlob(prev);
          return url;
        });
        onChange(blob, url);
      } catch {
        setError("No se pudo recortar la imagen.");
      } finally {
        setProcessing(false);
      }
    },
    [onChange]
  );

  function clearSource() {
    revokeIfBlob(sourceUrl);
    setSourceUrl(null);
    setSourceImg(null);
    setCrop(getInitialCropState());
  }

  async function handleFile(file: File | null) {
    setError("");
    if (!file) return;

    try {
      clearSource();
      const img = await readImageFile(file);
      const state = getInitialCropState();
      setSourceImg(img);
      setSourceUrl(img.src.startsWith("blob:") ? img.src : null);
      setCrop(state);
      await applyCrop(img, state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la imagen");
    }
  }

  function handleScaleChange(scale: number) {
    if (!sourceImg) return;
    const next = { ...crop, scale };
    setCrop(next);
    void applyCrop(sourceImg, next);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!sourceImg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: crop.offsetX, oy: crop.offsetY };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !sourceImg) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setCrop({
      ...crop,
      offsetX: dragRef.current.ox + dx,
      offsetY: dragRef.current.oy + dy,
    });
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !sourceImg) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    void applyCrop(sourceImg, crop);
  }

  function handleRemove() {
    clearSource();
    setPreviewUrl((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    onChange(null, null);
  }

  const displayed = sourceImg
    ? getDisplayedImageSize(sourceImg, PREVIEW_W, PREVIEW_H, crop.scale)
    : null;

  const cropImageSrc = sourceUrl ?? sourceImg?.src ?? "";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="space-y-2 shrink-0">
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm w-[320px] max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Vista previa de portada"
                className="w-full h-auto object-cover"
                style={{ aspectRatio: `${COVER_OUTPUT_WIDTH}/${COVER_OUTPUT_HEIGHT}` }}
              />
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                {COVER_OUTPUT_WIDTH}×{COVER_OUTPUT_HEIGHT}
              </span>
            </div>
          ) : (
            <div
              className="w-[320px] max-w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm"
              style={{ aspectRatio: `${COVER_OUTPUT_WIDTH}/${COVER_OUTPUT_HEIGHT}` }}
            >
              Sin imagen
            </div>
          )}

          <p className="text-xs text-slate-500">
            Tamaño medio optimizado para Facebook y tarjetas del sitio.
          </p>
        </div>

        <div className="flex-1 space-y-3">
          <label className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            📷 Elegir imagen
          </label>

          {sourceImg && displayed && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Ajustar recorte (arrastra para mover)
              </p>
              <div
                className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-900 cursor-grab active:cursor-grabbing touch-none"
                style={{ width: PREVIEW_W, height: PREVIEW_H, maxWidth: "100%" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropImageSrc}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none select-none pointer-events-none"
                  style={{
                    width: displayed.width,
                    height: displayed.height,
                    left: (PREVIEW_W - displayed.width) / 2 + crop.offsetX,
                    top: (PREVIEW_H - displayed.height) / 2 + crop.offsetY,
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 shrink-0">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.02}
                  value={crop.scale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
              </div>
            </div>
          )}

          {(previewUrl || currentUrl) && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-rose-600 hover:underline"
            >
              Quitar imagen
            </button>
          )}

          {processing && <p className="text-xs text-indigo-600">Ajustando imagen...</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
