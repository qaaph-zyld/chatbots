import React, { useState } from 'react';
import { OnboardingStepProps } from '../OnboardingTypes';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { HexColorPicker } from 'react-colorful';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { MessageSquare, Bell, Palette, Upload } from 'lucide-react';

/**
 * Preferences Step
 * Allows users to customize their ShopBot experience
 */
const PreferencesStep: React.FC<OnboardingStepProps> = ({
  userData,
  updateUserData,
}) => {
  const [activeTab, setActiveTab] = useState('communication');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(userData.preferences.logo || null);

  // Handle AI response style change
  const handleStyleChange = (value: string) => {
    updateUserData({
      preferences: {
        ...userData.preferences,
        aiResponseStyle: value as 'friendly' | 'professional' | 'casual' | 'formal',
      },
    });
  };

  // Handle notification preference change
  const handleNotificationChange = (type: 'email' | 'push' | 'slack', checked: boolean) => {
    updateUserData({
      preferences: {
        ...userData.preferences,
        notificationPreferences: {
          ...userData.preferences.notificationPreferences,
          [type]: checked,
        },
      },
    });
  };

  // Handle color change
  const handleColorChange = (type: 'primary' | 'secondary' | 'accent', color: string) => {
    updateUserData({
      preferences: {
        ...userData.preferences,
        brandColors: {
          ...userData.preferences.brandColors,
          [type]: color,
        },
      },
    });
  };

  // Simulate logo upload
  const handleLogoUpload = () => {
    setUploadingLogo(true);
    
    // Simulate upload delay
    setTimeout(() => {
      // For demo purposes, use a placeholder logo URL
      const logoUrl = 'https://via.placeholder.com/200x80?text=Your+Logo';
      setPreviewLogo(logoUrl);
      
      updateUserData({
        preferences: {
          ...userData.preferences,
          logo: logoUrl,
        },
      });
      
      setUploadingLogo(false);
    }, 1500);
  };

  // AI response style options
  const responseStyles = [
    {
      value: 'friendly',
      label: 'Friendly',
      description: 'Warm, approachable, and conversational',
      example: 'Hi there! I would be happy to help you track your order!',
    },
    {
      value: 'professional',
      label: 'Professional',
      description: 'Polished, efficient, and business-like',
      example: 'Thank you for your inquiry. I can assist with locating your order details.',
    },
    {
      value: 'casual',
      label: 'Casual',
      description: 'Relaxed, informal, and personable',
      example: 'Hey! Let us get that order tracked down for you right away.',
    },
    {
      value: 'formal',
      label: 'Formal',
      description: 'Traditional, respectful, and structured',
      example: 'Good day. I would be pleased to assist you with your order tracking request.',
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Communication Preferences */}
          <TabsContent value="communication" className="space-y-6">
            <div className="space-y-4">
              <Label>AI Response Style</Label>
              <RadioGroup
                value={userData.preferences.aiResponseStyle || 'professional'}
                onValueChange={handleStyleChange}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {responseStyles.map((style) => (
                  <div key={style.value} className="relative">
                    <RadioGroupItem
                      value={style.value}
                      id={`style-${style.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`style-${style.value}`}
                      className="flex flex-col rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {style.description}
                      </div>
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm italic">
                        "{style.example}"
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>
          
          {/* Notification Preferences */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base">Notification Preferences</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and summaries via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={userData.preferences.notificationPreferences?.email || false}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time alerts in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={userData.preferences.notificationPreferences?.push || false}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slack-notifications" className="font-medium">
                      Slack Integration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your Slack workspace
                    </p>
                  </div>
                  <Switch
                    id="slack-notifications"
                    checked={userData.preferences.notificationPreferences?.slack || false}
                    onCheckedChange={(checked) => handleNotificationChange('slack', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Branding Preferences */}
          <TabsContent value="branding" className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label className="text-base">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {previewLogo ? (
                    <img 
                      src={previewLogo} 
                      alt="Company logo" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended size: 200×80px, PNG or SVG format
              </p>
            </div>
            
            {/* Brand Colors */}
            <div className="space-y-4">
              <Label className="text-base">Brand Colors</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="space-y-2">
                    <div className="w-full h-24">
                      <HexColorPicker
                        color={userData.preferences.brandColors?.primary || '#0066cc'}
                        onChange={(color) => handleColorChange('primary', color)}
                      />
                    </div>
                    <Input
                      id="primary-color"
                      value={userData.preferences.brandColors?.primary || '#0066cc'}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                
                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="space-y-2">
                    <div className="w-full h-24">
                      <HexColorPicker
                        color={userData.preferences.brandColors?.secondary || '#4d9eff'}
                        onChange={(color) => handleColorChange('secondary', color)}
                      />
                    </div>
                    <Input
                      id="secondary-color"
                      value={userData.preferences.brandColors?.secondary || '#4d9eff'}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                
                {/* Accent Color */}
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="space-y-2">
                    <div className="w-full h-24">
                      <HexColorPicker
                        color={userData.preferences.brandColors?.accent || '#ff6b00'}
                        onChange={(color) => handleColorChange('accent', color)}
                      />
                    </div>
                    <Input
                      id="accent-color"
                      value={userData.preferences.brandColors?.accent || '#ff6b00'}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-6 p-4 border rounded-md">
                <Label className="text-sm mb-2 block">Preview</Label>
                <div className="flex flex-wrap gap-2">
                  <div 
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: userData.preferences.brandColors?.primary || '#0066cc' }}
                  />
                  <div 
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: userData.preferences.brandColors?.secondary || '#4d9eff' }}
                  />
                  <div 
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: userData.preferences.brandColors?.accent || '#ff6b00' }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PreferencesStep;
