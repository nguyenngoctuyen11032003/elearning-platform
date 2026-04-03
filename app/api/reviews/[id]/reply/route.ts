import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/reviews/${id}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error replying review:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
