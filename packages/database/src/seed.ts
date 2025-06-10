import { db } from './client';
import { users, teams, teamMembers, teamScrumMasters, releases, sprints, stories, planningSessions, votes, settings } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Seeding database...');

  try {
    // Clear existing data first (in correct order to handle foreign keys)
    // console.log('Clearing existing data...');
    // await db.delete(votes);
    // await db.delete(stories);
    // await db.delete(planningSessions);
    // await db.delete(sprints);
    // await db.delete(releases);
    // await db.delete(teamScrumMasters);
    // await db.delete(teamMembers);
    // await db.delete(teams);
    // await db.delete(users);
    // await db.delete(settings);
    // console.log('✓ Existing data cleared');

    // Seed users with correct password hash for 'password123'
    const correctPasswordHash = '$2a$10$qCf/63n0zyN1Mv5JPQxdUevDC0mzsgzalphgKHiAJDBT/OawDe3nu';
    
    const [adminUser] = await db.insert(users).values([
      {
        email: 'admin@agilehub.com',
        name: 'Admin User',
        password: correctPasswordHash, // password123
        role: 'ADMIN'
      }
    ]).returning();

    const [scrumMaster] = await db.insert(users).values([
      {
        email: 'scrum@agilehub.com',
        name: 'John Smith',
        password: correctPasswordHash, // password123
        role: 'SCRUM_MASTER'
      }
    ]).returning();

    const developers = await db.insert(users).values([
      {
        email: 'dev1@agilehub.com',
        name: 'Alice Johnson',
        password: correctPasswordHash, // password123
        role: 'DEVELOPER'
      },
      {
        email: 'dev2@agilehub.com',
        name: 'Bob Wilson',
        password: correctPasswordHash, // password123
        role: 'DEVELOPER'
      },
      {
        email: 'dev3@agilehub.com',
        name: 'Carol Davis',
        password: correctPasswordHash, // password123
        role: 'DEVELOPER'
      }
    ]).returning();

    const [tester] = await db.insert(users).values([
      {
        email: 'tester@agilehub.com',
        name: 'David Brown',
        password: correctPasswordHash, // password123
        role: 'TESTER'
      }
    ]).returning();

    console.log('✓ Users seeded');

    // Seed teams
    const [team1] = await db.insert(teams).values([
      {
        name: 'Frontend Team',
        description: 'Responsible for user interface and user experience',
        scrumMasterId: scrumMaster.id
      }
    ]).returning();

    const [team2] = await db.insert(teams).values([
      {
        name: 'Backend Team',
        description: 'Responsible for API and backend services',
        scrumMasterId: scrumMaster.id
      }
    ]).returning();

    console.log('✓ Teams seeded');

    // Seed team members
    await db.insert(teamMembers).values([
      { teamId: team1.id, userId: developers[0].id, role: 'DEVELOPER' },
      { teamId: team1.id, userId: developers[1].id, role: 'DEVELOPER' },
      { teamId: team1.id, userId: tester.id, role: 'TESTER' },
      { teamId: team2.id, userId: developers[2].id, role: 'DEVELOPER' },
      { teamId: team2.id, userId: tester.id, role: 'TESTER' }
    ]);

    // Seed team scrum masters
    await db.insert(teamScrumMasters).values([
      { teamId: team1.id, userId: scrumMaster.id, isLead: true },
      { teamId: team2.id, userId: scrumMaster.id, isLead: true }
    ]);

    console.log('✓ Team memberships seeded');

    // Seed releases
    const [release1] = await db.insert(releases).values([
      {
        teamId: team1.id,
        name: 'User Authentication System',
        description: 'Complete user authentication and authorization system',
        version: 'v1.0.0',
        startDate: '2024-01-01',
        targetDate: '2024-03-31',
        status: 'ACTIVE',
        goals: 'Implement secure user authentication, role-based access control, and user management features'
      }
    ]).returning();

    const [release2] = await db.insert(releases).values([
      {
        teamId: team1.id,
        name: 'Dashboard and Analytics',
        description: 'Advanced dashboard with real-time analytics',
        version: 'v1.1.0',
        startDate: '2024-04-01',
        targetDate: '2024-06-30',
        status: 'PLANNING',
        goals: 'Create comprehensive dashboard with charts, metrics, and real-time data visualization'
      }
    ]).returning();

    const [release3] = await db.insert(releases).values([
      {
        teamId: team2.id,
        name: 'API Performance Optimization',
        description: 'Optimize API performance and scalability',
        version: 'v2.0.0',
        startDate: '2024-02-01',
        targetDate: '2024-04-30',
        status: 'ACTIVE',
        goals: 'Improve API response times, implement caching, and optimize database queries'
      }
    ]).returning();

    console.log('✓ Releases seeded');

    // Seed sprints
    const [sprint1] = await db.insert(sprints).values([
      {
        releaseId: release1.id,
        name: 'Sprint 1: Core Authentication',
        goal: 'Implement basic user login and registration',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        status: 'COMPLETED',
        capacity: 40,
        velocity: 38
      }
    ]).returning();

    const [sprint2] = await db.insert(sprints).values([
      {
        releaseId: release1.id,
        name: 'Sprint 2: Role Management',
        goal: 'Implement role-based access control',
        startDate: '2024-01-15',
        endDate: '2024-01-28',
        status: 'COMPLETED',
        capacity: 35,
        velocity: 35
      }
    ]).returning();

    const [sprint3] = await db.insert(sprints).values([
      {
        releaseId: release1.id,
        name: 'Sprint 3: User Profile & Settings',
        goal: 'Complete user profile management and settings',
        startDate: '2024-01-29',
        endDate: '2024-02-11',
        status: 'ACTIVE',
        capacity: 42
      }
    ]).returning();

    const [sprint4] = await db.insert(sprints).values([
      {
        releaseId: release2.id,
        name: 'Sprint 1: Dashboard Foundation',
        goal: 'Create basic dashboard structure',
        startDate: '2024-04-01',
        endDate: '2024-04-14',
        status: 'PLANNING',
        capacity: 45
      }
    ]).returning();

    const [sprint5] = await db.insert(sprints).values([
      {
        releaseId: release3.id,
        name: 'Sprint 1: Performance Analysis',
        goal: 'Analyze current API performance bottlenecks',
        startDate: '2024-02-01',
        endDate: '2024-02-14',
        status: 'COMPLETED',
        capacity: 30,
        velocity: 28
      }
    ]).returning();

    const [sprint6] = await db.insert(sprints).values([
      {
        releaseId: release3.id,
        name: 'Sprint 2: Database Optimization',
        goal: 'Optimize database queries and implement caching',
        startDate: '2024-02-15',
        endDate: '2024-02-28',
        status: 'ACTIVE',
        capacity: 35
      }
    ]).returning();

    console.log('✓ Sprints seeded');

    // Seed planning sessions
    const [session1] = await db.insert(planningSessions).values([
      {
        teamId: team1.id,
        name: 'Sprint 3 Planning Session',
        status: 'active',
        settings: {
          votingScale: 'fibonacci',
          timerDuration: 300,
          autoReveal: false,
          allowRevoting: true
        }
      }
    ]).returning();

    console.log('✓ Planning sessions seeded');

    // Seed stories
    const storiesData = [
      // Sprint 1 - Completed stories
      {
        sprintId: sprint1.id,
        sessionId: null,
        title: 'User Registration Form',
        description: 'Create a user registration form with email and password validation',
        acceptanceCriteria: 'User can register with valid email and strong password. Form shows appropriate validation errors.',
        priority: 'HIGH' as const,
        storyPoints: 8,
        status: 'DONE' as const,
        assigneeId: developers[0].id,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint1.id,
        sessionId: null,
        title: 'User Login System',
        description: 'Implement secure user login with session management',
        acceptanceCriteria: 'Users can log in with valid credentials and stay logged in across browser sessions.',
        priority: 'HIGH' as const,
        storyPoints: 13,
        status: 'DONE' as const,
        assigneeId: developers[1].id,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint1.id,
        sessionId: null,
        title: 'Password Reset Flow',
        description: 'Allow users to reset their password via email',
        acceptanceCriteria: 'Users receive reset email and can set new password securely.',
        priority: 'MEDIUM' as const,
        storyPoints: 5,
        status: 'DONE' as const,
        assigneeId: developers[0].id,
        createdById: scrumMaster.id
      },

      // Sprint 2 - Completed stories
      {
        sprintId: sprint2.id,
        sessionId: null,
        title: 'Role-Based Access Control',
        description: 'Implement different user roles with appropriate permissions',
        acceptanceCriteria: 'Admin, Scrum Master, and Developer roles have correct access levels.',
        priority: 'HIGH' as const,
        storyPoints: 21,
        status: 'DONE' as const,
        assigneeId: developers[1].id,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint2.id,
        sessionId: null,
        title: 'Admin User Management',
        description: 'Allow admins to create, edit, and deactivate users',
        acceptanceCriteria: 'Admins can manage all user accounts with proper validation and security.',
        priority: 'HIGH' as const,
        storyPoints: 13,
        status: 'DONE' as const,
        assigneeId: developers[0].id,
        createdById: scrumMaster.id
      },

      // Sprint 3 - Active sprint stories
      {
        sprintId: sprint3.id,
        sessionId: session1.id,
        title: 'User Profile Management',
        description: 'Allow users to view and edit their profile information',
        acceptanceCriteria: 'Users can update name, email, and profile picture securely.',
        priority: 'MEDIUM' as const,
        storyPoints: null, // Needs estimation
        status: 'READY' as const,
        assigneeId: null,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint3.id,
        sessionId: session1.id,
        title: 'Account Settings Page',
        description: 'Create settings page for account preferences',
        acceptanceCriteria: 'Users can change password, notification preferences, and account settings.',
        priority: 'MEDIUM' as const,
        storyPoints: null, // Needs estimation
        status: 'BACKLOG' as const,
        assigneeId: null,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint3.id,
        sessionId: session1.id,
        title: 'Two-Factor Authentication',
        description: 'Add optional 2FA for enhanced security',
        acceptanceCriteria: 'Users can enable/disable 2FA using authenticator apps or SMS.',
        priority: 'LOW' as const,
        storyPoints: null, // Needs estimation
        status: 'BACKLOG' as const,
        assigneeId: null,
        createdById: scrumMaster.id
      },

      // Sprint 6 - Backend team active sprint
      {
        sprintId: sprint6.id,
        sessionId: null,
        title: 'Database Query Optimization',
        description: 'Optimize slow database queries identified in performance analysis',
        acceptanceCriteria: 'All queries complete in under 100ms with proper indexing.',
        priority: 'HIGH' as const,
        storyPoints: 13,
        status: 'IN_PROGRESS' as const,
        assigneeId: developers[2].id,
        createdById: scrumMaster.id
      },
      {
        sprintId: sprint6.id,
        sessionId: null,
        title: 'Redis Caching Implementation',
        description: 'Implement Redis caching for frequently accessed data',
        acceptanceCriteria: 'API responses are cached appropriately with proper TTL and cache invalidation.',
        priority: 'HIGH' as const,
        storyPoints: 8,
        status: 'READY' as const,
        assigneeId: developers[2].id,
        createdById: scrumMaster.id
      },

      // Future sprint stories (no sprint assigned)
      {
        sprintId: null,
        sessionId: null,
        title: 'Real-time Dashboard Updates',
        description: 'Implement WebSocket connections for real-time dashboard updates',
        acceptanceCriteria: 'Dashboard updates in real-time without page refresh.',
        priority: 'MEDIUM' as const,
        storyPoints: null,
        status: 'BACKLOG' as const,
        assigneeId: null,
        createdById: scrumMaster.id
      },
      {
        sprintId: null,
        sessionId: null,
        title: 'Advanced Analytics Charts',
        description: 'Create interactive charts for project analytics',
        acceptanceCriteria: 'Charts display velocity, burndown, and progress metrics with filtering.',
        priority: 'MEDIUM' as const,
        storyPoints: null,
        status: 'BACKLOG' as const,
        assigneeId: null,
        createdById: scrumMaster.id
      }
    ];

    await db.insert(stories).values(storiesData);

    console.log('✓ Stories seeded');

    // Seed some sample votes for planning session stories
    const planningStories = await db.select().from(stories).where(eq(stories.sessionId, session1.id));
    
    if (planningStories.length > 0) {
      const votesData = [
        // Votes for User Profile Management story
        {
          storyId: planningStories[0].id,
          userId: developers[0].id,
          value: '8',
          confidence: 4
        },
        {
          storyId: planningStories[0].id,
          userId: developers[1].id,
          value: '5',
          confidence: 5
        },
        {
          storyId: planningStories[0].id,
          userId: tester.id,
          value: '8',
          confidence: 3
        }
      ];

      await db.insert(votes).values(votesData);
      console.log('✓ Sample votes seeded');
    }

    // Seed settings
    await db.insert(settings).values([
      {
        defaultStoryPoints: [1, 2, 3, 5, 8, 13, 21, 34],
        defaultTShirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        allowCustomVotes: true,
        requireVoteConfirmation: false,
        autoRevealVotes: false,
        votingTimeLimit: 300
      }
    ]);

    console.log('✓ Settings seeded');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${1 + 1 + 3 + 1} (Admin, Scrum Master, Developers, Tester)`);
    console.log(`   🏢 Teams: 2 (Frontend, Backend)`);
    console.log(`   🚀 Releases: 3 (Auth System, Dashboard, API Optimization)`);
    console.log(`   ⚡ Sprints: 6 (2 completed, 2 active, 2 planning)`);
    console.log(`   📝 Stories: ${storiesData.length} (across different sprints and backlog)`);
    console.log(`   🗳️  Planning Sessions: 1 active session`);
    console.log('\n🔐 Login credentials:');
    console.log('   Admin: admin@agilehub.com / password123');
    console.log('   Scrum Master: scrum@agilehub.com / password123');
    console.log('   Developer: dev1@agilehub.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 