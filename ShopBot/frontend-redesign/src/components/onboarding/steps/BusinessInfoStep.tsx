import React from 'react';
import { OnboardingStepProps } from '../OnboardingTypes';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Slider } from '../../ui/slider';

/**
 * Business Information Step
 * Collects essential business details to personalize the ShopBot experience
 */
const BusinessInfoStep: React.FC<OnboardingStepProps> = ({
  userData,
  updateUserData,
}) => {
  // Industry options
  const industries = [
    'Fashion & Apparel',
    'Electronics',
    'Home & Garden',
    'Beauty & Personal Care',
    'Food & Beverage',
    'Health & Wellness',
    'Toys & Games',
    'Sports & Outdoors',
    'Jewelry & Accessories',
    'Books & Media',
    'Art & Collectibles',
    'Other',
  ];

  // Business size options
  const businessSizes = [
    { value: 'solo', label: 'Solo Entrepreneur (1 person)' },
    { value: 'small', label: 'Small Business (2-10 employees)' },
    { value: 'medium', label: 'Medium Business (11-50 employees)' },
    { value: 'enterprise', label: 'Enterprise (50+ employees)' },
  ];

  // Handle input changes
  const handleChange = (field: string, value: string | number) => {
    updateUserData({
      business: {
        ...userData.business,
        [field]: value,
      },
    });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="business-name">Business Name</Label>
          <Input
            id="business-name"
            placeholder="Enter your business name"
            value={userData.business.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={userData.business.industry || ''}
            onValueChange={(value) => handleChange('industry', value)}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Size */}
        <div className="space-y-2">
          <Label htmlFor="business-size">Business Size</Label>
          <Select
            value={userData.business.size || ''}
            onValueChange={(value) => handleChange('size', value as 'solo' | 'small' | 'medium' | 'enterprise')}
          >
            <SelectTrigger id="business-size">
              <SelectValue placeholder="Select your business size" />
            </SelectTrigger>
            <SelectContent>
              {businessSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website URL</Label>
          <Input
            id="website"
            placeholder="https://yourbusiness.com"
            value={userData.business.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </div>

        {/* Monthly Sales Volume */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="monthly-sales">Monthly Sales Volume</Label>
            <span className="text-sm font-medium">
              {userData.business.monthlySales ? `$${userData.business.monthlySales.toLocaleString()}` : 'Not set'}
            </span>
          </div>
          <Slider
            id="monthly-sales"
            min={0}
            max={100000}
            step={1000}
            value={[userData.business.monthlySales || 0]}
            onValueChange={(values) => handleChange('monthlySales', values[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>$0</span>
            <span>$25,000</span>
            <span>$50,000</span>
            <span>$75,000</span>
            <span>$100,000+</span>
          </div>
        </div>

        {/* Customer Service Volume */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="customer-service-volume">Monthly Customer Service Inquiries</Label>
            <span className="text-sm font-medium">
              {userData.business.customerServiceVolume || 'Not set'}
            </span>
          </div>
          <Slider
            id="customer-service-volume"
            min={0}
            max={1000}
            step={10}
            value={[userData.business.customerServiceVolume || 0]}
            onValueChange={(values) => handleChange('customerServiceVolume', values[0])}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1,000+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessInfoStep;
