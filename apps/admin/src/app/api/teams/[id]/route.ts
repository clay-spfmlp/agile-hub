import { NextResponse } from 'next/server';
import { db, teams, teamMembers } from '@repo/database';
import { eq, count } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);
    
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));

    if (!team.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const memberCount = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    return NextResponse.json({
      ...team[0],
      memberCount: memberCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);
    
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, scrumMasterId } = body;

    const updatedTeam = await db
      .update(teams)
      .set({
        name,
        description,
        scrumMasterId,
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (!updatedTeam.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const memberCount = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    return NextResponse.json({
      ...updatedTeam[0],
      memberCount: memberCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);
    
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    // First, remove all team memberships
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    // Then delete the team
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    if (!deletedTeam.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedTeam[0]);
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 