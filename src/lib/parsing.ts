// src/lib/parsing.ts
import { groqClient, MODEL } from "./openai"

// ─── Extracción de texto desde Buffer (sin disco) ────────────────────────────
// Esta es la función principal. Recibe el contenido del archivo ya en memoria.
export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  if (fileType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require("pdf-parse/lib/pdf-parse.js")
    const data = await pdf(buffer)
    return data.text || ""
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
}

// Alias para compatibilidad (no se usa en Vercel, solo en análisis posterior si hubiera fileUrl)
export async function extractText(fileUrl: string, fileType: string): Promise<string> {
  const { readFile } = await import("fs/promises")
  const { join } = await import("path")
  const filePath = fileUrl.startsWith("/tmp") ? fileUrl : join(process.cwd(), "public", fileUrl)
  const buffer = await readFile(filePath)
  return extractTextFromBuffer(buffer, fileType)
}

// ─── Tipos de retorno ────────────────────────────────────────────────────────

export interface ParsedExperience {
  company: string
  position: string
  startDate: string
  endDate: string | null
  description: string
  technologies: string[]
}

export interface ParsedEducation {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string | null
}

export interface ParsedResume {
  name: string
  email: string
  phone: string
  linkedin: string
  skills: string[]
  seniority: string
  experiences: ParsedExperience[]
  educations: ParsedEducation[]
}

// ─── Keywords helper ─────────────────────────────────────────────────────────

const SECTION_HEADERS = {
  experience: /^(experiencia|experience|trabajo|work|empleo|employment|carrera|career|professional|profesional|historial laboral|trayectoria)/i,
  education: /^(educaci[oó]n|education|formaci[oó]n|formacion|estudios|academic|academ|titulaci[oó]n|titulacion|universidad|university|escuela|school)/i,
  skills: /^(habilidades|skills|competencias|competencies|tecnolog[ií]as|technologies|conocimientos|tools|herramientas)/i,
  languages: /^(idiomas|languages|lenguas)/i,
  about: /^(sobre m[ií]|acerca de|about|perfil|profile|summary|resumen|objetivo|objective)/i,
}

const YEAR_RE = /\b(19|20)\d{2}\b/g
const DATE_RANGE_RE = /((enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.,]*)?((19|20)\d{2})\s*[-–—/]\s*((enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.,]*)?(((19|20)\d{2})|(actualidad|actual|presente|present|hoy|today|current|now))/gi

const KNOWN_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
  "React", "Next.js", "Vue", "Angular", "Svelte", "Node.js", "Express", "NestJS", "FastAPI",
  "Django", "Flask", "Spring", "Laravel", ".NET", "ASP.NET",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "Supabase",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Git", "GitHub", "GitLab", "CI/CD",
  "REST", "GraphQL", "tRPC", "Prisma", "Sequelize", "Drizzle",
  "Tailwind", "CSS", "HTML", "Sass", "SCSS", "Bootstrap", "Figma", "Storybook",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
  "React Native", "Flutter", "Ionic", "Electron",
  "Linux", "Bash", "PowerShell", "Nginx", "Apache",
  "Jest", "Cypress", "Playwright", "Vitest", "Testing Library",
]

// ─── Extracción de nombre ─────────────────────────────────────────────────────

function extractName(lines: string[]): string {
  // Palabras que indican que NO es un nombre
  const NOT_NAME = /^(curriculum|cv|resume|perfil|contact|email|tel[eé]fono|phone|linkedin|github|gitlab|nombre|name:|address|direcci[oó]n|www\.|http|@|objetivo|summary|sobre|acerca|experiencia|experience|educaci[oó]n|education|formaci[oó]n|habilidades|skills|idiomas|languages|references|referencias)/i

  for (const line of lines.slice(0, 15)) {
    const clean = line.trim()
    if (!clean || clean.length < 3 || clean.length > 70) continue
    if (clean.includes("@")) continue
    if (clean.match(/\d{4}/)) continue         // tiene año
    if (clean.match(/^\+?\d[\d\s.\-()]{7,}/)) continue  // teléfono
    if (NOT_NAME.test(clean)) continue
    if (clean.match(/^[-_=*•·|]+/)) continue   // separador decorativo

    const words = clean.split(/\s+/).filter(Boolean)
    if (words.length < 1 || words.length > 5) continue

    // Al menos el 60% de las palabras empiezan por mayúscula
    const capitalized = words.filter(w => /^[A-ZÁÉÍÓÚÜÑÀÂÄÈÊËÎÏÔÙÛÜ]/.test(w))
    if (capitalized.length >= Math.ceil(words.length * 0.6)) {
      return clean
    }
  }

  // Fallback: primera línea no vacía que no contenga símbolos raros
  return lines.find(l =>
    l.trim().length > 2 &&
    !l.includes("@") &&
    !l.match(/^\+?\d[\d\s.\-()]{7,}/)
  )?.trim() || ""
}

