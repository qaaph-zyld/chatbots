# Security Architecture
```mermaid
graph TD
    A[External Request] --> B[Cloudflare DDoS Protection]
    B --> C[Rate Limiting Middleware]
    C --> D[Authentication Middleware]
    D --> E[Authorization Middleware]
    E --> F[Input Validation]
    F --> G[Controller]
