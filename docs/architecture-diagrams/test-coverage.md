# Test Coverage Map
```mermaid
graph TD
    A[Test Coverage] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[End-to-End Tests]
    A --> E[Playwright UI Tests]
    
    B --> F[Controller Layer]
    B --> G[Service Layer]
    B --> H[Utility Functions]
    
    C --> I[API Routes]
    C --> J[Database Interactions]
    C --> K[External Services]
