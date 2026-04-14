import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

function normalizeErrorMessage(raw: unknown, fallback: string): string {
  if (typeof raw === "string" && raw.trim()) return raw
  if (Array.isArray(raw)) {
    const messages = raw
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean)
    if (messages.length > 0) return messages.join("; ")
  }
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return (
      normalizeErrorMessage(record.message, "") ||
      normalizeErrorMessage(record.error, "") ||
      fallback
    )
  }
  return fallback
}

function normalizeErrorCode(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const record = raw as Record<string, unknown>
  if (typeof record.code === "string" && record.code.trim()) {
    return record.code
  }
  const nestedError = record.error
  if (nestedError && typeof nestedError === "object") {
    const nestedRecord = nestedError as Record<string, unknown>
    if (typeof nestedRecord.code === "string" && nestedRecord.code.trim()) {
      return nestedRecord.code
    }
  }
  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const url = new URL(request.url)
    const query = url.searchParams.toString()

    const response = await fetch(`${API_URL}/courses${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: authHeader ? { Authorization: authHeader } : {},
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch courses from backend" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const body = await request.json()

    const response = await fetch(`${API_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({} as any))
      const code = normalizeErrorCode(errData)
      return NextResponse.json(
        {
          error: normalizeErrorMessage(errData, "Failed to create course"),
          code,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    )
  }
}
