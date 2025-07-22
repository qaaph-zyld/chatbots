// Multi-platform Integration Service
// Advanced service for cross-platform API integration, unified customer profiles, and real-time synchronization

import {
  PlatformConnection,
  PlatformType,
  ConnectionStatus,
  SyncFrequency,
  UnifiedCustomerProfile,
  CustomerSearchQuery,
  APIIntegration,
  APIResponse,
  SyncResult,
  SyncStatus,
  PlatformMetrics,
  CustomerInsights,
  Report,
  ReportType,
  ReportParameters,
  ValidationResult,
  MultiPlatformService as IMultiPlatformService,
  TimeRange,
  PlatformConfiguration,
  ConnectionMetrics,
  CustomerPlatformData,
  PlatformOrder,
  OrderStatus,
  CustomerSegment,
  RecommendedAction,
  BehaviorPattern
} from '../types/MultiPlatformTypes';

class MultiPlatformService implements IMultiPlatformService {
  private platforms: Map<string, PlatformConnection> = new Map();
  private customerProfiles: Map<string, UnifiedCustomerProfile> = new Map();
  private syncStatuses: Map<string, SyncStatus> = new Map();
  private apiIntegrations: Map<string, APIIntegration> = new Map();
  private storageKey = 'multiplatform_data';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultPlatforms();
    this.startPeriodicSync();
  }

  // Platform Management
  async connectPlatform(config: PlatformConnection): Promise<boolean> {
    try {
      // Validate platform configuration
      const validation = await this.validatePlatformConfig(config);
      if (!validation.isValid) {
        console.error('Platform configuration validation failed:', validation.errors);
        return false;
      }

      // Test connection
      const connectionTest = await this.testPlatformConnection(config);
      if (!connectionTest) {
        console.error('Platform connection test failed');
        return false;
      }

      // Store platform configuration
      config.status = 'connected';
      config.lastSync = new Date();
      this.platforms.set(config.id, config);
      
      // Initialize sync status
      this.syncStatuses.set(config.id, {
        isRunning: false,
        progress: 0
      });

      this.saveToStorage();
      console.log(`Platform ${config.name} connected successfully`);
      return true;
    } catch (error) {
      console.error('Error connecting platform:', error);
      return false;
    }
  }

  async disconnectPlatform(platformId: string): Promise<boolean> {
    try {
      const platform = this.platforms.get(platformId);
      if (!platform) {
        console.error('Platform not found:', platformId);
        return false;
      }

      platform.status = 'disconnected';
      this.platforms.set(platformId, platform);
      this.syncStatuses.delete(platformId);
      
      this.saveToStorage();
      console.log(`Platform ${platform.name} disconnected successfully`);
      return true;
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      return false;
    }
  }

  getPlatforms(): PlatformConnection[] {
    return Array.from(this.platforms.values());
  }

  getPlatform(platformId: string): PlatformConnection | null {
    return this.platforms.get(platformId) || null;
  }

  async updatePlatformConfig(
    platformId: string, 
    config: Partial<PlatformConfiguration>
  ): Promise<boolean> {
    try {
      const platform = this.platforms.get(platformId);
      if (!platform) {
        console.error('Platform not found:', platformId);
        return false;
      }

      platform.configuration = { ...platform.configuration, ...config };
      this.platforms.set(platformId, platform);
      this.saveToStorage();
      
      console.log(`Platform ${platform.name} configuration updated`);
      return true;
    } catch (error) {
      console.error('Error updating platform configuration:', error);
      return false;
    }
  }

  // Data Synchronization
  async syncPlatform(platformId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const platform = this.platforms.get(platformId);
    
    if (!platform) {
      return {
        platformId,
        success: false,
        recordsProcessed: 0,
        errors: [{ type: 'validation', message: 'Platform not found' }],
        duration: 0,
        timestamp: new Date()
      };
    }

    // Update sync status
    this.syncStatuses.set(platformId, {
      isRunning: true,
      progress: 0,
      startTime: new Date(),
      currentOperation: 'Initializing sync...'
    });

    try {
      let recordsProcessed = 0;
      const errors: any[] = [];

      // Simulate platform-specific sync operations
      const operations = this.getPlatformSyncOperations(platform.type);
      
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        // Update progress
        this.syncStatuses.set(platformId, {
          isRunning: true,
          progress: Math.round((i / operations.length) * 100),
          startTime: new Date(),
          currentOperation: operation?.name || 'Processing...'
        });

        try {
          const result = await this.executeSyncOperation(platform, operation);
          recordsProcessed += result.recordsProcessed;
          errors.push(...result.errors);
        } catch (error) {
          errors.push({
            type: 'server',
            message: `Operation ${operation?.name || 'unknown'} failed: ${error}`
          });
        }

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update platform metrics
      await this.updatePlatformMetrics(platformId, recordsProcessed, errors.length);

      // Complete sync
      this.syncStatuses.set(platformId, {
        isRunning: false,
        progress: 100
      });

      platform.lastSync = new Date();
      platform.status = errors.length > 0 ? 'error' : 'connected';
      this.platforms.set(platformId, platform);
      this.saveToStorage();

      const duration = Date.now() - startTime;
      return {
        platformId,
        success: errors.length === 0,
        recordsProcessed,
        errors,
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      // Handle sync failure
      this.syncStatuses.set(platformId, {
        isRunning: false,
        progress: 0
      });

      platform.status = 'error';
      this.platforms.set(platformId, platform);
      this.saveToStorage();

      const duration = Date.now() - startTime;
      return {
        platformId,
        success: false,
        recordsProcessed: 0,
        errors: [{ type: 'server', message: `Sync failed: ${error}` }],
        duration,
        timestamp: new Date()
      };
    }
  }

  async syncAllPlatforms(): Promise<SyncResult[]> {
    const connectedPlatforms = Array.from(this.platforms.values())
      .filter(p => p.status === 'connected');
    
    const syncPromises = connectedPlatforms.map(platform => 
      this.syncPlatform(platform.id)
    );
    
    return Promise.all(syncPromises);
  }

  getLastSyncStatus(platformId: string): SyncStatus {
    return this.syncStatuses.get(platformId) || {
      isRunning: false,
      progress: 0
    };
  }

  // Customer Management
  async getUnifiedCustomerProfile(customerId: string): Promise<UnifiedCustomerProfile | null> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) {
      // Try to build profile from platform data
      return await this.buildUnifiedProfile(customerId);
    }
    return profile;
  }

  async searchCustomers(query: CustomerSearchQuery): Promise<UnifiedCustomerProfile[]> {
    const allProfiles = Array.from(this.customerProfiles.values());
    
    return allProfiles.filter(profile => {
      // Email filter
      if (query.email && !profile.email.toLowerCase().includes(query.email.toLowerCase())) {
        return false;
      }
      
      // Name filter
      if (query.name) {
        const fullName = `${profile.firstName} ${profile.lastName}`.toLowerCase();
        if (!fullName.includes(query.name.toLowerCase())) {
          return false;
        }
      }
      
      // Platform filter
      if (query.platform) {
        const hasPlatform = profile.platforms.some(p => p.platformType === query.platform);
        if (!hasPlatform) {
          return false;
        }
      }
      
      // Order value filters
      if (query.orderValueMin && profile.averageOrderValue < query.orderValueMin) {
        return false;
      }
      if (query.orderValueMax && profile.averageOrderValue > query.orderValueMax) {
        return false;
      }
      
      // Last order days filter
      if (query.lastOrderDays) {
        const lastOrderDate = Math.max(...profile.platforms.map(p => 
          p.lastOrderDate ? p.lastOrderDate.getTime() : 0
        ));
        const daysSinceLastOrder = (Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOrder > query.lastOrderDays) {
          return false;
        }
      }
      
      return true;
    }).slice(query.offset || 0, (query.offset || 0) + (query.limit || 50));
  }

  async updateCustomerProfile(
    customerId: string, 
    updates: Partial<UnifiedCustomerProfile>
  ): Promise<boolean> {
    try {
      const profile = this.customerProfiles.get(customerId);
      if (!profile) {
        console.error('Customer profile not found:', customerId);
        return false;
      }

      const updatedProfile = { ...profile, ...updates, lastUpdated: new Date() };
      this.customerProfiles.set(customerId, updatedProfile);
      this.saveToStorage();
      
      console.log(`Customer profile ${customerId} updated successfully`);
      return true;
    } catch (error) {
      console.error('Error updating customer profile:', error);
      return false;
    }
  }

  // API Integration
  async executeAPICall(integrationId: string, payload?: any): Promise<APIResponse> {
    const integration = this.apiIntegrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        data: null,
        statusCode: 404,
        headers: {},
        responseTime: 0,
        error: 'Integration not found'
      };
    }

    const startTime = Date.now();
    
    try {
      // Simulate API call with realistic response times
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      // Simulate success/failure based on integration health
      const success = Math.random() > 0.1; // 90% success rate
      
      const responseTime = Date.now() - startTime;
      
      if (success) {
        return {
          success: true,
          data: this.generateMockAPIResponse(integration, payload),
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          responseTime,
        };
      } else {
        return {
          success: false,
          data: null,
          statusCode: 500,
          headers: {},
          responseTime,
          error: 'Internal server error'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        statusCode: 0,
        headers: {},
        responseTime: Date.now() - startTime,
        error: `Network error: ${error}`
      };
    }
  }

  async validateAPIIntegration(integration: APIIntegration): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate required fields
    if (!integration.endpoint) {
      errors.push({ field: 'endpoint', message: 'API endpoint is required', code: 'REQUIRED' });
    }
    
    if (!integration.authentication.credentials) {
      errors.push({ field: 'authentication', message: 'Authentication credentials are required', code: 'REQUIRED' });
    }

    // Validate endpoint format
    if (integration.endpoint && !integration.endpoint.startsWith('http')) {
      errors.push({ field: 'endpoint', message: 'Endpoint must be a valid URL', code: 'INVALID_FORMAT' });
    }

    // Validate rate limits
    if (integration.rateLimit.requestsPerMinute > 1000) {
      warnings.push({ 
        field: 'rateLimit', 
        message: 'High rate limit may cause issues', 
        suggestion: 'Consider reducing to under 1000 requests per minute' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Analytics and Reporting
  async getPlatformMetrics(platformId: string, timeRange: TimeRange): Promise<PlatformMetrics> {
    const platform = this.platforms.get(platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    // Generate realistic metrics based on platform type and time range
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const baseMultiplier = this.getPlatformBaseMultiplier(platform.type);

    return {
      platformId,
      timeRange,
      totalOrders: Math.floor((50 + Math.random() * 200) * days * baseMultiplier),
      totalRevenue: Math.floor((5000 + Math.random() * 20000) * days * baseMultiplier),
      averageOrderValue: 75 + Math.random() * 125,
      customerCount: Math.floor((20 + Math.random() * 80) * days * baseMultiplier),
      conversionRate: 0.02 + Math.random() * 0.08,
      apiCalls: platform.metrics.totalRequests,
      errorRate: platform.metrics.failedRequests / Math.max(platform.metrics.totalRequests, 1),
      responseTime: platform.metrics.averageResponseTime
    };
  }

  async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    const profile = await this.getUnifiedCustomerProfile(customerId);
    if (!profile) {
      throw new Error('Customer profile not found');
    }

    // Generate AI-powered insights
    const riskScore = this.calculateRiskScore(profile);
    const lifetimeValuePrediction = this.predictLifetimeValue(profile);
    const nextPurchaseProbability = this.calculatePurchaseProbability(profile);

    return {
      customerId,
      riskScore,
      lifetimeValuePrediction,
      nextPurchaseProbability,
      recommendedActions: this.generateRecommendedActions(profile, riskScore),
      behaviorPatterns: this.identifyBehaviorPatterns(profile),
      segmentChanges: this.getSegmentChanges(profile)
    };
  }

  async generateReport(type: ReportType, parameters: ReportParameters): Promise<Report> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate report data based on type
    const data = await this.generateReportData(type, parameters);
    const summary = this.generateReportSummary(data, type);

    return {
      id: reportId,
      type,
      title: this.getReportTitle(type),
      generatedAt: new Date(),
      parameters,
      data,
      summary,
      exportFormats: ['pdf', 'csv', 'xlsx', 'json']
    };
  }

  // Private Helper Methods
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore platforms
        if (data.platforms) {
          data.platforms.forEach((platform: PlatformConnection) => {
            // Convert date strings back to Date objects
            platform.lastSync = new Date(platform.lastSync);
            this.platforms.set(platform.id, platform);
          });
        }
        
        // Restore customer profiles
        if (data.customerProfiles) {
          data.customerProfiles.forEach((profile: UnifiedCustomerProfile) => {
            profile.dateCreated = new Date(profile.dateCreated);
            profile.lastUpdated = new Date(profile.lastUpdated);
            this.customerProfiles.set(profile.id, profile);
          });
        }
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        platforms: Array.from(this.platforms.values()),
        customerProfiles: Array.from(this.customerProfiles.values()),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private initializeDefaultPlatforms(): void {
    // Initialize with sample platform connections if none exist
    if (this.platforms.size === 0) {
      const samplePlatforms: PlatformConnection[] = [
        {
          id: 'shopify_main',
          name: 'Main Shopify Store',
          type: 'shopify',
          status: 'connected',
          apiEndpoint: 'https://your-store.myshopify.com/admin/api/2023-10',
          apiKey: 'sample_api_key',
          webhookUrl: 'https://your-app.com/webhooks/shopify',
          lastSync: new Date(),
          syncFrequency: 'real-time',
          configuration: {
            autoSync: true,
            syncProducts: true,
            syncOrders: true,
            syncCustomers: true,
            syncInventory: true,
            webhooksEnabled: true,
            rateLimitPerMinute: 40,
            timeoutSeconds: 30,
            retryAttempts: 3,
            customFields: {}
          },
          metrics: {
            totalRequests: 1250,
            successfulRequests: 1198,
            failedRequests: 52,
            averageResponseTime: 245,
            uptime: 99.2,
            dataTransferred: 15680000,
            rateLimitHits: 3
          },
          features: [
            {
              id: 'product_sync',
              name: 'Product Synchronization',
              description: 'Sync product catalog and inventory',
              enabled: true,
              requiredPermissions: ['read_products', 'write_products']
            }
          ]
        }
      ];

      samplePlatforms.forEach(platform => {
        this.platforms.set(platform.id, platform);
      });
      
      this.saveToStorage();
    }
  }

  private async validatePlatformConfig(config: PlatformConnection): Promise<ValidationResult> {
    const errors: any[] = [];
    
    if (!config.apiEndpoint) {
      errors.push({ field: 'apiEndpoint', message: 'API endpoint is required', code: 'REQUIRED' });
    }
    
    if (!config.apiKey) {
      errors.push({ field: 'apiKey', message: 'API key is required', code: 'REQUIRED' });
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private async testPlatformConnection(config: PlatformConnection): Promise<boolean> {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.random() > 0.1; // 90% success rate
  }

  private getPlatformSyncOperations(platformType: PlatformType) {
    const baseOperations = [
      { name: 'Fetching products', recordsExpected: 100 },
      { name: 'Syncing customers', recordsExpected: 50 },
      { name: 'Processing orders', recordsExpected: 75 },
      { name: 'Updating inventory', recordsExpected: 100 }
    ];

    return baseOperations;
  }

  private async executeSyncOperation(platform: PlatformConnection, operation: any) {
    // Simulate operation execution
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const success = Math.random() > 0.05; // 95% success rate per operation
    const recordsProcessed = success ? operation.recordsExpected : Math.floor(operation.recordsExpected * 0.7);
    const errors = success ? [] : [{ type: 'validation', message: `${operation.name} partially failed` }];

    return { recordsProcessed, errors };
  }

  private async updatePlatformMetrics(platformId: string, recordsProcessed: number, errorCount: number): Promise<void> {
    const platform = this.platforms.get(platformId);
    if (platform) {
      platform.metrics.totalRequests += 1;
      if (errorCount === 0) {
        platform.metrics.successfulRequests += 1;
      } else {
        platform.metrics.failedRequests += 1;
      }
      platform.metrics.averageResponseTime = 200 + Math.random() * 100;
      this.platforms.set(platformId, platform);
    }
  }

  private async buildUnifiedProfile(customerId: string): Promise<UnifiedCustomerProfile | null> {
    // Simulate building unified profile from multiple platforms
    const mockProfile: UnifiedCustomerProfile = {
      id: customerId,
      email: `customer${customerId}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      dateCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      platforms: [],
      totalOrders: Math.floor(Math.random() * 20) + 1,
      totalSpent: Math.floor(Math.random() * 5000) + 100,
      averageOrderValue: 75 + Math.random() * 125,
      lifetimeValue: Math.floor(Math.random() * 10000) + 500,
      segments: [],
      preferences: {
        communicationChannel: 'email',
        frequency: 'weekly',
        categories: ['electronics', 'clothing'],
        priceRange: { min: 0, max: 500, currency: 'USD' },
        brands: ['Brand A', 'Brand B'],
        timezone: 'UTC',
        language: 'en'
      },
      interactions: []
    };

    this.customerProfiles.set(customerId, mockProfile);
    return mockProfile;
  }

  private generateMockAPIResponse(integration: APIIntegration, payload: any) {
    // Generate realistic mock response based on integration type
    return {
      status: 'success',
      data: { message: 'API call successful', payload },
      timestamp: new Date().toISOString()
    };
  }

  private getPlatformBaseMultiplier(platformType: PlatformType): number {
    const multipliers = {
      'shopify': 1.2,
      'woocommerce': 1.0,
      'magento': 0.8,
      'bigcommerce': 0.9,
      'squarespace': 0.6,
      'wordpress': 0.7,
      'custom': 1.0
    };
    return multipliers[platformType] || 1.0;
  }

  private calculateRiskScore(profile: UnifiedCustomerProfile): number {
    // Calculate churn risk based on various factors
    let riskScore = 0;
    
    // Days since last order
    const lastOrderDates = profile.platforms
      .map(p => p.lastOrderDate?.getTime() || 0)
      .filter(date => date > 0);
    
    if (lastOrderDates.length > 0) {
      const daysSinceLastOrder = (Date.now() - Math.max(...lastOrderDates)) / (1000 * 60 * 60 * 24);
      riskScore += Math.min(daysSinceLastOrder / 30, 1) * 40; // Max 40 points for recency
    }
    
    // Order frequency
    const avgDaysBetweenOrders = 365 / Math.max(profile.totalOrders, 1);
    riskScore += Math.min(avgDaysBetweenOrders / 60, 1) * 30; // Max 30 points for frequency
    
    // Spending trend (simplified)
    riskScore += Math.random() * 30; // Max 30 points for spending trend
    
    return Math.min(Math.round(riskScore), 100);
  }

  private predictLifetimeValue(profile: UnifiedCustomerProfile): number {
    // Predict future lifetime value
    const currentLTV = profile.lifetimeValue;
    const growthFactor = 1 + (Math.random() * 0.5); // 0-50% growth
    return Math.round(currentLTV * growthFactor);
  }

  private calculatePurchaseProbability(profile: UnifiedCustomerProfile): number {
    // Calculate probability of next purchase in 30 days
    const baseProb = 0.3; // 30% base probability
    const orderFrequency = profile.totalOrders / 12; // Orders per month
    const frequencyBonus = Math.min(orderFrequency * 0.1, 0.4);
    
    return Math.min(baseProb + frequencyBonus + (Math.random() * 0.3), 1);
  }

  private generateRecommendedActions(profile: UnifiedCustomerProfile, riskScore: number): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
    
    if (riskScore > 70) {
      actions.push({
        type: 'discount-offer',
        priority: 'high',
        description: 'Send personalized discount to re-engage customer',
        expectedImpact: 'Reduce churn risk by 25%',
        effort: 'low'
      });
    }
    
    if (profile.totalOrders > 5) {
      actions.push({
        type: 'loyalty-program',
        priority: 'medium',
        description: 'Invite to VIP loyalty program',
        expectedImpact: 'Increase lifetime value by 15%',
        effort: 'medium'
      });
    }
    
    return actions;
  }

  private identifyBehaviorPatterns(profile: UnifiedCustomerProfile): BehaviorPattern[] {
    return [
      {
        pattern: 'Weekend shopper',
        frequency: 0.7,
        confidence: 0.85,
        trend: 'stable'
      },
      {
        pattern: 'Price-sensitive buyer',
        frequency: 0.6,
        confidence: 0.75,
        trend: 'increasing'
      }
    ];
  }

  private getSegmentChanges(profile: UnifiedCustomerProfile): any[] {
    // Return recent segment changes
    return [];
  }

  private async generateReportData(type: ReportType, parameters: ReportParameters): Promise<any> {
    // Generate mock report data based on type
    const mockData = {
      summary: { totalRecords: 1000, revenue: 50000 },
      details: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        value: Math.random() * 1000,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      }))
    };
    
    return mockData;
  }

  private generateReportSummary(data: any, type: ReportType): any {
    return {
      totalRecords: data.details?.length || 0,
      keyInsights: [
        'Revenue increased by 15% compared to previous period',
        'Customer acquisition cost decreased by 8%'
      ],
      recommendations: [
        'Focus on high-value customer segments',
        'Optimize conversion funnel for mobile users'
      ],
      trends: [
        {
          metric: 'Revenue',
          change: 15,
          direction: 'increasing' as const,
          significance: 'High'
        }
      ]
    };
  }

  private getReportTitle(type: ReportType): string {
    const titles = {
      'platform-performance': 'Platform Performance Report',
      'customer-analysis': 'Customer Analysis Report',
      'revenue-breakdown': 'Revenue Breakdown Report',
      'sync-status': 'Synchronization Status Report',
      'api-usage': 'API Usage Report',
      'custom': 'Custom Report'
    };
    return titles[type] || 'Report';
  }

  private startPeriodicSync(): void {
    // Start periodic sync for platforms with auto-sync enabled
    setInterval(() => {
      const autoSyncPlatforms = Array.from(this.platforms.values())
        .filter(p => p.configuration.autoSync && p.status === 'connected');
      
      autoSyncPlatforms.forEach(async platform => {
        if (this.shouldSync(platform)) {
          await this.syncPlatform(platform.id);
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private shouldSync(platform: PlatformConnection): boolean {
    const now = Date.now();
    const lastSync = platform.lastSync.getTime();
    const intervals = {
      'real-time': 5 * 60 * 1000, // 5 minutes
      'every-5-minutes': 5 * 60 * 1000,
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000,
      'manual': Infinity
    };
    
    const interval = intervals[platform.syncFrequency] || intervals['hourly'];
    return (now - lastSync) >= interval;
  }
}

export default new MultiPlatformService();
