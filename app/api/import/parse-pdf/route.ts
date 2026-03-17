import { NextRequest, NextResponse } from "next/server"
// @ts-ignore - pdf-parse doesn't have type definitions
import pdfParse from "pdf-parse/lib/pdf-parse.js"
// @ts-ignore - pdfjs-dist legacy build for Node.js (avoids DOMMatrix/browser API errors)
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

export const runtime = "nodejs"

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024

async function extractTextWithPdfParse(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer)
  return String(parsed?.text || "")
}

type PdfLine = { y: number; x: number; text: string }
type PdfImageMeta = { key: string; pageNum: number; x?: number; y?: number }

type PdfPageExtract = {
  pageNum: number
  pageHeight: number
  lines: PdfLine[]
  images: PdfImageMeta[]
}

const SMALL_IMAGE_MIN_DIM = 40

function cleanExtractedText(text: string): string {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\u0000/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function groupTextItemsIntoLines(items: any[]): PdfLine[] {
  const cleaned = items
    .filter((item) => typeof item?.str === "string" && item.str.trim())
    .map((item) => {
      const t = item.transform || [1, 0, 0, 1, 0, 0]
      return {
        str: String(item.str),
        x: Number(t[4] ?? 0),
        y: Number(t[5] ?? 0),
        w: Number(item.width ?? 0),
      }
    })

  cleaned.sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: PdfLine[] = []
  const Y_TOL = 2
  const GAP_TOL = 6

  let currentY: number | null = null
  let currentText = ""
  let currentX = 0
  let lastRight = 0

  for (const item of cleaned) {
    if (currentY === null || Math.abs(item.y - currentY) > Y_TOL) {
      if (currentY !== null && currentText.trim()) {
        lines.push({ y: currentY, x: currentX, text: currentText.trim() })
      }
      currentY = item.y
      currentX = item.x
      currentText = item.str
      lastRight = item.x + (item.w || 0)
      continue
    }

    const gap = item.x - lastRight
    if (gap > GAP_TOL) currentText += " "
    currentText += item.str
    lastRight = Math.max(lastRight, item.x + (item.w || 0))
  }

  if (currentY !== null && currentText.trim()) {
    lines.push({ y: currentY, x: currentX, text: currentText.trim() })
  }

  return lines
}

const HEADER_BAND_PCT = 0.06
const FOOTER_BAND_PCT = 0.08

const PAGE_NUMBER_ONLY_RE = /^\s*\d{1,4}\s*$/
const KNOWN_FOOTER_RE = /(copyright|all\s+rights\s+reserved|pearson|education,\s*inc\.?)/i

function stripKnownFooterArtifacts(text: string): string {
  const lines = String(text || "").replace(/\r/g, "").split("\n")
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) {
      out.push("")
      continue
    }

    // Drop common publisher/copyright footer lines (OCR/text extraction may vary slightly).
    if (KNOWN_FOOTER_RE.test(line)) continue

    // Drop standalone page numbers when they appear as isolated lines.
    if (PAGE_NUMBER_ONLY_RE.test(line)) {
      const prevBlank = i === 0 || !lines[i - 1].trim()
      const nextBlank = i === lines.length - 1 || !lines[i + 1].trim()
      if (prevBlank || nextBlank) continue
    }

    out.push(raw)
  }

  return cleanExtractedText(out.join("\n"))
}

function normalizeHeaderFooterLine(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[0-9]+/g, "")
    .replace(/[©®™]/g, "")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isInHeaderFooterBand(y: number, pageHeight: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(pageHeight) || pageHeight <= 0) return false
  const headerStart = pageHeight * (1 - HEADER_BAND_PCT)
  const footerEnd = pageHeight * FOOTER_BAND_PCT
  return y >= headerStart || y <= footerEnd
}

function shouldDropHeaderFooterLine(
  line: PdfLine,
  pageHeight: number,
  normalizedCounts: Map<string, number>,
): boolean {
  const text = line.text.trim()
  if (!text) return true

  const inBand = isInHeaderFooterBand(line.y, pageHeight)
  const norm = normalizeHeaderFooterLine(text)
  const repeated = norm ? (normalizedCounts.get(norm) ?? 0) >= 2 : false

  // Always drop standalone page numbers if they appear in header/footer.
  if (inBand && PAGE_NUMBER_ONLY_RE.test(text)) return true

  // Drop known publisher/copyright footers even if extraction shifts slightly.
  if (KNOWN_FOOTER_RE.test(text)) return true

  // Drop repeated header/footer lines across pages.
  if (inBand && repeated && text.length <= 140) return true

  // Drop very short band text (often artifacts like "1" or stray marks).
  if (inBand && text.length <= 3) return true

  return false
}

