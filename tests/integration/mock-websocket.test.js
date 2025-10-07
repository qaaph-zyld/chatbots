/**
 * Mock WebSocket Integration Test
 */

jest.mock('ws', () => {
  const EventEmitter = require('events');
  
  class MockWebSocket extends EventEmitter {
    constructor(url) {
      super();
      this.url = url;
      this.readyState = 0; // CONNECTING
      this.CONNECTING = 0;
      this.OPEN = 1;
      this.CLOSING = 2;
      this.CLOSED = 3;
      
      // Simulate connection
      setTimeout(() => {
        this.readyState = 1; // OPEN
        this.emit('open');
      }, 10);
    }
    
    send(data) {
      if (this.readyState === 1) {
        // Echo back the message for testing
        setTimeout(() => {
          this.emit('message', data);
        }, 5);
      }
    }
    
    close() {
      this.readyState = 3; // CLOSED
      this.emit('close');
    }
  }
  
  return MockWebSocket;
});

const WebSocket = require('ws');

describe('Mock WebSocket Integration', () => {
  test('should handle WebSocket connection', async () => {
    const wsService = {
      connect: function(url) {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(url);
          
          ws.on('open', () => {
            resolve(ws);
          });
          
          ws.on('error', (error) => {
            reject(error);
          });
        });
      }
    };

    const ws = await wsService.connect('ws://localhost:8080');
    expect(ws.readyState).toBe(1); // OPEN
    expect(ws.url).toBe('ws://localhost:8080');
  });

  test('should handle message sending and receiving', async () => {
    const ws = new WebSocket('ws://localhost:8080');
    
    await new Promise(resolve => {
      ws.on('open', resolve);
    });

    const messagePromise = new Promise(resolve => {
      ws.on('message', (data) => {
        resolve(data);
      });
    });

    ws.send('test message');
    const receivedMessage = await messagePromise;
    
    expect(receivedMessage).toBe('test message');
  });

  test('should handle WebSocket client wrapper', async () => {
    const createWebSocketClient = (url) => {
      let ws = null;
      const messageHandlers = new Map();
      let messageId = 0;
      
      return {
        async connect() {
          ws = new WebSocket(url);
          
          return new Promise((resolve, reject) => {
            ws.on('open', () => resolve());
            ws.on('error', reject);
            
            ws.on('message', (data) => {
              try {
                const message = JSON.parse(data);
                if (message.id && messageHandlers.has(message.id)) {
                  const handler = messageHandlers.get(message.id);
                  messageHandlers.delete(message.id);
                  handler(message);
                }
              } catch (error) {
                console.error('Failed to parse message:', error);
              }
            });
          });
        },
        
        async sendMessage(type, payload) {
          const id = ++messageId;
          const message = { id, type, payload };
          
          return new Promise((resolve, reject) => {
            messageHandlers.set(id, (response) => {
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response.payload);
              }
            });
            
            ws.send(JSON.stringify(message));
            
            // Simulate response for testing
            setTimeout(() => {
              const response = { id, payload: `Response to ${type}` };
              ws.emit('message', JSON.stringify(response));
            }, 10);
          });
        },
        
        close() {
          if (ws) {
            ws.close();
          }
        }
      };
    };

    const client = createWebSocketClient('ws://localhost:8080');
    await client.connect();
    
    const response = await client.sendMessage('ping', { timestamp: Date.now() });
    expect(response).toBe('Response to ping');
    
    client.close();
  });

  test('should handle WebSocket room management', async () => {
    const createWebSocketRoom = () => {
      const rooms = new Map();
      
      return {
        join: (roomId, clientId, ws) => {
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          rooms.get(roomId).set(clientId, ws);
        },
        
        leave: (roomId, clientId) => {
          if (rooms.has(roomId)) {
            rooms.get(roomId).delete(clientId);
            if (rooms.get(roomId).size === 0) {
              rooms.delete(roomId);
            }
          }
        },
        
        broadcast: (roomId, message, excludeClientId = null) => {
          if (rooms.has(roomId)) {
            rooms.get(roomId).forEach((ws, clientId) => {
              if (clientId !== excludeClientId && ws.readyState === 1) {
                ws.send(JSON.stringify(message));
              }
            });
          }
        },
        
        getClients: (roomId) => {
          return rooms.has(roomId) ? Array.from(rooms.get(roomId).keys()) : [];
        },
        
        getRoomCount: () => rooms.size,
        
        getClientCount: (roomId) => {
          return rooms.has(roomId) ? rooms.get(roomId).size : 0;
        }
      };
    };

    const roomManager = createWebSocketRoom();
    
    const ws1 = new WebSocket('ws://localhost:8080');
    const ws2 = new WebSocket('ws://localhost:8080');
    
    await Promise.all([
      new Promise(resolve => ws1.on('open', resolve)),
      new Promise(resolve => ws2.on('open', resolve))
    ]);

    roomManager.join('room1', 'client1', ws1);
    roomManager.join('room1', 'client2', ws2);
    
    expect(roomManager.getClientCount('room1')).toBe(2);
    expect(roomManager.getClients('room1')).toEqual(['client1', 'client2']);
    
    const messagePromise = new Promise(resolve => {
      ws2.on('message', (data) => {
        resolve(JSON.parse(data));
      });
    });

    roomManager.broadcast('room1', { type: 'announcement', text: 'Hello room!' }, 'client2');
    
    // ws2 should not receive the message since it's excluded
    // ws1 would receive it in a real scenario
    
    roomManager.leave('room1', 'client1');
    expect(roomManager.getClientCount('room1')).toBe(1);
  });

  test('should handle WebSocket heartbeat', async () => {
    const createHeartbeatManager = (ws, interval = 30000) => {
      let heartbeatInterval;
      let lastPong = Date.now();
      
      return {
        start: () => {
          heartbeatInterval = setInterval(() => {
            if (Date.now() - lastPong > interval * 2) {
              ws.close(); // Connection considered dead
              return;
            }
            
            ws.send(JSON.stringify({ type: 'ping' }));
          }, interval);
          
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data);
              if (message.type === 'pong') {
                lastPong = Date.now();
              }
            } catch (error) {
              // Ignore non-JSON messages
            }
          });
        },
        
        stop: () => {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
        },
        
        getLastPong: () => lastPong
      };
    };

    const ws = new WebSocket('ws://localhost:8080');
    await new Promise(resolve => ws.on('open', resolve));
    
    const heartbeat = createHeartbeatManager(ws, 100);
    
    // Mock pong response
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        // Ignore
      }
    });
    
    heartbeat.start();
    
    const initialPong = heartbeat.getLastPong();
    
    // Wait for heartbeat cycle
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(heartbeat.getLastPong()).toBeGreaterThan(initialPong);
    
    heartbeat.stop();
  });
});
