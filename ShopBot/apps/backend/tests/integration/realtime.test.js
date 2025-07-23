const request = require('supertest');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Create Express app with Socket.IO for real-time testing
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// Mock real-time data store
const activeConnections = new Map();
const storeUpdates = new Map();
const chatSessions = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join-store', (storeId) => {
    socket.join(`store-${storeId}`);
    activeConnections.set(socket.id, { storeId, joinedAt: new Date() });
    
    // Send initial store data
    socket.emit('store-joined', {
      storeId,
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  socket.on('start-chat', (data) => {
    const { storeId, userId } = data;
    const chatId = `chat-${Date.now()}`;
    
    chatSessions.set(chatId, {
      storeId,
      userId,
      startedAt: new Date(),
      messages: []
    });

    socket.join(`chat-${chatId}`);
    socket.emit('chat-started', { chatId, storeId, userId });
  });

  socket.on('send-message', (data) => {
    const { chatId, message, sender } = data;
    const chatSession = chatSessions.get(chatId);
    
    if (chatSession) {
      const messageData = {
        id: `msg-${Date.now()}`,
        message,
        sender,
        timestamp: new Date().toISOString()
      };
      
      chatSession.messages.push(messageData);
      
      // Broadcast to chat participants
      io.to(`chat-${chatId}`).emit('message-received', messageData);
      
      // Simulate AI response for user messages
      if (sender === 'user') {
        setTimeout(() => {
          const aiResponse = {
            id: `msg-${Date.now()}`,
            message: `AI Response: I understand you said "${message}". How can I help you further?`,
            sender: 'ai',
            timestamp: new Date().toISOString()
          };
          
          chatSession.messages.push(aiResponse);
          io.to(`chat-${chatId}`).emit('message-received', aiResponse);
        }, 1000);
      }
    }
  });

  socket.on('request-sync-status', (storeId) => {
    // Simulate sync status updates
    const syncStatus = {
      storeId,
      status: 'in-progress',
      progress: 0,
      startTime: new Date().toISOString()
    };
    
    socket.emit('sync-status', syncStatus);
    
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      syncStatus.progress = progress;
      syncStatus.status = progress >= 100 ? 'completed' : 'in-progress';
      
      socket.emit('sync-status', syncStatus);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        socket.emit('sync-completed', {
          storeId,
          completedAt: new Date().toISOString(),
          results: {
            products: { synced: 150, errors: 2 },
            orders: { synced: 45, errors: 0 },
            customers: { synced: 89, errors: 1 }
          }
        });
      }
    }, 500);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    activeConnections.delete(socket.id);
  });
});

// REST endpoints for triggering real-time events
app.post('/api/realtime/store-update', (req, res) => {
  const { storeId, updateType, data } = req.body;
  
  if (!storeId || !updateType) {
    return res.status(400).json({ error: 'Store ID and update type required' });
  }

  const update = {
    storeId,
    updateType,
    data,
    timestamp: new Date().toISOString()
  };

  storeUpdates.set(`${storeId}-${Date.now()}`, update);
  
  // Broadcast to all clients in the store room
  io.to(`store-${storeId}`).emit('store-updated', update);
  
  res.json({ success: true, update });
});

app.get('/api/realtime/active-connections', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([socketId, data]) => ({
    socketId,
    ...data
  }));
  
  res.json({ connections, count: connections.length });
});

app.get('/api/realtime/chat-sessions', (req, res) => {
  const sessions = Array.from(chatSessions.entries()).map(([chatId, data]) => ({
    chatId,
    ...data,
    messageCount: data.messages.length
  }));
  
  res.json({ sessions, count: sessions.length });
});

