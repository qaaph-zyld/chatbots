'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { InfoCircle, ArrowRight } from 'lucide-react';

interface ROIInputs {
  monthlyOrders: number;
  avgOrderValue: number;
  customerServiceHours: number;
  hourlyWage: number;
  automationRate: number;
}

interface ROIResults {
  monthlySavings: number;
  annualSavings: number;
  laborSavings: number;
  conversionIncrease: number;
  customerSatisfaction: number;
  roi: number;
  paybackPeriod: number;
}

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>({
    monthlyOrders: 500,
    avgOrderValue: 75,
    customerServiceHours: 160,
    hourlyWage: 20,
    automationRate: 70,
  });

  const [results, setResults] = useState<ROIResults>({
    monthlySavings: 0,
    annualSavings: 0,
    laborSavings: 0,
    conversionIncrease: 0,
    customerSatisfaction: 0,
    roi: 0,
    paybackPeriod: 0,
  });

  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate ROI based on inputs
  const calculateROI = () => {
    setIsCalculating(true);
    
    // Simulate API call or complex calculation
    setTimeout(() => {
      const { monthlyOrders, avgOrderValue, customerServiceHours, hourlyWage, automationRate } = inputs;
      
      // Calculate labor savings
      const automationDecimal = automationRate / 100;
      const hoursAutomated = customerServiceHours * automationDecimal;
      const laborSavings = hoursAutomated * hourlyWage;
      
      // Calculate conversion increase (assume 5% increase in conversion rate from better support)
      const additionalOrders = monthlyOrders * 0.05;
      const additionalRevenue = additionalOrders * avgOrderValue;
      
      // Calculate customer satisfaction increase (scaled based on automation rate)
      const satisfactionIncrease = 10 + (automationRate / 10);
      
      // Calculate total monthly savings
      const monthlySavings = laborSavings + (additionalRevenue * 0.3); // Assuming 30% profit margin
      
      // Calculate annual savings
      const annualSavings = monthlySavings * 12;
      
      // Calculate ROI (assuming $500/month ShopBot cost)
      const annualCost = 500 * 12;
      const roi = (annualSavings / annualCost) * 100;
      
      // Calculate payback period in months
      const paybackPeriod = (annualCost / annualSavings) * 12;
      
      setResults({
        monthlySavings,
        annualSavings,
        laborSavings,
        conversionIncrease: additionalRevenue,
        customerSatisfaction: satisfactionIncrease,
        roi,
        paybackPeriod,
      });
      
      setIsCalculating(false);
    }, 800);
  };

  // Calculate initial ROI on component mount
  useEffect(() => {
    calculateROI();
  }, []);

  // Handle input changes
  const handleInputChange = (key: keyof ROIInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ROI Calculator</CardTitle>
        <CardDescription>
          Calculate your potential savings and return on investment with ShopBot
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthlyOrders">Monthly Orders</Label>
                <span className="text-sm font-medium">{inputs.monthlyOrders}</span>
              </div>
              <Slider
                id="monthlyOrders"
                min={100}
                max={10000}
                step={100}
                value={[inputs.monthlyOrders]}
                onValueChange={(value) => handleInputChange('monthlyOrders', value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span>
                <span>10,000</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="avgOrderValue">Average Order Value</Label>
                <span className="text-sm font-medium">{formatCurrency(inputs.avgOrderValue)}</span>
              </div>
              <Slider
                id="avgOrderValue"
                min={10}
                max={500}
                step={5}
                value={[inputs.avgOrderValue]}
                onValueChange={(value) => handleInputChange('avgOrderValue', value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10</span>
                <span>$500</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customerServiceHours">Monthly CS Hours</Label>
                <span className="text-sm font-medium">{inputs.customerServiceHours} hrs</span>
              </div>
              <Slider
                id="customerServiceHours"
                min={40}
                max={1000}
                step={10}
                value={[inputs.customerServiceHours]}
                onValueChange={(value) => handleInputChange('customerServiceHours', value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>40 hrs</span>
                <span>1,000 hrs</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hourlyWage">Hourly Wage</Label>
                <span className="text-sm font-medium">{formatCurrency(inputs.hourlyWage)}/hr</span>
              </div>
              <Slider
                id="hourlyWage"
                min={10}
                max={100}
                step={1}
                value={[inputs.hourlyWage]}
                onValueChange={(value) => handleInputChange('hourlyWage', value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10/hr</span>
                <span>$100/hr</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="automationRate">Automation Rate</Label>
                <span className="text-sm font-medium">{inputs.automationRate}%</span>
              </div>
              <Slider
                id="automationRate"
                min={30}
                max={95}
                step={5}
                value={[inputs.automationRate]}
                onValueChange={(value) => handleInputChange('automationRate', value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span>95%</span>
              </div>
            </div>
            
            <Button 
              onClick={calculateROI} 
              className="w-full"
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Calculate ROI'}
            </Button>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary">
                {formatCurrency(results.annualSavings)}
              </h3>
              <p className="text-sm text-muted-foreground">Estimated Annual Savings</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Monthly Savings</p>
                <p className="text-xl font-bold">{formatCurrency(results.monthlySavings)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Labor Savings</p>
                <p className="text-xl font-bold">{formatCurrency(results.laborSavings)}/mo</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">ROI</p>
                <p className="text-xl font-bold">{results.roi.toFixed(0)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Payback Period</p>
                <p className="text-xl font-bold">{results.paybackPeriod.toFixed(1)} months</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-medium">+{results.customerSatisfaction.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Additional Revenue</span>
                <span className="text-sm font-medium">{formatCurrency(results.conversionIncrease)}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Hours Saved</span>
                <span className="text-sm font-medium">{(inputs.customerServiceHours * inputs.automationRate / 100).toFixed(0)} hrs/mo</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <InfoCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            This calculator provides estimates based on industry averages and your inputs. 
            Actual results may vary based on your specific business operations and implementation.
          </p>
        </div>
        
        <Button variant="outline" className="w-full sm:w-auto ml-auto">
          <span>Get Detailed Report</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
