import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // Simulate payment processing
  const enrollment = {
    id: Date.now().toString(),
    userId: body.userId,
    courseId: body.courseId,
    status: "active",
    enrolledAt: new Date().toISOString(),
    progress: 0,
  }

  return NextResponse.json(enrollment, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  // Mock enrollments
  const enrollments = [
    {
      id: "1",
      userId,
      courseId: "1",
      status: "active",
      enrolledAt: "2024-01-15",
      progress: 65,
    },
    {
      id: "2",
      userId,
      courseId: "2",
      status: "active",
      enrolledAt: "2024-02-20",
      progress: 40,
    },
  ]

  return NextResponse.json(enrollments)
}
