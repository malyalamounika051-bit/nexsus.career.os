# Scalability Planning: Infrastructure for Growth

## Purpose
Engineering roadmap for scaling the system to support thousands of concurrent users.

## Scaling Architecture
```mermaid
graph TD
    Client[Edge CDN Client] --> LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    API1 & API2 --> Redis[Redis Shared Cache]
    API1 & API2 --> DB[(Sharded MongoDB Cluster)]
```

## Operations Plan
- **Database Sharding**: Partition MongoDB data by `user` ID, dividing document writes across active database shards.
- **Failover Routing**: OpenRouter handles API key limits, dynamically switching to alternative LLM backends if rate limits are reached.
- **Stateless Controllers**: Deployed backend functions are stateless, allowing them to scale horizontally across serverless environments.
- **Blob Storage Strategy**: Resume documents and user profile assets are stored in external object storage, keeping main database document sizes small.