// ─── Detección de sección activa ─────────────────────────────────────────────

type Section = "experience" | "education" | "skills" | "languages" | "about" | "other"

function detectSection(line: string): Section | null {
  const clean = line.trim().replace(/[:.\-_*•·]+$/, "")
  for (const [key, re] of Object.entries(SECTION_HEADERS)) {
    if (re.test(clean)) return key as Section
  }
  return null
}

// ─── Extracción de experiencias ───────────────────────────────────────────────

function extractExperiences(lines: string[], rawText: string): ParsedExperience[] {
  const experiences: ParsedExperience[] = []

  // Busca bloques de fecha (rango) — señal de entrada en una experiencia
  const dateRangeMatches = [...rawText.matchAll(DATE_RANGE_RE)]

  if (dateRangeMatches.length === 0) {
    // Sin rangos de fecha detectados, intenta por sección
    return extractExperiencesBySection(lines)
  }

  // Estrategia: encuentra líneas con rango de fechas y reconstruye el bloque
  const lineIndexMap = buildLineIndexMap(lines)

  for (const match of dateRangeMatches) {
    const dateStr = match[0]
    const startYear = (dateStr.match(/(19|20)\d{2}/) || [])[0] || ""
    const endRaw = dateStr.split(/[-–—]/)[1]?.trim() || ""
    const endYear = (endRaw.match(/(19|20)\d{2}/) || [])[0] || null
    const isCurrentJob = /actualidad|actual|presente|present|hoy|today|current|now/i.test(endRaw)

    // Busca la línea más cercana a esta fecha en el texto
    const lineIdx = findLineWithText(lines, dateStr.slice(0, 10), lineIndexMap)
    if (lineIdx === -1) continue

    // Contexto: 3 líneas antes y 5 después de la fecha
    const context = lines.slice(Math.max(0, lineIdx - 3), lineIdx + 6)
    const { position, company } = extractPositionCompany(context)
    const technologies = extractTechnologiesFromText(context.join(" "))
    const description = context.filter(l =>
      l.trim() &&
      !l.includes(dateStr.slice(0, 8)) &&
      l.trim() !== position &&
      l.trim() !== company
    ).join(". ").slice(0, 400)

    if (company || position) {
      experiences.push({
        company: company || "Empresa no especificada",
        position: position || "Puesto no especificado",
        startDate: startYear ? `${startYear}-01-01` : "2020-01-01",
        endDate: isCurrentJob ? null : (endYear ? `${endYear}-01-01` : null),
        description: description.trim(),
        technologies,
      })
    }
  }

  // Deduplicar por empresa+posición
  const seen = new Set<string>()
  return experiences.filter(exp => {
    const key = `${exp.company}|${exp.position}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractExperiencesBySection(lines: string[]): ParsedExperience[] {
  const experiences: ParsedExperience[] = []
  let inExperience = false
  let block: string[] = []

  for (const line of lines) {
    const section = detectSection(line)
    if (section === "experience") {
      inExperience = true
      block = []
      continue
    }
    if (section && section !== ("experience" as any)) {
      if (inExperience && block.length > 2) {
        const exp = parseExperienceBlock(block)
        if (exp) experiences.push(exp)
      }
      inExperience = false
      block = []
      continue
    }
    if (inExperience) block.push(line)
  }

  if (inExperience && block.length > 2) {
    const exp = parseExperienceBlock(block)
    if (exp) experiences.push(exp)
  }

  return experiences
}

function parseExperienceBlock(lines: string[]): ParsedExperience | null {
  const nonEmpty = lines.filter(l => l.trim())
  if (nonEmpty.length < 2) return null

  const { position, company } = extractPositionCompany(nonEmpty)
  const years = nonEmpty.join(" ").match(YEAR_RE) || []
  const technologies = extractTechnologiesFromText(nonEmpty.join(" "))

  return {
    company: company || "Empresa no especificada",
    position: position || nonEmpty[0]?.trim() || "Puesto no especificado",
    startDate: years[0] ? `${years[0]}-01-01` : "2020-01-01",
    endDate: years[1] ? `${years[1]}-01-01` : null,
    description: nonEmpty.slice(2).join(". ").slice(0, 400),
    technologies,
  }
}

function extractPositionCompany(lines: string[]): { position: string; company: string } {
  // Heurística: la línea más corta y con más mayúsculas suele ser el cargo/empresa
  const candidates = lines
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 80 && !l.match(DATE_RANGE_RE))

  let position = ""
  let company = ""

  // Patrones comunes: "Cargo en/at/@ Empresa", "Empresa — Cargo"
  for (const line of candidates) {
    const atMatch = line.match(/^(.+?)\s+(en|at|@|–|—|-)\s+(.+)$/i)
    if (atMatch) {
      position = atMatch[1].trim()
      company = atMatch[3].trim()
      return { position, company }
    }
  }

  // Sin patrón claro: primera línea = posición, segunda = empresa
  position = candidates[0] || ""
  company = candidates[1] || ""
  return { position, company }
}

function extractTechnologiesFromText(text: string): string[] {
  return KNOWN_SKILLS.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.+]/g, "\\$&")}\\b`, "i").test(text)
  )
}

