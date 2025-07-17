# CI/CD Pipeline
```mermaid
graph LR
    A[GitHub] -->|Push| B[CI Pipeline]
    B --> C[Linting & Formatting]
    C --> D[Unit Tests]
    D --> E[Integration Tests]
    E --> F[Build Artifacts]
    F --> G[Deployment]
    
    subgraph Environments
        G --> H[Staging]
        H --> I[E2E Tests]
        I --> J[Production]
    end
