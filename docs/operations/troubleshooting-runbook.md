# Operational Troubleshooting Runbook

## Overview

This runbook provides step-by-step procedures for diagnosing and resolving common operational issues with the chatbot platform. It is intended for operations teams, DevOps engineers, and on-call personnel.

## Table of Contents

1. [Health Check Failures](#health-check-failures)
2. [Performance Issues](#performance-issues)
3. [Database Issues](#database-issues)
4. [Cache Issues](#cache-issues)
5. [API Issues](#api-issues)
6. [Authentication Issues](#authentication-issues)
7. [Payment Processing Issues](#payment-processing-issues)
8. [High Error Rates](#high-error-rates)
9. [Deployment Failures](#deployment-failures)
10. [Scaling Issues](#scaling-issues)

## Health Check Failures

### Liveness Probe Failure

**Symptoms:**
- Kubernetes pods restarting frequently
- `/health/liveness` endpoint returning non-200 status code

**Troubleshooting Steps:**

1. Check application logs for errors:
   ```bash
   kubectl logs -n chatbot-platform <pod-name>
   ```

2. Verify the application process is running:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- ps aux
   ```

3. Check memory usage:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- free -m
   ```

4. Check disk space:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- df -h
   ```

**Resolution:**

- If memory issues: Increase memory limits in Kubernetes deployment
- If disk space issues: Clean up logs or increase disk space
- If application crash: Fix the underlying code issue causing the crash

### Readiness Probe Failure

**Symptoms:**
- Service not receiving traffic
- `/health/readiness` endpoint returning non-200 status code

**Troubleshooting Steps:**

1. Check if dependent services are available:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- curl -v <dependent-service-url>/health
   ```

2. Check database connectivity:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
   ```

3. Check cache connectivity:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- node -e "const redis = require('redis'); const client = redis.createClient(process.env.REDIS_URL); client.on('connect', () => console.log('Connected')); client.on('error', (err) => console.error(err)); client.connect();"
   ```

**Resolution:**

- If database connectivity issue: Verify database credentials and network connectivity
- If cache connectivity issue: Verify Redis credentials and network connectivity
- If dependent service issue: Check the health of dependent services

## Performance Issues

### High Response Times

**Symptoms:**
- API response times exceeding 500ms
- User complaints about slow performance

**Troubleshooting Steps:**

1. Check system resource usage:
   ```bash
   kubectl top pods -n chatbot-platform
   kubectl top nodes
   ```

2. Check database query performance:
   ```bash
   # Connect to MongoDB and run explain on slow queries
   db.collection.find({...}).explain("executionStats")
   ```

3. Check for N+1 query issues in application logs

4. Check Redis cache hit rates:
   ```bash
   kubectl exec -it -n chatbot-platform <redis-pod> -- redis-cli info stats | grep hit_rate
   ```

**Resolution:**

- If high CPU usage: Scale up or out the service
- If slow database queries: Add indexes or optimize queries
- If low cache hit rate: Review caching strategy
- If N+1 query issues: Fix application code to batch queries

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Eventual OOM (Out of Memory) errors

**Troubleshooting Steps:**

1. Take heap snapshots at intervals:
   ```bash
   # Enable inspector
   kubectl exec -it -n chatbot-platform <pod-name> -- node --inspect=0.0.0.0:9229 server.js
   
   # Use Chrome DevTools to connect and take heap snapshots
   ```

2. Compare heap snapshots to identify growing objects

3. Check for event listeners not being removed

**Resolution:**

- Fix memory leaks in application code
- Implement regular service restarts as a temporary measure

## Database Issues

### Connection Failures

**Symptoms:**
- Database health check failing
- Error logs showing connection issues

**Troubleshooting Steps:**

1. Check if database is running:
   ```bash
   kubectl get pods -n database
   ```

2. Check network connectivity:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- nc -zv <db-host> <db-port>
   ```

3. Check database logs:
   ```bash
   kubectl logs -n database <db-pod-name>
   ```

4. Verify credentials are correct in environment variables

**Resolution:**

- If database is down: Restore from backup or fix database issues
- If network issue: Fix network policies or firewall rules
- If credential issue: Update environment variables with correct credentials

### Slow Queries

**Symptoms:**
- Specific API endpoints are slow
- Database CPU or I/O usage is high

**Troubleshooting Steps:**

1. Identify slow queries from logs or monitoring

2. Analyze query execution plan:
   ```bash
   # For MongoDB
   db.collection.find({...}).explain("executionStats")
   ```

3. Check for missing indexes:
   ```bash
   # For MongoDB
   db.collection.getIndexes()
   ```

**Resolution:**

- Add appropriate indexes
- Optimize query structure
- Consider denormalizing data for frequently accessed patterns

## Cache Issues

### Cache Connection Failures

**Symptoms:**
- Cache health check failing
- Increased database load due to cache misses

**Troubleshooting Steps:**

1. Check if Redis is running:
   ```bash
   kubectl get pods -n cache
   ```

2. Check network connectivity:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- nc -zv <redis-host> <redis-port>
   ```

3. Check Redis logs:
   ```bash
   kubectl logs -n cache <redis-pod-name>
   ```

**Resolution:**

- If Redis is down: Restart Redis service
- If network issue: Fix network policies or firewall rules
- If memory issue: Increase Redis memory limit or implement eviction policies

### Cache Inconsistency

**Symptoms:**
- Stale data being served
- Inconsistent behavior between different instances

**Troubleshooting Steps:**

1. Check cache TTL settings in code

2. Verify cache invalidation logic

3. Manually inspect cache entries:
   ```bash
   kubectl exec -it -n cache <redis-pod-name> -- redis-cli
   > GET <key>
   ```

**Resolution:**

- Implement proper cache invalidation
- Adjust TTL values
- Consider implementing cache versioning

## API Issues

### High Error Rates

**Symptoms:**
- Increased 4xx or 5xx responses
- Error alerts from monitoring system

**Troubleshooting Steps:**

1. Check application logs for errors:
   ```bash
   kubectl logs -n chatbot-platform <pod-name> | grep ERROR
   ```

2. Check recent deployments or changes

3. Verify external service dependencies are healthy

**Resolution:**

- Roll back recent changes if they caused the issue
- Fix application code bugs
- Address external service issues

### Rate Limiting Issues

**Symptoms:**
- Increased 429 (Too Many Requests) responses
- Client complaints about API throttling

**Troubleshooting Steps:**

1. Check rate limiting configuration

2. Analyze traffic patterns for potential abuse

3. Check Redis usage for rate limiting storage:
   ```bash
   kubectl exec -it -n cache <redis-pod-name> -- redis-cli
   > KEYS *rate-limit*
   ```

**Resolution:**

- Adjust rate limiting thresholds if necessary
- Implement client-specific rate limits
- Block abusive clients

## Authentication Issues

### Login Failures

**Symptoms:**
- Users unable to log in
- Increased authentication errors in logs

**Troubleshooting Steps:**

1. Check authentication service logs:
   ```bash
   kubectl logs -n chatbot-platform <auth-service-pod> | grep "authentication failed"
   ```

2. Verify identity provider connectivity (if using OAuth/SAML)

3. Check JWT signing key configuration

**Resolution:**

- Fix identity provider connection issues
- Update JWT signing keys if compromised
- Clear user sessions if necessary

### Token Validation Failures

**Symptoms:**
- Users being logged out unexpectedly
- Increased 401 responses for authenticated endpoints

**Troubleshooting Steps:**

1. Check token validation logs

2. Verify JWT signing key consistency across services

3. Check for clock skew between services

**Resolution:**

- Synchronize clocks using NTP
- Ensure consistent JWT configuration across services
- Update token validation logic if necessary

## Payment Processing Issues

### Failed Payments

**Symptoms:**
- Increased payment failure rate
- Customer complaints about billing issues

**Troubleshooting Steps:**

1. Check payment service logs:
   ```bash
   kubectl logs -n chatbot-platform <payment-service-pod> | grep "payment failed"
   ```

2. Verify payment gateway connectivity:
   ```bash
   kubectl exec -it -n chatbot-platform <pod-name> -- curl -v <payment-gateway-health-endpoint>
   ```

3. Check for payment gateway outages on status page

**Resolution:**

- Contact payment gateway support if service is down
- Fix connectivity issues to payment gateway
- Update payment processing code if API changes

### Subscription Issues

**Symptoms:**
- Users not getting access to paid features
- Subscription status inconsistencies

**Troubleshooting Steps:**

1. Check subscription service logs

2. Verify webhook processing for subscription events

3. Check database for subscription records:
   ```bash
   # Connect to database and query subscriptions
   db.subscriptions.find({userId: "<user-id>"}).pretty()
   ```

**Resolution:**

- Manually sync subscription data from payment provider
- Fix webhook processing issues
- Update user subscription status if necessary

## High Error Rates

### Application Errors

**Symptoms:**
- Spike in error logs
- Increased error reporting in monitoring

**Troubleshooting Steps:**

1. Identify most common errors from logs

2. Check recent deployments or changes

3. Look for patterns in errors (specific endpoints, users, or data)

**Resolution:**

- Roll back recent changes if they caused the issue
- Deploy hotfix for critical bugs
- Add additional error handling for edge cases

### External Service Failures

**Symptoms:**
- Errors related to external service calls
- Increased latency in dependent operations

**Troubleshooting Steps:**

1. Check external service status pages

2. Verify connectivity to external services

3. Check for API changes or deprecations

**Resolution:**

- Implement circuit breakers for failing services
- Use fallback mechanisms when possible
- Update integration code if API has changed

## Deployment Failures

### Failed CI/CD Pipeline

**Symptoms:**
- CI/CD pipeline failing
- New versions not deploying

**Troubleshooting Steps:**

1. Check CI/CD logs for specific errors

2. Verify test failures and their causes

3. Check for infrastructure issues in the CI/CD environment

**Resolution:**

- Fix failing tests
- Address code quality issues
- Resolve infrastructure problems in CI/CD environment

### Failed Kubernetes Deployments

**Symptoms:**
- Pods not starting or crashing
- Deployment stuck in progress

**Troubleshooting Steps:**

1. Check pod status:
   ```bash
   kubectl get pods -n chatbot-platform
   ```

2. Check pod events:
   ```bash
   kubectl describe pod -n chatbot-platform <pod-name>
   ```

3. Check container logs:
   ```bash
   kubectl logs -n chatbot-platform <pod-name>
   ```

**Resolution:**

- Fix resource constraints if pods are evicted
- Fix container image issues
- Address application startup errors

## Scaling Issues

### Auto-scaling Not Working

**Symptoms:**
- Service not scaling under load
- HPA (Horizontal Pod Autoscaler) not triggering

**Troubleshooting Steps:**

1. Check HPA status:
   ```bash
   kubectl get hpa -n chatbot-platform
   ```

2. Verify metrics are being collected:
   ```bash
   kubectl describe hpa -n chatbot-platform <hpa-name>
   ```

3. Check if metrics server is running:
   ```bash
   kubectl get pods -n kube-system | grep metrics-server
   ```

**Resolution:**

- Fix metrics collection issues
- Adjust HPA configuration
- Manually scale if necessary while fixing auto-scaling

### Resource Constraints

**Symptoms:**
- Pods being evicted
- OOM (Out of Memory) kills

**Troubleshooting Steps:**

1. Check resource usage:
   ```bash
   kubectl top pods -n chatbot-platform
   ```

2. Check resource limits in deployment:
   ```bash
   kubectl describe deployment -n chatbot-platform <deployment-name>
   ```

3. Check node capacity:
   ```bash
   kubectl describe nodes
   ```

**Resolution:**

- Adjust resource requests and limits
- Scale out to more nodes if cluster is constrained
- Optimize application resource usage

---

## Escalation Procedures

If you are unable to resolve an issue using this runbook:

1. Escalate to the on-call engineer (Level 2)
2. If still unresolved after 30 minutes, escalate to the engineering manager
3. For critical production issues affecting multiple customers, initiate the incident response plan

## Contact Information

- **DevOps Team**: devops@customizable-chatbots.com
- **Database Team**: database@customizable-chatbots.com
- **Security Team**: security@customizable-chatbots.com
- **On-call Phone**: +1-800-CHATBOT-911

---

**Note**: This runbook should be regularly updated as new issues are encountered and resolved. Last updated: 2025-07-05.
