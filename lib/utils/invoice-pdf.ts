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

function toAscii(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function formatMoneyVnd(value: number): string {
  const amount = Number.isFinite(value) ? value : 0
  return `${Math.round(amount).toLocaleString("en-US")} VND`
}

function statusLabel(status: InvoicePaymentStatus): string {
  if (status === "completed") return "Da thanh toan / Paid"
  if (status === "pending") return "Dang xu ly / Processing"
  return "That bai / Failed"
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<void> {
  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ unit: "mm", format: "a4" })

  const pageWidth = 210
  const contentLeft = 16
  const contentRight = 194

  const brandBlue: [number, number, number] = [37, 99, 235]
  const grayText: [number, number, number] = [75, 85, 99]

  const safe = {
    companyName: toAscii(input.companyName || "ICS E-Learning Platform"),
    companyAddress: toAscii(input.companyAddress || "Ha Noi, Viet Nam"),
    supportEmail: toAscii(input.supportEmail || "support@ics-elearning.com"),
    website: toAscii(input.website || "www.ics-elearning.com"),
    invoiceNumber: toAscii(input.invoiceNumber),
    issueDate: toAscii(input.issueDate),
    customerName: toAscii(input.customerName || "N/A"),
    customerEmail: toAscii(input.customerEmail || "N/A"),
    courseTitle: toAscii(input.courseTitle || "N/A"),
    instructorName: toAscii(input.instructorName || "N/A"),
    paymentMethod: toAscii(input.paymentMethod || "Online"),
  }

  doc.setFillColor(...brandBlue)
  doc.rect(0, 0, pageWidth, 34, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("ICS E-LEARNING", contentLeft, 14)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Hoa don thanh toan / Payment invoice", contentLeft, 22)
  doc.text(`${safe.companyName} | ${safe.website}`, contentLeft, 28)

  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("HOA DON / INVOICE", contentLeft, 45)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`So hoa don / Invoice no: ${safe.invoiceNumber}`, 130, 41)
  doc.text(`Ngay phat hanh / Issue date: ${safe.issueDate}`, 130, 47)
  doc.text(`Trang thai / Status: ${statusLabel(input.paymentStatus)}`, 130, 53)

  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(contentLeft, 58, 88, 36, 2, 2)
  doc.roundedRect(106, 58, 88, 36, 2, 2)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Thong tin khach hang / Customer", 20, 66)
  doc.text("Thong tin khoa hoc / Course", 110, 66)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...grayText)
  doc.text(`Ho ten / Name: ${safe.customerName}`, 20, 74)
  doc.text(`Email: ${safe.customerEmail}`, 20, 80)

  const titleLines = doc.splitTextToSize(safe.courseTitle, 78)
  doc.text("Khoa hoc / Course:", 110, 74)
  doc.text(titleLines, 110, 80)
  doc.text(`Giang vien / Instructor: ${safe.instructorName}`, 110, 90)

  doc.setTextColor(17, 24, 39)
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(contentLeft, 101, 178, 42, 2, 2, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Chi tiet thanh toan / Payment details", 20, 109)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Mo ta / Description", 22, 118)
  doc.text("So tien / Amount", 186, 118, { align: "right" })

  doc.setDrawColor(191, 219, 254)
  doc.line(20, 121, 190, 121)

  doc.setTextColor(...grayText)
  doc.text("Gia khoa hoc / Course price", 22, 128)
  doc.text(formatMoneyVnd(input.subtotal), 186, 128, { align: "right" })

  const discount = Number(input.discount || 0)
  if (discount > 0) {
    doc.text("Giam gia / Discount", 22, 134)
    doc.setTextColor(220, 38, 38)
    doc.text(`- ${formatMoneyVnd(discount)}`, 186, 134, { align: "right" })
    doc.setTextColor(...grayText)
  }

  const tax = Number(input.tax || 0)
  if (tax > 0) {
    doc.text("Thue VAT / VAT", 22, 140)
    doc.text(formatMoneyVnd(tax), 186, 140, { align: "right" })
  }

  doc.setDrawColor(148, 163, 184)
  doc.line(20, 145, 190, 145)

  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Tong cong / Total", 22, 153)
  doc.text(formatMoneyVnd(input.total), 186, 153, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...grayText)
  doc.text(`Phuong thuc / Method: ${safe.paymentMethod}`, 20, 162)
  doc.text(`Ho tro / Support: ${safe.supportEmail}`, 20, 168)

  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Dieu khoan / Terms", 20, 180)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...grayText)

  const terms = [
    "- Truy cap tron doi / Lifetime access.",
    "- Ho tro cap nhat mien phi / Free content updates.",
    "- Tai tai lieu va video / Downloadable materials and videos.",
    "- Cap chung chi hoan thanh / Certificate after completion.",
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
