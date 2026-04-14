import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

function pickErrorCode(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const record = raw as Record<string, unknown>
  const code =
    (typeof record.code === "string" && record.code) ||
    (record.error && typeof record.error === "object" && typeof (record.error as Record<string, unknown>).code === "string"
      ? ((record.error as Record<string, unknown>).code as string)
      : "")
  return code || undefined
}

function pickErrorMessage(raw: unknown): string | undefined {
  if (typeof raw === "string" && raw.trim()) return raw
  if (Array.isArray(raw)) {
    const first = raw.find((item) => typeof item === "string" && item.trim())
    return typeof first === "string" ? first : undefined
  }
  if (!raw || typeof raw !== "object") return undefined
  const record = raw as Record<string, unknown>
  return (
    pickErrorMessage(record.message) ||
    pickErrorMessage(record.error)
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/courses/${id}/submit`, {
      method: "PATCH",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const message = pickErrorMessage(err) || "Failed to submit course"
      const code = pickErrorCode(err)
      return NextResponse.json(
        { error: message, code },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error submitting course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
