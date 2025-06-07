import { NextResponse } from 'next/server';
import { db, teams, users } from '@repo/database';
import { eq, count } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, params.id));

    if (!team.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const memberCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.teamId, params.id));

    return NextResponse.json({
      ...team[0],
      memberCount: memberCount[0].count
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, scrumMasterId } = body;

    const updatedTeam = await db
      .update(teams)
      .set({
        name,
        description,
        scrumMasterId,
      })
      .where(eq(teams.id, params.id))
      .returning();

    if (!updatedTeam.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const memberCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.teamId, params.id));

    return NextResponse.json({
      ...updatedTeam[0],
      memberCount: memberCount[0].count
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
  { params }: { params: { id: string } }
) {
  try {
    // First, remove team association from all users
    await db
      .update(users)
      .set({ teamId: null })
      .where(eq(users.teamId, params.id));

    // Then delete the team
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, params.id))
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