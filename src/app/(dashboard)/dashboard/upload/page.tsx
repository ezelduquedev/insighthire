"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"

type UploadState = "idle" | "dragging" | "uploading" | "parsing" | "success" | "error"

export default function UploadPage() {
  const router = useRouter()
  const [state, setState] = useState<UploadState>("idle")
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<{ name: string; size: string } | null>(null)

  const processFile = async (file: File) => {
    setState("uploading"); setError("")
    const fd = new FormData(); fd.append("file", file)
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
    if (!uploadRes.ok) { const e = await uploadRes.json(); throw new Error(e.error || "Error al subir") }
    const uploadData = await uploadRes.json()
    setState("parsing")
    const candidateRes = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: uploadData.fileUrl, fileName: uploadData.fileName, fileType: uploadData.fileType, fileSize: uploadData.fileSize }),
    })
    if (!candidateRes.ok) throw new Error("Error al procesar el candidato")
    const candidateData = await candidateRes.json()
    setState("success")
    setTimeout(() => router.push(`/dashboard/candidates/${candidateData.candidate.id}`), 1200)
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return
    const file = accepted[0]
    setPreview({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` })
    try { await processFile(file) } catch (e: any) { setState("error"); setError(e.message || "Error desconocido") }
  }, []) // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 5 * 1024 * 1024, multiple: false,
  })

  const reset = () => { setState("idle"); setError(""); setPreview(null) }

  const stateContent: Record<string, { icon: React.ReactNode; title: string; subtitle: string }> = {
    idle:      { icon: <Upload style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-accent)" }} />, title: "Arrastra tu CV aquí", subtitle: "o haz clic para seleccionar un archivo" },
    dragging:  { icon: <Upload style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-accent)" }} />, title: "Suelta el archivo", subtitle: "Listo para procesar" },
    uploading: { icon: <Loader2 style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-accent)", animation: "spin 1s linear infinite" }} />, title: "Subiendo archivo…", subtitle: preview?.name ?? "" },
    parsing:   { icon: <Loader2 style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-accent)", animation: "spin 1s linear infinite" }} />, title: "Analizando CV con IA…", subtitle: "Extrayendo experiencia, skills y datos de contacto" },
    success:   { icon: <CheckCircle style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-success)" }} />, title: "¡CV procesado!", subtitle: "Redirigiendo al perfil del candidato…" },
    error:     { icon: <XCircle style={{ width: "2.5rem", height: "2.5rem", color: "var(--ih-danger)" }} />, title: "Error al procesar", subtitle: error },
  }

  const current = stateContent[isDragActive ? "dragging" : state]

  return (
    <div className="space-y-5" style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <div>
        <h1 className="ih-page-title">Subir CV</h1>
        <p className="ih-page-subtitle">Sube un CV en PDF o DOCX para añadir un candidato</p>
      </div>

      <div className="ih-card">
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--ih-text-primary)" }}>Cargar archivo</p>

        <div
          {...getRootProps()}
          className={`ih-dropzone ${isDragActive ? "dragging" : ""}`}
          style={state === "success"
            ? { borderColor: "var(--ih-success)", background: "#ECFDF5" }
            : state === "error"
            ? { borderColor: "var(--ih-danger)", background: "#FEF2F2" }
            : {}
          }
        >
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, scale: .93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: .93 }}
              transition={{ duration: .18 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
            >
              {current.icon}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 600, color: "var(--ih-text-primary)", marginBottom: ".25rem" }}>{current.title}</p>
                <p style={{ fontSize: ".875rem", color: "var(--ih-text-muted)" }}>{current.subtitle}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {state === "error" && (
          <button onClick={reset} className="ih-btn ih-btn-ghost cursor-pointer" style={{ width: "100%", marginTop: "1rem", justifyContent: "center" }}>
            Intentar de nuevo
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1rem", color: "var(--ih-text-muted)", fontSize: ".8125rem" }}>
          <FileText style={{ width: ".875rem", height: ".875rem" }} />
          Formatos aceptados: PDF, DOCX · Tamaño máximo: 5 MB
        </div>
      </div>
    </div>
  )
}