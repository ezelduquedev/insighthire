import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { extractTextFromBuffer } from "@/lib/parsing"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

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

    // Leer el archivo en memoria como Buffer — sin escribir nada en disco
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extraer texto directamente del buffer (funciona en Vercel y en local)
    const rawText = await extractTextFromBuffer(buffer, file.type)

    const ext = file.type === "application/pdf" ? ".pdf" : ".docx"
    const fileName = `${uuidv4()}${ext}`

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: null,         // ya no guardamos en disco
      rawText,               // texto extraído listo para parsear con IA
    })
  } catch (error) {
    console.error("Error en upload:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}