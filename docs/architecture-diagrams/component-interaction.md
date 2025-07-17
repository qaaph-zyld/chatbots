# Component Interaction Diagram
```mermaid
graph TD
    A[Client] --> B[/api/auth/login POST]
    B --> C[Authentication Middleware]
    C --> D[Auth Controller]
    D --> E[Auth Service]
    E --> F[User Model]
    F --> G[(Database)]
    
    style B stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
```
