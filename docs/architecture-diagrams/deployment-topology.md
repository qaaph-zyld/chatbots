# Deployment Topology
```mermaid
graph TD
    A[User] --> B[Cloudflare CDN]
    B --> C[Load Balancer]
    
    subgraph Kubernetes Cluster
        C --> D[Ingress Controller]
        D --> E[Auth Service Pod]
        D --> F[API Service Pod]
        D --> G[Chatbot Service Pod]
        D --> H[Database Proxy]
        
        E --> I[(Redis Cache)]
        F --> J[(MongoDB Cluster)]
        G --> K[(Vector Database)]
    end
