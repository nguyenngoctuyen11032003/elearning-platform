import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "20"
    const sortBy = searchParams.get("sortBy") || "createdAt"

    const response = await fetch(
      `${BACKEND_URL}/reviews/course/${courseId}?page=${page}&limit=${limit}&sortBy=${sortBy}`,
      { cache: "no-store" },
    )

    if (!response.ok) {
      return NextResponse.json({ data: [], total: 0 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ data: [], total: 0 })
  }
}
