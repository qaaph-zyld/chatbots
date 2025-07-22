import React, { useState } from 'react';
import { OnboardingStepProps } from '../OnboardingTypes';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Button } from '../../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ShoppingBag, Store } from 'lucide-react';

/**
 * Platform Integration Step
 * Guides users through connecting their e-commerce platform
 */
const PlatformIntegrationStep: React.FC<OnboardingStepProps> = ({
  userData,
  updateUserData,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle platform type selection
  const handlePlatformChange = (value: string) => {
    updateUserData({
      platform: {
        ...userData.platform,
        type: value as 'shopify' | 'woocommerce' | 'other',
        apiIntegrated: false, // Reset integration status when platform changes
      },
    });
    setConnectionStatus('idle');
  };

  // Handle store URL change
  const handleStoreUrlChange = (value: string) => {
    updateUserData({
      platform: {
        ...userData.platform,
        storeUrl: value,
        apiIntegrated: false, // Reset integration status when URL changes
      },
    });
    setConnectionStatus('idle');
  };

  // Simulate API connection
  const handleConnect = async () => {
    if (!userData.platform.storeUrl) {
      setErrorMessage('Please enter your store URL');
      setConnectionStatus('error');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      // Simulate API connection with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo purposes, simulate success most of the time
      const success = Math.random() > 0.2;

      if (success) {
        setConnectionStatus('success');
        updateUserData({
          platform: {
            ...userData.platform,
            apiIntegrated: true,
            productCount: Math.floor(Math.random() * 500) + 10, // Random product count for demo
          },
        });
      } else {
        setConnectionStatus('error');
        setErrorMessage('Could not connect to store. Please check your URL and try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Platform options with icons and descriptions
  const platformOptions = [
    {
      value: 'shopify',
      label: 'Shopify',
      icon: <ShoppingBag className="h-5 w-5" />,
      description: 'Connect your Shopify store for seamless integration',
    },
    {
      value: 'woocommerce',
      label: 'WooCommerce',
      icon: <Store className="h-5 w-5" />,
      description: 'Connect your WooCommerce store for WordPress sites',
    },
    {
      value: 'other',
      label: 'Other Platform',
      icon: <Store className="h-5 w-5" />,
      description: 'Manual setup for other e-commerce platforms',
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Platform Selection */}
        <div className="space-y-3">
          <Label>Select Your E-commerce Platform</Label>
          <RadioGroup
            value={userData.platform.type || ''}
            onValueChange={handlePlatformChange}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {platformOptions.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`platform-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`platform-${option.value}`}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex flex-col items-center gap-2">
                    {option.icon}
                    <div className="font-semibold">{option.label}</div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground mt-2">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Store URL Input */}
        {userData.platform.type && (
          <div className="space-y-2 animate-in fade-in-50 duration-300">
            <Label htmlFor="store-url">Store URL</Label>
            <div className="flex space-x-2">
              <Input
                id="store-url"
                placeholder={
                  userData.platform.type === 'shopify'
                    ? 'your-store.myshopify.com'
                    : userData.platform.type === 'woocommerce'
                    ? 'your-wordpress-site.com'
                    : 'your-store-url.com'
                }
                value={userData.platform.storeUrl || ''}
                onChange={(e) => handleStoreUrlChange(e.target.value)}
                disabled={isConnecting || userData.platform.apiIntegrated}
              />
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !userData.platform.storeUrl || userData.platform.apiIntegrated}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting
                  </>
                ) : userData.platform.apiIntegrated ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Connected
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {connectionStatus === 'success' && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Successfully Connected!</AlertTitle>
            <AlertDescription>
              {userData.platform.productCount
                ? `We found ${userData.platform.productCount} products in your store.`
                : 'Your store has been connected successfully.'}
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Integration Tips */}
        {userData.platform.type && !userData.platform.apiIntegrated && (
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <h4 className="font-semibold mb-1">Integration Tips:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {userData.platform.type === 'shopify' && (
                <>
                  <li>Ensure you have admin access to your Shopify store</li>
                  <li>You'll need to approve the ShopBot app in your Shopify admin</li>
                  <li>We only request permissions necessary for customer service functions</li>
                </>
              )}
              {userData.platform.type === 'woocommerce' && (
                <>
                  <li>Ensure your WooCommerce REST API is enabled</li>
                  <li>You may need to generate API keys in your WordPress admin</li>
                  <li>Your site must be accessible from the internet (not localhost)</li>
                </>
              )}
              {userData.platform.type === 'other' && (
                <>
                  <li>Manual integration may require additional setup steps</li>
                  <li>Contact our support team for assistance with custom integrations</li>
                  <li>API documentation is available for custom development</li>
                </>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformIntegrationStep;
