#!/bin/bash

# MVP Deployment Script
# Supports Heroku, Railway, Render, and Vercel

set -e

echo "🚀 Starting MVP Deployment Process..."

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run from project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run basic tests
echo "🧪 Running health checks..."
node -e "
const app = require('./server.js');
const http = require('http');
const server = app.listen(0, () => {
    const port = server.address().port;
    http.get(\`http://localhost:\${port}/health\`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const result = JSON.parse(data);
            if (result.status === 'healthy') {
                console.log('✅ Health check passed');
                server.close();
                process.exit(0);
            } else {
                console.log('❌ Health check failed');
                server.close();
                process.exit(1);
            }
        });
    }).on('error', (err) => {
        console.log('❌ Health check error:', err.message);
        server.close();
        process.exit(1);
    });
});
"

echo "✅ MVP is ready for deployment!"
echo ""
echo "🌐 Deployment Options:"
echo "1. Heroku: git push heroku main"
echo "2. Railway: railway up"
echo "3. Render: Connect GitHub repo"
echo "4. Vercel: vercel --prod"
echo ""
echo "📊 Health endpoint: /health"
echo "🔗 API endpoint: /api/status"
echo "🤖 Chat endpoint: /api/chatbots/:id/message"
