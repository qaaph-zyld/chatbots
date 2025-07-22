'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestName, TestVariant } from '@/lib/ab-testing/ABTestProvider';
import analytics, { TestResult } from '@/lib/ab-testing/ABTestingAnalytics';
import { LineChart, BarChart, PieChart } from '@/components/charts';

interface ABTestCardProps {
  testName: TestName;
  results: TestResult[];
  onViewDetails: (testName: TestName) => void;
}

const ABTestCard: React.FC<ABTestCardProps> = ({ testName, results, onViewDetails }) => {
  // Find the winning variant (highest conversion rate)
  const winningVariant = results.reduce((prev, current) => 
    prev.conversionRate > current.conversionRate ? prev : current
  );
  
  // Calculate improvement over control
  const controlResult = results.find(r => r.variant === 'control');
  const improvement = controlResult 
    ? ((winningVariant.conversionRate - controlResult.conversionRate) / controlResult.conversionRate) * 100
    : 0;
  
  // Calculate total impressions
  const totalImpressions = results.reduce((sum, result) => sum + result.impressions, 0);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{testName}</CardTitle>
          <Badge className={improvement > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`}
          </Badge>
        </div>
        <CardDescription className="text-sm text-gray-500">
          {totalImpressions.toLocaleString()} impressions • {results.length} variants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {results.map((result) => (
            <div key={result.variant} className="flex items-center">
              <span className="w-16 text-sm">{result.variant}:</span>
              <div className="flex-1 mx-2">
                <Progress 
                  value={result.conversionRate * 100} 
                  max={Math.max(...results.map(r => r.conversionRate * 100)) * 1.2} 
                  className={`h-2 ${result.variant === winningVariant.variant ? 'bg-green-500' : ''}`} 
                />
              </div>
              <span className="text-sm">{(result.conversionRate * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(testName)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

interface TestDetailsProps {
  testName: TestName;
  results: TestResult[];
  onClose: () => void;
}

const TestDetails: React.FC<TestDetailsProps> = ({ testName, results, onClose }) => {
  // Calculate significance between best variant and control
  const significance = analytics.calculateSignificance(
    testName,
    results.reduce((prev, current) => 
      prev.conversionRate > current.conversionRate ? prev.variant : current.variant
    ),
    'control'
  );
  
  // Prepare data for charts
  const conversionData = {
    labels: results.map(r => r.variant),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: results.map(r => r.conversionRate * 100),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const clicksData = {
    labels: results.map(r => r.variant),
    datasets: [
      {
        label: 'Clicks',
        data: results.map(r => r.clicks),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const impressionsData = {
    labels: results.map(r => r.variant),
    datasets: [
      {
        label: 'Impressions',
        data: results.map(r => r.impressions),
      },
    ],
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{testName} - Test Results</h2>
        <Badge className={significance.significant ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {significance.significant ? 'Statistically Significant' : 'Not Significant Yet'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(significance.confidenceLevel * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(significance.improvement * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">P-Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{significance.pValue.toFixed(3)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
          <div className="h-64 bg-white p-4 rounded-lg border">
            <BarChart data={conversionData} />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Clicks</h3>
          <div className="h-64 bg-white p-4 rounded-lg border">
            <BarChart data={clicksData} />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Detailed Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.variant}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{result.variant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{result.impressions.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{result.clicks.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{result.conversions.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{(result.conversionRate * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${result.averageValue?.toFixed(2) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
          {significance.significant ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">
                <strong>Implement the winning variant.</strong> With {(significance.confidenceLevel * 100).toFixed(1)}% confidence,
                variant {results.reduce((prev, current) => 
                  prev.conversionRate > current.conversionRate ? prev : current
                ).variant} outperforms the control by {(significance.improvement * 100).toFixed(1)}%.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                <strong>Continue testing.</strong> The results are not yet statistically significant.
                Consider running the test longer or increasing traffic allocation.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  );
};

interface NewTestFormProps {
  onSubmit: (testName: string, variants: string[], weights: number[]) => void;
  onCancel: () => void;
}

const NewTestForm: React.FC<NewTestFormProps> = ({ onSubmit, onCancel }) => {
  const [testName, setTestName] = useState('');
  const [variants, setVariants] = useState(['A', 'B', 'control']);
  const [weights, setWeights] = useState(['33', '33', '34']);
  const [newVariant, setNewVariant] = useState('');
  
  const handleAddVariant = () => {
    if (newVariant && !variants.includes(newVariant)) {
      const newVariants = [...variants, newVariant];
      const equalWeight = Math.floor(100 / newVariants.length);
      const remainder = 100 - (equalWeight * newVariants.length);
      
      const newWeights = newVariants.map((_, index) => 
        index === newVariants.length - 1 ? String(equalWeight + remainder) : String(equalWeight)
      );
      
      setVariants(newVariants);
      setWeights(newWeights);
      setNewVariant('');
    }
  };
  
  const handleRemoveVariant = (index: number) => {
    if (variants.length > 2) {
      const newVariants = variants.filter((_, i) => i !== index);
      const equalWeight = Math.floor(100 / newVariants.length);
      const remainder = 100 - (equalWeight * newVariants.length);
      
      const newWeights = newVariants.map((_, index) => 
        index === newVariants.length - 1 ? String(equalWeight + remainder) : String(equalWeight)
      );
      
      setVariants(newVariants);
      setWeights(newWeights);
    }
  };
  
  const handleWeightChange = (index: number, value: string) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate weights sum to 100
    const weightSum = weights.reduce((sum, weight) => sum + Number(weight), 0);
    if (weightSum !== 100) {
      alert('Weights must sum to 100%');
      return;
    }
    
    onSubmit(
      testName, 
      variants, 
      weights.map(w => Number(w))
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="testName">Test Name</Label>
        <Input
          id="testName"
          value={testName}
          onChange={e => setTestName(e.target.value)}
          placeholder="e.g., homepage_cta_button"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Variants</Label>
        {variants.map((variant, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={variant}
              onChange={e => {
                const newVariants = [...variants];
                newVariants[index] = e.target.value;
                setVariants(newVariants);
              }}
              className="flex-1"
              required
            />
            <Input
              type="number"
              value={weights[index]}
              onChange={e => handleWeightChange(index, e.target.value)}
              className="w-20"
              min="1"
              max="100"
              required
            />
            <span className="text-sm">%</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => handleRemoveVariant(index)}
              disabled={variants.length <= 2}
            >
              Remove
            </Button>
          </div>
        ))}
        
        <div className="flex items-center space-x-2 mt-2">
          <Input
            value={newVariant}
            onChange={e => setNewVariant(e.target.value)}
            placeholder="New variant name"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddVariant}>
            Add Variant
          </Button>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Test
        </Button>
      </DialogFooter>
    </form>
  );
};

// Sample test data for demonstration
const sampleTests: { name: TestName; results: TestResult[] }[] = [
  {
    name: 'homepage_hero_cta',
    results: [
      {
        testName: 'homepage_hero_cta',
        variant: 'A',
        impressions: 5000,
        clicks: 750,
        conversions: 150,
        conversionRate: 0.03,
        averageValue: 65.5,
        customEvents: {}
      },
      {
        testName: 'homepage_hero_cta',
        variant: 'B',
        impressions: 5000,
        clicks: 850,
        conversions: 200,
        conversionRate: 0.04,
        averageValue: 68.2,
        customEvents: {}
      },
      {
        testName: 'homepage_hero_cta',
        variant: 'control',
        impressions: 5000,
        clicks: 650,
        conversions: 120,
        conversionRate: 0.024,
        averageValue: 62.8,
        customEvents: {}
      }
    ]
  },
  {
    name: 'product_page_layout',
    results: [
      {
        testName: 'product_page_layout',
        variant: 'A',
        impressions: 3000,
        clicks: 450,
        conversions: 90,
        conversionRate: 0.03,
        averageValue: 72.5,
        customEvents: {}
      },
      {
        testName: 'product_page_layout',
        variant: 'B',
        impressions: 3000,
        clicks: 420,
        conversions: 75,
        conversionRate: 0.025,
        averageValue: 70.2,
        customEvents: {}
      },
      {
        testName: 'product_page_layout',
        variant: 'control',
        impressions: 3000,
        clicks: 390,
        conversions: 70,
        conversionRate: 0.023,
        averageValue: 68.8,
        customEvents: {}
      }
    ]
  },
  {
    name: 'checkout_flow',
    results: [
      {
        testName: 'checkout_flow',
        variant: 'A',
        impressions: 2000,
        clicks: 1800,
        conversions: 900,
        conversionRate: 0.45,
        averageValue: 85.5,
        customEvents: {}
      },
      {
        testName: 'checkout_flow',
        variant: 'B',
        impressions: 2000,
        clicks: 1850,
        conversions: 1000,
        conversionRate: 0.5,
        averageValue: 88.2,
        customEvents: {}
      },
      {
        testName: 'checkout_flow',
        variant: 'control',
        impressions: 2000,
        clicks: 1750,
        conversions: 850,
        conversionRate: 0.425,
        averageValue: 82.8,
        customEvents: {}
      }
    ]
  }
];

export function ABTestingDashboard() {
  const [tests, setTests] = useState(sampleTests);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<{ name: TestName; results: TestResult[] } | null>(null);
  const [isNewTestDialogOpen, setIsNewTestDialogOpen] = useState(false);
  
  const handleViewTestDetails = (testName: TestName) => {
    const test = tests.find(t => t.name === testName);
    if (test) {
      setSelectedTest(test);
      setIsDialogOpen(true);
    }
  };
  
  const handleCreateTest = (testName: string, variants: string[], weights: number[]) => {
    // In a real application, this would call an API to create the test
    console.log('Creating test:', { testName, variants, weights });
    setIsNewTestDialogOpen(false);
    
    // For demo purposes, add a mock test
    const newTest = {
      name: testName as TestName,
      results: variants.map((variant, index) => ({
        testName: testName as TestName,
        variant: variant as TestVariant,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        customEvents: {}
      }))
    };
    
    setTests([...tests, newTest]);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">A/B Testing Dashboard</h1>
        <Dialog open={isNewTestDialogOpen} onOpenChange={setIsNewTestDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Create New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test with multiple variants and traffic allocation.
              </DialogDescription>
            </DialogHeader>
            <NewTestForm 
              onSubmit={handleCreateTest} 
              onCancel={() => setIsNewTestDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="active" value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'archived')}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="archived">Archived Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <ABTestCard
                  key={test.name}
                  testName={test.name}
                  results={test.results}
                  onViewDetails={handleViewTestDetails}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No active tests yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setIsNewTestDialogOpen(true)}
                >
                  Create New Test
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="archived">
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No archived tests yet.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          {selectedTest && (
            <TestDetails 
              testName={selectedTest.name} 
              results={selectedTest.results} 
              onClose={() => setIsDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Testing Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tests.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {tests.reduce(
                  (sum, test) => sum + test.results.reduce(
                    (testSum, result) => testSum + result.impressions, 0
                  ), 0
                ).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(tests.reduce(
                  (sum, test) => sum + test.results.reduce(
                    (testSum, result) => testSum + result.conversionRate, 0
                  ) / test.results.length, 0
                ) / (tests.length || 1) * 100).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Significant Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