function isLikelyUsefulImage(width?: number, height?: number): boolean {
  if (!width || !height) return false
  return width >= SMALL_IMAGE_MIN_DIM && height >= SMALL_IMAGE_MIN_DIM
}

async function encodeImageObjToPngDataUrl(imageObj: any): Promise<string | null> {
  try {
    const width = imageObj?.width
    const height = imageObj?.height
    const data = imageObj?.data
    if (!width || !height || !data) return null
    if (!isLikelyUsefulImage(width, height)) return null

    const raw = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data)
    const pixelCount = width * height

    let rgba: Uint8Array
    if (raw.length === pixelCount * 4) {
      rgba = Uint8Array.from(raw)
    } else if (raw.length === pixelCount * 3) {
      rgba = new Uint8Array(pixelCount * 4)
      for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
        rgba[j] = raw[i]
        rgba[j + 1] = raw[i + 1]
        rgba[j + 2] = raw[i + 2]
        rgba[j + 3] = 255
      }
    } else if (raw.length === pixelCount) {
      rgba = new Uint8Array(pixelCount * 4)
      for (let i = 0, j = 0; i < raw.length; i += 1, j += 4) {
        const v = raw[i]
        rgba[j] = v
        rgba[j + 1] = v
        rgba[j + 2] = v
        rgba[j + 3] = 255
      }
    } else {
      return null
    }

    // pngjs is CJS; dynamic import avoids ESM interop issues in Next.
    // @ts-ignore
    const { PNG } = await import("pngjs")
    const png = new PNG({ width, height })
    png.data = Buffer.from(rgba)
    const buf = PNG.sync.write(png)
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

async function getPdfObject(cache: any, key: string): Promise<any | null> {
  if (!cache || !key) return null

  try {
    const immediate = cache.get(key)
    if (immediate) return immediate
  } catch {
    // Ignore and try async callback variant.
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (value: any | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    try {
      cache.get(key, (value: any) => finish(value || null))
    } catch {
      finish(null)
      return
    }

    // Do not wait forever when pdf.js fails to resolve this key.
    setTimeout(() => finish(null), 250)
  })
}

async function resolveImageDataUrl(
  page: any,
  imageRef: unknown,
): Promise<string | null> {
  // Inline image objects may be passed directly by pdf.js.
  if (imageRef && typeof imageRef === "object") {
    const inlineDataUrl = await encodeImageObjToPngDataUrl(imageRef)
    if (inlineDataUrl) return inlineDataUrl
  }

  if (typeof imageRef !== "string" || !imageRef) return null

  // Try page-local object cache first.
  try {
    if (page?.objs) {
      const localObj = await getPdfObject(page.objs, imageRef)
      const localDataUrl = await encodeImageObjToPngDataUrl(localObj)
      if (localDataUrl) return localDataUrl
    }
  } catch {
    // Continue with shared cache fallback.
  }

  // Some PDFs keep image XObjects in commonObjs rather than page.objs.
  try {
    if (page?.commonObjs) {
      const commonObj = await getPdfObject(page.commonObjs, imageRef)
      const commonDataUrl = await encodeImageObjToPngDataUrl(commonObj)
      if (commonDataUrl) return commonDataUrl
    }
  } catch {
    // Ignore and report failure through null return.
  }

  return null
}

