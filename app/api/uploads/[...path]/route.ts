import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"
const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i

function toFallbackImage() {
  // 1x1 PNG placeholder, safe for next/image optimization pipeline.
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+X9QAAAAASUVORK5CYII="
  const pngBytes = Buffer.from(pngBase64, "base64")
  return new NextResponse(pngBytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
    },
  })
}

function expectsImage(filePath: string, request: NextRequest) {
  if (IMAGE_EXT_REGEX.test(filePath)) return true
  const accept = request.headers.get("accept") || ""
  return accept.includes("image/")
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join("/")
  const imageRequest = expectsImage(filePath, request)

  try {
    const response = await fetch(`${BACKEND_URL}/uploads/${filePath}`, {
      cache: "force-cache",
    })

    if (!response.ok) {
      if (imageRequest) {
        return toFallbackImage()
      }
      return new NextResponse(null, { status: response.status })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    if (imageRequest && !contentType.toLowerCase().startsWith("image/")) {
      return toFallbackImage()
    }
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    if (imageRequest) {
      return toFallbackImage()
    }
    return new NextResponse(null, { status: 500 })
  }
}
