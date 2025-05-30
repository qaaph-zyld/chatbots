# Kubernetes Deployment Guide

This guide provides detailed instructions for deploying the Chatbots Platform on Kubernetes, offering scalability, high availability, and enterprise-grade infrastructure for production environments.

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl CLI tool configured to access your cluster
- Helm v3.0+
- Docker registry access (Docker Hub or private registry)
- Domain name for ingress configuration

## Deployment Options

### 1. Using Helm Chart (Recommended)

The Chatbots Platform provides a Helm chart for easy deployment to Kubernetes clusters.

#### Install with Default Values

```bash
# Add the Bitnami repository for dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy the chart
helm install chatbots-platform ./kubernetes/helm-chart \
  --namespace chatbots \
  --create-namespace
```

#### Install with Custom Values

Create a custom values file (e.g., `my-values.yaml`) to override default settings:

```yaml
# Example custom values
replicaCount: 3

image:
  repository: your-registry/chatbots-platform
  tag: latest

config:
  mongodb:
    uri: "mongodb://your-mongodb-host:27017/chatbots"
  
  jwt:
    secret: "your-secure-jwt-secret"
  
  refreshToken:
    secret: "your-secure-refresh-token-secret"

ingress:
  enabled: true
  hosts:
    - host: chatbots.yourdomain.com
      paths: ["/"]
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  tls:
    - secretName: chatbots-tls
      hosts:
        - chatbots.yourdomain.com
```

Deploy with custom values:

```bash
helm install chatbots-platform ./kubernetes/helm-chart \
  --namespace chatbots \
  --create-namespace \
  -f my-values.yaml
```

### 2. Using kubectl with YAML Manifests

If you prefer not to use Helm, you can apply the Kubernetes manifests directly:

```bash
# Create namespace
kubectl create namespace chatbots

# Apply all manifests
kubectl apply -f kubernetes/deployment.yaml -n chatbots
```

## Security Considerations

### Secrets Management

For production deployments, use a secure secrets management solution:

1. **Kubernetes Secrets**: Basic solution, but secrets are only base64 encoded
2. **HashiCorp Vault**: Advanced secrets management with dynamic credentials
3. **AWS Secrets Manager/Azure Key Vault**: Cloud provider solutions

Example with external secrets:

```bash
# Create secrets from environment variables
kubectl create secret generic chatbots-platform-secrets \
  --from-literal=mongodb-uri="mongodb://user:pass@host:port/db" \
  --from-literal=jwt-secret="your-secure-jwt-secret" \
  --from-literal=refresh-token-secret="your-secure-refresh-token-secret" \
  -n chatbots
```

### Network Policies

Restrict communication between pods with network policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: chatbots-platform-network-policy
  namespace: chatbots
spec:
  podSelector:
    matchLabels:
      app: chatbots-platform
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: chatbots-platform
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mongodb
    ports:
    - protocol: TCP
      port: 27017
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

## Monitoring and Logging

### Prometheus Metrics

The Chatbots Platform exposes metrics at the `/metrics` endpoint. To collect these metrics:

1. Install Prometheus Operator:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

2. Create a ServiceMonitor:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: chatbots-platform
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: chatbots-platform
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
  namespaceSelector:
    matchNames:
    - chatbots
```

### Logging with EFK Stack

For centralized logging, deploy the Elasticsearch, Fluentd, Kibana (EFK) stack:

```bash
helm repo add elastic https://helm.elastic.co
helm repo update

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace

# Install Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set service.type=LoadBalancer

# Install Fluentd
kubectl apply -f https://raw.githubusercontent.com/fluent/fluentd-kubernetes-daemonset/master/fluentd-daemonset-elasticsearch.yaml
```

## Scaling and High Availability

### Horizontal Pod Autoscaler

Enable autoscaling based on CPU/memory usage:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chatbots-platform
  namespace: chatbots
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chatbots-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply with:
```bash
kubectl apply -f hpa.yaml -n chatbots
```

### Pod Disruption Budget

Ensure high availability during voluntary disruptions:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: chatbots-platform-pdb
  namespace: chatbots
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: chatbots-platform
```

## CI/CD Integration

The Chatbots Platform includes a GitHub Actions workflow for automated Kubernetes deployments:

1. Set up required secrets in your GitHub repository:
   - `KUBE_CONFIG_DATA`: Base64-encoded kubeconfig file
   - `KUBE_CONTEXT`: Kubernetes context name
   - `DOCKER_REGISTRY`: Docker registry URL
   - `DOCKER_HUB_USERNAME`: Docker registry username
   - `DOCKER_HUB_TOKEN`: Docker registry access token
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret for JWT tokens
   - `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
   - `BASE_DOMAIN`: Base domain for ingress

2. Trigger a deployment:
   - Go to Actions → Kubernetes Deployment
   - Click "Run workflow"
   - Select environment (staging/production)
   - Enter version tag
   - Click "Run workflow"

## Troubleshooting

### Common Issues

1. **Pod in CrashLoopBackOff**:
   ```bash
   kubectl logs -f deployment/chatbots-platform -n chatbots
   ```

2. **MongoDB connection issues**:
   - Verify the MongoDB URI secret is correct
   - Check network policies allow communication

3. **Ingress not working**:
   - Verify ingress controller is installed
   - Check DNS configuration points to ingress controller IP

### Debugging Commands

```bash
# Get pod status
kubectl get pods -n chatbots

# Describe a pod
kubectl describe pod <pod-name> -n chatbots

# Get logs
kubectl logs <pod-name> -n chatbots

# Check service endpoints
kubectl get endpoints chatbots-platform -n chatbots

# Port-forward to test directly
kubectl port-forward svc/chatbots-platform 8080:80 -n chatbots
```

## Upgrading

To upgrade to a new version:

```bash
helm upgrade chatbots-platform ./kubernetes/helm-chart \
  --namespace chatbots \
  -f my-values.yaml
```

## Uninstalling

To remove the deployment:

```bash
helm uninstall chatbots-platform -n chatbots
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Helm Documentation](https://helm.sh/docs/)
- [Prometheus Operator Documentation](https://github.com/prometheus-operator/prometheus-operator)
- [Chatbots Platform GitHub Repository](https://github.com/example/chatbots-platform)

## Support

For enterprise support, please contact support@example.com or open an issue on GitHub.
