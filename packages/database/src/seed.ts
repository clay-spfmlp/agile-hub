import { db } from './client';
import { users, teams, teamMembers, teamScrumMasters, planningSessions, stories, votes } from './schema';

async function seed() {
  try {
    // Create test users
    const [admin, scrumMaster1, scrumMaster2, scrumMaster3, user1, user2] = await Promise.all([
      db.insert(users).values({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      }).returning(),
      db.insert(users).values({
        email: 'scrum1@example.com',
        name: 'Sarah Scrum',
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'scrum2@example.com',
        name: 'Mike Master',
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'scrum3@example.com',
        name: 'Lisa Lead',
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'user1@example.com',
        name: 'John Doe',
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user2@example.com',
        name: 'Jane Smith',
        role: 'USER',
      }).returning(),
    ]);

    // Create test teams
    const [team1, team2] = await Promise.all([
      db.insert(teams).values({
        name: 'Frontend Team',
        description: 'Frontend development team',
      }).returning(),
      db.insert(teams).values({
        name: 'Backend Team',
        description: 'Backend development team',
      }).returning(),
    ]);

    // Assign Scrum Masters to teams
    await Promise.all([
      // Frontend Team has two Scrum Masters, Sarah is the lead
      db.insert(teamScrumMasters).values({
        teamId: team1[0].id,
        userId: scrumMaster1[0].id,
        isLead: true,
      }),
      db.insert(teamScrumMasters).values({
        teamId: team1[0].id,
        userId: scrumMaster3[0].id,
        isLead: false,
      }),
      // Backend Team has two Scrum Masters, Mike is the lead
      db.insert(teamScrumMasters).values({
        teamId: team2[0].id,
        userId: scrumMaster2[0].id,
        isLead: true,
      }),
      db.insert(teamScrumMasters).values({
        teamId: team2[0].id,
        userId: scrumMaster3[0].id,
        isLead: false,
      }),
    ]);

    // Add team members
    await Promise.all([
      db.insert(teamMembers).values({
        teamId: team1[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team1[0].id,
        userId: user2[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team2[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
    ]);

    // Create planning sessions
    const [session1, session2] = await Promise.all([
      db.insert(planningSessions).values({
        teamId: team1[0].id,
        name: 'Sprint 1 Planning',
        status: 'active',
        settings: {
          votingSystem: 'fibonacci',
          autoReveal: true,
          timeLimit: 60,
        },
      }).returning(),
      db.insert(planningSessions).values({
        teamId: team2[0].id,
        name: 'Sprint 2 Planning',
        status: 'completed',
        settings: {
          votingSystem: 't-shirt',
          autoReveal: false,
          timeLimit: 90,
        },
      }).returning(),
    ]);

    // Create stories
    const [story1, story2, story3] = await Promise.all([
      db.insert(stories).values({
        sessionId: session1[0].id,
        title: 'Implement User Authentication',
        description: 'Add login and registration functionality',
        priority: 'high',
        storyPoints: 5,
        status: 'pending',
      }).returning(),
      db.insert(stories).values({
        sessionId: session1[0].id,
        title: 'Design Dashboard UI',
        description: 'Create responsive dashboard layout',
        priority: 'medium',
        storyPoints: 3,
        status: 'in_progress',
      }).returning(),
      db.insert(stories).values({
        sessionId: session2[0].id,
        title: 'API Integration',
        description: 'Integrate with external API',
        priority: 'high',
        storyPoints: 8,
        status: 'completed',
      }).returning(),
    ]);

    // Add some votes
    await Promise.all([
      db.insert(votes).values({
        storyId: story1[0].id,
        userId: user1[0].id,
        value: '5',
        confidence: 8,
      }),
      db.insert(votes).values({
        storyId: story1[0].id,
        userId: user2[0].id,
        value: '3',
        confidence: 6,
      }),
      db.insert(votes).values({
        storyId: story2[0].id,
        userId: user1[0].id,
        value: '2',
        confidence: 9,
      }),
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch(console.error); 