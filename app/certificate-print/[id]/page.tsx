"use client"

import { useEffect, useState, use } from "react"
import { Loader2 } from "lucide-react"

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  title: string
  description?: string
  validityPeriod: string
  courseName: string
  studentName: string
  instructorName: string
  theme: {
    backgroundColor: string
    borderColor: string
    borderStyle: string
    textColor: string
    templateImageUrl?: string
    logoUrl?: string
    signatureUrl?: string
  }
}

function normalizeMediaUrl(value: unknown): string | undefined {
  const raw = String(value || "").trim()
  if (!raw) return undefined
  if (/^(data:image\/|blob:)/i.test(raw)) return raw

  let normalized = raw
    .replace(/(^|\s)\/api\/uploads\//g, "$1/uploads/")
    .replace(/^(https?:\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/")

  const backendBase = String(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
  if (backendBase && normalized.startsWith(`${backendBase}/uploads/`)) {
    normalized = normalized.slice(backendBase.length)
  }

  if (/^https?:\/\/[^/]+\/uploads\//i.test(normalized)) {
    normalized = normalized.replace(/^https?:\/\/[^/]+/i, "")
  }

  if (/^(uploads|images|image)\//i.test(normalized)) {
    normalized = `/${normalized}`
  }

  return normalized
}

function mapCert(raw: any): Certificate {
  const snapshot = raw?.metadata?.snapshot || null
  const template = snapshot?.template || raw?.metadata?.template || raw?.template || null

  const studentName =
    raw?.student?.name ||
    [raw?.student?.firstName, raw?.student?.lastName].filter(Boolean).join(" ") ||
    raw?.metadata?.snapshot?.studentName ||
    raw?.metadata?.studentName ||
    "Học viên"

  const courseName =
    raw?.course?.title ||
    raw?.metadata?.snapshot?.courseName ||
    raw?.metadata?.courseName ||
    "Khóa học"

  const instructorName =
    raw?.course?.teacher?.name ||
    [raw?.course?.teacher?.firstName, raw?.course?.teacher?.lastName].filter(Boolean).join(" ") ||
    raw?.metadata?.teacherName ||
    "Giảng viên"

  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || snapshot?.issuedAt || "",
    title:
      template?.title ||
      raw?.metadata?.snapshot?.certificateTitle ||
      raw?.metadata?.certificateTitle ||
      raw?.metadata?.snapshot?.examTitle ||
      raw?.metadata?.examTitle ||
      raw?.metadata?.snapshot?.title ||
      raw?.metadata?.title ||
      raw?.title ||
      "",
    description:
      template?.description ||
      raw?.metadata?.snapshot?.description ||
      raw?.metadata?.description ||
      raw?.description ||
      "",
    validityPeriod: template?.validityPeriod || raw?.validityPeriod || "Vĩnh viễn",
    courseName,
    studentName,
    instructorName,
    theme: {
      backgroundColor: template?.backgroundColor || raw?.backgroundColor || "#0d1b2e",
      borderColor: template?.borderColor || raw?.borderColor || "#d4af37",
      borderStyle: template?.borderStyle || raw?.borderStyle || "solid",
      textColor: template?.textColor || raw?.textColor || "#ffffff",
      templateImageUrl: normalizeMediaUrl(template?.templateImageUrl || raw?.templateImageUrl),
      logoUrl: normalizeMediaUrl(template?.logoUrl || raw?.logoUrl),
      signatureUrl: normalizeMediaUrl(template?.signatureUrl || raw?.signatureUrl),
    },
  }
}

function formatDateVN(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

function normalizeTextForCompare(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isGenericCertificateTitle(value: string): boolean {
  const normalized = normalizeTextForCompare(value)
  return (
    normalized === "chung chi hoan thanh" ||
    normalized === "chung chi" ||
    normalized === "certificate of completion"
  )
}

function fitTextSize(text: string, min: number, max: number, targetLength: number): number {
  const content = String(text || "").trim()
  const length = Math.max(content.length, 1)
  const ratio = targetLength / length
  const scaled = max * Math.max(0.62, Math.min(1.42, ratio))
  return Math.max(min, Math.min(max, Math.round(scaled)))
}

export default function CertificatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError(true)
          setLoading(false)
          return
        }

        const res = await fetch("/api/certificates/my-certificates", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Failed to load certificates")

        const payload = await res.json()
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []

        const found = raw.find((c: any) => c.id === id)
        if (!found) {
          setError(true)
          setLoading(false)
          return
        }

        setCert(mapCert(found))
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (!loading && cert && query.get("print") === "1") {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, cert])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 size={36} className="animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="text-sm text-slate-600">Không tìm thấy chứng chỉ.</p>
      </div>
    )
  }

  const studentName = cert.studentName || "Học viên"
  const courseName = cert.courseName || "Khóa học"
  const instructorName = cert.instructorName || "Giảng viên"
  const certTitle = String(cert.title || "").trim()
  const certificateName = certTitle && !isGenericCertificateTitle(certTitle) ? certTitle : "Chứng chỉ hoàn thành"
  const certDescription = cert.description || "Đã hoàn thành xuất sắc khóa học"
  const validityLabel = cert.validityPeriod || "Vĩnh viễn"
  const theme = cert.theme
  const issueDateFmt = formatDateVN(cert.issueDate)
  const certificateNameSize = fitTextSize(certificateName, 30, 52, 18)
  const studentNameSize = fitTextSize(studentName, 42, 72, 14)
  const courseNameSize = fitTextSize(courseName, 26, 38, 18)

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex items-center justify-center py-8 px-3 print:bg-white print:min-h-0 print:py-0 print:px-0">
        <div
          id="certificate"
          className="relative w-full max-w-[900px]"
          style={{ fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif", aspectRatio: "210 / 297" }}
        >
          <div
            className="p-[6px] rounded-lg h-full"
            style={{ background: `linear-gradient(135deg, ${theme.borderColor}, #f8f5d0, ${theme.borderColor}, #f8f5d0, ${theme.borderColor})` }}
          >
            <div
              className="relative rounded-md px-10 py-10 h-full"
              style={{
                background: theme.backgroundColor,
                backgroundImage: theme.templateImageUrl ? `url(${theme.templateImageUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5" />
              <div className="absolute inset-3 rounded pointer-events-none" style={{ border: `1px ${theme.borderStyle} ${theme.borderColor}` }} />

              <div className="relative z-10 flex h-full flex-col text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-3">
                    {theme.logoUrl ? (
                      <img
                        src={theme.logoUrl}
                        alt="Logo"
                        className="w-14 h-14 object-contain rounded bg-white/90 p-1"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded bg-white/20" />
                    )}
                  </div>

                  <div style={{ color: theme.borderColor, letterSpacing: "0.15em", fontSize: "11px", fontFamily: "sans-serif" }}>---- ICS E-LEARNING ----</div>

                  <h1 className="font-bold mt-2" style={{ color: theme.borderColor, fontSize: "34px", letterSpacing: "0.08em", fontFamily: "sans-serif" }}>
                    CHỨNG CHỈ HOÀN THÀNH
                  </h1>

                  <div className="w-48 mt-2" style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${theme.borderColor}, transparent)` }} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: theme.textColor, border: `2px solid ${theme.borderColor}` }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={theme.borderColor}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>

                  <h2
                    className="mb-3"
                    style={{
                      color: theme.textColor,
                      fontSize: `${certificateNameSize}px`,
                      fontWeight: 800,
                      lineHeight: 1.08,
                      maxWidth: "90%",
                      textWrap: "balance",
                    }}
                  >
                    {certificateName}
                  </h2>

                  <div className="w-48 mb-6" style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${theme.borderColor}, transparent)` }} />

                  <p className="mb-1" style={{ color: theme.textColor, fontSize: "16px", opacity: 0.8, fontStyle: "italic" }}>
                    Chứng nhận rằng
                  </p>

                  <h2
                    className="mb-6"
                    style={{
                      color: theme.textColor,
                      fontSize: `${studentNameSize}px`,
                      fontStyle: "italic",
                      fontWeight: "bold",
                      borderBottom: `1px solid ${theme.borderColor}99`,
                      paddingBottom: "10px",
                      minWidth: "360px",
                      maxWidth: "90%",
                      lineHeight: 1.08,
                      textWrap: "balance",
                    }}
                  >
                    {studentName}
                  </h2>

                  <p className="mb-2" style={{ color: theme.textColor, fontSize: "16px", opacity: 0.85 }}>
                    {certDescription}
                  </p>

                  <h3
                    className="mb-6"
                    style={{
                      color: theme.borderColor,
                      fontSize: `${courseNameSize}px`,
                      fontWeight: "bold",
                      lineHeight: 1.14,
                      maxWidth: "90%",
                      textWrap: "balance",
                    }}
                  >
                    {courseName}
                  </h3>
                </div>

                <div className="w-full">
                  <div className="w-full mb-6" style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${theme.borderColor}99, transparent)` }} />

                  <div className="w-full flex justify-between items-end">
                    <div className="px-4 py-1 rounded-full text-xs font-medium" style={{ border: `1px solid ${theme.borderColor}`, color: theme.borderColor, background: `${theme.borderColor}20` }}>
                      {validityLabel}
                    </div>

                    <div className="flex gap-12">
                      <div className="text-center">
                        <div className="mb-1" style={{ color: theme.textColor, fontSize: "11px", letterSpacing: "0.05em" }}>Chữ ký</div>
                        {theme.signatureUrl ? (
                          <img
                            src={theme.signatureUrl}
                            alt="Signature"
                            className="mx-auto h-10 max-w-[120px] object-contain"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        ) : null}
                        <div style={{ color: theme.textColor, fontSize: "15px", fontStyle: "italic", borderBottom: `1px solid ${theme.borderColor}99`, paddingBottom: "2px", minWidth: "100px" }}>
                          {instructorName}
                        </div>
                        <div style={{ color: theme.textColor, opacity: 0.65, fontSize: "10px", marginTop: "2px" }}>Giảng viên</div>
                      </div>
                      <div className="text-center">
                        <div className="mb-1" style={{ color: theme.textColor, fontSize: "11px", letterSpacing: "0.05em" }}>Ngày cấp</div>
                        <div style={{ color: theme.textColor, fontSize: "14px", borderBottom: `1px solid ${theme.borderColor}99`, paddingBottom: "2px", minWidth: "100px" }}>
                          {issueDateFmt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full text-left">
                    <span style={{ color: theme.textColor, opacity: 0.6, fontSize: "10px", fontFamily: "monospace" }}>
                      Số chứng chỉ: {cert.certificateNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            max-width: none;
            transform: none;
            margin: 0;
            padding: 0;
            aspect-ratio: unset !important;
          }
        }
      `}</style>
    </>
  )
}
