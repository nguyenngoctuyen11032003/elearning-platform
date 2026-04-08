export type InvoicePaymentStatus = "completed" | "pending" | "failed"

export interface InvoicePdfInput {
  invoiceNumber: string
  issueDate: string
  customerName: string
  customerEmail: string
  courseTitle: string
  instructorName?: string
  paymentMethod: string
  paymentStatus: InvoicePaymentStatus
  subtotal: number
  discount?: number
  tax?: number
  total: number
  companyName?: string
  companyAddress?: string
  supportEmail?: string
  website?: string
}

const INVOICE_FONT_FAMILY = "NotoSans"
const INVOICE_FONT_REGULAR_URL = "/fonts/NotoSans-Regular.ttf"
const INVOICE_FONT_BOLD_URL = "/fonts/NotoSans-Bold.ttf"

let cachedFontRegular: string | null = null
let cachedFontBold: string | null = null
let fontLoadPromise: Promise<boolean> | null = null

function normalizeInvoiceText(value: string): string {
  return String(value || "").trim()
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

async function fetchFontBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Unable to load font: ${url}`)
  }
  const buffer = await response.arrayBuffer()
  return arrayBufferToBase64(buffer)
}

async function ensureInvoiceFonts(doc: any): Promise<boolean> {
  if (typeof window === "undefined") return false

  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      try {
        if (!cachedFontRegular) {
          cachedFontRegular = await fetchFontBase64(INVOICE_FONT_REGULAR_URL)
        }
        if (!cachedFontBold) {
          cachedFontBold = await fetchFontBase64(INVOICE_FONT_BOLD_URL)
        }
        return true
      } catch (error) {
        console.warn("Invoice font load failed, falling back to default font.", error)
        cachedFontRegular = null
        cachedFontBold = null
        return false
      }
    })()
  }

  const loaded = await fontLoadPromise
  if (loaded && cachedFontRegular && cachedFontBold) {
    doc.addFileToVFS("NotoSans-Regular.ttf", cachedFontRegular)
    doc.addFont("NotoSans-Regular.ttf", INVOICE_FONT_FAMILY, "normal")
    doc.addFileToVFS("NotoSans-Bold.ttf", cachedFontBold)
    doc.addFont("NotoSans-Bold.ttf", INVOICE_FONT_FAMILY, "bold")
  }

  return loaded && Boolean(cachedFontRegular && cachedFontBold)
}

function formatMoneyVnd(value: number): string {
  const amount = Number.isFinite(value) ? value : 0
  return `${Math.round(amount).toLocaleString("vi-VN")} VND`
}

function statusLabel(status: InvoicePaymentStatus): string {
  if (status === "completed") return "Đã thanh toán / Paid"
  if (status === "pending") return "Đang xử lý / Processing"
  return "Thất bại / Failed"
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<void> {
  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const fontReady = await ensureInvoiceFonts(doc)
  const fontFamily = fontReady ? INVOICE_FONT_FAMILY : "helvetica"

  const pageWidth = 210
  const contentLeft = 16
  const contentRight = 194

  const brandBlue: [number, number, number] = [37, 99, 235]
  const grayText: [number, number, number] = [75, 85, 99]

  const safe = {
    companyName: normalizeInvoiceText(input.companyName || "ICS E-Learning Platform"),
    companyAddress: normalizeInvoiceText(input.companyAddress || "Ha Noi, Viet Nam"),
    supportEmail: normalizeInvoiceText(input.supportEmail || "support@ics-elearning.com"),
    website: normalizeInvoiceText(input.website || "www.ics-elearning.com"),
    invoiceNumber: normalizeInvoiceText(input.invoiceNumber),
    issueDate: normalizeInvoiceText(input.issueDate),
    customerName: normalizeInvoiceText(input.customerName || "N/A"),
    customerEmail: normalizeInvoiceText(input.customerEmail || "N/A"),
    courseTitle: normalizeInvoiceText(input.courseTitle || "N/A"),
    instructorName: normalizeInvoiceText(input.instructorName || "N/A"),
    paymentMethod: normalizeInvoiceText(input.paymentMethod || "Online"),
  }

  doc.setFillColor(...brandBlue)
  doc.rect(0, 0, pageWidth, 34, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont(fontFamily, "bold")
  doc.setFontSize(22)
  doc.text("ICS E-LEARNING", contentLeft, 14)

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(10)
  doc.text("Hóa đơn thanh toán / Payment invoice", contentLeft, 22)
  doc.text(`${safe.companyName} | ${safe.website}`, contentLeft, 28)

  doc.setTextColor(17, 24, 39)
  doc.setFont(fontFamily, "bold")
  doc.setFontSize(16)
  doc.text("HÓA ĐƠN / INVOICE", contentLeft, 45)

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(10)
  doc.text(`Số hóa đơn / Invoice no: ${safe.invoiceNumber}`, 130, 41)
  doc.text(`Ngày phát hành / Issue date: ${safe.issueDate}`, 130, 47)
  doc.text(`Trạng thái / Status: ${statusLabel(input.paymentStatus)}`, 130, 53)

  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(contentLeft, 58, 88, 36, 2, 2)
  doc.roundedRect(106, 58, 88, 36, 2, 2)

  doc.setFont(fontFamily, "bold")
  doc.setFontSize(11)
  doc.text("Thông tin khách hàng / Customer", 20, 66)
  doc.text("Thông tin khóa học / Course", 110, 66)

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(10)
  doc.setTextColor(...grayText)
  doc.text(`Họ tên / Name: ${safe.customerName}`, 20, 74)
  doc.text(`Email: ${safe.customerEmail}`, 20, 80)

  const titleLines = doc.splitTextToSize(safe.courseTitle, 78)
  doc.text("Khóa học / Course:", 110, 74)
  doc.text(titleLines, 110, 80)
  doc.text(`Giảng viên / Instructor: ${safe.instructorName}`, 110, 90)

  doc.setTextColor(17, 24, 39)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(contentLeft, 101, 178, 42, 2, 2, "F")

  doc.setFont(fontFamily, "bold")
  doc.setFontSize(11)
  doc.text("Chi tiết thanh toán / Payment details", 20, 109)

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(10)
  doc.text("Mô tả / Description", 22, 118)
  doc.text("Số tiền / Amount", 186, 118, { align: "right" })

  doc.setDrawColor(191, 219, 254)
  doc.line(20, 121, 190, 121)

  doc.setTextColor(...grayText)
  doc.text("Giá khóa học / Course price", 22, 128)
  doc.text(formatMoneyVnd(input.subtotal), 186, 128, { align: "right" })

  const discount = Number(input.discount || 0)
  if (discount > 0) {
    doc.text("Giảm giá / Discount", 22, 134)
    doc.setTextColor(220, 38, 38)
    doc.text(`- ${formatMoneyVnd(discount)}`, 186, 134, { align: "right" })
    doc.setTextColor(...grayText)
  }

  const tax = Number(input.tax || 0)
  if (tax > 0) {
    doc.text("Thuế VAT (10%) / VAT (10%)", 22, 140)
    doc.text(formatMoneyVnd(tax), 186, 140, { align: "right" })
  }

  doc.setDrawColor(148, 163, 184)
  doc.line(20, 145, 190, 145)

  doc.setTextColor(17, 24, 39)
  doc.setFont(fontFamily, "bold")
  doc.setFontSize(13)
  doc.text("Tổng cộng / Total", 22, 153)
  doc.text(formatMoneyVnd(input.total), 186, 153, { align: "right" })

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(10)
  doc.setTextColor(...grayText)
  doc.text(`Phương thức / Method: ${safe.paymentMethod}`, 20, 162)
  doc.text(`Hỗ trợ / Support: ${safe.supportEmail}`, 20, 168)

  doc.setTextColor(17, 24, 39)
  doc.setFont(fontFamily, "bold")
  doc.setFontSize(11)
  doc.text("Điều khoản / Terms", 20, 180)

  doc.setFont(fontFamily, "normal")
  doc.setFontSize(9)
  doc.setTextColor(...grayText)

  const terms = [
    "- Truy cập trọn đời / Lifetime access.",
    "- Hỗ trợ cập nhật miễn phí / Free content updates.",
    "- Tải tài liệu và video / Downloadable materials and videos.",
    "- Cấp chứng chỉ hoàn thành / Certificate after completion.",
  ]

  terms.forEach((term, index) => {
    doc.text(term, 22, 188 + index * 6)
  })

  doc.setDrawColor(226, 232, 240)
  doc.line(contentLeft, 273, contentRight, 273)
  doc.setFontSize(9)
  doc.text(`${safe.companyName} | ${safe.companyAddress}`, 105, 279, { align: "center" })
  doc.text(`${safe.website} | ${safe.supportEmail}`, 105, 284, { align: "center" })

  doc.save(`invoice-${safe.invoiceNumber}.pdf`)
}
