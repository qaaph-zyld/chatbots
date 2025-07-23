const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopbot';

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', MONGODB_URI.replace(/:([^:]+)@/, ':***@')); // Hide password in logs
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    
    // Test the connection
    await mongoose.connection.db.command({ ping: 1 });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function runMigrations() {
  try {
    await connectDB();
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.js') && file !== 'template.js')
      .sort();

    // Run each migration
    for (const file of migrationFiles) {
      try {
        console.log(`\nRunning migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up();
        console.log(`✓ ${file} completed successfully`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error);
        throw error;
      }
    }

    console.log('\nAll migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
