# MongoDB Connection Guide

Last Updated: 2025-06-04 04:48:08

## Current Connection Issues

The chatbot platform is experiencing persistent MongoDB connection issues:

```
Error Message: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

This indicates that MongoDB is not running or not accessible at the default localhost address.

## Quick Solutions

### Option 1: Install and Run MongoDB Locally

1. Download and install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start the MongoDB service:
   - Windows: `net start MongoDB`
   - Linux/Mac: `sudo systemctl start mongod`
3. Verify MongoDB is running: `mongo` or `mongosh`

### Option 2: Use MongoDB Memory Server for Testing (Recommended)

This in-memory MongoDB server is perfect for testing and doesn't require a separate MongoDB installation.

1. Install the package:
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

2. Run tests with the updated scripts that use MongoDB Memory Server

### Option 3: Use MongoDB Atlas (Cloud MongoDB)

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas/register
2. Create a cluster and get your connection string
3. Set your connection string as an environment variable:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
   ```

### Option 4: Use Docker

1. Install Docker from https://www.docker.com/products/docker-desktop/
2. Run MongoDB in a container:
   ```bash
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   ```

## Recommended Approach

For the chatbot platform, we recommend the following approach:

1. **For Development**: Use MongoDB Memory Server
   - No separate installation required
   - Works seamlessly with tests
   - Automatically managed by test scripts

2. **For Production**: Use MongoDB Atlas
   - Reliable and scalable
   - No need to manage infrastructure
   - Free tier available for development

## Implementation Status

We've updated the codebase to support these alternatives:

1. ✅ Created centralized MongoDB configuration
2. ✅ Added support for MongoDB Memory Server
3. ✅ Updated test scripts to use Memory Server
4. ✅ Added retry logic for connection failures
5. ✅ Improved error handling and reporting

## Next Steps

1. Install MongoDB Memory Server:
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

2. Run the updated test scripts:
   ```bash
   node src/tests/scripts/simple-topic-test.js
   ```

3. For production deployment, set up MongoDB Atlas and update the environment variable:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
   ```

## Troubleshooting

If you continue to experience connection issues:

1. Check if MongoDB is installed and running
2. Verify the connection string is correct
3. Check for network/firewall issues
4. Try using MongoDB Memory Server for testing
5. Check the test results in `test-results/manual-test-results.txt`
