import { Server as SocketIOServer, Socket } from 'socket.io';

// Import the session storage from routes
import { sessions } from '../routes/planning';

interface PlanningSocket extends Socket {
  roomCode?: string;
  userId?: string;
  userName?: string;
}

interface Participant {
  id: string;
  userId: string;
  name: string;
  isGuest: boolean;
  isOnline: boolean;
  joinedAt: string;
  socketId: string;
}

export function setupPlanningSocket(io: SocketIOServer) {
  io.on('connection', (socket: PlanningSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Connect to a room for real-time updates (without joining as participant)
    socket.on('planning:connect_room', (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        
        console.log(`Client ${socket.id} connecting to room ${roomCode} for real-time updates`);
        
        // Join the socket room for real-time updates
        socket.join(roomCode);
        
        console.log(`Client ${socket.id} connected to room ${roomCode}`);
      } catch (error) {
        console.error('Error connecting to room:', error);
        socket.emit('error', { message: 'Failed to connect to room' });
      }
    });

    // Join a planning session room
    socket.on('planning:join', async (data: { roomCode: string; name?: string; userId?: string; guestId?: string }) => {
      try {
        const { roomCode, name, userId, guestId } = data;
        
        // Find the session
        const session = sessions[roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Store user info on socket
        socket.roomCode = roomCode;
        socket.userId = userId || guestId || `guest_${socket.id}`;
        socket.userName = name || 'Anonymous';

        // Join the socket room
        socket.join(roomCode);

        // Check if participant already exists (could be from HTTP join or previous WebSocket connection)
        const existingParticipant = session.participants.find((p: any) => 
          p.id === socket.userId || p.id === guestId || (p.name === socket.userName && p.isGuest)
        );

        if (!existingParticipant) {
          // Add new participant to session
          const participant = {
            id: socket.userId!,
            userId: socket.userId!,
            name: socket.userName!,
            isGuest: !userId,
            isOnline: true,
            joinedAt: new Date().toISOString(),
            socketId: socket.id
          };

          session.participants.push(participant);

          console.log(`Broadcasting participant_joined event to room ${roomCode} for new WebSocket participant ${participant.name}`);
          console.log(`Room ${roomCode} now has ${session.participants.length} participants`);

          // Notify all clients in the room about the new participant
          io.to(roomCode).emit('planning:participant_joined', {
            participant,
            session: {
              ...session,
              participantCount: session.participants.length
            }
          });
        } else {
          // Update existing participant as online (they might have joined via HTTP first)
          existingParticipant.isOnline = true;
          existingParticipant.socketId = socket.id;
          if (!existingParticipant.userId) {
            existingParticipant.userId = socket.userId;
          }
          
          console.log(`Participant ${socket.userName} reconnected to room ${roomCode} via WebSocket`);
          
          // Notify room about participant coming online
          io.to(roomCode).emit('planning:participant_joined', {
            participant: existingParticipant,
            session: {
              ...session,
              participantCount: session.participants.filter((p: any) => p.isOnline).length
            }
          });
        }

        // Send current session state to the joining client
        socket.emit('planning:session_joined', {
          ...session,
          participantCount: session.participants.length
        });

        console.log(`User ${socket.userName} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Cast a vote
    socket.on('planning:vote_cast', (data: { sessionId: string; storyId: string; vote: { value: string; confidence: number } }) => {
      try {
        const { sessionId, storyId, vote } = data;
        
        if (!socket.roomCode || !socket.userId) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Store the vote
        if (!session.votes) {
          session.votes = {};
        }

        const voteKey = `${socket.userId}_${storyId}`;
        session.votes[voteKey] = {
          userId: socket.userId,
          userName: socket.userName,
          storyId,
          value: vote.value,
          confidence: vote.confidence,
          timestamp: new Date().toISOString()
        };

        // Notify room about vote (without revealing the value)
        io.to(socket.roomCode).emit('planning:vote_cast', {
          userId: socket.userId,
          userName: socket.userName,
          storyId,
          hasVoted: true
        });

        console.log(`Vote cast by ${socket.userName} in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error casting vote:', error);
        socket.emit('error', { message: 'Failed to cast vote' });
      }
    });

    // Reveal votes (with corrected event name and parameters)
    socket.on('planning:votes_revealed', (data: { sessionId: string; storyId?: string }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Use current story ID if not provided
        const storyId = data.storyId || session.currentStoryId;
        
        // Get votes for the story
        const storyVotes = Object.values(session.votes || {}).filter((vote: any) => 
          vote.storyId === storyId
        );

        // Update session state
        session.state = 'revealing';

        // Broadcast votes to all participants
        io.to(socket.roomCode).emit('planning:votes_revealed', {
          storyId: storyId,
          votes: storyVotes,
          session: {
            ...session,
            participantCount: session.participants.length
          }
        });

        console.log(`Votes revealed for story ${storyId} in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error revealing votes:', error);
        socket.emit('error', { message: 'Failed to reveal votes' });
      }
    });

    // Reset voting for new story
    socket.on('planning:reset_voting', (data: { storyId?: string }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Clear votes
        session.votes = {};
        session.state = 'voting';
        if (data.storyId) {
          session.currentStoryId = data.storyId;
        }

        // Broadcast reset to all participants
        io.to(socket.roomCode).emit('planning:voting_reset', {
          storyId: data.storyId,
          session: {
            ...session,
            participantCount: session.participants.length
          }
        });

        console.log(`Voting reset in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error resetting votes:', error);
        socket.emit('error', { message: 'Failed to reset voting' });
      }
    });

    // Create a new story
    socket.on('planning:story_created', (data: { sessionId: string; story: any }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Create new story
        const newStory = {
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.story.title,
          description: data.story.description || '',
          acceptance: data.story.acceptance || '',
          priority: data.story.priority || 'MEDIUM',
          status: data.story.status || 'READY',
          storyPoints: null,
          createdById: socket.userId || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Initialize stories array if it doesn't exist
        if (!session.stories) {
          session.stories = [];
        }

        session.stories.push(newStory);

        // If this is the first story, select it automatically
        if (session.stories.length === 1) {
          session.currentStoryId = newStory.id;
        }

        // Broadcast story creation to all participants
        io.to(socket.roomCode).emit('planning:session_updated', {
          ...session,
          participantCount: session.participants.length
        });

        console.log(`Story created: ${newStory.title} in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error creating story:', error);
        socket.emit('error', { message: 'Failed to create story' });
      }
    });

    // Update a story
    socket.on('planning:story_updated', (data: { sessionId: string; storyId: string; updates: any }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Find and update the story
        const storyIndex = session.stories?.findIndex((story: any) => story.id === data.storyId);
        if (storyIndex !== undefined && storyIndex >= 0 && session.stories) {
          session.stories[storyIndex] = {
            ...session.stories[storyIndex],
            ...data.updates,
            updatedAt: new Date().toISOString()
          };

          // Broadcast story update to all participants
          io.to(socket.roomCode).emit('planning:session_updated', {
            ...session,
            participantCount: session.participants.length
          });

          console.log(`Story updated: ${data.storyId} in room ${socket.roomCode}`);
        } else {
          socket.emit('error', { message: 'Story not found' });
        }
      } catch (error) {
        console.error('Error updating story:', error);
        socket.emit('error', { message: 'Failed to update story' });
      }
    });

    // Start voting for a story
    socket.on('planning:voting_started', (data: { sessionId: string; storyId: string }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Update session state
        session.state = 'voting';
        session.currentStoryId = data.storyId;
        session.votes = {}; // Clear previous votes

        // Broadcast voting started to all participants
        io.to(socket.roomCode).emit('planning:session_updated', {
          ...session,
          participantCount: session.participants.length
        });

        console.log(`Voting started for story ${data.storyId} in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error starting voting:', error);
        socket.emit('error', { message: 'Failed to start voting' });
      }
    });

    // Stop voting
    socket.on('planning:voting_stopped', (data: { sessionId: string }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Update session state
        session.state = 'discussing';

        // Broadcast voting stopped to all participants
        io.to(socket.roomCode).emit('planning:session_updated', {
          ...session,
          participantCount: session.participants.length
        });

        console.log(`Voting stopped in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error stopping voting:', error);
        socket.emit('error', { message: 'Failed to stop voting' });
      }
    });

    // Select a story for estimation
    socket.on('planning:story_selected', (data: { sessionId: string; storyId: string }) => {
      try {
        if (!socket.roomCode) {
          socket.emit('error', { message: 'Not joined to a session' });
          return;
        }

        const session = sessions[socket.roomCode];
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Update current story
        session.currentStoryId = data.storyId;
        session.state = 'waiting'; // Reset to waiting state
        session.votes = {}; // Clear previous votes

        // Broadcast story selection to all participants
        io.to(socket.roomCode).emit('planning:session_updated', {
          ...session,
          participantCount: session.participants.length
        });

        console.log(`Story selected: ${data.storyId} in room ${socket.roomCode}`);
      } catch (error) {
        console.error('Error selecting story:', error);
        socket.emit('error', { message: 'Failed to select story' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (${socket.userName} from room ${socket.roomCode})`);
      
      if (socket.roomCode && socket.userId) {
        const session = sessions[socket.roomCode];
        if (session) {
          // Mark participant as offline
          const participant = session.participants.find((p: Participant) => p.socketId === socket.id);
          if (participant) {
            participant.isOnline = false;
            console.log(`Marking participant ${participant.name} as offline in room ${socket.roomCode}`);

            // Notify room about participant going offline
            const updatedSession = {
              ...session,
              participantCount: session.participants.filter((p: Participant) => p.isOnline).length
            };

            console.log(`Broadcasting participant_left event to room ${socket.roomCode}`);
            io.to(socket.roomCode).emit('planning:participant_left', {
              participantId: participant.id,
              participantName: participant.name,
              session: updatedSession
            });
          }
        }
      }
    });

    // Handle explicit leave
    socket.on('planning:leave', (data: { roomCode: string }) => {
      console.log(`User ${socket.userName} explicitly leaving room ${data.roomCode}`);
      
      if (socket.roomCode) {
        const session = sessions[socket.roomCode];
        if (session) {
          const participant = session.participants.find((p: Participant) => p.socketId === socket.id);
          if (participant) {
            participant.isOnline = false;
            
            // Notify room about participant leaving
            io.to(socket.roomCode).emit('planning:participant_left', {
              participantId: participant.id,
              participantName: participant.name,
              session: {
                ...session,
                participantCount: session.participants.filter((p: Participant) => p.isOnline).length
              }
            });
          }
        }
        
        socket.leave(socket.roomCode);
        socket.roomCode = undefined;
        socket.userId = undefined;
        socket.userName = undefined;
      }
    });
  });
} 