// ─── Extracción de educación ─────────────────────────────────────────────────

function extractEducations(lines: string[]): ParsedEducation[] {
  const educations: ParsedEducation[] = []
  let inEducation = false
  let block: string[] = []

  for (const line of lines) {
    const section = detectSection(line)
    if (section === "education") {
      inEducation = true
      block = []
      continue
    }
    if (section && section !== ("education" as any)) {
      if (inEducation && block.length >= 1) {
        const edu = parseEducationBlock(block)
        if (edu) educations.push(edu)
      }
      inEducation = false
      block = []
      continue
    }
    if (inEducation) block.push(line)
  }

  if (inEducation && block.length >= 1) {
    const edu = parseEducationBlock(block)
    if (edu) educations.push(edu)
  }

  // Fallback: busca líneas con palabras clave de institución
  if (educations.length === 0) {
    const uniKeywords = /universidad|university|college|instituto|escuela|facultad|polytechnic|politécnica|grado|máster|master|bachelor|licenciatura|ingeniería|ingenieria|formación profesional|fp\b|ciclo formativo/i
    const eduLines = lines.filter(l => uniKeywords.test(l))
    for (const line of eduLines) {
      const years = line.match(YEAR_RE) || []
      educations.push({
        institution: line.trim().slice(0, 100),
        degree: "Titulación",
        field: "",
        startDate: years[0] ? `${years[0]}-09-01` : "2015-09-01",
        endDate: years[1] ? `${years[1]}-06-30` : null,
      })
    }
  }

  return educations
}

function parseEducationBlock(lines: string[]): ParsedEducation | null {
  const nonEmpty = lines.map(l => l.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return null

  const years = nonEmpty.join(" ").match(YEAR_RE) || []
  const degreeKeywords = /grado|máster|master|bachelor|licenciatura|ingeniería|ingenieria|doctorado|phd|técnico|tecnico|formación|fp|ciclo/i

  let degree = nonEmpty.find(l => degreeKeywords.test(l)) || nonEmpty[0] || "Titulación"
  let institution = nonEmpty.find(l => /universidad|university|college|instituto|escuela/i.test(l)) || nonEmpty[1] || nonEmpty[0] || ""
  if (institution === degree) institution = nonEmpty[1] || nonEmpty[0] || ""

  // Si degree tiene más de 80 chars, trunca y úsala como field
  const field = degree.length > 80 ? "" : degree

  return {
    institution: institution.slice(0, 150),
    degree: degree.slice(0, 100),
    field: field,
    startDate: years[0] ? `${years[0]}-09-01` : "2015-09-01",
    endDate: years[1] ? `${years[1]}-06-30` : null,
  }
}

// ─── Helpers de índice de líneas ─────────────────────────────────────────────

function buildLineIndexMap(lines: string[]): Map<string, number> {
  const map = new Map<string, number>()
  lines.forEach((l, i) => map.set(l.trim().slice(0, 30), i))
  return map
}

function findLineWithText(lines: string[], needle: string, _map: Map<string, number>): number {
  const n = needle.toLowerCase().trim().slice(0, 10)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(n)) return i
  }
  return -1
}

// ─── Función principal ────────────────────────────────────────────────────────

export function parseResume(rawText: string): ParsedResume {
  const lines = rawText
    .split(/\n|\r/)
    .map(l => l.replace(/\s+/g, " ").trim())
    .filter(l => l.length > 0)

  // ── Email ───────────────────────────────────────────────────────────────────
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : ""

  // ── Teléfono ────────────────────────────────────────────────────────────────
  const phoneMatch = rawText.match(/(\+34|0034)?[\s.-]?[6789]\d{8}|(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0].trim() : ""

  // ── LinkedIn ────────────────────────────────────────────────────────────────
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/)
  const linkedin = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : ""

  // ── Nombre ──────────────────────────────────────────────────────────────────
  const name = extractName(lines)

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skills = KNOWN_SKILLS.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.+]/g, "\\$&")}\\b`, "i").test(rawText)
  )

  // ── Seniority ───────────────────────────────────────────────────────────────
  const textLower = rawText.toLowerCase()
  let seniority = "JUNIOR"
  if (/\b(senior|lead|principal|staff)\b/i.test(textLower)) {
    seniority = "SENIOR"
  } else if (/\b(mid|semi-senior|ssrr|pleno)\b/i.test(textLower)) {
    seniority = "MID"
  }

  // ── Experiencias ─────────────────────────────────────────────────────────────
  const experiences = extractExperiences(lines, rawText)

  // ── Educación ────────────────────────────────────────────────────────────────
  const educations = extractEducations(lines)

  return { name, email, phone, linkedin, skills, seniority, experiences, educations }
}

export async function parseResumeWithAI(rawText: string): Promise<ParsedResume> {
  try {
    const prompt = `Eres un sistema experto en extracción de datos de currículums (CV). Analiza el texto del CV y devuelve ÚNICAMENTE un objeto JSON válido. No incluyas texto adicional, markdown, ni explicaciones.

