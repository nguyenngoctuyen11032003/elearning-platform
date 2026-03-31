"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  status: string
  courseId: string
  course?: { id: string; title: string; teacher?: { name?: string } }
  student?: { name?: string; email?: string }
}

function mapCert(raw: any): Certificate {
  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || "",
    status: raw?.status || "approved",
    courseId: raw?.courseId || raw?.course?.id || "",
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

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const autoPrint = searchParams.get("print") === "1"

  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) { setError(true); setLoading(false); return }
        const res = await fetch("/api/certificates/my-certificates", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const payload = await res.json()
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : []
        const found = raw.find((c: any) => c.id === id)
        if (!found) { setError(true); setLoading(false); return }
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
    if (!loading && cert && autoPrint) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, cert, autoPrint])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-4">
        <p className="text-muted-foreground">Không tìm thấy chứng chỉ.</p>
        <Link href="/certificates" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>
    )
  }

  const studentName = cert.student?.name || "Học viên"
  const courseName = cert.course?.title || "Khóa học"
  const instructorName = cert.course?.teacher?.name || "Giảng viên"
  const issueDateFmt = formatDateVN(cert.issueDate)

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden flex items-center justify-between p-4 bg-background border-b border-border">
        <Link href="/certificates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
          <span>Quay lại danh sách</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Printer size={18} />
          In / Tải xuống PDF
        </button>
      </div>

      {/* Certificate — centered for screen view */}
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center py-12 px-4 print:bg-white print:min-h-0 print:py-0 print:px-0">
        <div
          id="certificate"
          className="relative w-full max-w-[900px]"
          style={{ fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif", aspectRatio: "210 / 297" }}
        >
          {/* Outer border */}
          <div
            className="p-[6px] rounded-lg h-full"
            style={{ background: "linear-gradient(135deg, #b8860b, #ffd700, #b8860b, #ffd700, #b8860b)" }}
          >
            {/* Inner dark background */}
            <div
              className="relative rounded-md px-10 py-12 flex flex-col items-center text-center h-full"
              style={{ background: "#0d1b2e" }}
            >
              {/* Inner gold border inset */}
              <div
                className="absolute inset-3 rounded pointer-events-none"
                style={{ border: "1px solid rgba(184,134,11,0.5)" }}
              />

              {/* Header logo area */}
              <div className="mb-4">
                <img
                  src="/image/logo-ics.jpg"
                  alt="ICS"
                  className="w-14 h-14 object-contain rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              </div>

              {/* Title */}
              <div className="mb-2">
                <div style={{ color: "#ffd700", letterSpacing: "0.15em", fontSize: "11px", fontFamily: "sans-serif" }}>
                  ──── ICS E-LEARNING ────
                </div>
              </div>

              <h1
                className="font-bold mb-4"
                style={{ color: "#ffd700", fontSize: "26px", letterSpacing: "0.08em", fontFamily: "sans-serif" }}
              >
                CHỨNG CHỈ HOÀN THÀNH
              </h1>

              {/* Gold divider */}
              <div className="w-40 mb-6" style={{ height: "2px", background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />

              {/* Star icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ background: "linear-gradient(135deg, #b8860b, #ffd700)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              {/* Certifies */}
              <p className="mb-1" style={{ color: "#c8a96e", fontSize: "14px", fontStyle: "italic" }}>
                Chứng nhận rằng
              </p>

              {/* Student name */}
              <h2
                className="mb-5"
                style={{ color: "#ffffff", fontSize: "32px", fontStyle: "italic", fontWeight: "bold", borderBottom: "1px solid rgba(184,134,11,0.6)", paddingBottom: "8px", minWidth: "300px" }}
              >
                {studentName}
              </h2>

              <p className="mb-2" style={{ color: "#c8a96e", fontSize: "14px" }}>
                Đã hoàn thành xuất sắc khóa học
              </p>

              {/* Course name */}
              <h3
                className="mb-6"
                style={{ color: "#ffd700", fontSize: "20px", fontWeight: "bold" }}
              >
                {courseName}
              </h3>

              {/* Gold divider */}
              <div className="w-full mb-6" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(184,134,11,0.6), transparent)" }} />

              {/* Bottom row */}
              <div className="w-full flex justify-between items-end">
                {/* Validity badge */}
                <div
                  className="px-4 py-1 rounded-full text-xs font-medium"
                  style={{ border: "1px solid #b8860b", color: "#ffd700", background: "rgba(184,134,11,0.1)" }}
                >
                  Vĩnh viễn
                </div>

                {/* Signature + date */}
                <div className="flex gap-12">
                  <div className="text-center">
                    <div className="mb-1" style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "0.05em" }}>Chữ ký</div>
                    <div
                      style={{ color: "#ffffff", fontSize: "15px", fontStyle: "italic", borderBottom: "1px solid rgba(184,134,11,0.5)", paddingBottom: "2px", minWidth: "100px" }}
                    >
                      {instructorName}
                    </div>
                    <div style={{ color: "#888", fontSize: "10px", marginTop: "2px" }}>Giảng viên</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1" style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "0.05em" }}>Ngày cấp</div>
                    <div style={{ color: "#ffffff", fontSize: "14px", borderBottom: "1px solid rgba(184,134,11,0.5)", paddingBottom: "2px", minWidth: "100px" }}>
                      {issueDateFmt}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate number */}
              <div className="mt-4 w-full text-left">
                <span style={{ color: "#666", fontSize: "10px", fontFamily: "monospace" }}>
                  Số chứng chỉ: {cert.certificateNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 210mm; max-width: 100%; height: auto; }
        }
      `}</style>
    </>
  )
}
