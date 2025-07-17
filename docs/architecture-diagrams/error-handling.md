# Error Handling Flow
```mermaid
graph TD
    A[Controller] -->|Request| B[Service]
    B -->|Call| C[Database]
    C -->|Error| B
    B -->|Log Error| D[Centralized Logging]
    B -->|Wrap Error| E[Custom Error Class]
    E -->|Propagate| A
    A -->|Format Response| F[Error Middleware]
    F -->|HTTP Response| G[Client]
