# Monitoring and Alerting Guide

## Overview

This document provides comprehensive information about the monitoring and alerting system for the Chatbot Platform. It covers metrics collection, alerting rules, dashboards, and incident response procedures.

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Key Metrics](#key-metrics)
3. [Alerting Rules](#alerting-rules)
4. [Dashboards](#dashboards)
5. [Health Checks](#health-checks)
6. [Logging](#logging)
7. [Incident Response](#incident-response)
8. [Monitoring Tools](#monitoring-tools)
9. [Best Practices](#best-practices)

## Monitoring Architecture

The Chatbot Platform uses a comprehensive monitoring architecture based on the following components:

- **Prometheus**: For metrics collection and storage
- **Grafana**: For visualization and dashboards
- **AlertManager**: For alert routing and notification
- **Node Exporter**: For host-level metrics
- **Loki**: For log aggregation
- **Tempo**: For distributed tracing

### Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Chatbot    │     │  Database   │     │   Cache     │
│  Platform   │     │  Server     │     │   Server    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Expose            │ Expose            │ Expose
       │ Metrics           │ Metrics           │ Metrics
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    Prometheus                        │
└──────────────────────────┬──────────────────────────┘
                           │
                           │ Query
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐    ┌─────────▼──────────┐
    │      Grafana       │    │    AlertManager    │
    └────────────────────┘    └─────────┬──────────┘
                                        │
                                        │ Notify
                                        │
                              ┌─────────▼──────────┐
                              │  Slack / Email /   │
                              │  PagerDuty         │
                              └────────────────────┘
```

## Key Metrics

The following key metrics are collected and monitored:

### System Metrics

- **CPU Usage**: Per pod and node
- **Memory Usage**: Per pod and node
- **Disk Usage**: Per node
- **Network Traffic**: Inbound and outbound

### Application Metrics

- **Request Rate**: Requests per second
- **Error Rate**: Percentage of requests resulting in errors
- **Latency**: Response time (p50, p90, p99)
- **Saturation**: Queue depth, connection pool utilization

### Business Metrics

- **Active Users**: Number of active users
- **Conversations**: Number of conversations created
- **Messages**: Number of messages sent
- **API Calls**: Number of API calls by endpoint

### Database Metrics

- **Query Performance**: Query execution time
- **Connection Pool**: Connection pool utilization
- **Transaction Rate**: Transactions per second
- **Lock Contention**: Number of lock waits

### Cache Metrics

- **Hit Rate**: Cache hit percentage
- **Eviction Rate**: Items evicted per second
- **Memory Usage**: Memory used by cache
- **Request Rate**: Requests per second

## Alerting Rules

Alerts are configured in Prometheus using PrometheusRules. The following alerts are defined:

### High Error Rate

```yaml
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{job="chatbot-platform",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="chatbot-platform"}[5m])) > 0.05
  for: 2m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "High HTTP error rate"
    description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes (threshold: 5%)"
```

### High Latency

```yaml
- alert: HighLatency
  expr: histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket{job="chatbot-platform"}[5m])) by (le)) > 1
  for: 5m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "High HTTP latency"
    description: "P90 latency is {{ $value | humanizeDuration }} for the last 5 minutes (threshold: 1s)"
```

### High CPU Usage

```yaml
- alert: HighCPUUsage
  expr: sum(rate(container_cpu_usage_seconds_total{pod=~"chatbot-platform-.*"}[5m])) / sum(kube_pod_container_resource_limits_cpu_cores{pod=~"chatbot-platform-.*"}) > 0.8
  for: 10m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "High CPU usage"
    description: "CPU usage is {{ $value | humanizePercentage }} for the last 10 minutes (threshold: 80%)"
```

### High Memory Usage

```yaml
- alert: HighMemoryUsage
  expr: sum(container_memory_usage_bytes{pod=~"chatbot-platform-.*"}) / sum(kube_pod_container_resource_limits_memory_bytes{pod=~"chatbot-platform-.*"}) > 0.8
  for: 10m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "High memory usage"
    description: "Memory usage is {{ $value | humanizePercentage }} for the last 10 minutes (threshold: 80%)"
```

### Pod Crash Looping

```yaml
- alert: PodCrashLooping
  expr: increase(kube_pod_container_status_restarts_total{pod=~"chatbot-platform-.*"}[15m]) > 3
  for: 5m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "Pod crash looping"
    description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes"
```

### Pod Not Ready

```yaml
- alert: PodNotReady
  expr: sum by (pod) (kube_pod_status_ready{condition="true", pod=~"chatbot-platform-.*"}) == 0
  for: 5m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "Pod not ready"
    description: "Pod {{ $labels.pod }} has been in a non-ready state for more than 5 minutes"
```

## Dashboards

Grafana dashboards are used to visualize metrics and monitor the system. The following dashboards are available:

### Overview Dashboard

- System health overview
- Key metrics summary
- Recent alerts
- Deployment status

### Application Dashboard

- Request rate by endpoint
- Error rate by endpoint
- Latency by endpoint
- Active users
- Conversations and messages

### Infrastructure Dashboard

- CPU usage by pod and node
- Memory usage by pod and node
- Disk usage by node
- Network traffic

### Database Dashboard

- Query performance
- Connection pool utilization
- Transaction rate
- Lock contention

### Cache Dashboard

- Hit rate
- Eviction rate
- Memory usage
- Request rate

## Health Checks

Health checks are used to verify the health of the application and its dependencies:

### API Health Endpoint

The application exposes a `/health` endpoint that returns the overall health status:

```json
{
  "status": "ok",
  "version": "1.2.3",
  "timestamp": "2025-07-03T19:53:03.000Z",
  "checks": {
    "database": {
      "status": "ok",
      "latency": 5
    },
    "cache": {
      "status": "ok",
      "latency": 2
    },
    "api": {
      "status": "ok",
      "latency": 10
    }
  }
}
```

### API Readiness Endpoint

The application exposes a `/health/ready` endpoint that returns the readiness status:

```json
{
  "status": "ready",
  "timestamp": "2025-07-03T19:53:03.000Z"
}
```

### Kubernetes Probes

The application uses Kubernetes liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## Logging

Logs are collected and aggregated using Loki:

### Log Format

Logs are formatted as JSON for easier parsing and querying:

```json
{
  "timestamp": "2025-07-03T19:53:03.000Z",
  "level": "info",
  "message": "Request processed successfully",
  "request_id": "abc123",
  "user_id": "user456",
  "endpoint": "/api/conversations",
  "method": "POST",
  "status_code": 201,
  "duration_ms": 45
}
```

### Log Levels

The following log levels are used:

- **ERROR**: For errors that require immediate attention
- **WARN**: For potential issues that don't require immediate attention
- **INFO**: For normal operation events
- **DEBUG**: For detailed debugging information

### Log Retention

Logs are retained for the following periods:

- **ERROR**: 90 days
- **WARN**: 30 days
- **INFO**: 7 days
- **DEBUG**: 1 day

## Incident Response

When alerts are triggered, the following incident response procedure is followed:

### Severity Levels

- **Critical**: Requires immediate attention, service is down or severely degraded
- **Warning**: Requires attention within 1 hour, service is degraded
- **Info**: Requires attention within 24 hours, potential issue

### Notification Channels

- **Critical**: Slack, Email, PagerDuty
- **Warning**: Slack, Email
- **Info**: Slack

### Incident Response Procedure

1. **Alert**: Alert is triggered and notifications are sent
2. **Acknowledge**: On-call engineer acknowledges the alert
3. **Investigate**: Engineer investigates the issue
4. **Mitigate**: Engineer takes action to mitigate the issue
5. **Resolve**: Issue is resolved
6. **Post-mortem**: Post-mortem analysis is conducted

### Escalation Path

1. **Primary On-Call**: First responder
2. **Secondary On-Call**: Backup responder
3. **Team Lead**: Escalated if primary and secondary are unavailable
4. **Engineering Manager**: Escalated for critical incidents

## Monitoring Tools

The following tools are used for monitoring:

### Prometheus

- **Purpose**: Metrics collection and storage
- **Configuration**: `/etc/prometheus/prometheus.yml`
- **Data Retention**: 15 days

### Grafana

- **Purpose**: Visualization and dashboards
- **URL**: `https://grafana.example.com`
- **Authentication**: SSO via Google

### AlertManager

- **Purpose**: Alert routing and notification
- **Configuration**: `/etc/alertmanager/alertmanager.yml`
- **Notification Channels**: Slack, Email, PagerDuty

### Loki

- **Purpose**: Log aggregation
- **Configuration**: `/etc/loki/loki.yml`
- **Data Retention**: See Log Retention section

### Tempo

- **Purpose**: Distributed tracing
- **Configuration**: `/etc/tempo/tempo.yml`
- **Data Retention**: 7 days

## Best Practices

### Metric Naming

- Use snake_case for metric names
- Use a prefix for application metrics (e.g., `chatbot_`)
- Use suffixes to indicate units (e.g., `_seconds`, `_bytes`)

### Alert Design

- Set appropriate thresholds based on historical data
- Use `for` clause to prevent alert flapping
- Include actionable information in alert descriptions

### Dashboard Design

- Start with an overview and drill down
- Use consistent colors and scales
- Include links to documentation and runbooks
- Keep dashboards simple and focused

### Logging

- Use structured logging (JSON)
- Include request IDs for correlation
- Log at appropriate levels
- Include relevant context in log messages
