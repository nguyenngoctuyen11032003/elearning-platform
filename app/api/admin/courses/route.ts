import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const url = new URL(request.url)
    const query = url.searchParams.toString()

    const response = await fetch(
      `${BACKEND_URL}/courses/admin/all${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching admin courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
