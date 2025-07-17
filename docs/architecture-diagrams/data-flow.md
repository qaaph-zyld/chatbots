# Data Flow Diagram
```mermaid
graph LR
    A[User] -->|Request| B[API Gateway]
    B -->|Route| C[Auth Service]
    C -->|Validate| D[(User DB)]
    C -->|Issue Token| B
    B -->|Authenticated Request| E[Chatbot Service]
    E -->|Process Query| F[AI Model]
    F -->|Generate Response| E
    E -->|Log Interaction| G[(Analytics DB)]
    E -->|Cache Response| H[(Vector DB)]
    E -->|Final Response| A
