import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/upload/document`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Failed to upload document" },
        { status: response.status },
      )
    }

    const result = await response.json()
    // Rewrite absolute backend URL to relative
    if (result?.data?.url && typeof result.data.url === "string") {
      result.data.url = result.data.url.replace(/^https?:\/\/[^/]+/, "")
    } else if (result?.url && typeof result.url === "string") {
      result.url = result.url.replace(/^https?:\/\/[^/]+/, "")
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
