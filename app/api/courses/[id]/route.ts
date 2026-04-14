import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

function isInvalidUuidMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("invalid input syntax for type uuid") ||
    normalized.includes("khóa học không tìm thấy") ||
    normalized.includes("khoa hoc khong tim thay")
  )
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")
    const normalizedId = String(id || "").trim()
    const encodedId = encodeURIComponent(normalizedId)
    const requestByUuid = isUuid(normalizedId)

    const requestCourse = async (url: string) => {
      return fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      })
    }

    if (authHeader) {
      const response = await requestCourse(
        requestByUuid
          ? `${BACKEND_URL}/courses/${encodedId}`
          : `${BACKEND_URL}/courses/slug/${encodedId}`,
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const message = normalizeErrorMessage(err, "Failed to fetch course")
        return NextResponse.json(
          {
            error: isInvalidUuidMessage(message)
              ? "Khóa học đã hết hạn hoặc không tồn tại."
              : message,
          },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    // Public viewers can only access the latest published version.
    let response = await requestCourse(
      requestByUuid
        ? `${BACKEND_URL}/courses/public/${encodedId}`
        : `${BACKEND_URL}/courses/slug/${encodedId}`,
    )

    // Backward compatibility: some links still store slug-like values.
    if (requestByUuid && response.status === 404) {
      response = await requestCourse(`${BACKEND_URL}/courses/slug/${encodedId}`)
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const message = normalizeErrorMessage(err, "Failed to fetch course")
      return NextResponse.json(
        {
          error: isInvalidUuidMessage(message)
            ? "Khóa học đã hết hạn hoặc không tồn tại."
            : message,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/courses/${id}`, {
      method: "PATCH",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const code = normalizeErrorCode(err)
      return NextResponse.json(
        { error: normalizeErrorMessage(err, "Failed to update course"), code },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/courses/${id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete course" },
        { status: response.status },
      )
    }

    return NextResponse.json({ message: "Đã xóa khóa học thành công" })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
