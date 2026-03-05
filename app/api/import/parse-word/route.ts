import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)

    // 1. Read relationships to map rId → image file path
    const relsFile = zip.file("word/_rels/document.xml.rels")
    const ridToDataUrl: Record<string, string> = {}

    if (relsFile) {
      const relsXml = await relsFile.async("text")
      const relMatches = [...relsXml.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Type="[^"]*\/image"[^>]+Target="([^"]+)"[^>]*\/?>/gi)]
      await Promise.all(relMatches.map(async ([, rId, target]) => {
        const imagePath = target.startsWith("../") ? target.slice(3) : target.startsWith("media/") ? `word/${target}` : target
        const imageFile = zip.file(imagePath) || zip.file(`word/${target}`)
        if (imageFile) {
          const bytes = await imageFile.async("uint8array")
          const base64 = Buffer.from(bytes).toString("base64")
          const ext = imagePath.split(".").pop()?.toLowerCase() || "jpeg"
          const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg"
          ridToDataUrl[rId] = `data:${mime};base64,${base64}`
        }
      }))
    }

    console.log(`[parse-word] Loaded ${Object.keys(ridToDataUrl).length} images from relationships`)

    // 2. Parse document.xml paragraph by paragraph, preserving image positions
    const docFile = zip.file("word/document.xml")
    if (!docFile) throw new Error("document.xml not found in Word file")

    const docXml = await docFile.async("text")

    // Split into paragraphs (w:p elements)
    const paragraphs = [...docXml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0])

    const finalImageMap: Record<string, string> = {}
    const ridToKey: Record<string, string> = {}
    let imgCounter = 0
    const lines: string[] = []

    for (const para of paragraphs) {
      // Find all image references in this paragraph (works for both inline wp:inline and floating wp:anchor)
      const blipMatches = [...para.matchAll(/r:embed="([^"]+)"/g)]
      const imageKeys: string[] = []

      for (const [, rId] of blipMatches) {
        if (ridToDataUrl[rId]) {
          if (!ridToKey[rId]) {
            const key = `img_${imgCounter++}`
            ridToKey[rId] = key
            finalImageMap[key] = ridToDataUrl[rId]
          }
          imageKeys.push(`[[IMAGE:${ridToKey[rId]}]]`)
        }
      }

      // Extract text from this paragraph
      const textParts = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1])
      const paraText = textParts.join("").trim()

      if (paraText) lines.push(paraText)
      imageKeys.forEach(k => lines.push(k))
    }

    const text = lines.join("\n").replace(/\n\n+/g, "\n").trim()
    console.log(`[parse-word] Extracted ${lines.length} lines, ${Object.keys(finalImageMap).length} images`)
    const imageMarkerLines = lines.filter(l => l.startsWith("[[IMAGE:"))
    console.log("[parse-word] Image marker lines:", imageMarkerLines)

    if (!text) {
      return NextResponse.json({ error: "No text extracted from document" }, { status: 400 })
    }

    return NextResponse.json({ text, images: finalImageMap })
  } catch (error) {
    console.error("Error parsing Word document:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to parse document: " + errorMessage },
      { status: 500 }
    )
  }
}
