import { NextResponse } from 'next/server';
import { db } from '@repo/database';
import { users, teams } from '@repo/database';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    
    // Get teams for each user
    const usersWithTeams = await Promise.all(
      allUsers.map(async (user) => {
        const managedTeams = user.role === 'SCRUM_MASTER'
          ? await db
              .select()
              .from(teams)
              .where(eq(teams.scrumMasterId, user.id))
          : [];

        return {
          ...user,
          managedTeams,
        };
      })
    );

    return NextResponse.json(usersWithTeams);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, role } = body;

    // Validate role
    if (role && !['USER', 'SCRUM_MASTER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either USER or SCRUM_MASTER' },
        { status: 400 }
      );
    }

    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        role: role || 'USER',
      })
      .returning();

    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, email, name, role } = body;

    // Validate role
    if (role && !['USER', 'SCRUM_MASTER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either USER or SCRUM_MASTER' },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        email,
        name,
        role,
      })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 