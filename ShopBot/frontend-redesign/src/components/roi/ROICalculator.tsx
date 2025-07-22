'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { TrendingUp, DollarSign, Clock, Users, Target, Calculator } from 'lucide-react';

// Industry benchmarks for realistic calculations
const INDUSTRY_BENCHMARKS = {
  'retail': {
    avgTicketSize: 75,
    supportCostPerTicket: 12,
    conversionRate: 0.025,
    customerLifetimeValue: 850,
    supportVolumeMultiplier: 1.2
  },
  'electronics': {
    avgTicketSize: 320,
    supportCostPerTicket: 18,
    conversionRate: 0.018,
    customerLifetimeValue: 1200,
    supportVolumeMultiplier: 1.5
  },
  'fashion': {
    avgTicketSize: 95,
    supportCostPerTicket: 10,
    conversionRate: 0.032,
    customerLifetimeValue: 650,
    supportVolumeMultiplier: 1.1
  },
  'home-garden': {
    avgTicketSize: 140,
    supportCostPerTicket: 15,
    conversionRate: 0.022,
    customerLifetimeValue: 980,
    supportVolumeMultiplier: 1.3
  },
  'health-beauty': {
    avgTicketSize: 55,
    supportCostPerTicket: 8,
    conversionRate: 0.028,
    customerLifetimeValue: 420,
    supportVolumeMultiplier: 1.0
  }
};

interface ROIInputs {
  industry: keyof typeof INDUSTRY_BENCHMARKS;
  monthlyOrders: number;
  avgOrderValue: number;
  currentSupportCost: number;
  supportTicketsPerMonth: number;
  currentResponseTime: number; // in minutes
  desiredResponseTime: number; // in minutes
  businessSize: 'small' | 'medium' | 'large' | 'enterprise';
}

interface ROIResults {
  monthlySavings: number;
  annualSavings: number;
  efficiencyGain: number;
  customerSatisfactionImprovement: number;
  revenueIncrease: number;
  paybackPeriod: number;
  roi12Month: number;
  totalBenefit: number;
}

