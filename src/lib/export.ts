// src/lib/export.ts  (archivo nuevo)
// Exportación a CSV con papaparse y a PDF con jspdf + jspdf-autotable
// Instalar si no están: npm install papaparse jspdf jspdf-autotable
// npm install --save-dev @types/papaparse

import Papa from 'papaparse'

// ─── Tipos mínimos ────────────────────────────────────────────────────────────
interface Skill { name: string; category: string; level: number }
interface Experience { company: string; position: string; startDate: string; endDate?: string | null }
interface CandidateExport {
  id: string
  name: string | null
  email: string | null
  phone?: string | null
  location?: string | null
  seniority?: string | null
  status: string
  technicalScore?: number | null
  generalScore?: number | null
  summary?: string | null
  skills?: Skill[]
  experiences?: Experience[]
  createdAt: string
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
export function exportCandidatesToCSV(candidates: CandidateExport[], filename = 'candidatos.csv') {
  const rows = candidates.map(c => ({
    Nombre:           c.name ?? '',
    Email:            c.email ?? '',
    Teléfono:         c.phone ?? '',
    Ubicación:        c.location ?? '',
    Seniority:        c.seniority ?? '',
    Estado:           c.status,
    'Score Técnico':  c.technicalScore ?? '',
    'Score General':  c.generalScore ?? '',
    Skills:           (c.skills ?? []).map(s => s.name).join(', '),
    Resumen:          c.summary ?? '',
    'Fecha registro': new Date(c.createdAt).toLocaleDateString('es-ES'),
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  const BOM = '\uFEFF' // UTF-8 BOM para Excel en Windows
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

// ─── PDF (un candidato) ───────────────────────────────────────────────────────
export async function exportCandidateToPDF(candidate: CandidateExport) {
  // Importación dinámica para evitar SSR
  // @ts-ignore: Module may be missing type declarations in this environment
  const { default: jsPDF } = await import('jspdf')
  // @ts-ignore: Module may be missing type declarations in this environment
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const MARGIN = 18
  const PAGE_W = 210
  const CONTENT_W = PAGE_W - MARGIN * 2
  let y = MARGIN

  // ── Colores ──────────────────────────────────────────────────────────────────
  const INDIGO: [number, number, number] = [79, 70, 229]
  const SLATE_DARK: [number, number, number] = [30, 41, 59]
  const SLATE_MID: [number, number, number] = [100, 116, 139]
  const WHITE: [number, number, number] = [255, 255, 255]

  // ── Header band ───────────────────────────────────────────────────────────────
  doc.setFillColor(...INDIGO)
  doc.rect(0, 0, PAGE_W, 42, 'F')

  // Logo placeholder
  doc.setFillColor(...WHITE)
  doc.roundedRect(MARGIN, 10, 22, 22, 3, 3, 'F')
  doc.setTextColor(...INDIGO)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('IH', MARGIN + 7, 24)

  // Nombre
  doc.setTextColor(...WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(candidate.name ?? 'Sin nombre', MARGIN + 28, 20)

  // Subtítulo: email + seniority
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const sub = [candidate.email, candidate.seniority, candidate.status]
    .filter(Boolean).join('  ·  ')
  doc.text(sub, MARGIN + 28, 28)

  // Fecha de generación
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, MARGIN + 28, 35)

  y = 52

  // ── Scores ────────────────────────────────────────────────────────────────────
  if (candidate.technicalScore != null || candidate.generalScore != null) {
    doc.setFillColor(248, 250, 252)
    doc.rect(MARGIN, y, CONTENT_W, 20, 'F')

    const scores = [
      { label: 'Score Técnico', value: candidate.technicalScore },
      { label: 'Score General', value: candidate.generalScore },
    ]

    scores.forEach((s, i) => {
      const x = MARGIN + i * (CONTENT_W / 2) + 8
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...SLATE_MID)
      doc.text(s.label, x, y + 7)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...SLATE_DARK)
      doc.text(`${s.value ?? '—'}%`, x, y + 16)
    })
    y += 26
  }

  // ── Helper: sección título ────────────────────────────────────────────────────
  function sectionTitle(title: string) {
    if (y > 260) { doc.addPage(); y = MARGIN }
    doc.setDrawColor(...INDIGO)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y)
    y += 5
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INDIGO)
    doc.text(title.toUpperCase(), MARGIN, y)
    y += 6
  }

  // ── Resumen ───────────────────────────────────────────────────────────────────
  if (candidate.summary) {
    sectionTitle('Resumen IA')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE_DARK)
    const lines = doc.splitTextToSize(candidate.summary, CONTENT_W)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 4
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (candidate.skills && candidate.skills.length > 0) {
    sectionTitle('Skills')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Habilidad', 'Categoría', 'Nivel']],
      body: candidate.skills.map(s => [
        s.name,
        s.category,
        '●'.repeat(s.level) + '○'.repeat(5 - s.level),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ── Experiencia ───────────────────────────────────────────────────────────────
  if (candidate.experiences && candidate.experiences.length > 0) {
    sectionTitle('Experiencia')
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Empresa', 'Cargo', 'Período']],
      body: candidate.experiences.map(e => [
        e.company,
        e.position,
        `${e.startDate} — ${e.endDate ?? 'Actual'}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: INDIGO, textColor: WHITE, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...SLATE_MID)
    doc.text(
      `InsightHire · Informe generado el ${new Date().toLocaleDateString('es-ES')} · Pág ${i}/${pageCount}`,
      PAGE_W / 2,
      295,
      { align: 'center' }
    )
  }

  doc.save(`${(candidate.name ?? 'candidato').replace(/\s+/g, '_')}_InsightHire.pdf`)
}

// ─── Utilidad ─────────────────────────────────────────────────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}