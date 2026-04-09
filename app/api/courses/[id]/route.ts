import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("Authorization")
    const encodedId = encodeURIComponent(id)

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
      const response = await requestCourse(`${BACKEND_URL}/courses/${encodedId}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return NextResponse.json(
          { error: normalizeErrorMessage(err, "Failed to fetch course") },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    // Public viewers can only access the latest published version.
    let response = await requestCourse(`${BACKEND_URL}/courses/public/${encodedId}`)

    // Backward compatibility: some links still store slug-like values.
    if (response.status === 404) {
      response = await requestCourse(`${BACKEND_URL}/courses/slug/${encodedId}`)
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: normalizeErrorMessage(err, "Failed to fetch course") },
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
      return NextResponse.json(
        { error: normalizeErrorMessage(err, "Failed to update course") },
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
