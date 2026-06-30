# Líneas y Letras

Plataforma literaria para leer, escribir y compartir lecciones de vida e inspiración espiritual.

## Características

- **Explorar** — Biblioteca de historias con búsqueda y filtros por categoría
- **Leer** — Lector enfocado con modos claro, sepia y noche, tamaño de fuente ajustable y narración por voz (TTS)
- **Escribir** — Editor para crear y guardar tus propias lecciones
- **Asistente IA** — Generación literaria con Gemini (bosquejo, devocional, pulir prosa)
- **Favoritos** — Guarda las historias que más te inspiran

## Stack

- [Next.js 16](https://nextjs.org/) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Firebase Firestore](https://firebase.google.com/) — persistencia de historias en la nube
- [Google Gemini](https://ai.google.dev/) — asistente literario (API segura en servidor)
- Despliegue en [Vercel](https://vercel.com/)

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completa las variables en .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Configuración del proyecto Firebase |
| `GEMINI_API_KEY` | Clave de API de Gemini (solo servidor) |

Sin Firebase configurado, las historias se guardan en `localStorage` del navegador. Sin `GEMINI_API_KEY`, el asistente IA no funcionará.

## Firebase y reglas de Firestore

### Cómo funciona la seguridad

| Quién | Acceso a Firestore |
|-------|-------------------|
| **Visitantes (navegador)** | Sin acceso directo. Solo ven datos vía `/api/stories`. |
| **Panel `/admin`** | Escribe vía API de Next.js con **Firebase Admin SDK** (ignora reglas). |
| **Cliente con tu API key** | Bloqueado por reglas si están bien configuradas. |

### Reglas recomendadas (producción)

El archivo `firestore.rules` del proyecto contiene:

```
// Lectura pública: solo historias con published == true
// Escritura desde cliente: DENEGADA (solo Admin SDK en servidor)
```

**Despliega las reglas** en Firebase Console → Firestore → Reglas, o con CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use lineasyletras-51eb0
firebase deploy --only firestore:rules,firestore:indexes
```

### Índice compuesto requerido

La consulta `published == true` + `orderBy createdAt` necesita un índice. Está definido en `firestore.indexes.json`. Firebase Console te mostrará un enlace para crearlo si falta.

### Cuenta de servicio (obligatoria con reglas estrictas)

1. Firebase Console → ⚙️ Configuración → **Cuentas de servicio**
2. **Generar nueva clave privada** (descarga JSON)
3. En `.env.local`, añade el JSON en una sola línea:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"lineasyletras-51eb0",...}
```

En **Vercel**, pega el mismo JSON como variable de entorno.

Sin esta clave, el servidor usa el SDK web como respaldo y **necesitarás reglas abiertas** (solo para desarrollo).

### Reglas temporales (solo desarrollo local)

Si aún no tienes cuenta de servicio, usa esto **solo mientras desarrollas**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stories/{storyId} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **No uses reglas abiertas en producción.** Cualquiera con tu `apiKey` podría leer borradores o borrar historias.

### Pasos iniciales

1. Crea el proyecto y activa **Firestore Database**
2. Despliega `firestore.rules` e índices
3. Configura `FIREBASE_SERVICE_ACCOUNT_KEY` en `.env.local`
4. Reinicia `npm run dev`

## Panel de administración

Accede en **[http://localhost:3000/admin](http://localhost:3000/admin)** (o `/admin` en producción).

### Configuración

1. Añade en `.env.local`:
   ```
   ADMIN_PASSWORD=tu_contraseña
   ADMIN_SECRET=una_clave_larga_aleatoria
   ```
2. Sin `ADMIN_PASSWORD`, la contraseña por defecto en desarrollo es `admin123`.

### Qué puedes hacer

- **Crear y editar historias** con título, autor, categoría, etiquetas, resumen y contenido
- **Publicar o guardar como borrador** — solo lo publicado aparece en el inicio
- **Importar historias iniciales** a Firebase (botón en la lista, solo si está vacío)
- **Ver todas las etiquetas** en uso y enlazar a su página pública
- **Eliminar** contenido

### Flujo recomendado

1. Configura Firebase en `.env.local`
2. Entra en `/admin` e inicia sesión
3. Pulsa **Importar historias iniciales** (o crea contenido nuevo)
4. Marca **Publicar en el sitio** al crear/editar
5. El inicio y las páginas `/etiqueta/[tag]` mostrarán el contenido publicado

## Despliegue en Vercel

1. Sube el repositorio a GitHub
2. Importa el proyecto en [vercel.com/new](https://vercel.com/new)
3. Añade las variables de entorno en **Settings → Environment Variables**
4. Despliega

Vercel detecta Next.js automáticamente.

## Licencia

Proyecto personal — Líneas y Letras.
