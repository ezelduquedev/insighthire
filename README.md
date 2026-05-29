# InsightHire — ATS con Inteligencia Artificial

> Plataforma SaaS de análisis inteligente de CVs con IA generativa, embeddings vectoriales y chat RAG. Proyecto de prácticas DAM — Ucademy 2026.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| UI | TailwindCSS v4 + shadcn/ui + Framer Motion |
| Base de datos | PostgreSQL (Supabase) + pgvector |
| ORM | Prisma v5 |
| Autenticación | NextAuth.js v5 (Auth.js) |
| IA Generativa | Groq API (llama-3.1-70b) + OpenAI (embeddings) |
| Upload/Parsing | pdf-parse + mammoth |
| Exportación | jspdf + jspdf-autotable + papaparse |
| Deploy | Vercel (frontend) + Supabase (PostgreSQL) |

---

## Funcionalidades

- **Upload drag & drop** — PDF y DOCX procesados automáticamente
- **Parsing inteligente** — extrae nombre, email, experiencia, skills, educación
- **Análisis con IA** — scores técnico/general, seniority, fortalezas y debilidades vía Groq
- **Chat RAG** — preguntas en lenguaje natural sobre cualquier candidato con streaming en tiempo real
- **Embeddings vectoriales** — búsqueda semántica por cosine similarity con pgvector
- **Matching candidato-oferta** — algoritmo con skillMatch, experienceMatch, seniorityMatch y ranking visual
- **Pipeline de estados** — NEW → IN_REVIEW → TECHNICAL_INTERVIEW → HIRED / REJECTED
- **Tags automáticos** — clasifica frontend, backend, fullstack, devops, data según skills
- **Favoritos** — toggle con optimistic UI y filtro rápido
- **Notas del reclutador** — guardado automático con debounce de 1s
- **Exportación** — CSV de tabla completa y PDF individual por candidato
- **Dashboard con métricas** — gráficos Recharts, distribución por seniority, score medio

---

## Requisitos Previos

- Node.js 20+
- npm 10+
- Cuenta en [Supabase](https://supabase.com) (PostgreSQL + pgvector)
- API key de [Groq](https://console.groq.com) (gratuita)
- API key de [OpenAI](https://platform.openai.com) (para embeddings)

---

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/insighthire.git
cd insighthire

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (ver sección Variables de Entorno)

# 4. Ejecutar migraciones
npx prisma migrate dev --name init

# 5. Cargar datos de prueba
npx prisma db seed

# 6. Arrancar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variables de Entorno

```env
# Base de datos (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth.js
AUTH_SECRET="secreto-muy-largo-y-seguro"

# IA
GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-proj-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── candidates/     # Tabla paginada con filtros
│   │       ├── candidates/[id] # Detalle con IA + chat RAG
│   │       ├── matches/        # Ranking de matching
│   │       ├── offers/         # CRUD de ofertas laborales
│   │       ├── upload/         # Drag & drop de CVs
│   │       └── settings/       # Perfil de usuario
│   ├── api/
│   │   ├── candidates/         # CRUD + analyze + chat + notes
│   │   ├── offers/             # CRUD + match endpoint
│   │   ├── embeddings/         # Generación y búsqueda vectorial
│   │   └── upload/             # Recepción de archivos
│   ├── login/
│   └── register/
├── components/
│   ├── candidate-detail/       # CandidateDetail.tsx (componente principal)
│   ├── chat/                   # ChatInterface.tsx
│   └── ui/                     # Componentes shadcn/ui
├── lib/
│   ├── analysis.ts             # Análisis IA de candidatos
│   ├── embeddings.ts           # Chunking + vectores + búsqueda
│   ├── export.ts               # CSV y PDF
│   ├── matching.ts             # Algoritmo candidato-oferta
│   ├── parsing.ts              # Extracción de texto PDF/DOCX
│   ├── tags.ts                 # Clasificación automática por área
│   └── rate-limit.ts           # Rate limiting con fallback en memoria
└── types/
    └── index.ts                # Tipos TypeScript globales
```

---

## Deploy en Vercel + Supabase

### Base de datos (Supabase)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. En el dashboard de Supabase: `Database → Extensions → habilitar pgvector`
3. Copiar `DATABASE_URL` y `DIRECT_URL` desde `Project Settings → Database`
4. Ejecutar migraciones: `npx prisma migrate deploy`

### Frontend (Vercel)

1. Importar el repositorio en [vercel.com](https://vercel.com)
2. Añadir las variables de entorno del apartado anterior
3. Deploy automático en cada push a `main`

---

## Flujo RAG

```
Upload CV
  └─ Extracción texto (pdf-parse / mammoth)
       └─ Chunking semántico (1 chunk por experiencia / educación / skills)
            └─ Embeddings OpenAI (text-embedding-3-small, 1536d)
                 └─ Almacenamiento en pgvector
                      └─ Pregunta del usuario → embedding
                           └─ Cosine similarity → top 5 chunks
                                └─ Prompt + contexto → Groq (streaming)
                                     └─ Respuesta contextualizada
```

---

## Decisiones Técnicas

**PostgreSQL + pgvector vs Pinecone** — Una sola base de datos gestiona datos relacionales y búsqueda vectorial. Railway/Supabase ofrecen pgvector preinstalado sin coste adicional.

**RAG vs fine-tuning** — RAG no requiere reentrenar modelos, el contexto del CV siempre está actualizado, y previene alucinaciones al responder solo con información extraída del documento.

**Groq vs OpenAI para chat** — Groq ofrece ~500 tokens/segundo con llama-3.1-70b, lo que hace el streaming prácticamente instantáneo. OpenAI se usa solo para embeddings (text-embedding-3-small).

**Next.js App Router** — Server Components reducen el JavaScript enviado al cliente. Los Route Handlers (route.ts) comparten tipos TypeScript con el frontend, eliminando CORS y simplificando el deploy a un único servicio en Vercel.

---

## Autor

**Ezel Alexander Duque Arias**
Técnico Superior en Desarrollo de Aplicaciones Multiplataforma — Ucademy

---

*InsightHire es un prototipo técnico funcional de prácticas DAM. No incluye multi-tenancy ni pasarela de pagos.*