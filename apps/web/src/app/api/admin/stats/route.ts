import { NextResponse } from 'next/server';
import { db } from '@/db/config';
import { users, teams, sessions, stories } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total users
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    
    // Get total teams
    const totalTeams = await db.select({ count: sql`count(*)` }).from(teams);
    
    // Get active sessions
    const activeSessions = await db
      .select({ count: sql`count(*)` })
      .from(sessions)
      .where(eq(sessions.status, 'active'));
    
    // Get total stories
    const totalStories = await db.select({ count: sql`count(*)` }).from(stories);

    return NextResponse.json({
      totalUsers: Number(totalUsers[0].count),
      totalTeams: Number(totalTeams[0].count),
      activeSessions: Number(activeSessions[0].count),
      totalStories: Number(totalStories[0].count),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
} 