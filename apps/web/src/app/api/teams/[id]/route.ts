import { NextRequest, NextResponse } from 'next/server';
import { db } from '@agile-hub/database';
import { teams, teamMembers } from '@agile-hub/database/schema';
import { eq, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    // Fetch team details with member count
    const teamResult = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        scrumMasterId: teams.scrumMasterId,
        createdAt: teams.createdAt,
        membersCount: count(teamMembers.userId)
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teams.id, teamId))
      .groupBy(teams.id)
      .limit(1);

    if (teamResult.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const team = teamResult[0];

    // Check access permissions
    if (user.role !== 'ADMIN' && team.scrumMasterId !== user.id) {
      // Check if user is a member of the team
      const memberCheck = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .where(eq(teamMembers.teamId, teamId))
        .limit(1);

      if (memberCheck.length === 0) {
        return NextResponse.json(
          { error: 'Access denied. You are not a member of this team.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details' },
      { status: 500 }
    );
  }
} 