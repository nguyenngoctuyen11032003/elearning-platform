import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/quizzes/course/${courseId}`, {
      method: "GET",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quizzes" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
