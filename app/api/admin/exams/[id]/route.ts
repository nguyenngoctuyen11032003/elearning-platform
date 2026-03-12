import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    const response = await fetch(`${API_URL}/exams/${id}/admin`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorPayload: any = null
      try {
        errorPayload = await response.json()
      } catch {
        const text = await response.text()
        errorPayload = text ? { message: text } : null
      }
      return NextResponse.json(
        { error: "Failed to delete exam", details: errorPayload },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin delete exam route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
