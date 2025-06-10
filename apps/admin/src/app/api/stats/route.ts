import { NextResponse } from 'next/server';
import { db, users, teams, planningSessions, stories } from '@repo/database';
import { count, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [
      totalUsers,
      totalTeams,
      activeSessions,
      totalStories
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(teams),
      db.select({ count: count() })
        .from(planningSessions)
        .where(eq(planningSessions.status, 'active')),
      db.select({ count: count() }).from(stories)
    ]);

    return NextResponse.json({
      totalUsers: totalUsers[0]?.count || 0,
      totalTeams: totalTeams[0]?.count || 0,
      activeSessions: activeSessions[0]?.count || 0,
      totalStories: totalStories[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 