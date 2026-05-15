import type { ArchivumRecord } from "@/types";

const record = (
  id: string,
  title: string,
  slug: string,
  synopsis: string,
  content: string,
  season: number,
  episode: number,
  is_premium: boolean,
  featured: boolean,
  tags: string[],
  created_at: string,
  season_title = "",
  story_title = "",
  story_slug = "",
): ArchivumRecord => ({
  id,
  title,
  slug,
  synopsis,
  content,
  season,
  episode,
  story_title,
  story_slug,
  season_title,
  is_premium,
  published: true,
  featured,
  tags,
  cover_url: null,
  created_at,
});

export const seedRecords: ArchivumRecord[] = [
  record(
    "rec-001",
    "La emisora que llora",
    "senal-vidrio-episodio-01",
    "El dial se detiene en 88.8 y alguien susurra tu nombre con voz de máquina oxidada.",
    "La lluvia no cae en esta ciudad: se arrastra, como si el cielo hubiera olvidado cómo soltar el agua de una vez.\n\nEn el apartamento 14B, la radio enciende sola a las 3:17. No hay estación oficial en esa frecuencia. Solo una voz que repite fragmentos de conversaciones que aún no han ocurrido.\n\nCuando el narrador sintoniza el dial, el vidrio de la ventana vibra con un tono grave. Algo en el edificio de enfrente parpadea al mismo ritmo.\n\nEl primer mensaje es una dirección. El segundo, una fecha. El tercero es tu nombre, pronunciado con la precisión de quien lleva años ensayándolo en la oscuridad.",
    1,
    1,
    false,
    true,
    ["radio", "misterio", "senal"],
    "2026-03-01",
  ),
  record(
    "rec-002",
    "Huellas en el asfalto luminoso",
    "senal-vidrio-episodio-02",
    "Las calles guardan memoria térmica. Alguien caminó aquí antes de que tú llegaras.",
    "El asfalto reciente brilla como piel mojada bajo los neones defectuosos del distrito 7.\n\nLas cámaras municipales muestran un vacío donde debería haber un cuerpo. La emisora reproduce el sonido de zapatos que se detienen exactamente donde tú te detienes ahora.\n\nUn archivo clasificado menciona un protocolo de borrado selectivo. No borra personas: borra la posibilidad de que hayan existido en el registro.\n\nLa señal corta. Cuando vuelve, la voz ya no susurra: ordena que no mires atrás.",
    1,
    2,
    true,
    true,
    ["radio", "misterio", "ciudad"],
    "2026-03-08",
  ),
  record(
    "rec-003",
    "Archivo clasificado 7",
    "senal-vidrio-archivo-7",
    "Documento recuperado. Lectura no autorizada.",
    "El documento no tiene sello institucional. Tiene huellas dactilares parcialmente quemadas.\n\nDescribe un experimento de transmisión emocional: convertir el miedo colectivo en narrativa consumible.\n\nLa conclusión está tachada, pero legible: la audiencia no escucha historias. Las historias escuchan a la audiencia.",
    1,
    3,
    true,
    true,
    ["archivo", "clasificado", "misterio"],
    "2026-03-15",
  ),
  record(
    "rec-004",
    "La semilla de papel",
    "jardin-ceniza-episodio-01",
    "La primera hoja germina con tinta fresca y un olor a biblioteca incendiada.",
    "El invernadero no aparece en ningún mapa urbano. Se accede por un ascensor que solo baja cuando cierras los ojos.\n\nEn el centro, una maceta contiene tierra negra y un fragmento de novela impresa en papel de arroz.\n\nAl regarla con agua de lluvia filtrada por carbón, la tinta se reorganiza y forma una frase distinta cada amanecer.",
    1,
    1,
    false,
    true,
    ["botanica", "memoria", "jardin"],
    "2026-01-10",
  ),
  record(
    "rec-005",
    "Polen de memorias ajenas",
    "jardin-ceniza-episodio-02",
    "Respirar demasiado cerca puede hacerte recordar infancias que no fueron tuyas.",
    "El segundo espécimen libera polen plateado bajo la luz azul de las lámparas de sodio.\n\nQuienes lo inhalan describen la misma escena: un niño corriendo por un pasillo infinito de puertas entreabiertas.\n\nLa jardinera anota cada reacción en un cuaderno encuadernado con piel de libro.",
    1,
    2,
    false,
    false,
    ["botanica", "memoria", "jardin"],
    "2026-01-17",
  ),
  record(
    "rec-006",
    "Despertar sin reloj",
    "orbita-silente-episodio-01",
    "El amanecer artificial dura exactamente lo que tarda en leerse un secreto.",
    "La estación no gira: flota con la paciencia de un animal que ha aprendido a no ser visto.\n\nEn el módulo de sueño, las paredes acumulan frases escritas por manos que nadie recuerda haber levantado.\n\nLa primera línea visible hoy dice: «No confíes en quien traduce tus sueños».",
    1,
    1,
    false,
    false,
    ["espacio", "sueno", "orbita"],
    "2026-04-02",
  ),
];

export function getSeedRecordById(id: string) {
  return seedRecords.find((record) => record.id === id || record.slug === id);
}

export function getSeedRecords(options?: {
  includeUnpublished?: boolean;
  featuredOnly?: boolean;
}) {
  return seedRecords.filter((record) => {
    if (!options?.includeUnpublished && !record.published) {
      return false;
    }

    if (options?.featuredOnly && !record.featured) {
      return false;
    }

    return true;
  });
}
