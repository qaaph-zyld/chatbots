'use client';

import React from 'react';
import { InnovationDashboard } from '@/components/innovation/InnovationDashboard';
import { InnovationPipelineProvider } from '@/lib/innovation/InnovationPipeline';

// Sample initial innovations for demonstration
const initialInnovations = [
  {
    id: 'inn_1',
    title: 'AI-Powered Product Recommendations',
    description: 'Implement machine learning algorithm to suggest products based on user behavior and purchase history.',
    stage: 'development',
    priority: 'high',
    category: 'feature',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdBy: 'alex.smith',
    assignedTo: 'maria.jones',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
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
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    createdBy: 'alex.smith',
    assignedTo: 'john.doe',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
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
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    createdBy: 'sarah.parker',
    tags: ['ui', 'accessibility', 'dark-mode'],
    status: 'active',
    progress: 10
  },
  {
    id: 'inn_4',
    title: 'Voice Search Integration',
    description: 'Add voice search capability to allow customers to search for products using voice commands.',
    stage: 'validation',
    priority: 'medium',
    category: 'feature',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    createdBy: 'mike.wilson',
    assignedTo: 'sarah.parker',
    tags: ['voice', 'search', 'accessibility'],
    status: 'active',
    progress: 30
  },
  {
    id: 'inn_5',
    title: 'Mobile App Performance Optimization',
    description: 'Improve loading times and reduce battery consumption in the mobile application.',
    stage: 'released',
    priority: 'high',
    category: 'performance',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdBy: 'john.doe',
    assignedTo: 'alex.smith',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (completed)
    estimatedEffort: 7,
    businessValue: 8,
    technicalComplexity: 9,
    tags: ['performance', 'mobile', 'optimization'],
    metrics: [
      {
        name: 'App Load Time (seconds)',
        baseline: 3.2,
        target: 1.5,
        current: 1.4
      },
      {
        name: 'Battery Usage (%/hour)',
        baseline: 2.8,
        target: 1.5,
        current: 1.3
      }
    ],
    status: 'completed',
    progress: 100
  }
];

export default function InnovationPipelinePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Innovation Pipeline Management</h1>
          <p className="text-gray-600">Track, manage, and prioritize new features and improvements</p>
        </div>
      </div>
      
      <InnovationPipelineProvider initialInnovations={initialInnovations}>
        <InnovationDashboard />
      </InnovationPipelineProvider>
    </div>
  );
}