export interface ROICalculatorProps {
  className?: string;
  onResultsChange?: (results: ROIResults) => void;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ 
  className,
  onResultsChange 
}) => {
  const [inputs, setInputs] = useState<ROIInputs>({
    industry: 'retail',
    monthlyOrders: 1000,
    avgOrderValue: 75,
    currentSupportCost: 5000,
    supportTicketsPerMonth: 500,
    currentResponseTime: 120, // 2 hours
    desiredResponseTime: 5, // 5 minutes
    businessSize: 'medium'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  // Calculate ROI based on inputs
  const roiResults = useMemo((): ROIResults => {
    const benchmark = INDUSTRY_BENCHMARKS[inputs.industry];
    
    // Base calculations
    const currentMonthlyCost = inputs.currentSupportCost;
    const automationEfficiency = 0.75; // 75% of tickets can be automated
    const responseTimeImprovement = inputs.currentResponseTime / inputs.desiredResponseTime;
    
    // Cost savings calculations
    const automatedTickets = inputs.supportTicketsPerMonth * automationEfficiency;
    const costPerTicket = benchmark.supportCostPerTicket;
    const monthlySavings = automatedTickets * costPerTicket;
    
    // Revenue impact calculations
    const satisfactionImprovement = Math.min(responseTimeImprovement * 0.15, 0.4); // Max 40% improvement
    const conversionIncrease = satisfactionImprovement * 0.5; // 50% of satisfaction improvement affects conversion
    const additionalRevenue = inputs.monthlyOrders * inputs.avgOrderValue * conversionIncrease;
    
    // Business size multipliers
    const sizeMultipliers = {
      small: 0.8,
      medium: 1.0,
      large: 1.3,
      enterprise: 1.8
    };
    
    const sizeMultiplier = sizeMultipliers[inputs.businessSize];
    const adjustedSavings = monthlySavings * sizeMultiplier;
    const adjustedRevenue = additionalRevenue * sizeMultiplier;
    
    // ShopBot pricing estimate (simplified)
    const monthlyShopBotCost = inputs.businessSize === 'small' ? 99 : 
                               inputs.businessSize === 'medium' ? 299 :
                               inputs.businessSize === 'large' ? 599 : 999;
    
    const netMonthlySavings = adjustedSavings - monthlyShopBotCost;
    const totalMonthlyBenefit = netMonthlySavings + adjustedRevenue;
    
    return {
      monthlySavings: Math.max(0, netMonthlySavings),
      annualSavings: Math.max(0, netMonthlySavings * 12),
      efficiencyGain: responseTimeImprovement,
      customerSatisfactionImprovement: satisfactionImprovement * 100,
      revenueIncrease: adjustedRevenue * 12,
      paybackPeriod: monthlyShopBotCost / Math.max(totalMonthlyBenefit, 1),
      roi12Month: ((totalMonthlyBenefit * 12) / (monthlyShopBotCost * 12)) * 100,
      totalBenefit: totalMonthlyBenefit * 12
    };
  }, [inputs]);

  // Trigger animation when results change
  useEffect(() => {
    setAnimateResults(true);
    const timer = setTimeout(() => setAnimateResults(false), 600);
    return () => clearTimeout(timer);
  }, [roiResults]);

  // Notify parent of results changes
  useEffect(() => {
    onResultsChange?.(roiResults);
  }, [roiResults, onResultsChange]);

  const updateInput = (key: keyof ROIInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          ROI Calculator
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Calculate your potential savings and revenue increase with ShopBot's AI-powered customer support automation.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Industry Selection */}
            <div className="space-y-2">
              <Label htmlFor="industry-select">Industry</Label>
              <Select 
                value={inputs.industry} 
                onValueChange={(value: keyof typeof INDUSTRY_BENCHMARKS) => updateInput('industry', value)}
              >
                <SelectTrigger id="industry-select" aria-label="Industry">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail & General Merchandise</SelectItem>
                  <SelectItem value="electronics">Electronics & Technology</SelectItem>
                  <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                  <SelectItem value="home-garden">Home & Garden</SelectItem>
                  <SelectItem value="health-beauty">Health & Beauty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Size */}
            <div className="space-y-2">
              <Label htmlFor="business-size-select">Business Size</Label>
              <Select 
                value={inputs.businessSize} 
                onValueChange={(value: 'small' | 'medium' | 'large' | 'enterprise') => updateInput('businessSize', value)}
              >
                <SelectTrigger id="business-size-select" aria-label="Business Size">
                  <SelectValue placeholder="Select business size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; $1M annual revenue)</SelectItem>
                  <SelectItem value="medium">Medium ($1M - $10M annual revenue)</SelectItem>
                  <SelectItem value="large">Large ($10M - $100M annual revenue)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (&gt; $100M annual revenue)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Orders */}
            <div className="space-y-2">
              <Label htmlFor="monthlyOrders">Monthly Orders</Label>
              <Input
                id="monthlyOrders"
                type="number"
                value={inputs.monthlyOrders}
                onChange={(e) => updateInput('monthlyOrders', parseInt(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>

            {/* Average Order Value */}
            <div className="space-y-2">
              <Label htmlFor="avgOrderValue">Average Order Value ($)</Label>
              <Input
                id="avgOrderValue"
                type="number"
                value={inputs.avgOrderValue}
                onChange={(e) => updateInput('avgOrderValue', parseFloat(e.target.value) || 0)}
                placeholder="75"
              />
            </div>

            {/* Support Tickets */}
            <div className="space-y-2">
              <Label htmlFor="supportTickets">Monthly Support Tickets</Label>
              <Input
                id="supportTickets"
                type="number"
                value={inputs.supportTicketsPerMonth}
                onChange={(e) => updateInput('supportTicketsPerMonth', parseInt(e.target.value) || 0)}
                placeholder="500"
              />
            </div>

            {/* Advanced Options Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="currentSupportCost">Current Monthly Support Cost ($)</Label>
                  <Input
                    id="currentSupportCost"
                    type="number"
                    value={inputs.currentSupportCost}
                    onChange={(e) => updateInput('currentSupportCost', parseFloat(e.target.value) || 0)}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Response Time: {inputs.currentResponseTime} minutes</Label>
                  <Slider
                    value={[inputs.currentResponseTime]}
                    onValueChange={([value]) => updateInput('currentResponseTime', value)}
                    max={480}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Response Time: {inputs.desiredResponseTime} minutes</Label>
                  <Slider
                    value={[inputs.desiredResponseTime]}
                    onValueChange={([value]) => updateInput('desiredResponseTime', value)}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your ROI Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-4 transition-all duration-500 ${animateResults ? 'scale-105' : 'scale-100'}`}>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(roiResults.annualSavings)}
                  </div>
                  <div className="text-sm text-green-600">Annual Savings</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700">
                    {formatPercentage(roiResults.roi12Month)}
                  </div>
                  <div className="text-sm text-blue-600">12-Month ROI</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Monthly Cost Savings</span>
                  <Badge variant="secondary">{formatCurrency(roiResults.monthlySavings)}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Additional Annual Revenue</span>
                  <Badge variant="secondary">{formatCurrency(roiResults.revenueIncrease)}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Efficiency Improvement</span>
                  <Badge variant="secondary">{roiResults.efficiencyGain.toFixed(1)}x faster</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Customer Satisfaction Boost</span>
                  <Badge variant="secondary">+{formatPercentage(roiResults.customerSatisfactionImprovement)}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Payback Period</span>
                  <Badge variant="secondary">{roiResults.paybackPeriod.toFixed(1)} months</Badge>
                </div>
              </div>

              {/* Total Benefit */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white text-center">
                <div className="text-sm opacity-90">Total 12-Month Benefit</div>
                <div className="text-3xl font-bold">{formatCurrency(roiResults.totalBenefit)}</div>
              </div>

              {/* CTA */}
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Your Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Industry Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">Average Ticket Size</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(INDUSTRY_BENCHMARKS[inputs.industry].avgTicketSize)}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="font-semibold text-green-700">Support Cost per Ticket</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(INDUSTRY_BENCHMARKS[inputs.industry].supportCostPerTicket)}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="font-semibold text-purple-700">Conversion Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(INDUSTRY_BENCHMARKS[inputs.industry].conversionRate * 100)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ROICalculator;
