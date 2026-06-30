import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Líneas y Letras",
    short_name: "Líneas y Letras",
    description: "Literatura, fe y palabras que inspiran",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#312e81",
    orientation: "any",
    lang: "es",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
