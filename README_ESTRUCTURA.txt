═══════════════════════════════════════════════════════════════════
   INSIGHTHIRE - DIA 1: ESTRUCTURA DE ARCHIVOS
═══════════════════════════════════════════════════════════════════

ESTRUCTURA DE CARPETAS:
───────────────────────────────────────────────────────────────────
insighthire/
│
├── .env                          ← Variables de entorno (SQLite)
├── auth.ts                        ← Configuracion NextAuth v5
├── middleware.ts                  ← Proteccion de rutas (JWT)
├── package.json                   ← + seccion "prisma" con seed
│
├── types/
│   └── next-auth.d.ts             ← Tipos extendidos de NextAuth
│
├── lib/
│   ├── utils.ts                   ← Utilidades shadcn/ui (ya existe)
│   └── prisma.ts                  ← Cliente Prisma singleton
│
├── prisma/
│   ├── schema.prisma              ← Schema SQLite (SIN enums)
│   ├── seed.ts                    ← 2 usuarios de prueba
│   └── dev.db                     ← Base de datos SQLite (generada)
│
├── app/
│   ├── page.tsx                   ← Landing page (publica)
│   │
│   ├── login/
│   │   └── page.tsx               ← Pagina de login
│   │
│   ├── register/
│   │   └── page.tsx               ← Pagina de registro
│   │
│   ├── (dashboard)/               ← Grupo de rutas protegidas
│   │   ├── layout.tsx             ← Layout con sidebar + header
│   │   └── page.tsx               ← Dashboard principal
│   │
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts       ← API route de autenticacion
│
├── components/
│   ├── ui/                        ← Componentes shadcn/ui
│   │   ├── button.tsx             ← (generar: npx shadcn add button)
│   │   ├── input.tsx              ← (generar: npx shadcn add input)
│   │   ├── label.tsx              ← (generar: npx shadcn add label)
│   │   └── card.tsx               ← (generar: npx shadcn add card)
│   │
│   ├── dashboard-sidebar.tsx      ← Sidebar responsive
│   └── dashboard-header.tsx       ← Header superior
│
└── public/                        ← Archivos estaticos

───────────────────────────────────────────────────────────────────
INSTRUCCIONES DE INSTALACION:
───────────────────────────────────────────────────────────────────

1. Crear proyecto Next.js:
   npx create-next-app@latest insighthire --typescript --tailwind --eslint --app --src-dir --use-npm

2. Inicializar shadcn/ui:
   cd insighthire
   npx shadcn@latest init -y -d

3. Instalar dependencias:
   npm install zustand @tanstack/react-query framer-motion lucide-react react-dropzone recharts
   npm install prisma@5.22.0 @prisma/client@5.22.0
   npm install next-auth@beta bcryptjs @auth/prisma-adapter
   npm install -D tsx @types/bcryptjs
   npx prisma init

4. Generar componentes shadcn necesarios:
   npx shadcn@latest add button input label card

5. Copiar TODOS los archivos de los 4 ZIPs a tu proyecto
   (manteniendo la estructura de carpetas)

6. Configurar seed en package.json:
   Anadir al final:
   ,
   "prisma": {
     "seed": "tsx prisma/seed.ts"
   }

7. Sincronizar base de datos:
   npx prisma db push
   npx prisma db seed

8. Iniciar servidor:
   npm run dev

───────────────────────────────────────────────────────────────────
USUARIOS DE PRUEBA:
───────────────────────────────────────────────────────────────────

  Admin:     admin@insighthire.com     / password123
  Recruiter: recruiter@insighthire.com / password123

───────────────────────────────────────────────────────────────────
RUTAS DE LA APLICACION:
───────────────────────────────────────────────────────────────────

  /              → Landing page (publica)
  /login         → Login (publica)
  /register      → Registro (publica)
  /dashboard     → Dashboard (protegida, requiere login)

───────────────────────────────────────────────────────────────────
   FIN DEL DOCUMENTO
───────────────────────────────────────────────────────────────────