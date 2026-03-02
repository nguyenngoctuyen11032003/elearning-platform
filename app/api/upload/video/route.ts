import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/api/upload/video`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Failed to upload video" },
        { status: response.status },
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error uploading video:", error)
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
  }
}
