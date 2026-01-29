import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/courses/my-courses`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch courses from backend" },
        { status: response.status }
      )
    }

    const courses = await response.json()
    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching teacher courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