async function extractTextAndImagesFromPDF(
  buffer: Buffer,
  opts: { maxImages?: number; maxPages?: number } = {},
): Promise<{ text: string; images: Record<string, string> }> {
  const maxImages = opts.maxImages ?? 20
  const maxPages = opts.maxPages ?? 50
  const images: Record<string, string> = {}
  let imageIndex = 0

  const pages: PdfPageExtract[] = []
  const headerFooterCounts = new Map<string, number>()

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pagesToRead = Math.min(pdf.numPages, maxPages)

  const multiply = (m1: number[], m2: number[]) => {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ]
  }

  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum)

    const viewport = page.getViewport({ scale: 1 })
    const pageHeight = Number(viewport?.height ?? 0)

    // Text
    let rawLines: PdfLine[] = []
    try {
      const textContent = await page.getTextContent()
      rawLines = groupTextItemsIntoLines(textContent.items as any[])
    } catch {
      rawLines = []
    }

    // Images + rough coordinates
    const pageImages: PdfImageMeta[] = []
    if (imageIndex < maxImages) {
      try {
        const operatorList = await page.getOperatorList()
        const stack: number[][] = []
        let currentTransform = [1, 0, 0, 1, 0, 0]

        for (let i = 0; i < operatorList.fnArray.length; i++) {
          const fn = operatorList.fnArray[i]

          if (fn === pdfjsLib.OPS.save) {
            stack.push(currentTransform)
            continue
          }
          if (fn === pdfjsLib.OPS.restore) {
            currentTransform = stack.pop() || [1, 0, 0, 1, 0, 0]
            continue
          }
          if (fn === pdfjsLib.OPS.transform) {
            const args = operatorList.argsArray[i]
            if (Array.isArray(args) && args.length >= 6) {
              const m2 = args.slice(0, 6).map((v: any) => Number(v))
              currentTransform = multiply(currentTransform, m2)
            }
            continue
          }

          // Note: pdfjs OPS list differs by version; keep to known ops and guard optional ones.
          const ops = pdfjsLib.OPS as any
          const paintInline = ops.paintInlineImageXObject
          const paintJpeg = ops.paintJpegXObject
          const paintImageRepeat = ops.paintImageXObjectRepeat
          const paintImageMask = ops.paintImageMaskXObject
          const paintImageMaskRepeat = ops.paintImageMaskXObjectRepeat
          const paintImageMaskGroup = ops.paintImageMaskXObjectGroup
          const isImageOp =
            fn === pdfjsLib.OPS.paintImageXObject ||
            (paintInline && fn === paintInline) ||
            (paintJpeg && fn === paintJpeg) ||
            (paintImageRepeat && fn === paintImageRepeat) ||
            (paintImageMask && fn === paintImageMask) ||
            (paintImageMaskRepeat && fn === paintImageMaskRepeat) ||
            (paintImageMaskGroup && fn === paintImageMaskGroup)

          if (isImageOp) {
            if (imageIndex >= maxImages) break
            const imageArg = operatorList.argsArray[i]?.[0]
            if (!imageArg) continue

            try {
              const dataUrl = await resolveImageDataUrl(page, imageArg)
              if (!dataUrl) continue

              const key = `img_${imageIndex}`
              images[key] = dataUrl
              pageImages.push({ key, pageNum, x: currentTransform[4], y: currentTransform[5] })
              imageIndex++
            } catch {
              continue
            }
          }
        }
      } catch {
        // ignore per-page extraction errors
      }
    }

    // Count potential header/footer lines for repeated-line suppression.
    for (const line of rawLines) {
      if (!isInHeaderFooterBand(line.y, pageHeight)) continue
      const norm = normalizeHeaderFooterLine(line.text)
      if (!norm) continue
      headerFooterCounts.set(norm, (headerFooterCounts.get(norm) ?? 0) + 1)
    }

    pages.push({ pageNum, pageHeight, lines: rawLines, images: pageImages })
  }

  const outputLines: string[] = []
  for (const page of pages) {
    const pageLines = page.lines.filter(
      (line) => !shouldDropHeaderFooterLine(line, page.pageHeight, headerFooterCounts),
    )

    if (pageLines.length === 0) {
      for (const img of page.images) outputLines.push(`[[IMAGE:${img.key}]]`)
      outputLines.push("")
      continue
    }

    const byLineIndex = new Map<number, string[]>()
    for (const img of page.images) {
      const y = typeof img.y === "number" ? img.y : pageLines[0].y
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let idx = 0; idx < pageLines.length; idx++) {
        const dist = Math.abs(pageLines[idx].y - y)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = idx
        }
      }
      const list = byLineIndex.get(bestIdx) || []
      list.push(`[[IMAGE:${img.key}]]`)
      byLineIndex.set(bestIdx, list)
    }

    for (let idx = 0; idx < pageLines.length; idx++) {
      outputLines.push(pageLines[idx].text)
      const markers = byLineIndex.get(idx)
      if (markers?.length) {
        for (const marker of markers) outputLines.push(marker)
      }
    }

    outputLines.push("")
  }

  return {
    text: outputLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    images,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const withImages = formData.get("withImages") === "true"
    const ocrMode = formData.get("ocr") || "none" // "none", "extract", "full"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF is supported by this endpoint" }, { status: 400 })
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "PDF quá lớn (tối đa 50MB)" },
        { status: 413 },
      )
    }

    // IMPORTANT: Reject very large files early to avoid memory crashes
    const fileSizeKB = file.size / 1024
    const fileSizeMB = fileSizeKB / 1024
    
    if (fileSizeKB > 15000) {
      console.warn(`[parse-pdf] File rejected: too large (${fileSizeMB.toFixed(1)} MB > 15 MB limit)`)
      return NextResponse.json(
        {
          error: `Không thể xử lý file PDF quá lớn (${fileSizeMB.toFixed(1)} MB). Giới hạn: 15 MB. Vui lòng:
1. Nén PDF (giảm chất lượng hình ảnh)
2. Chia nhỏ PDF thành nhiều file
3. Sử dụng công cụ khác để chuyển đổi PDF`,
        },
        { status: 400 },
      )
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch (bufferError) {
      console.error("[parse-pdf] Error creating buffer:", bufferError)
      return NextResponse.json(
        { error: "Lỗi đọc file. Vui lòng thử lại." },
        { status: 400 },
      )
    }

    const startTime = Date.now()

    console.log(`[parse-pdf] Starting to parse file: ${file.name} (${fileSizeKB.toFixed(2)} KB)`)

    let text = ""
    let images: Record<string, string> = {}

    const shouldTryImages = (withImages || ocrMode !== "none") && fileSizeKB < 20000

    if (shouldTryImages) {
      try {
        console.log("[parse-pdf] Extracting text+images via pdfjs...")
        const extracted = await extractTextAndImagesFromPDF(buffer, { maxImages: 20, maxPages: 50 })
        text = stripKnownFooterArtifacts(extracted.text)
        images = extracted.images

        if (Object.keys(images).length > 0) {
          console.log(`[parse-pdf] Extracted ${Object.keys(images).length} images with markers`)
        }
      } catch (pdfjsError) {
        console.warn("[parse-pdf] pdfjs extraction failed, falling back to text-only:", pdfjsError)
      }
    } else if (fileSizeKB >= 20000 && (withImages || ocrMode !== "none")) {
      console.log("[parse-pdf] Skipping image extraction for large file (>20MB)")
    }

    // Fallback: text-only extraction via pdf-parse
    if (!text) {
      try {
        console.log(`[parse-pdf] Calling pdfParse on ${fileSizeKB.toFixed(2)} KB file...`)

        let parsed: any
        try {
          parsed = await pdfParse(buffer)
        } catch (pdfError) {
          console.error("[parse-pdf] pdfParse error:", pdfError)

          const errorMsg = pdfError instanceof Error ? pdfError.message : String(pdfError)
          if (errorMsg.includes("Cannot allocate") || errorMsg.includes("memory") || errorMsg.includes("ENOMEM")) {
            console.error("[parse-pdf] Memory error detected - file may still be too large")
            return NextResponse.json(
              {
                error: `Lỗi bộ nhớ xử lý PDF. File quá lớn hoặc phức tạp. Vui lòng:
1. Nén PDF
2. Chia nhỏ file
3. Xoá các hình ảnh không cần thiết`,
              },
              { status: 400 },
            )
          }

          throw pdfError
        }

        text = stripKnownFooterArtifacts(String(parsed?.text || ""))

        if (!text) {
          console.warn("[parse-pdf] No text extracted from PDF")
          return NextResponse.json({ error: "Không trích xuất được text từ PDF" }, { status: 400 })
        }

        console.log(`[parse-pdf] Successfully extracted text: ${text.split(/\n/).length} lines`)
      } catch (parseError) {
        console.error("[parse-pdf] Error parsing PDF:", parseError)
        const errorMsg = parseError instanceof Error ? parseError.message : "Unknown parsing error"

        return NextResponse.json(
          { error: `Không đọc được file PDF: ${errorMsg}` },
          { status: 400 },
        )
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[parse-pdf] Extraction completed in ${duration}ms - Text lines: ${text.split(/\n/).length}, Images: ${Object.keys(images).length}`,
    )

    return NextResponse.json({
      text,
      images,
      metadata: {
        extractedAt: new Date().toISOString(),
        processingTimeMs: duration,
        imageCount: Object.keys(images).length,
        hasImages: Object.keys(images).length > 0,
        ocrMode,
        fileSizeKB: fileSizeKB.toFixed(2),
      },
    })
  } catch (error) {
    console.error("[parse-pdf] Unexpected error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to process PDF: ${message}` }, { status: 500 })
  }
}
