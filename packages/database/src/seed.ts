import { db } from './client';
import { users, teams, teamMembers, teamScrumMasters, planningSessions, stories, votes } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('Starting database seed...');
    
    // Clear existing data to avoid conflicts
    console.log('Clearing existing data...');
    await db.delete(votes);
    await db.delete(stories);
    await db.delete(planningSessions);
    await db.delete(teamMembers);
    await db.delete(teamScrumMasters);
    await db.delete(teams);
    await db.delete(users);
    
    console.log('Creating new seed data...');
    
    // Hash passwords for all users
    const defaultPassword = await bcrypt.hash('password123', 12);
    const adminPassword = await bcrypt.hash('K6b18y63*123', 12);

    // Create test users
    const [admin, scrumMaster1, scrumMaster2, scrumMaster3, user1, user2] = await Promise.all([
      db.insert(users).values({
        email: 'claycpi@gmail.com',
        name: 'Clay Admin',
        password: adminPassword,
        role: 'ADMIN',
      }).returning(),
      db.insert(users).values({
        email: 'scrum1@example.com',
        name: 'Sarah Scrum',
        password: defaultPassword,
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'scrum2@example.com',
        name: 'Mike Master',
        password: defaultPassword,
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'scrum3@example.com',
        name: 'Lisa Lead',
        password: defaultPassword,
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'user1@example.com',
        name: 'John Doe',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user2@example.com',
        name: 'Jane Smith',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
    ]);

    // Add additional test users for pagination testing
    const [admin2, superAdmin, scrumMaster4, scrumMaster5, user3, user4, user5, user6, user7, user8, user9, user10] = await Promise.all([
      db.insert(users).values({
        email: 'admin2@example.com',
        name: 'Alex Administrator',
        password: defaultPassword,
        role: 'ADMIN',
      }).returning(),
      db.insert(users).values({
        email: 'superadmin@example.com',
        name: 'Sam SuperAdmin',
        password: defaultPassword,
        role: 'SUPER_ADMIN',
      }).returning(),
      db.insert(users).values({
        email: 'scrum4@example.com',
        name: 'Rachel Rodriguez',
        password: defaultPassword,
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'scrum5@example.com',
        name: 'David Director',
        password: defaultPassword,
        role: 'SCRUM_MASTER',
      }).returning(),
      db.insert(users).values({
        email: 'user3@example.com',
        name: 'Emily Evans',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user4@example.com',
        name: 'Robert Rodriguez',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user5@example.com',
        name: 'Maria Martinez',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user6@example.com',
        name: 'James Johnson',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user7@example.com',
        name: 'Lisa Lopez',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user8@example.com',
        name: 'Michael Miller',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user9@example.com',
        name: 'Jennifer Jackson',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
      db.insert(users).values({
        email: 'user10@example.com',
        name: 'Christopher Chen',
        password: defaultPassword,
        role: 'USER',
      }).returning(),
    ]);

    // Create test teams with more variety
    const [team1, team2, team3, team4, team5, team6, team7, team8, team9, team10, team11, team12, team13, team14, team15, team16] = await Promise.all([
      db.insert(teams).values({
        name: 'Frontend Team',
        description: 'Frontend development team focusing on React and TypeScript',
        scrumMasterId: scrumMaster1[0].id, // Sarah Smith
      }).returning(),
      db.insert(teams).values({
        name: 'Backend Team',
        description: 'Backend development team working on APIs and databases',
        scrumMasterId: scrumMaster2[0].id, // Mike Johnson
      }).returning(),
      db.insert(teams).values({
        name: 'DevOps Team',
        description: 'Infrastructure and deployment automation team',
        scrumMasterId: scrumMaster3[0].id, // Emily Davis
      }).returning(),
      db.insert(teams).values({
        name: 'QA Team',
        description: 'Quality assurance and testing team',
        scrumMasterId: scrumMaster1[0].id, // Reusing Sarah as there are only 3 
      }).returning(),
      db.insert(teams).values({
        name: 'Mobile Team',
        description: 'iOS and Android mobile app development',
        scrumMasterId: scrumMaster2[0].id, // Reusing Mike
      }).returning(),
      db.insert(teams).values({
        name: 'Data Team',
        description: 'Data analytics and machine learning team',
        scrumMasterId: null, // No assigned Scrum Master
      }).returning(),
      // New teams for pagination testing
      db.insert(teams).values({
        name: 'Security Team',
        description: 'Cybersecurity and penetration testing specialists',
        scrumMasterId: scrumMaster3[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Platform Team',
        description: 'Core platform infrastructure and shared services',
        scrumMasterId: scrumMaster1[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Product Team',
        description: 'Product management and user experience design',
        scrumMasterId: scrumMaster2[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Research Team',
        description: 'Innovation and research & development initiatives',
        scrumMasterId: null,
      }).returning(),
      db.insert(teams).values({
        name: 'Analytics Team',
        description: 'Business intelligence and data visualization',
        scrumMasterId: scrumMaster3[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Growth Team',
        description: 'User acquisition and conversion optimization',
        scrumMasterId: scrumMaster1[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Support Team',
        description: 'Customer support and technical assistance',
        scrumMasterId: null,
      }).returning(),
      db.insert(teams).values({
        name: 'Architecture Team',
        description: 'System architecture and technical strategy',
        scrumMasterId: scrumMaster2[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Integration Team',
        description: 'Third-party integrations and API partnerships',
        scrumMasterId: scrumMaster3[0].id,
      }).returning(),
      db.insert(teams).values({
        name: 'Performance Team',
        description: 'Application performance optimization and monitoring',
        scrumMasterId: null,
      }).returning(),
    ]);

    // Add team members to different teams
    await Promise.all([
      // Frontend Team members
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
      // Backend Team members
      db.insert(teamMembers).values({
        teamId: team2[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team2[0].id,
        userId: user2[0].id,
        role: 'MEMBER',
      }),
      // DevOps Team members
      db.insert(teamMembers).values({
        teamId: team3[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      // QA Team members
      db.insert(teamMembers).values({
        teamId: team4[0].id,
        userId: user2[0].id,
        role: 'MEMBER',
      }),
      // Mobile Team members
      db.insert(teamMembers).values({
        teamId: team5[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team5[0].id,
        userId: user2[0].id,
        role: 'MEMBER',
      }),
      // Data Team members (no scrum master)
      db.insert(teamMembers).values({
        teamId: team6[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      // New teams members - distributing users across teams
      // Security Team
      db.insert(teamMembers).values({
        teamId: team7[0].id,
        userId: user3[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team7[0].id,
        userId: user4[0].id,
        role: 'MEMBER',
      }),
      // Platform Team
      db.insert(teamMembers).values({
        teamId: team8[0].id,
        userId: user5[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team8[0].id,
        userId: user6[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team8[0].id,
        userId: user7[0].id,
        role: 'MEMBER',
      }),
      // Product Team
      db.insert(teamMembers).values({
        teamId: team9[0].id,
        userId: user8[0].id,
        role: 'MEMBER',
      }),
      // Research Team (smaller team)
      db.insert(teamMembers).values({
        teamId: team10[0].id,
        userId: user9[0].id,
        role: 'MEMBER',
      }),
      // Analytics Team
      db.insert(teamMembers).values({
        teamId: team11[0].id,
        userId: user10[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team11[0].id,
        userId: user3[0].id,
        role: 'MEMBER',
      }),
      // Growth Team
      db.insert(teamMembers).values({
        teamId: team12[0].id,
        userId: user4[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team12[0].id,
        userId: user5[0].id,
        role: 'MEMBER',
      }),
      // Support Team (larger team)
      db.insert(teamMembers).values({
        teamId: team13[0].id,
        userId: user6[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team13[0].id,
        userId: user7[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team13[0].id,
        userId: user8[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team13[0].id,
        userId: user9[0].id,
        role: 'MEMBER',
      }),
      // Architecture Team
      db.insert(teamMembers).values({
        teamId: team14[0].id,
        userId: user10[0].id,
        role: 'MEMBER',
      }),
      // Integration Team
      db.insert(teamMembers).values({
        teamId: team15[0].id,
        userId: user1[0].id,
        role: 'MEMBER',
      }),
      db.insert(teamMembers).values({
        teamId: team15[0].id,
        userId: user2[0].id,
        role: 'MEMBER',
      }),
      // Performance Team (no scrum master, smaller team)
      db.insert(teamMembers).values({
        teamId: team16[0].id,
        userId: user3[0].id,
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