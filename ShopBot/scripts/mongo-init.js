// MongoDB initialization script for ShopBot
db = db.getSiblingDB('shopbot');

// Create application user
db.createUser({
  user: 'shopbot_app',
  pwd: 'shopbot_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'shopbot'
    }
  ]
});

// Create indexes for better performance
db.stores.createIndex({ "name": 1 });
db.stores.createIndex({ "owner": 1 });
db.stores.createIndex({ "createdAt": 1 });
db.stores.createIndex({ "isActive": 1 });

// Create sample data for development
db.stores.insertMany([
  {
    name: "Demo Store",
    description: "Sample store for testing",
    owner: "demo@shopbot.com",
    platform: "shopify",
    settings: {
      theme: "default",
      language: "en",
      currency: "USD"
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('MongoDB initialization completed for ShopBot database');
