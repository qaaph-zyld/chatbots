'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ABTestProvider } from '@/lib/ab-testing/ABTestProvider';
import { InnovationPipelineProvider } from '@/lib/innovation/InnovationPipeline';
import { ABTestingDashboard } from '@/components/ab-testing/ABTestingDashboard';
import { InnovationDashboard } from '@/components/innovation/InnovationDashboard';
import { PerformanceMonitoringDashboard } from '@/components/performance/PerformanceMonitoringDashboard';
import { ConversionOptimizationDashboard } from '@/components/optimization/ConversionOptimizationDashboard';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Lightbulb, TestTube2, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/charts';

// Sample data for the overview metrics
const overviewData = {
  activeTests: 3,
  significantTests: 2,
  activeInnovations: 5,
  completedInnovations: 1,
  conversionImprovement: 12.5,
  testingCoverage: 68,
  innovationProgress: 42,
  revenueImpact: 8.2,
};

// Sample data for the performance chart
const performanceData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Conversion Rate',
      data: [2.1, 2.3, 2.8, 3.2, 3.5, 3.9],
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
    },
    {
      label: 'Average Order Value',
      data: [65, 68, 70, 72, 75, 78],
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
    },
  ],
};

// Sample innovation ideas for the quick ideas section
const innovationIdeas = [
  {
    title: 'Personalized Product Recommendations',
    description: 'Implement AI-based product recommendations based on browsing history and purchase patterns',
    impact: 'high',
    effort: 'medium',
  },
  {
    title: 'Social Proof Notifications',
    description: 'Show real-time notifications of recent purchases to create urgency and social proof',
    impact: 'medium',
    effort: 'low',
  },
  {
    title: 'Abandoned Cart Recovery Workflow',
    description: 'Create an automated email sequence to recover abandoned carts with personalized incentives',
    impact: 'high',
    effort: 'medium',
  },
  {
    title: 'Product Page Video Demonstrations',
    description: 'Add short video demonstrations for products to increase engagement and conversions',
    impact: 'medium',
    effort: 'medium',
  },
];

// Sample initial innovations for the innovation pipeline
const initialInnovations = [
  {
    id: 'inn_1',
    title: 'AI-Powered Product Recommendations',
    description: 'Implement machine learning algorithm to suggest products based on user behavior and purchase history.',
    stage: 'development',
    priority: 'high',
    category: 'feature',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'alex.smith',
    assignedTo: 'maria.jones',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedEffort: 8,
    businessValue: 9,
    technicalComplexity: 7,
    tags: ['ai', 'recommendations', 'personalization'],
    metrics: [
      {
        name: 'Conversion Rate',
        baseline: 2.3,
        target: 3.5,
        current: 2.8
      },
      {
        name: 'Average Order Value',
        baseline: 65,
        target: 75,
        current: 68
      }
    ],
    status: 'active',
    progress: 60
  },
  {
    id: 'inn_2',
    title: 'One-Click Checkout Experience',
    description: 'Streamline the checkout process to allow customers to complete purchases with a single click.',
    stage: 'testing',
    priority: 'critical',
    category: 'ux',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'alex.smith',
    assignedTo: 'john.doe',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedEffort: 5,
    businessValue: 10,
    technicalComplexity: 6,
    tags: ['checkout', 'conversion', 'ux-improvement'],
    metrics: [
      {
        name: 'Cart Abandonment Rate',
        baseline: 68,
        target: 45,
        current: 52
      },
      {
        name: 'Checkout Time (seconds)',
        baseline: 120,
        target: 30,
        current: 45
      }
    ],
    status: 'active',
    progress: 85
  },
  {
    id: 'inn_3',
    title: 'Dark Mode UI Theme',
    description: 'Implement a dark mode option for the entire application to improve accessibility and user experience.',
    stage: 'ideation',
    priority: 'medium',
    category: 'ui',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'sarah.parker',
    tags: ['ui', 'accessibility', 'dark-mode'],
    status: 'active',
    progress: 10
  },
];

export default function OptimizationDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Optimization & Innovation Dashboard</h1>
          <p className="text-gray-600">Monitor, analyze, and optimize your store's performance</p>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
            <TabsTrigger value="innovation">Innovation Pipeline</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active A/B Tests</CardTitle>
                  <TestTube2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData.activeTests}</div>
                  <p className="text-xs text-muted-foreground">
                    {overviewData.significantTests} with significant results
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Innovations</CardTitle>
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData.activeInnovations}</div>
                  <p className="text-xs text-muted-foreground">
                    {overviewData.completedInnovations} completed this quarter
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92</div>
                  <p className="text-xs text-muted-foreground">
                    +5 points this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.8%</div>
                  <p className="text-xs text-muted-foreground">
                    +0.5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Improvement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+{overviewData.conversionImprovement}%</div>
                  <p className="text-xs text-muted-foreground">
                    From optimization initiatives
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+${overviewData.revenueImpact}k</div>
                  <p className="text-xs text-muted-foreground">
                    Monthly revenue increase
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Conversion rate and average order value over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LineChart data={performanceData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program Progress</CardTitle>
                  <CardDescription>
                    Current status of optimization initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Testing Coverage</span>
                      <span className="text-sm text-gray-500">{overviewData.testingCoverage}%</span>
                    </div>
                    <Progress value={overviewData.testingCoverage} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Innovation Progress</span>
                      <span className="text-sm text-gray-500">{overviewData.innovationProgress}%</span>
                    </div>
                    <Progress value={overviewData.innovationProgress} className="h-2" />
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-semibold mb-2">Recent Achievements</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Checkout optimization: +15% conversion
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Mobile UX improvements: +8% engagement
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Product recommendations: +12% AOV
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Innovation Ideas</CardTitle>
                  <CardDescription>
                    Potential opportunities to improve your store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {innovationIdeas.map((idea, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{idea.title}</h4>
                          <div className="flex space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              idea.impact === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {idea.impact} impact
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              idea.effort === 'low' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {idea.effort} effort
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>
                    Recommended actions to optimize your store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4 py-1">
                      <h4 className="font-medium">Implement winning variant from homepage CTA test</h4>
                      <p className="text-sm text-gray-600">The "B" variant shows a 40% improvement in click-through rate</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">View test details</Button>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-1">
                      <h4 className="font-medium">Review product page layout test results</h4>
                      <p className="text-sm text-gray-600">Test is approaching statistical significance (95% confidence)</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">View test details</Button>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 py-1">
                      <h4 className="font-medium">Prioritize innovation pipeline</h4>
                      <p className="text-sm text-gray-600">5 ideas ready for development prioritization</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">View innovation pipeline</Button>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-1">
                      <h4 className="font-medium">Create new A/B test for product recommendations</h4>
                      <p className="text-sm text-gray-600">Test different recommendation algorithms for effectiveness</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">Create new test</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value="ab-testing">
            <ABTestProvider>
              <ABTestingDashboard />
            </ABTestProvider>
          </TabsContent>

          {/* Innovation Pipeline Tab */}
          <TabsContent value="innovation">
            <InnovationPipelineProvider initialInnovations={initialInnovations}>
              <InnovationDashboard />
            </InnovationPipelineProvider>
          </TabsContent>

          {/* Performance Monitoring Tab */}
          <TabsContent value="performance">
            <PerformanceMonitoringDashboard />
          </TabsContent>

          {/* Conversion Optimization Tab */}
          <TabsContent value="conversion">
            <ConversionOptimizationDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">
                Detailed analytics and reporting for your optimization initiatives will be available soon.
              </p>
              <Button variant="outline">Request Early Access</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
