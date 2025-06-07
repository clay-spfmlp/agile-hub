import { NextResponse } from 'next/server';
import { db } from '@repo/database';
import { settings } from '@repo/database';

export async function GET() {
  try {
    const appSettings = await db.select().from(settings).limit(1);
    
    if (!appSettings.length) {
      // Return default settings if none exist
      return NextResponse.json({
        defaultStoryPoints: [1, 2, 3, 5, 8, 13, 21],
        defaultTShirtSizes: ['XS', 'S', 'M', 'L', 'XL'],
        allowCustomVotes: false,
        requireVoteConfirmation: true,
        autoRevealVotes: false,
        votingTimeLimit: 60,
      });
    }

    return NextResponse.json(appSettings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      defaultStoryPoints,
      defaultTShirtSizes,
      allowCustomVotes,
      requireVoteConfirmation,
      autoRevealVotes,
      votingTimeLimit,
    } = body;

    const appSettings = await db.select().from(settings).limit(1);
    
    let updatedSettings;
    if (appSettings.length) {
      // Update existing settings
      updatedSettings = await db
        .update(settings)
        .set({
          defaultStoryPoints,
          defaultTShirtSizes,
          allowCustomVotes,
          requireVoteConfirmation,
          autoRevealVotes,
          votingTimeLimit,
        })
        .returning();
    } else {
      // Create new settings
      updatedSettings = await db
        .insert(settings)
        .values({
          defaultStoryPoints,
          defaultTShirtSizes,
          allowCustomVotes,
          requireVoteConfirmation,
          autoRevealVotes,
          votingTimeLimit,
        })
        .returning();
    }

    return NextResponse.json(updatedSettings[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 