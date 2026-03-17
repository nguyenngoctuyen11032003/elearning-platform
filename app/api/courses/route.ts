import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

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
      return NextResponse.json(
        {
          error:
            errData?.message ||
            errData?.error ||
            "Failed to create course",
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
