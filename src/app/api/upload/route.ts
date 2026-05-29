import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

// En Vercel las funciones serverless solo pueden escribir en /tmp
// En desarrollo usamos public/uploads para poder servir los ficheros estáticamente
const IS_VERCEL = process.env.VERCEL === "1"

export async function POST(req: NextRequest) {
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

    let fileUrl: string

    if (IS_VERCEL) {
      // En Vercel: guardar en /tmp (único directorio escribible)
      const tmpDir = "/tmp/uploads"
      await mkdir(tmpDir, { recursive: true })
      const filePath = join(tmpDir, fileName)
      await writeFile(filePath, buffer)
      fileUrl = `/tmp/uploads/${fileName}`
    } else {
      // En desarrollo: guardar en public/uploads para acceso estático
      const uploadDir = join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)
      fileUrl = `/uploads/${fileName}`
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl,
      fileType: file.type,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("Error en upload:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}