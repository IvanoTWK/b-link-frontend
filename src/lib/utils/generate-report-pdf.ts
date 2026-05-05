import jsPDF from 'jspdf'

export interface ReportPdfEntry {
  parameterName: string
  unit: string
  measuredValue: number
  refMin: number
  refMax: number
}

export interface ReportPdfData {
  donorFirstName: string
  donorLastName: string
  donorFiscalCode?: string | null
  donorDateOfBirth?: string | null
  donorBiologicalSex?: string | null
  donationTypeName: string
  donatedAt: string
  centerName?: string | null
  centerCity?: string | null
  entries: ReportPdfEntry[]
}

function formatDateIt(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function sexLabel(sex?: string | null): string {
  if (sex === 'MALE') return 'Maschio'
  if (sex === 'FEMALE') return 'Femmina'
  return '—'
}

export function generateReportPdf(data: ReportPdfData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2

  // ── Palette ──────────────────────────────────────────────────────────────────
  const RED: [number, number, number] = [185, 28, 28]
  const LIGHT_GRAY: [number, number, number] = [245, 245, 245]
  const MED_GRAY: [number, number, number] = [120, 120, 120]
  const DARK: [number, number, number] = [30, 30, 30]
  const GREEN: [number, number, number] = [22, 163, 74]
  const ORANGE: [number, number, number] = [234, 88, 12]

  let y = 0

  // ── Header band ───────────────────────────────────────────────────────────────
  doc.setFillColor(...RED)
  doc.rect(0, 0, pageW, 28, 'F')

  // Logo placeholder (quadrato bianco con testo)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 6, 26, 16, 2, 2, 'F')
  doc.setTextColor(...RED)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('B-LINK', margin + 13, 16.5, { align: 'center' })

  // Titolo header
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Referto Medico', margin + 30, 12)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema di gestione donazioni ematiche', margin + 30, 18)

  // Data generazione (angolo destro)
  doc.setFontSize(7.5)
  doc.text(`Generato il ${formatDateIt(new Date().toISOString())}`, pageW - margin, 20, { align: 'right' })

  y = 36

  // ── Sezione: Dati donatore ────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, 'F')
  doc.setTextColor(...RED)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('DATI DONATORE', margin + 3, y + 4.2)
  y += 10

  const donorGrid: Array<[string, string]> = [
    ['Cognome e Nome', `${data.donorLastName} ${data.donorFirstName}`],
    ['Codice Fiscale', data.donorFiscalCode ?? '—'],
    ['Data di nascita', data.donorDateOfBirth ? formatDateIt(data.donorDateOfBirth) : '—'],
    ['Sesso biologico', sexLabel(data.donorBiologicalSex)],
  ]

  const colW = contentW / 2
  donorGrid.forEach(([label, value], i) => {
    const col = i % 2
    const x = margin + col * colW
    if (col === 0 && i > 0) y += 10

    doc.setTextColor(...MED_GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(label.toUpperCase(), x, y)

    doc.setTextColor(...DARK)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(value, x, y + 5)
  })
  y += 14

  // Divider
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Sezione: Dati donazione ───────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, 'F')
  doc.setTextColor(...RED)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('DATI DONAZIONE', margin + 3, y + 4.2)
  y += 10

  const donGrid: Array<[string, string]> = [
    ['Tipo donazione', data.donationTypeName],
    ['Data donazione', formatDateIt(data.donatedAt)],
    ['Centro', data.centerName ?? '—'],
    ['Città', data.centerCity ?? '—'],
  ]

  donGrid.forEach(([label, value], i) => {
    const col = i % 2
    const x = margin + col * colW
    if (col === 0 && i > 0) y += 10

    doc.setTextColor(...MED_GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(label.toUpperCase(), x, y)

    doc.setTextColor(...DARK)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(value, x, y + 5)
  })
  y += 14

  // Divider
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Sezione: Parametri esame ──────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(margin, y, contentW, 6, 1.5, 1.5, 'F')
  doc.setTextColor(...RED)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('PARAMETRI ESAME', margin + 3, y + 4.2)
  y += 10

  // Intestazione tabella
  const cols = {
    param: margin,
    value: margin + contentW * 0.38,
    unit: margin + contentW * 0.54,
    range: margin + contentW * 0.67,
    esito: margin + contentW * 0.88,
  }

  doc.setFillColor(230, 230, 230)
  doc.rect(margin, y, contentW, 7, 'F')

  doc.setTextColor(...MED_GRAY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Parametro', cols.param + 2, y + 4.8)
  doc.text('Valore', cols.value, y + 4.8)
  doc.text('Unità', cols.unit, y + 4.8)
  doc.text('Range rif.', cols.range, y + 4.8)
  doc.text('Esito', cols.esito, y + 4.8)
  y += 7

  // Righe tabella
  data.entries.forEach((entry, i) => {
    const inRange = entry.measuredValue >= entry.refMin && entry.measuredValue <= entry.refMax
    const rowBg: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : [250, 250, 250]

    doc.setFillColor(...rowBg)
    doc.rect(margin, y, contentW, 8, 'F')

    doc.setTextColor(...DARK)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(entry.parameterName, cols.param + 2, y + 5.2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(String(entry.measuredValue), cols.value, y + 5.2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MED_GRAY)
    doc.text(entry.unit, cols.unit, y + 5.2)
    doc.text(`${entry.refMin} – ${entry.refMax}`, cols.range, y + 5.2)

    // Badge esito
    const esitoColor: [number, number, number] = inRange ? GREEN : ORANGE
    doc.setFillColor(...esitoColor)
    doc.roundedRect(cols.esito - 1, y + 1.5, 18, 5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(inRange ? 'Normale' : 'Anomalo', cols.esito + 8, y + 5.2, { align: 'center' })

    // Bordo riga
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 8, pageW - margin, y + 8)

    y += 8
  })

  y += 10

  // ── Footer firma ──────────────────────────────────────────────────────────────
  // Se rimane poco spazio, vai a nuova pagina
  if (y > 240) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  doc.setTextColor(...MED_GRAY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Firma del Medico Responsabile', margin, y)
  doc.text('Data e Timbro', pageW - margin - 50, y)

  y += 12
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + 70, y)
  doc.line(pageW - margin - 50, y, pageW - margin, y)

  // ── Footer pagina ─────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(...RED)
  doc.rect(0, pageH - 10, pageW, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('B-Link — Sistema di gestione donazioni ematiche', margin, pageH - 4)
  doc.text('Documento generato automaticamente — non sostituisce la firma autografa del medico', pageW - margin, pageH - 4, { align: 'right' })

  // ── Download ──────────────────────────────────────────────────────────────────
  const filename = `referto_${data.donorLastName.toLowerCase()}_${formatDateIt(data.donatedAt).replace(/\//g, '-')}.pdf`
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
