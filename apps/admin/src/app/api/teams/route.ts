import { NextResponse } from 'next/server';
import { db } from '@repo/database';
import { teams, users, teamMembers } from '@repo/database';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allTeams = await db.select().from(teams);
    
    // Get team members and scrum masters for each team
    const teamsWithMembers = await Promise.all(
      allTeams.map(async (team) => {
        const members = await db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id));

        const scrumMaster = team.scrumMasterId
          ? await db
              .select()
              .from(users)
              .where(eq(users.id, team.scrumMasterId))
              .then((result) => result[0])
          : null;

        return {
          ...team,
          members,
          scrumMaster,
        };
      })
    );

    return NextResponse.json(teamsWithMembers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, scrumMasterId } = body;

    // Validate scrum master role
    if (scrumMasterId) {
      const scrumMaster = await db
        .select()
        .from(users)
        .where(eq(users.id, scrumMasterId))
        .then((result) => result[0]);

      if (!scrumMaster || scrumMaster.role !== 'SCRUM_MASTER') {
        return NextResponse.json(
          { error: 'Invalid Scrum Master ID or user is not a Scrum Master' },
          { status: 400 }
        );
      }
    }

    const newTeam = await db
      .insert(teams)
      .values({
        name,
        description,
        scrumMasterId,
      })
      .returning();

    return NextResponse.json(newTeam[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, scrumMasterId } = body;

    // Validate scrum master role if being updated
    if (scrumMasterId) {
      const scrumMaster = await db
        .select()
        .from(users)
        .where(eq(users.id, scrumMasterId))
        .then((result) => result[0]);

      if (!scrumMaster || scrumMaster.role !== 'SCRUM_MASTER') {
        return NextResponse.json(
          { error: 'Invalid Scrum Master ID or user is not a Scrum Master' },
          { status: 400 }
        );
      }
    }

    const updatedTeam = await db
      .update(teams)
      .set({
        name,
        description,
        scrumMasterId,
      })
      .where(eq(teams.id, id))
      .returning();

    return NextResponse.json(updatedTeam[0]);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
} 