import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function GET(request: Request) {
  try {
    // Accept token from Authorization header (sent by the page) or cookie fallback
    const authHeader = request.headers.get("Authorization")
    let token: string | undefined

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
    } else {
      const cookieStore = cookies()
      token = (await cookieStore).get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/certificates/my-certificates`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([])
      }
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching my certificates:", error)
    return NextResponse.json([])
  }
}
