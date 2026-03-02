import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

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

    const response = await fetch(`${BACKEND_URL}/api/lessons/${id}/publish`, {
      method: "PATCH",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.message || "Failed to toggle publish" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error toggling publish:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
