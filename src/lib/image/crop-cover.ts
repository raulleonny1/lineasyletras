/** Tamaño medio para portadas: 800×420 px (proporción recomendada para Facebook). */
export const COVER_OUTPUT_WIDTH = 800;
export const COVER_OUTPUT_HEIGHT = 420;
export const COVER_ASPECT = COVER_OUTPUT_WIDTH / COVER_OUTPUT_HEIGHT;

export type CoverCropState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function getInitialCropState(): CoverCropState {
  return { scale: 1, offsetX: 0, offsetY: 0 };
}

export function getDisplayedImageSize(
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
  scale: number
): { width: number; height: number } {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const containerAspect = containerW / containerH;

  if (imgAspect > containerAspect) {
    const height = containerH * scale;
    return { width: height * imgAspect, height };
  }

  const width = containerW * scale;
  return { width, height: width / imgAspect };
}

export async function cropCoverToBlob(
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
  state: CoverCropState
): Promise<Blob> {
  const { width: drawW, height: drawH } = getDisplayedImageSize(
    img,
    containerW,
    containerH,
    state.scale
  );

  const x = (containerW - drawW) / 2 + state.offsetX;
  const y = (containerH - drawH) / 2 + state.offsetY;

  const sourceX = Math.max(0, ((0 - x) / drawW) * img.naturalWidth);
  const sourceY = Math.max(0, ((0 - y) / drawH) * img.naturalHeight);
  const sourceW = Math.min(img.naturalWidth - sourceX, (containerW / drawW) * img.naturalWidth);
  const sourceH = Math.min(img.naturalHeight - sourceY, (containerH / drawH) * img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = COVER_OUTPUT_WIDTH;
  canvas.height = COVER_OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte");

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    COVER_OUTPUT_WIDTH,
    COVER_OUTPUT_HEIGHT
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar la imagen"));
      },
      "image/jpeg",
      0.88
    );
  });
}

export function readImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecciona un archivo de imagen (JPG, PNG, WebP)."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("La imagen es demasiado grande. Máximo 8 MB."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    img.src = url;
  });
}
