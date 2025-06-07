import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This is a mock implementation. In production, you would:
// 1. Validate credentials against a database
// 2. Use proper password hashing
// 3. Implement proper session management
// 4. Use secure HTTP-only cookies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock validation - replace with actual authentication logic
    if (email === 'demo@example.com' && password === 'demo123') {
      // Set a mock session cookie
      cookies().set('session', 'mock-session-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return NextResponse.json({
        user: {
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'SCRUM_MASTER',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 