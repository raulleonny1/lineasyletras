"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import type { Story, ActiveTab, ThemeMode, FontSize, AiAssistantMode } from "@/types/story";
import { INITIAL_STORIES } from "@/data/initial-stories";
import { LineasYLetrasLogo } from "@/components/brand/lineas-y-letras-logo";
import { filterStories } from "@/lib/stories/utils";
import { saveAdminDraft } from "@/lib/admin/draft-storage";
import { StorySocialBar } from "@/components/reading/story-social-bar";
import { StoryComments } from "@/components/reading/story-comments";
import { StoryCard } from "@/components/reading/story-card";
import { storyCoverHeaderClass, storyCoverHeaderStyle, resolveStoryCoverSrc } from "@/lib/stories/cover";

const STORAGE_FAVORITES = "lineas_letras_favorites";
const LEGACY_FAVORITES = "senda_luz_favorites";

function mergeStories(published: Story[], fallback: Story[]): Story[] {
  return published.length > 0 ? published : fallback;
}

export default function SendaDeLuz({
  initialTag,
  initialStoryId,
}: { initialTag?: string; initialStoryId?: string } = {}) {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("explorar");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [tagFilter, setTagFilter] = useState(initialTag ?? "");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["Todas"]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [fontSize, setFontSize] = useState<FontSize>("text-base");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const [notification, setNotification] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAssistantMode, setAiAssistantMode] = useState<AiAssistantMode>("bosquejo");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const warmVoices = () => synthRef.current?.getVoices();
      warmVoices();
      window.speechSynthesis.addEventListener("voiceschanged", warmVoices);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", warmVoices);
    }
  }, []);

  useEffect(() => {
    async function loadStories() {
      const savedFavorites =
        localStorage.getItem(STORAGE_FAVORITES) ?? localStorage.getItem(LEGACY_FAVORITES);

      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch {
          /* ignore */
        }
      }

      try {
        const res = await fetch("/api/stories");
        const data = await res.json();
        const published: Story[] = data.stories ?? [];
        setStories(mergeStories(published, INITIAL_STORIES));
      } catch {
        setStories(INITIAL_STORIES);
      }

      setHydrated(true);
    }

    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.filterOptions?.length) {
          setCategoryOptions(data.filterOptions);
        }
      } catch {
        /* keep defaults */
      }
    }

    loadStories();
    loadCategories();
  }, []);

  useEffect(() => {
    if (!hydrated || !initialStoryId) return;
    const story = stories.find((s) => s.id === initialStoryId);
    if (story) {
      setSelectedStory(story);
      setActiveTab("leer");
    }
  }, [hydrated, initialStoryId, stories]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
    }
  }, [favorites, hydrated]);

  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    stopSpeech();
  }, [selectedStory, activeTab, stopSpeech]);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setActiveTab("leer");
  };

  const toggleFavorite = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 4000);
  };

  const speakContent = () => {
    if (!selectedStory || !synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.pause();
      setIsSpeaking(false);
      return;
    }

    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsSpeaking(true);
      return;
    }

    synthRef.current.cancel();

    const cleanText = `${selectedStory.title}. Escrito por ${selectedStory.author}. ${selectedStory.content}`;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES";
    utterance.rate = speechRate;

    const voices = synthRef.current.getVoices();
    const esVoice =
      voices.find((v) => v.lang.startsWith("es") && !v.name.toLowerCase().includes("english")) ??
      voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    if (isSpeaking) {
      synthRef.current?.cancel();
      setTimeout(() => {
        speakContent();
      }, 100);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError(
        "Por favor, escribe una idea o palabra clave para inspirar a la Inteligencia Artificial."
      );
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiResult("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, mode: aiAssistantMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAiError(
          data.error ||
            "Hubo un error de conexión al generar la inspiración de la IA. Por favor, vuelve a intentarlo en unos instantes."
        );
        return;
      }

      setAiResult(data.text);
    } catch (err) {
      setAiError(
        "Hubo un error de conexión al generar la inspiración de la IA. Por favor, vuelve a intentarlo en unos instantes."
      );
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResultToEditor = () => {
    if (!aiResult) return;

    const lines = aiResult.split("\n");
    let titleGuess = "Inspiración del Corazón";
    for (const line of lines) {
      const cleanLine = line.replace(/[#*_\-\-]/g, "").trim();
      if (
        cleanLine.toLowerCase().startsWith("título:") ||
        cleanLine.toLowerCase().startsWith("titulo:")
      ) {
        titleGuess = cleanLine.replace(/titulo:|título:/gi, "").trim();
        break;
      } else if (
        cleanLine.length > 5 &&
        cleanLine.length < 50 &&
        (cleanLine.startsWith("El ") ||
          cleanLine.startsWith("La ") ||
          cleanLine.startsWith("Los ") ||
          cleanLine.startsWith("Un "))
      ) {
        titleGuess = cleanLine;
        break;
      }
    }

    saveAdminDraft({
      title: titleGuess,
      content: aiResult,
      category:
        aiAssistantMode === "devocional" ? "Lecciones Cristianas" : "Literatura Creativa",
    });
    window.location.href = "/admin/escribir";
  };

  const filteredStories = filterStories(stories, {
    search: searchQuery,
    category: selectedCategory,
    tag: tagFilter || undefined,
    publishedOnly: true,
  });

  const premiumStories = filteredStories.filter((story) => story.premium);
  const regularStories = filteredStories.filter((story) => !story.premium);

  const favoriteStories = stories.filter((story) => favorites.includes(story.id));

  const getThemeClasses = () => {
    if (themeMode === "sepia") return "bg-[#f4ecd8] text-[#433422] font-serif";
    if (themeMode === "dark") return "bg-gray-900 text-gray-100 font-serif border-gray-800";
    return "bg-white text-gray-800 font-serif";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* HEADER DE LA APP */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all safe-top">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer touch-target min-w-0"
            onClick={() => {
              setActiveTab("explorar");
              setSelectedStory(null);
            }}
          >
            <LineasYLetrasLogo className="w-10 h-10 sm:w-11 sm:h-11" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 via-violet-700 to-indigo-700 bg-clip-text text-transparent font-serif tracking-wide truncate">
                Líneas y Letras
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Literatura, fe y palabras que inspiran
              </p>
            </div>
          </div>

          {/* Menú superior — tablet/desktop */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0">
            <button
              onClick={() => {
                setActiveTab("explorar");
                setSelectedStory(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "explorar" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              📖 Explorar
            </button>
            <button
              onClick={() => {
                setActiveTab("asistente");
                setSelectedStory(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "asistente" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              ✨ Asistente IA
            </button>
            <button
              onClick={() => {
                setActiveTab("favoritos");
                setSelectedStory(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "favoritos" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              ❤️ Guardados ({favorites.length})
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-all"
            >
              ⚙️ Admin
            </Link>
          </nav>

          {/* Verso Inspirador Rápido (Encabezado) */}
          <div className="hidden lg:block text-right max-w-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
              Pensamiento de Hoy
            </span>
            <p className="text-xs italic text-slate-600 font-serif">
              &quot;Lámpara es a mis pies tu palabra, y lumbrera a mi camino.&quot;
            </p>
          </div>
        </div>
      </header>

      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
          {notification}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 mobile-main-pad">
        {/* TABA: EXPLORAR / INICIO */}
        {activeTab === "explorar" && (
          <div className="space-y-6">
            {/* HÉROE DE BIENVENIDA */}
            <div className="bg-gradient-to-br from-indigo-950 via-violet-950 to-amber-950 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-violet-500 rounded-full blur-3xl opacity-25"></div>
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-amber-400 rounded-full blur-3xl opacity-15"></div>

              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <LineasYLetrasLogo className="w-16 h-16" showGlow />
                  <span className="bg-amber-500/20 border border-amber-400/30 text-amber-100 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                    Tu espacio literario
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold mt-3 font-serif leading-tight">
                  Un rincón literario para fortalecer tu espíritu y mente.
                </h2>
                <p className="text-slate-300 mt-3 text-base md:text-lg leading-relaxed font-sans">
                  Descubre parábolas, lecciones de vida y relatos profundos diseñados para
                  inspirarte y dar respuestas de paz en el día a día.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const randomStory = stories[Math.floor(Math.random() * stories.length)];
                      handleSelectStory(randomStory);
                    }}
                    className="bg-white text-indigo-950 font-bold px-5 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm shadow-md flex items-center space-x-2 touch-manipulation"
                  >
                    🎲 Lectura Aleatoria
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN PREMIUM */}
            {premiumStories.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                      Selección especial
                    </p>
                    <h2 className="text-2xl font-bold font-serif text-slate-900">
                      ✨ Historias Premium
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Relatos destacados elegidos para inspirarte con profundidad.
                    </p>
                  </div>
                </div>

                <div className="relative rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-4 sm:p-5 shadow-sm">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x scroll-touch">
                    {premiumStories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        isFavorite={favorites.includes(story.id)}
                        onSelect={handleSelectStory}
                        onToggleFavorite={toggleFavorite}
                        onNotify={showNotification}
                        featured
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* BARRA DE FILTRADO Y BÚSQUEDA */}
            {tagFilter && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-sm text-indigo-800">
                  Filtrando por etiqueta: <strong>#{tagFilter}</strong>
                </p>
                <button
                  onClick={() => setTagFilter("")}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Quitar filtro
                </button>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Buscador */}
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  placeholder="Buscar palabras, temas, citas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 text-sm"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 absolute left-3 top-3 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3.5 text-xs font-bold text-indigo-600"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Categorías */}
              <div className="flex gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none snap-x scroll-touch">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap snap-center ${selectedCategory === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* CUADRICULA DE HISTORIAS */}
            {regularStories.length > 0 ? (
              <div className="space-y-3">
                {premiumStories.length > 0 && (
                  <h2 className="text-lg font-bold font-serif text-slate-800">Más historias</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      isFavorite={favorites.includes(story.id)}
                      onSelect={handleSelectStory}
                      onToggleFavorite={toggleFavorite}
                      onNotify={showNotification}
                    />
                  ))}
                </div>
              </div>
            ) : premiumStories.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <span className="text-4xl">🌾</span>
                <h3 className="text-lg font-bold text-slate-700 mt-3 font-serif">
                  Aún no hay historias aquí
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                  No se encontraron resultados para la búsqueda actual o la categoría
                  seleccionada. Intenta borrar los filtros o escribe tu primera historia.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Todas");
                  }}
                  className="mt-4 text-indigo-600 font-semibold hover:underline"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* TABA: LECTURA ENFOCADA (PREMIUM) */}
        {activeTab === "leer" && selectedStory && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Volver y Configuración */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => {
                  stopSpeech();
                  setActiveTab("explorar");
                }}
                className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-bold text-sm bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all touch-manipulation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
                <span>Volver</span>
              </button>

              {/* Controles de Accesibilidad */}
              <div className="flex items-center space-x-3">
                {/* Modos de Color */}
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button
                    onClick={() => setThemeMode("light")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all ${themeMode === "light" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                    title="Modo Claro"
                  >
                    ☀️
                  </button>
                  <button
                    onClick={() => setThemeMode("sepia")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all ${themeMode === "sepia" ? "bg-[#f4ecd8] text-[#433422] shadow-sm" : "text-slate-500"}`}
                    title="Modo Sepia"
                  >
                    🍂
                  </button>
                  <button
                    onClick={() => setThemeMode("dark")}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all ${themeMode === "dark" ? "bg-gray-800 text-white shadow-sm" : "text-slate-500"}`}
                    title="Modo Noche"
                  >
                    🌙
                  </button>
                </div>

                {/* Tamaños de Letra */}
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button
                    onClick={() => setFontSize("text-base")}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${fontSize === "text-base" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize("text-lg")}
                    className={`px-2 py-1 rounded-md text-sm font-bold transition-all ${fontSize === "text-lg" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize("text-xl")}
                    className={`px-2 py-1 rounded-md text-base font-bold transition-all ${fontSize === "text-xl" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    A++
                  </button>
                </div>
              </div>
            </div>

            {/* ARTÍCULO ENFOCADO */}
            <article
              className={`rounded-3xl p-6 md:p-10 shadow-md border border-slate-100 transition-all ${getThemeClasses()}`}
            >
              <div className="space-y-4">
                {resolveStoryCoverSrc(selectedStory) && (
                  <div className="rounded-2xl overflow-hidden -mx-1 md:-mx-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveStoryCoverSrc(selectedStory)}
                      alt={selectedStory.title}
                      className="w-full h-44 md:h-52 object-cover"
                    />
                  </div>
                )}

                {/* Categoría y Fecha */}
                <div className="flex items-center justify-between text-xs font-sans text-slate-500 border-b pb-4 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {selectedStory.category}
                    </span>
                    <span>⏱️ Lectura: {selectedStory.readTime}</span>
                  </div>
                  <span>📅 {selectedStory.date}</span>
                </div>

                {/* Título Principal */}
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-serif mt-2 leading-tight">
                  {selectedStory.title}
                </h2>

                {/* Autor */}
                <p className="text-sm font-sans text-slate-500 italic">
                  Escrito por:{" "}
                  <span className="font-semibold text-slate-700 not-italic">
                    {selectedStory.author}
                  </span>
                </p>

                {/* CONTROL DE LECTOR DE TEXTO A VOZ (AUDIO) */}
                <div className="bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-sm">
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <button
                      onClick={speakContent}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-md transition-all touch-manipulation ${isSpeaking ? "bg-amber-600 hover:bg-amber-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-500"}`}
                      title={
                        isSpeaking ? "Pausar narración de voz" : "Escuchar lección en voz alta"
                      }
                    >
                      {isSpeaking ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 ml-0.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        Escuchar Reflexión
                      </p>
                      <p className="text-xs text-slate-400">Narrador artificial en español</p>
                    </div>
                  </div>

                  {/* Selector de Velocidad */}
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Velocidad:</span>
                    {[0.8, 1, 1.2, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleRateChange(rate)}
                        className={`px-2 py-1 text-xs rounded-md font-bold transition-all ${speechRate === rate ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300"}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* CUERPO DE LA HISTORIA */}
                <div
                  className={`mt-6 space-y-5 leading-relaxed tracking-normal text-justify ${fontSize} border-t pt-6 border-slate-100 dark:border-slate-800`}
                >
                  {selectedStory.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Etiquetas y acciones sociales */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 font-sans">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStory.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/etiqueta/${encodeURIComponent(tag.toLowerCase())}`}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-400 hover:text-indigo-700 text-xs px-3 py-1 rounded-full font-medium transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>

                  <StorySocialBar
                    storyId={selectedStory.id}
                    title={selectedStory.title}
                    summary={selectedStory.summary}
                    coverImageUrl={resolveStoryCoverSrc(selectedStory)}
                    isFavorite={favorites.includes(selectedStory.id)}
                    onToggleFavorite={toggleFavorite}
                    onNotify={showNotification}
                  />
                </div>
              </div>
            </article>

            <StoryComments storyId={selectedStory.id} />

            {/* Tarjeta de Reflexión Adicional */}
            <div className="bg-gradient-to-tr from-indigo-50 to-sky-50 rounded-2xl p-6 border border-indigo-100 text-center space-y-2">
              <span className="text-2xl">🌱</span>
              <h4 className="font-serif font-bold text-slate-800">
                ¿Te ha gustado esta lección de vida?
              </h4>
              <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
                El conocimiento espiritual y literario se multiplica al compartirse. Usa el
                asistente de IA para inspirarte.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setActiveTab("asistente")}
                  className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-indigo-500 transition-all"
                >
                  ✨ Preguntar al Asistente IA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABA: ASISTENTE DE IA (GEMINI POWERED) */}
        {activeTab === "asistente" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header del Asistente */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative z-10 space-y-2">
                <span className="bg-white/20 text-white px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase">
                  Tecnología de Vanguardia
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold font-serif">
                  Asistente Literario de Inteligencia Artificial
                </h2>
                <p className="text-indigo-100 text-sm leading-relaxed font-sans max-w-2xl">
                  ¿Te falta inspiración o quieres darle un toque literario refinado a tu idea?
                  Selecciona una modalidad de escritura, escribe tu idea clave y deja que el modelo
                  Gemini cree una joya literaria para ti.
                </p>
              </div>
            </div>

            {/* CONTENEDOR DE OPCIONES Y PROMPTS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              {/* Modos del Asistente */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  ¿En qué te asisto hoy?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setAiAssistantMode("bosquejo");
                      setAiResult("");
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${aiAssistantMode === "bosquejo" ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="text-base">📋</span>
                    <div className="mt-2">
                      <p className="font-bold text-xs text-slate-800">Estructurar Bosquejo</p>
                      <p className="text-[10px] text-slate-500">Esquema narrativo e ideas clave</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setAiAssistantMode("devocional");
                      setAiResult("");
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${aiAssistantMode === "devocional" ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="text-base">🕊️</span>
                    <div className="mt-2">
                      <p className="font-bold text-xs text-slate-800">Crear Devocional / Lección</p>
                      <p className="text-[10px] text-slate-500">
                        Reflexión espiritual y aplicación
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setAiAssistantMode("pulir");
                      setAiResult("");
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${aiAssistantMode === "pulir" ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className="text-base">✨</span>
                    <div className="mt-2">
                      <p className="font-bold text-xs text-slate-800">Pulir Prosa & Redacción</p>
                      <p className="text-[10px] text-slate-500">Perfecciona tu borrador inicial</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Entrada de Texto */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {aiAssistantMode === "pulir"
                    ? "Pega tu borrador para refinarlo:"
                    : "Escribe las palabras o tema inspirador:"}
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={
                    aiAssistantMode === "bosquejo"
                      ? "Ej: Una historia sobre vencer el miedo a los cambios basados en la parábola de la fe..."
                      : aiAssistantMode === "devocional"
                        ? "Ej: Un pasaje sobre la paciencia, Dios guardándonos en los momentos de soledad..."
                        : "Pega tu texto aquí para que la IA mejore su redacción, vocabulario, impacto y belleza..."
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 text-sm leading-relaxed"
                ></textarea>

                {/* Sugerencias Rápidas */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Sugerencias:
                  </span>
                  {["El Valor del Perdón", "Paz en la tormenta", "La vasija rota", "Paciencia activa"].map(
                    (sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setAiPrompt(sug)}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                      >
                        {sug}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Botón de Generación */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  className={`w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${aiLoading ? "opacity-85 cursor-not-allowed" : ""}`}
                >
                  {aiLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Inspirando al escritor celestial...</span>
                    </>
                  ) : (
                    <span>✨ Generar Inspiración Literaria</span>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm font-semibold">
                  ⚠️ {aiError}
                </div>
              )}

              {/* RESULTADO DE LA IA */}
              {aiResult && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                      ✨ Inspiración Encontrada
                    </span>
                    <button
                      type="button"
                      onClick={applyAiResultToEditor}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1"
                    >
                      ✍️ Llevar a Escribir
                    </button>
                  </div>

                  {/* Cuerpo de Texto Generado */}
                  <div className="font-serif leading-relaxed text-slate-800 text-sm whitespace-pre-line text-justify max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                    {aiResult}
                  </div>

                  <div className="text-xs text-slate-400 italic">
                    Esta sugerencia literaria es generada para inspirar tu pluma. Puedes copiarla,
                    editarla o publicarla como propia.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TABA: HISTORIAS FAVORITAS / GUARDADAS */}
        {activeTab === "favoritos" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-serif text-slate-900">
                Tus Joyas Literarias Guardadas
              </h2>
              <p className="text-slate-500 text-sm">
                Un cofre especial donde residen las historias, lecciones y devocionales que han
                tocado tu corazón.
              </p>
            </div>

            {favoriteStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteStories.map((story) => (
                  <article
                    key={story.id}
                    onClick={() => handleSelectStory(story)}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                  >
                    <div
                      className={`${storyCoverHeaderClass(story, "h-20")} p-4 flex flex-col justify-between`}
                      style={storyCoverHeaderStyle(story)}
                    >
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase self-start">
                        {story.category}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-3 font-sans">
                          {story.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">⏱️ {story.readTime}</span>
                        <button
                          onClick={(e) => toggleFavorite(story.id, e)}
                          className="text-rose-500 text-xs font-bold hover:underline"
                        >
                          Quitar de guardados
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <span className="text-4xl">❤️</span>
                <h3 className="text-lg font-bold text-slate-700 mt-3 font-serif">
                  Aún no hay favoritos guardados
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                  Cuando estés explorando y leyendo las lecciones, haz clic en el botón de corazón
                  para atesorarlas aquí.
                </p>
                <button
                  onClick={() => setActiveTab("explorar")}
                  className="mt-4 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-indigo-500 transition-all"
                >
                  📖 Ir a Explorar Lecciones
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navegación inferior — móvil y tablet (iPad/Android) */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg mobile-tab-bar">
        <div className="flex justify-around items-stretch max-w-lg mx-auto">
        <button
          onClick={() => {
            setActiveTab("explorar");
            setSelectedStory(null);
          }}
          className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all touch-target flex-1 ${activeTab === "explorar" || activeTab === "leer" ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 0 0 8.716-6.747c-1.88-.227-3.796-.187-5.64.12a21.05 21.05 0 0 0-6.152 1.95A8.955 8.955 0 0 0 12 21ZM20.893 12.623A9.003 9.003 0 0 0 12 3a8.999 8.999 0 0 0-8.893 9.623c1.802-.853 3.755-1.465 5.767-1.815a21.1 21.1 0 0 1 5.64-.12c1.844-.307 3.76-.347 5.64-.12Z"
            />
          </svg>
          <span className="text-[10px] font-bold mt-1">Explorar</span>
        </button>

        <Link
          href="/admin"
          className="flex flex-col items-center justify-center py-2 px-4 rounded-xl text-slate-500 hover:text-indigo-600 transition-all touch-target flex-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="text-[10px] font-bold mt-1">Admin</span>
        </Link>

        <button
          onClick={() => {
            setActiveTab("asistente");
            setSelectedStory(null);
          }}
          className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all touch-target flex-1 ${activeTab === "asistente" ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18 10.5l-.563-2.688L14.75 7.25l2.688-.563L18 4l.563 2.688 2.688.563-2.688.563L18 10.5z"
            />
          </svg>
          <span className="text-[10px] font-bold mt-1">Asistente IA</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("favoritos");
            setSelectedStory(null);
          }}
          className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all touch-target flex-1 ${activeTab === "favoritos" ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span className="text-[10px] font-bold mt-1">Guardados</span>
        </button>
        </div>
      </footer>
    </div>
  );
}
