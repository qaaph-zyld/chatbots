'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

// Scenario interface
interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  tags: string[];
}

// Sample scenarios data
const SAMPLE_SCENARIOS: Scenario[] = [
  {
    id: 'product-inquiry',
    title: 'Product Availability Inquiry',
    description: 'Customer asking about product availability and stock levels.',
    category: 'Product Information',
    complexity: 'simple',
    tags: ['product', 'inventory', 'availability'],
  },
  {
    id: 'order-status',
    title: 'Order Status Check',
    description: 'Customer checking on the status of their recent order.',
    category: 'Order Management',
    complexity: 'simple',
    tags: ['order', 'tracking', 'shipping'],
  },
  {
    id: 'return-policy',
    title: 'Return Policy Information',
    description: 'Customer inquiring about the store\'s return and refund policies.',
    category: 'Customer Service',
    complexity: 'simple',
    tags: ['returns', 'refunds', 'policy'],
  },
  {
    id: 'product-comparison',
    title: 'Product Comparison Assistance',
    description: 'Customer needs help comparing features between multiple products.',
    category: 'Product Information',
    complexity: 'moderate',
    tags: ['comparison', 'features', 'recommendation'],
  },
  {
    id: 'payment-issue',
    title: 'Payment Processing Problem',
    description: 'Customer experiencing issues with payment processing during checkout.',
    category: 'Technical Support',
    complexity: 'complex',
    tags: ['payment', 'checkout', 'error'],
  },
  {
    id: 'bulk-order',
    title: 'Bulk Order Inquiry',
    description: 'Business customer inquiring about placing a large volume order with potential discount.',
    category: 'Sales',
    complexity: 'moderate',
    tags: ['bulk', 'wholesale', 'discount'],
  },
  {
    id: 'product-customization',
    title: 'Product Customization Options',
    description: 'Customer asking about available customization options for products.',
    category: 'Product Information',
    complexity: 'moderate',
    tags: ['customization', 'personalization', 'options'],
  },
  {
    id: 'shipping-international',
    title: 'International Shipping Query',
    description: 'Customer inquiring about international shipping options, costs, and delivery times.',
    category: 'Shipping',
    complexity: 'complex',
    tags: ['international', 'shipping', 'customs'],
  },
];

// Categories
const CATEGORIES = ['All', 'Product Information', 'Order Management', 'Customer Service', 'Technical Support', 'Sales', 'Shipping'];

// Complexity filters
const COMPLEXITY_FILTERS = ['All', 'simple', 'moderate', 'complex'];

export interface ScenarioLibraryProps {
  onScenarioSelect?: (scenarioId: string) => void;
  className?: string;
}

export const ScenarioLibrary: React.FC<ScenarioLibraryProps> = ({ 
  onScenarioSelect,
  className 
}) => {
  const [scenarios] = useState<Scenario[]>(SAMPLE_SCENARIOS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter scenarios based on category, complexity, and search query
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesCategory = selectedCategory === 'All' || scenario.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'All' || scenario.complexity === selectedComplexity;
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          scenario.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesComplexity && matchesSearch;
  });

  // Handle scenario selection
  const handleSelectScenario = (scenarioId: string) => {
    if (onScenarioSelect) {
      onScenarioSelect(scenarioId);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold">Customer Inquiry Scenarios</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COMPLEXITY_FILTERS.map(complexity => (
                <option key={complexity} value={complexity}>
                  {complexity === 'All' ? 'All' : complexity.charAt(0).toUpperCase() + complexity.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {filteredScenarios.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <p className="text-gray-500">No scenarios found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScenarios.map(scenario => (
            <div 
              key={scenario.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{scenario.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  scenario.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                  scenario.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {scenario.complexity.charAt(0).toUpperCase() + scenario.complexity.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-600 mt-2">{scenario.description}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {scenario.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">{scenario.category}</span>
                <Button 
                  onClick={() => handleSelectScenario(scenario.id)}
                  size="sm"
                >
                  Load Scenario
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioLibrary;
