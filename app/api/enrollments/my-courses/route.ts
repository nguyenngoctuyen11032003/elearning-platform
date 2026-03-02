import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("token")?.value

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/enrollments/my-courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array if no enrollments found
        return NextResponse.json([])
      }
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching my courses:", error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}
