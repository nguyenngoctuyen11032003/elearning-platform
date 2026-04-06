    import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"

async function forwardToBackend(payload: unknown) {
  const targets = [
    `${BACKEND_URL}/payments/sepay/webhook`,
    `${BACKEND_URL}/sepay/webhook`,
  ]

  let lastStatus = 502
  let lastBody = ""

  for (const target of targets) {
    try {
      const response = await fetch(target, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      })

      const text = await response.text()
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "application/json"
        return new NextResponse(text || "{}", {
          status: 200,
          headers: {
            "Content-Type": contentType,
          },
        })
      }

      lastStatus = response.status
      lastBody = text

      if (response.status !== 404) {
        break
      }
    } catch (error) {
      lastStatus = 502
      lastBody = error instanceof Error ? error.message : "Webhook proxy error"
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: "Failed to forward webhook",
      backend: BACKEND_URL,
      detail: lastBody || "Unknown error",
    },
    { status: lastStatus || 502 },
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    return forwardToBackend(payload)
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON payload",
      },
      { status: 400 },
    )
  }
}
