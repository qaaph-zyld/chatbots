# MongoDB Connection Alternatives

Last Updated: 2025-06-04 04:48:08

## Overview

This document outlines alternative MongoDB connection options to address the persistent connection issues (`ECONNREFUSED ::1:27017`) encountered in the chatbot platform.

## Current Issue

The connection tests consistently show `ECONNREFUSED` errors when attempting to connect to MongoDB at the default localhost address:

```
Error Message: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

This indicates that:
1. MongoDB is not installed locally
2. MongoDB service is not running
3. MongoDB is not accessible at the default port (27017)

## Connection Alternatives

### 1. MongoDB Memory Server

For testing purposes, MongoDB Memory Server is an excellent alternative that doesn't require an external MongoDB installation.

#### Implementation Steps:

1. Install the required package:

```bash
npm install --save-dev mongodb-memory-server
```

2. Update the MongoDB configuration to use MongoDB Memory Server for tests:

```javascript
// src/config/mongodb.js
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer;

async function getTestUri() {
  if (!mongoMemoryServer) {
    mongoMemoryServer = await MongoMemoryServer.create();
  }
  return mongoMemoryServer.getUri();
}

async function stopMemoryServer() {
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
}
```

3. Update test scripts to use MongoDB Memory Server:

```javascript
// For test scripts
const { getTestUri, stopMemoryServer } = require('../../config/mongodb');

// Before tests
process.env.MONGODB_URI = await getTestUri();

// After tests
await stopMemoryServer();
```

### 2. MongoDB Atlas (Cloud-hosted MongoDB)

For development and production, MongoDB Atlas provides a free tier that can be used without local installation.

#### Implementation Steps:

1. Sign up for a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (free tier is sufficient for development)
3. Configure network access to allow connections from your IP address
4. Create a database user with appropriate permissions
5. Get the connection string from the Atlas dashboard
6. Update your environment variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

### 3. Docker Container

Run MongoDB in a Docker container for local development.

#### Implementation Steps:

1. Install Docker from https://www.docker.com/products/docker-desktop/
2. Run MongoDB container:

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

3. Create a Docker Compose file for easier management:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=chatbots

volumes:
  mongodb_data:
```

4. Start MongoDB with Docker Compose:

```bash
docker-compose up -d
```

### 4. Remote MongoDB Server

Connect to an existing MongoDB server in your network.

#### Implementation Steps:

1. Obtain the connection details (host, port, authentication) from your database administrator
2. Update your environment variables:

```
MONGODB_URI=mongodb://<username>:<password>@<host>:<port>/<database>
```

## Implementation in the Chatbot Platform

### Update MongoDB Configuration

Update the MongoDB configuration module to support these alternatives:

```javascript
// src/config/mongodb.js

// MongoDB Memory Server support
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoMemoryServer;

async function getTestUri() {
  if (!mongoMemoryServer) {
    mongoMemoryServer = await MongoMemoryServer.create();
  }
  return mongoMemoryServer.getUri();
}

async function stopMemoryServer() {
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
}

// Get MongoDB URI from various sources
function getMongoUri() {
  // Priority order:
  // 1. Environment variable MONGODB_URI
  // 2. Environment variable DATABASE_URL
  // 3. Saved successful URI
  // 4. Default URI
  
  // Check for environment variables
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Check for saved successful URI
  try {
    const fs = require('fs');
    const path = require('path');
    const connectionResultsPath = path.join(process.cwd(), 'test-results', 'mongodb-connection.json');
    
    if (fs.existsSync(connectionResultsPath)) {
      const connectionResults = JSON.parse(fs.readFileSync(connectionResultsPath, 'utf8'));
      if (connectionResults.successfulUri) {
        return connectionResults.successfulUri;
      }
    }
  } catch (error) {
    // Ignore errors reading saved URI
  }
  
  // Default URI
  return 'mongodb://localhost:27017/chatbots';
}

module.exports = {
  getTestUri,
  stopMemoryServer,
  getMongoUri,
  // ... other exports
};
```

### Update Test Scripts

Update test scripts to use MongoDB Memory Server:

```javascript
// src/tests/scripts/simple-topic-test.js
const mongoConfig = require('../../config/mongodb');

async function setupTestDatabase() {
  // Use MongoDB Memory Server for tests
  process.env.MONGODB_URI = await mongoConfig.getTestUri();
  console.log(`Using in-memory MongoDB for tests: ${process.env.MONGODB_URI}`);
}

async function cleanupTestDatabase() {
  await mongoConfig.stopMemoryServer();
}

async function runSimpleTest() {
  try {
    await setupTestDatabase();
    
    // Test code here
    
    await cleanupTestDatabase();
  } catch (error) {
    await cleanupTestDatabase();
    throw error;
  }
}
```

## Recommended Approach for Different Environments

### Development Environment

1. **Docker Container**: Use Docker Compose to run MongoDB locally
   - Easy to set up and tear down
   - Isolated from system
   - No need to install MongoDB directly

2. **MongoDB Atlas**: Use a free tier cluster for development
   - No local installation required
   - Accessible from anywhere
   - Similar to production environment

### Testing Environment

1. **MongoDB Memory Server**: Use for automated tests
   - No external dependencies
   - Fast startup and teardown
   - Isolated test data

### Production Environment

1. **MongoDB Atlas**: Use a paid tier for production
   - Managed service with backups, monitoring, etc.
   - Scalable and reliable
   - Professional support available

2. **Self-hosted MongoDB**: Use for on-premises deployment
   - Full control over data and configuration
   - May require more maintenance
   - Good for compliance requirements

## Next Steps

1. Install MongoDB Memory Server for testing:
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

2. Update MongoDB configuration to support Memory Server

3. Update test scripts to use Memory Server

4. Create Docker Compose file for local development

5. Document MongoDB setup options in README.md
