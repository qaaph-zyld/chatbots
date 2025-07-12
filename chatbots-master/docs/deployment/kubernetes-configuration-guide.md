# Kubernetes Configuration Guide

## Overview

This document provides detailed information about the Kubernetes configuration for the Chatbot Platform. It covers the deployment, service, ingress, and monitoring configurations for different environments.

## Table of Contents

1. [Environment Structure](#environment-structure)
2. [Blue/Green Deployment Configuration](#bluegreen-deployment-configuration)
3. [Service Configuration](#service-configuration)
4. [Ingress Configuration](#ingress-configuration)
5. [Monitoring Configuration](#monitoring-configuration)
6. [Secret Management](#secret-management)
7. [Resource Management](#resource-management)
8. [Network Policies](#network-policies)
9. [Troubleshooting](#troubleshooting)

## Environment Structure

The Chatbot Platform uses the following Kubernetes environments:

- **Development**: Used for ongoing development work
- **Staging**: Used for pre-production testing
- **Production**: The live environment used by customers

Each environment has its own namespace:

- `chatbot-platform-dev`
- `chatbot-platform-staging`
- `chatbot-platform-prod`

## Blue/Green Deployment Configuration

In production, we use a blue/green deployment strategy to minimize downtime and risk. This involves maintaining two identical environments (blue and green) and switching traffic between them.

### Deployment Files

- `k8s/production/deployment-blue.yaml`: Configuration for the blue deployment
- `k8s/production/deployment-green.yaml`: Configuration for the green deployment

### Key Configuration Elements

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-platform-blue  # or chatbot-platform-green
  namespace: chatbot-platform-prod
  labels:
    app: chatbot-platform
    color: blue  # or green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-platform
      color: blue  # or green
  template:
    metadata:
      labels:
        app: chatbot-platform
        color: blue  # or green
```

### Deployment Process

1. New code is deployed to the inactive environment (blue or green)
2. Verification tests are run against the new deployment
3. If tests pass, traffic is switched to the new environment
4. If tests fail, the deployment is rolled back

## Service Configuration

Services are used to expose deployments within the cluster and to external users.

### Main Service

The main service (`k8s/production/service.yaml`) routes traffic to either the blue or green deployment based on the `color` selector:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chatbot-platform
  namespace: chatbot-platform-prod
spec:
  selector:
    app: chatbot-platform
    color: blue  # This is changed during deployment
  ports:
  - port: 80
    targetPort: 3000
```

### Color-Specific Services

Each color also has its own service for direct access during testing:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chatbot-platform-blue  # or chatbot-platform-green
  namespace: chatbot-platform-prod
spec:
  selector:
    app: chatbot-platform
    color: blue  # or green
  ports:
  - port: 80
    targetPort: 3000
```

## Ingress Configuration

The ingress configuration (`k8s/production/ingress.yaml`) exposes the application to external users:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chatbot-platform-ingress
  namespace: chatbot-platform-prod
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - chatbot-platform.example.com
    secretName: chatbot-platform-tls
  rules:
  - host: chatbot-platform.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chatbot-platform
            port:
              name: http
```

## Monitoring Configuration

The monitoring configuration (`k8s/production/monitoring.yaml`) sets up Prometheus monitoring and Grafana dashboards:

### ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: chatbot-platform-monitor
  namespace: chatbot-platform-prod
spec:
  selector:
    matchLabels:
      app: chatbot-platform
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

### PrometheusRule

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: chatbot-platform-alerts
  namespace: chatbot-platform-prod
spec:
  groups:
  - name: chatbot-platform.rules
    rules:
    - alert: HighErrorRate
      expr: sum(rate(http_requests_total{job="chatbot-platform",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="chatbot-platform"}[5m])) > 0.05
      for: 2m
      labels:
        severity: critical
```

### Grafana Dashboard

A Grafana dashboard is provided as a ConfigMap in `k8s/production/monitoring.yaml`.

## Secret Management

Secrets are managed using Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: chatbot-platform-secrets
  namespace: chatbot-platform-prod
type: Opaque
data:
  database-url: <base64-encoded-value>
  jwt-secret: <base64-encoded-value>
  stripe-secret-key: <base64-encoded-value>
```

### Creating Secrets

```bash
kubectl create secret generic chatbot-platform-secrets \
  --from-literal=database-url=<database-url> \
  --from-literal=jwt-secret=<jwt-secret> \
  --from-literal=stripe-secret-key=<stripe-secret-key>
```

### Using Secrets in Deployments

```yaml
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: chatbot-platform-secrets
      key: database-url
```

## Resource Management

Resources are managed using resource requests and limits:

```yaml
resources:
  limits:
    cpu: "1"
    memory: "1Gi"
  requests:
    cpu: "500m"
    memory: "512Mi"
```

### Resource Recommendations

| Environment | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|------------|-----------|----------------|--------------|
| Development | 200m       | 500m      | 256Mi          | 512Mi        |
| Staging     | 300m       | 750m      | 384Mi          | 768Mi        |
| Production  | 500m       | 1000m     | 512Mi          | 1024Mi       |

## Network Policies

Network policies are used to control traffic between pods:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: chatbot-platform-network-policy
  namespace: chatbot-platform-prod
spec:
  podSelector:
    matchLabels:
      app: chatbot-platform
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

## Troubleshooting

### Common Issues

#### Pods Not Starting

Check for resource constraints:

```bash
kubectl describe pod <pod-name> -n chatbot-platform-prod
```

#### Service Not Accessible

Check if the service is correctly targeting the pods:

```bash
kubectl get endpoints chatbot-platform -n chatbot-platform-prod
```

#### Ingress Not Working

Check the ingress controller logs:

```bash
kubectl logs -n ingress-nginx -l app=ingress-nginx
```

#### Blue/Green Switch Failed

Check the service selector:

```bash
kubectl get service chatbot-platform -n chatbot-platform-prod -o yaml
```

### Useful Commands

```bash
# Get pods
kubectl get pods -n chatbot-platform-prod

# Get logs
kubectl logs <pod-name> -n chatbot-platform-prod

# Describe deployment
kubectl describe deployment chatbot-platform-blue -n chatbot-platform-prod

# Port forward to a service
kubectl port-forward svc/chatbot-platform -n chatbot-platform-prod 8080:80

# Execute command in a pod
kubectl exec -it <pod-name> -n chatbot-platform-prod -- /bin/sh
```
