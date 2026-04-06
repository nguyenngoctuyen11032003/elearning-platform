"use client"

import { useEffect, useState, use } from "react"
import { Loader2 } from "lucide-react"

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  course?: { id: string; title: string; teacher?: { name?: string } }
  student?: { name?: string; email?: string }
}

function mapCert(raw: any): Certificate {
  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || "",
    course: raw?.course
      ? { id: raw.course.id || "", title: raw.course.title || "", teacher: raw.course.teacher }
      : undefined,
    student: raw?.student,
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
        <p className="text-sm text-slate-600">Khong tim thay chung chi.</p>
      </div>
    )
  }

  const studentName = cert.student?.name || "Hoc vien"
  const courseName = cert.course?.title || "Khoa hoc"
  const instructorName = cert.course?.teacher?.name || "Giang vien"
  const issueDateFmt = formatDateVN(cert.issueDate)

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
            style={{ background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b, #ffd700, #b8860b)" }}
          >
            <div className="relative rounded-md px-10 py-10 h-full" style={{ background: "#0d1b2e" }}>
              <div className="absolute inset-3 rounded pointer-events-none" style={{ border: "1px solid rgba(184,134,11,0.5)" }} />

              <div className="relative z-10 flex h-full flex-col text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-3">
                    <img
                      src="/image/logo-ics.jpg"
                      alt="ICS"
                      className="w-14 h-14 object-contain rounded"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </div>

                  <div style={{ color: "#ffd700", letterSpacing: "0.15em", fontSize: "11px", fontFamily: "sans-serif" }}>
                    ---- ICS E-LEARNING ----
                  </div>

                  <h1 className="font-bold mt-2" style={{ color: "#ffd700", fontSize: "34px", letterSpacing: "0.08em", fontFamily: "sans-serif" }}>
                    CHUNG CHI HOAN THANH
                  </h1>

                  <div className="w-48 mt-2" style={{ height: "2px", background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #b8860b, #ffd700)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>

                  <p className="mb-1" style={{ color: "#c8a96e", fontSize: "16px", fontStyle: "italic" }}>
                    Chung nhan rang
                  </p>

                  <h2
                    className="mb-6"
                    style={{ color: "#ffffff", fontSize: "48px", fontStyle: "italic", fontWeight: "bold", borderBottom: "1px solid rgba(184,134,11,0.6)", paddingBottom: "10px", minWidth: "360px" }}
                  >
                    {studentName}
                  </h2>

                  <p className="mb-2" style={{ color: "#c8a96e", fontSize: "16px" }}>
                    Da hoan thanh xuat sac khoa hoc
                  </p>

                  <h3 className="mb-6" style={{ color: "#ffd700", fontSize: "28px", fontWeight: "bold" }}>
                    {courseName}
                  </h3>
                </div>

                <div className="w-full">
                  <div className="w-full mb-6" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(184,134,11,0.6), transparent)" }} />

                  <div className="w-full flex justify-between items-end">
                    <div className="px-4 py-1 rounded-full text-xs font-medium" style={{ border: "1px solid #b8860b", color: "#ffd700", background: "rgba(184,134,11,0.1)" }}>
                      Vinh vien
                    </div>

                    <div className="flex gap-12">
                      <div className="text-center">
                        <div className="mb-1" style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "0.05em" }}>Chu ky</div>
                        <div style={{ color: "#ffffff", fontSize: "15px", fontStyle: "italic", borderBottom: "1px solid rgba(184,134,11,0.5)", paddingBottom: "2px", minWidth: "100px" }}>
                          {instructorName}
                        </div>
                        <div style={{ color: "#888", fontSize: "10px", marginTop: "2px" }}>Giang vien</div>
                      </div>
                      <div className="text-center">
                        <div className="mb-1" style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "0.05em" }}>Ngay cap</div>
                        <div style={{ color: "#ffffff", fontSize: "14px", borderBottom: "1px solid rgba(184,134,11,0.5)", paddingBottom: "2px", minWidth: "100px" }}>
                          {issueDateFmt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full text-left">
                    <span style={{ color: "#666", fontSize: "10px", fontFamily: "monospace" }}>
                      So chung chi: {cert.certificateNumber}
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
