import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop(); // Get 'reject' or 'approve'

    // Determine the backend endpoint based on the action
    let backendEndpoint = '';
    if (action === 'reject') {
      backendEndpoint = `${API_URL}/certificates/${id}/reject`;
    } else if (action === 'approve') {
      backendEndpoint = `${API_URL}/certificates/${id}/approve`;
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const response = await fetch(backendEndpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to ${action} certificate` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