REGLAS CRÍTICAS DE SEPARACIÓN:
- "experiences" → SOLO trabajos remunerados (empresas, autónomo, freelance, prácticas laborales). Incluye CUALQUIER trabajo aunque no sea tecnológico (técnico de sonido, camarero, conductor, etc.).
- "educations" → SOLO formación académica (universidades, institutos, FP, cursos acreditados, bootcamps, certificaciones).
- NUNCA mezcles trabajos con estudios. Si una entrada menciona una empresa o empleador, va en "experiences". Si menciona una escuela, instituto, universidad o curso, va en "educations".

Para EXPERIENCIA LABORAL (experiences):
- "company": nombre de la empresa/empleador. Si trabaja por cuenta propia o freelance, escribe "Autónomo" o "Freelance".
- "position": cargo o puesto exacto (puede ser "Técnico de Sonido", "Desarrollador Web", "Camarero", etc.).
- "startDate": formato YYYY-01-01. Si solo hay año, usa YYYY-01-01.
- "endDate": formato YYYY-01-01 o null si es trabajo actual.
- "description": descripción de responsabilidades y logros. Si no hay descripción, usa "".
- "technologies": array de tecnologías/herramientas usadas. Si no hay, usa [].

Para FORMACIÓN ACADÉMICA (educations):
- "institution": nombre del centro educativo.
- "degree": título obtenido o en curso (Grado, Máster, FP, Técnico Superior, Bootcamp, Certificación, etc.).
- "field": especialidad o rama de estudio.
- "startDate": formato YYYY-09-01 o YYYY-01-01.
- "endDate": formato YYYY-06-30 o YYYY-01-01 o null si sigue estudiando.

Para SKILLS:
- Lista solo habilidades técnicas y herramientas concretas (lenguajes, frameworks, software, etc.).
- No incluyas habilidades blandas (comunicación, trabajo en equipo, etc.).

Para SENIORITY:
- Determina la seniority basándote ÚNICAMENTE en la experiencia relevante en desarrollo de software, tecnología o IT. NO consideres experiencia laboral en áreas completamente no relacionadas (como técnico de sonido, hostelería, conducción, etc.) para el cálculo de años de seniority en tecnología.
- "JUNIOR": menos de 2 años de experiencia relevante en desarrollo/tecnología.
- "MID": entre 2 y 5 años de experiencia relevante en desarrollo/tecnología.
- "SENIOR": más de 5 años de experiencia relevante en desarrollo/tecnología o rol de liderazgo técnico.

Texto del CV:
"""
${rawText}
"""

Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "linkedin": "string",
  "skills": ["string"],
  "seniority": "JUNIOR|MID|SENIOR",
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "startDate": "YYYY-01-01",
      "endDate": "YYYY-01-01 o null",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "educations": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY-01-01",
      "endDate": "YYYY-01-01 o null"
    }
  ]
}`

    const response = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Eres un parser de CVs altamente preciso que responde únicamente con JSON estructurado.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("La IA no devolvió contenido")
    const parsed = JSON.parse(content) as ParsedResume

    return {
      name: parsed.name || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      linkedin: parsed.linkedin || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      seniority: ["JUNIOR", "MID", "SENIOR", "LEAD"].includes(parsed.seniority) ? parsed.seniority : "JUNIOR",
      experiences: (Array.isArray(parsed.experiences) ? parsed.experiences : []).map(exp => ({
        company: exp.company || "Empresa no especificada",
        position: exp.position || "Puesto no especificado",
        startDate: exp.startDate || "2020-01-01",
        endDate: exp.endDate || null,
        description: exp.description || "",
        technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
      })),
      educations: (Array.isArray(parsed.educations) ? parsed.educations : []).map(edu => ({
        institution: edu.institution || "Institución no especificada",
        degree: edu.degree || "Título no especificado",
        field: edu.field || "",
        startDate: edu.startDate || "2015-01-01",
        endDate: edu.endDate || null,
      })),
    }
  } catch (error) {
    console.error("Error parsing resume with AI, falling back to regex parser:", error)
    return parseResume(rawText)
  }
}