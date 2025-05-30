# Local Storage Implementation

This directory contains the local storage implementation for the Open-Source Chatbots Platform. The local storage service provides a way to store and retrieve chatbot data locally without relying on external services.

## Features

- **Multiple Storage Backends**: Supports both file-based and SQLite storage options
- **Document-Oriented API**: Simple API for storing, retrieving, querying, and deleting data
- **Collection-Based Organization**: Data is organized into collections (users, bots, conversations, etc.)
- **Query Capabilities**: Supports filtering, sorting, pagination, and advanced query operators
- **Automatic ID Generation**: Automatically generates UUIDs for new items if not provided
- **Timestamp Management**: Automatically adds and updates timestamps for created and modified items

## Configuration

The local storage service can be configured using environment variables:

- `LOCAL_STORAGE_TYPE`: Storage backend type ('file' or 'sqlite', default: 'file')
- `LOCAL_STORAGE_PATH`: Base path for file storage (default: './data')
- `SQLITE_DB_PATH`: Path to SQLite database file (default: './data/chatbot.db')

Example in `.env` file:
```
LOCAL_STORAGE_TYPE=sqlite
LOCAL_STORAGE_PATH=./data
SQLITE_DB_PATH=./data/chatbot.db
```

## Usage

### Basic Usage

```javascript
const { localStorageService } = require('./storage');

// Initialize the storage service
await localStorageService.initialize();

// Store data
const user = await localStorageService.store('users', 'user123', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Retrieve data
const retrievedUser = await localStorageService.retrieve('users', 'user123');

// Query data
const users = await localStorageService.query('users', { name: 'John Doe' });

// Delete data
await localStorageService.delete('users', 'user123');
```

### Advanced Queries

```javascript
// Query with operators
const recentConversations = await localStorageService.query('conversations', {
  created_at: { $gt: Date.now() - 86400000 } // Conversations from the last 24 hours
});

// Sorting and pagination
const sortedMessages = await localStorageService.query('messages', 
  { conversation_id: 'conv123' },
  { sort: { created_at: 1 }, limit: 10, offset: 20 }
);
```

## Collections

The local storage service supports the following collections:

- **users**: User profiles and preferences
- **bots**: Chatbot configurations and settings
- **conversations**: Conversation metadata and state
- **messages**: Individual messages within conversations
- **settings**: Application settings and configurations

## Storage Structure

### File Storage

When using file-based storage, data is organized as follows:

```
data/
  ├── users/
  │   ├── user123.json
  │   └── ...
  ├── bots/
  │   ├── bot123.json
  │   └── ...
  ├── conversations/
  │   ├── conv123.json
  │   └── ...
  ├── messages/
  │   ├── msg123.json
  │   └── ...
  └── settings/
      ├── setting123.json
      └── ...
```

### SQLite Storage

When using SQLite storage, data is stored in tables with the following schema:

- **users**: id, name, email, created_at, updated_at, data
- **bots**: id, name, description, created_at, updated_at, data
- **conversations**: id, user_id, bot_id, title, created_at, updated_at, data
- **messages**: id, conversation_id, user_id, bot_id, content, type, created_at, data
- **settings**: id, key, value, updated_at

## Performance Considerations

- **File Storage**: Better for small to medium datasets and development environments
- **SQLite Storage**: Better for larger datasets and production environments with query-heavy workloads

## Error Handling

The local storage service includes robust error handling and logging. All errors are logged with appropriate context to help with debugging.

## Dependencies

- **fs.promises**: For file system operations
- **path**: For path manipulation
- **sqlite3** and **sqlite**: For SQLite database operations
- **uuid**: For generating unique identifiers
- **logger**: For logging errors and information

## Extending

To add a new storage backend:

1. Add a new storage type option (e.g., 'mongodb')
2. Implement initialization, store, retrieve, query, and delete methods for the new backend
3. Update the constructor to handle the new storage type

## License

This component is licensed under the MIT License, the same as the main project.
