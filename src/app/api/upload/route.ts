import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { extractText } from "@/lib/parsing"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten archivos PDF o DOCX" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar los 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.type === "application/pdf" ? ".pdf" : ".docx"
    const fileName = `${uuidv4()}${ext}`

    // Siempre guardamos en /tmp (funciona en Vercel y en local)
    // El archivo solo necesita existir durante esta misma función para extraer el texto
    const tmpDir = "/tmp/uploads"
    await mkdir(tmpDir, { recursive: true })
    tmpPath = join(tmpDir, fileName)
    await writeFile(tmpPath, buffer)

    // Extraemos el texto del CV dentro de esta misma invocación
    // (antes de que /tmp desaparezca en otra Lambda)
    const rawText = await extractText(tmpPath, file.type)

    // Limpieza del archivo temporal
    try { await unlink(tmpPath) } catch { /* ignorar */ }
    tmpPath = null

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      rawText, // ← texto ya extraído, listo para parsear
    })
  } catch (error) {
    // Intentar limpiar el archivo temporal si hubo error
    if (tmpPath) { try { await unlink(tmpPath) } catch { /* ignorar */ } }
    console.error("Error en upload:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}