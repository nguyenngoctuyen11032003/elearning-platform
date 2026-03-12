import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const body = await request.json()

    const response = await fetch(`${API_URL}/exams/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorPayload: any = null
      try {
        errorPayload = await response.json()
      } catch (parseError) {
        const text = await response.text()
        errorPayload = text ? { message: text } : null
      }
      return NextResponse.json(
        { error: "Failed to reject exam", details: errorPayload },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in reject API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