describe('Real-time Features Integration Tests', () => {
  let serverInstance;
  let clientSocket;
  const TEST_PORT = 3001;

  beforeAll(async () => {
    await setupTestDB();
    
    // Start server for testing
    serverInstance = server.listen(TEST_PORT);
  });

  afterAll(async () => {
    await teardownTestDB();
    
    if (serverInstance) {
      serverInstance.close();
    }
  });

  beforeEach(async () => {
    await clearDatabase();
    activeConnections.clear();
    storeUpdates.clear();
    chatSessions.clear();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Socket.IO Connection Management', () => {
    test('should establish socket connection', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    test('should join store room and receive confirmation', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      clientSocket.on('connect', () => {
        clientSocket.emit('join-store', 'test-store-123');
      });

      clientSocket.on('store-joined', (data) => {
        expect(data.storeId).toBe('test-store-123');
        expect(data.status).toBe('connected');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    test('should track active connections', async () => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      await new Promise((resolve) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('join-store', 'test-store-456');
          resolve();
        });
      });

      // Wait for connection to be registered
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/realtime/active-connections')
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.connections[0].storeId).toBe('test-store-456');
    });
  });

  describe('Real-time Chat Integration', () => {
    test('should start chat session and exchange messages', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      let chatId;
      let messagesReceived = 0;

      clientSocket.on('connect', () => {
        clientSocket.emit('start-chat', {
          storeId: 'chat-store-123',
          userId: 'user-456'
        });
      });

      clientSocket.on('chat-started', (data) => {
        expect(data.storeId).toBe('chat-store-123');
        expect(data.userId).toBe('user-456');
        chatId = data.chatId;

        // Send a message
        clientSocket.emit('send-message', {
          chatId,
          message: 'Hello, I need help with my order',
          sender: 'user'
        });
      });

      clientSocket.on('message-received', (message) => {
        messagesReceived++;
        
        if (messagesReceived === 1) {
          // User message echoed back
          expect(message.sender).toBe('user');
          expect(message.message).toBe('Hello, I need help with my order');
        } else if (messagesReceived === 2) {
          // AI response
          expect(message.sender).toBe('ai');
          expect(message.message).toContain('AI Response');
          done();
        }
      });
    });

    test('should track chat sessions', async () => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      await new Promise((resolve) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('start-chat', {
            storeId: 'session-store-789',
            userId: 'user-123'
          });
          resolve();
        });
      });

      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/realtime/chat-sessions')
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.sessions[0].storeId).toBe('session-store-789');
      expect(response.body.sessions[0].userId).toBe('user-123');
    });
  });

  describe('Real-time Store Updates', () => {
    test('should broadcast store updates to connected clients', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      clientSocket.on('connect', () => {
        clientSocket.emit('join-store', 'update-store-123');
      });

      clientSocket.on('store-joined', async () => {
        // Trigger store update via REST API
        await request(app)
          .post('/api/realtime/store-update')
          .send({
            storeId: 'update-store-123',
            updateType: 'inventory',
            data: { productId: 'prod-456', newQuantity: 25 }
          });
      });

      clientSocket.on('store-updated', (update) => {
        expect(update.storeId).toBe('update-store-123');
        expect(update.updateType).toBe('inventory');
        expect(update.data.productId).toBe('prod-456');
        expect(update.data.newQuantity).toBe(25);
        done();
      });
    });

    test('should validate store update requests', async () => {
      const response = await request(app)
        .post('/api/realtime/store-update')
        .send({
          storeId: 'test-store'
          // Missing updateType
        })
        .expect(400);

      expect(response.body.error).toBe('Store ID and update type required');
    });
  });

  describe('Real-time Sync Status Updates', () => {
    test('should provide real-time sync progress updates', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      let statusUpdates = 0;
      
      clientSocket.on('connect', () => {
        clientSocket.emit('request-sync-status', 'sync-store-789');
      });

      clientSocket.on('sync-status', (status) => {
        statusUpdates++;
        expect(status.storeId).toBe('sync-store-789');
        expect(status.progress).toBeGreaterThanOrEqual(0);
        expect(status.progress).toBeLessThanOrEqual(100);
        
        if (status.status === 'completed') {
          expect(status.progress).toBe(100);
        }
      });

      clientSocket.on('sync-completed', (result) => {
        expect(result.storeId).toBe('sync-store-789');
        expect(result.results.products).toBeDefined();
        expect(result.results.orders).toBeDefined();
        expect(result.results.customers).toBeDefined();
        expect(statusUpdates).toBeGreaterThan(1); // Should have received multiple status updates
        done();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle message to non-existent chat session', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      clientSocket.on('connect', () => {
        // Try to send message to non-existent chat
        clientSocket.emit('send-message', {
          chatId: 'non-existent-chat',
          message: 'Hello',
          sender: 'user'
        });

        // Should not receive any message-received event
        setTimeout(() => {
          done(); // Test passes if no error occurs
        }, 1000);
      });

      clientSocket.on('message-received', () => {
        done(new Error('Should not receive message for non-existent chat'));
      });
    });

    test('should handle client disconnection gracefully', async () => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      
      await new Promise((resolve) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('join-store', 'disconnect-test-store');
          resolve();
        });
      });

      // Wait for connection to be registered
      await new Promise(resolve => setTimeout(resolve, 100));

      let response = await request(app)
        .get('/api/realtime/active-connections')
        .expect(200);
      
      expect(response.body.count).toBe(1);

      // Disconnect client
      clientSocket.disconnect();
      
      // Wait for disconnection to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      response = await request(app)
        .get('/api/realtime/active-connections')
        .expect(200);
      
      expect(response.body.count).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple simultaneous connections', async () => {
      const clients = [];
      const connectionPromises = [];

      // Create 5 simultaneous connections
      for (let i = 0; i < 5; i++) {
        const client = Client(`http://localhost:${TEST_PORT}`);
        clients.push(client);
        
        connectionPromises.push(new Promise((resolve) => {
          client.on('connect', () => {
            client.emit('join-store', `multi-store-${i}`);
            resolve();
          });
        }));
      }

      await Promise.all(connectionPromises);
      
      // Wait for all connections to be registered
      await new Promise(resolve => setTimeout(resolve, 200));

      const response = await request(app)
        .get('/api/realtime/active-connections')
        .expect(200);

      expect(response.body.count).toBe(5);

      // Clean up
      clients.forEach(client => client.disconnect());
    });

    test('should handle rapid message exchange', (done) => {
      clientSocket = Client(`http://localhost:${TEST_PORT}`);
      let chatId;
      let messagesReceived = 0;
      const messagesToSend = 10;

      clientSocket.on('connect', () => {
        clientSocket.emit('start-chat', {
          storeId: 'rapid-chat-store',
          userId: 'rapid-user'
        });
      });

      clientSocket.on('chat-started', (data) => {
        chatId = data.chatId;
        
        // Send multiple messages rapidly
        for (let i = 0; i < messagesToSend; i++) {
          clientSocket.emit('send-message', {
            chatId,
            message: `Rapid message ${i}`,
            sender: 'user'
          });
        }
      });

      clientSocket.on('message-received', (message) => {
        messagesReceived++;
        
        // We expect user messages + AI responses (2x the messages sent)
        if (messagesReceived >= messagesToSend * 2) {
          done();
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (messagesReceived < messagesToSend * 2) {
          done(new Error(`Only received ${messagesReceived} messages, expected ${messagesToSend * 2}`));
        }
      }, 10000);
    });
  });
});
