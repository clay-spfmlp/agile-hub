import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionInput } from '@/types/planning';

// In-memory storage for sessions (replace with database in production)
const sessions: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateSessionInput;
    
    // Validate input
    if (!body.name) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }
    
    // Generate room code (6 characters)
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create session
    const session = {
      id: uuidv4(),
      roomCode,
      name: body.name,
      description: body.description,
      createdById: 'current-user-id', // Replace with actual user ID from auth
      teamId: body.teamId,
      sprintId: body.sprintId,
      status: 'ACTIVE',
      state: 'waiting',
      settings: {
        votingScale: body.votingScale || 'fibonacci',
        timerDuration: body.timerDuration,
        autoReveal: body.autoReveal || false,
        allowRevoting: body.allowRevoting || false,
      },
      participants: [],
      stories: [],
      votes: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    };
    
    // Store session
    sessions[roomCode] = session;
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');
    
    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }
    
    const session = sessions[roomCode];
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
} 