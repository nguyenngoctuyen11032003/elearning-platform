import { NextResponse } from "next/server"

// Mock database
const courses = [
  {
    id: "1",
    title: "Lập trình Next.js từ Cơ bản đến Nâng cao",
    description: "Khóa học toàn diện về Next.js",
    price: 499000,
    instructor: "Nguyễn Ngọc Tuyền",
    students: 1250,
    rating: 4.8,
  },
  {
    id: "2",
    title: "React Hooks Advanced",
    description: "Nắm vững React Hooks",
    price: 399000,
    instructor: "Trần Minh Tuấn",
    students: 890,
    rating: 4.7,
  },
]

export async function GET() {
  return NextResponse.json(courses)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newCourse = {
    id: Date.now().toString(),
    ...body,
    students: 0,
    rating: 0,
  }
  return NextResponse.json(newCourse, { status: 201 })
}
