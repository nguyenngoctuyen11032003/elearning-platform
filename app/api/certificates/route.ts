import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  const certificate = {
    id: Date.now().toString(),
    userId: body.userId,
    courseId: body.courseId,
    certificateNumber: `CERT-${Date.now()}`,
    issuedAt: new Date().toISOString(),
    certificateUrl: `/certificates/${Date.now()}.pdf`,
  }

  return NextResponse.json(certificate, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  // Mock certificates
  const certificates = [
    {
      id: "1",
      userId,
      courseId: "1",
      certificateNumber: "CERT-2024-001",
      issuedAt: "2024-03-15",
      courseName: "Lập trình Next.js",
    },
  ]

  return NextResponse.json(certificates)
}
