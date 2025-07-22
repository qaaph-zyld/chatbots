import React, { useState } from 'react';
import { OnboardingStepProps } from '../OnboardingTypes';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { AlertCircle, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';

/**
 * AI Training Step
 * Allows users to customize and train the AI for their specific business needs
 */
const AITrainingStep: React.FC<OnboardingStepProps> = ({
  userData,
  updateUserData,
}) => {
  const [activeTab, setActiveTab] = useState('product-knowledge');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Handle product knowledge update
  const handleProductKnowledgeChange = (value: string) => {
    updateUserData({
      aiTraining: {
        ...userData.aiTraining,
        productKnowledge: value,
      },
    });
  };

  // Handle company policy update
  const handlePolicyChange = (value: string) => {
    updateUserData({
      aiTraining: {
        ...userData.aiTraining,
        companyPolicies: value,
      },
    });
  };

  // Handle tone settings update
  const handleToneChange = (tone: string, value: number) => {
    updateUserData({
      aiTraining: {
        ...userData.aiTraining,
        toneSettings: {
          ...userData.aiTraining?.toneSettings,
          [tone]: value,
        },
      },
    });
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    updateUserData({
      aiTraining: {
        ...userData.aiTraining,
        features: {
          ...userData.aiTraining?.features,
          [feature]: enabled,
        },
      },
    });
  };

  // Simulate AI training process
  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress with intervals
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTrainingComplete(true);
          setIsTraining(false);
          
          // Update user data to indicate training is complete
          updateUserData({
            aiTraining: {
              ...userData.aiTraining,
              trainingCompleted: true,
              lastTrainedAt: new Date().toISOString(),
            },
          });
          
          return 100;
        }
        
        return newProgress;
      });
    }, 800);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {trainingComplete ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Training Complete!</h3>
            <p className="text-gray-600 mb-6">
              Your ShopBot has been trained with your specific business information and is ready to assist your customers.
            </p>
            <Alert variant="success" className="bg-green-50 text-green-800 border-green-200 mb-4">
              <AlertTitle>Training Results</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  <li>Product knowledge base: {userData.aiTraining?.productKnowledge ? 'Integrated' : 'Default'}</li>
                  <li>Company policies: {userData.aiTraining?.companyPolicies ? 'Customized' : 'Standard'}</li>
                  <li>AI personality: {userData.preferences?.aiResponseStyle || 'Professional'}</li>
                  <li>Advanced features: {Object.values(userData.aiTraining?.features || {}).filter(Boolean).length} enabled</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => setTrainingComplete(false)}>
              Adjust Training Settings
            </Button>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="product-knowledge">Product Knowledge</TabsTrigger>
                <TabsTrigger value="company-policies">Company Policies</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              {/* Product Knowledge Tab */}
              <TabsContent value="product-knowledge" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-knowledge">
                    Product Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Describe your products, key features, and common questions customers ask.
                    This helps ShopBot provide accurate information about your offerings.
                  </p>
                  <Textarea
                    id="product-knowledge"
                    placeholder="Example: Our premium t-shirts are made from 100% organic cotton, available in sizes XS-XXL, and come with a 30-day satisfaction guarantee. They're pre-shrunk and machine washable in cold water."
                    rows={6}
                    value={userData.aiTraining?.productKnowledge || ''}
                    onChange={(e) => handleProductKnowledgeChange(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
                  <h4 className="font-semibold mb-1">Tips for effective product descriptions:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Include key product features and benefits</li>
                    <li>Mention sizing, materials, and care instructions</li>
                    <li>Address common customer questions</li>
                    <li>Include any warranty or guarantee information</li>
                    <li>Describe what makes your products unique</li>
                  </ul>
                </div>
              </TabsContent>
              
              {/* Company Policies Tab */}
              <TabsContent value="company-policies" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-policies">
                    Company Policies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Describe your return policy, shipping information, and customer service guidelines.
                    This helps ShopBot accurately represent your policies to customers.
                  </p>
                  <Textarea
                    id="company-policies"
                    placeholder="Example: We offer free shipping on orders over $50. Returns are accepted within 30 days of purchase with original receipt. Refunds are processed within 5-7 business days."
                    rows={6}
                    value={userData.aiTraining?.companyPolicies || ''}
                    onChange={(e) => handlePolicyChange(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
                  <h4 className="font-semibold mb-1">Important policies to include:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Return and refund policies</li>
                    <li>Shipping times and costs</li>
                    <li>Privacy and data handling policies</li>
                    <li>Customer service hours and response times</li>
                    <li>Any special promotions or loyalty programs</li>
                  </ul>
                </div>
              </TabsContent>
              
              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="space-y-6">
                {/* Tone Settings */}
                <div className="space-y-4">
                  <Label className="text-base">AI Tone Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Fine-tune how your ShopBot communicates with customers
                  </p>
                  
                  <div className="space-y-6">
                    {/* Formality Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Formality</Label>
                        <span className="text-sm font-medium">
                          {userData.aiTraining?.toneSettings?.formality === 0 ? 'Very Casual' :
                           userData.aiTraining?.toneSettings?.formality === 25 ? 'Casual' :
                           userData.aiTraining?.toneSettings?.formality === 50 ? 'Neutral' :
                           userData.aiTraining?.toneSettings?.formality === 75 ? 'Formal' :
                           userData.aiTraining?.toneSettings?.formality === 100 ? 'Very Formal' :
                           'Neutral'}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={25}
                        value={[userData.aiTraining?.toneSettings?.formality || 50]}
                        onValueChange={(values) => handleToneChange('formality', values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Casual</span>
                        <span>Formal</span>
                      </div>
                    </div>
                    
                    {/* Enthusiasm Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Enthusiasm</Label>
                        <span className="text-sm font-medium">
                          {userData.aiTraining?.toneSettings?.enthusiasm === 0 ? 'Reserved' :
                           userData.aiTraining?.toneSettings?.enthusiasm === 25 ? 'Mild' :
                           userData.aiTraining?.toneSettings?.enthusiasm === 50 ? 'Moderate' :
                           userData.aiTraining?.toneSettings?.enthusiasm === 75 ? 'Enthusiastic' :
                           userData.aiTraining?.toneSettings?.enthusiasm === 100 ? 'Very Enthusiastic' :
                           'Moderate'}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={25}
                        value={[userData.aiTraining?.toneSettings?.enthusiasm || 50]}
                        onValueChange={(values) => handleToneChange('enthusiasm', values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Reserved</span>
                        <span>Enthusiastic</span>
                      </div>
                    </div>
                    
                    {/* Humor Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Humor</Label>
                        <span className="text-sm font-medium">
                          {userData.aiTraining?.toneSettings?.humor === 0 ? 'Serious' :
                           userData.aiTraining?.toneSettings?.humor === 25 ? 'Subtle' :
                           userData.aiTraining?.toneSettings?.humor === 50 ? 'Balanced' :
                           userData.aiTraining?.toneSettings?.humor === 75 ? 'Playful' :
                           userData.aiTraining?.toneSettings?.humor === 100 ? 'Very Playful' :
                           'Balanced'}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={25}
                        value={[userData.aiTraining?.toneSettings?.humor || 25]}
                        onValueChange={(values) => handleToneChange('humor', values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Serious</span>
                        <span>Playful</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feature Toggles */}
                <div className="space-y-4">
                  <Label className="text-base">Advanced Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable specific AI capabilities
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="feature-product-recommendations" className="font-medium">
                          Product Recommendations
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Suggest relevant products based on customer inquiries
                        </p>
                      </div>
                      <Switch
                        id="feature-product-recommendations"
                        checked={userData.aiTraining?.features?.productRecommendations || false}
                        onCheckedChange={(checked) => handleFeatureToggle('productRecommendations', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="feature-sentiment-analysis" className="font-medium">
                          Sentiment Analysis
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Detect customer emotions and adjust responses accordingly
                        </p>
                      </div>
                      <Switch
                        id="feature-sentiment-analysis"
                        checked={userData.aiTraining?.features?.sentimentAnalysis || false}
                        onCheckedChange={(checked) => handleFeatureToggle('sentimentAnalysis', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="feature-multilingual" className="font-medium">
                          Multilingual Support
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically detect and respond in the customer's language
                        </p>
                      </div>
                      <Switch
                        id="feature-multilingual"
                        checked={userData.aiTraining?.features?.multilingualSupport || false}
                        onCheckedChange={(checked) => handleFeatureToggle('multilingualSupport', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="feature-order-management" className="font-medium">
                          Order Management
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow AI to check order status and process simple changes
                        </p>
                      </div>
                      <Switch
                        id="feature-order-management"
                        checked={userData.aiTraining?.features?.orderManagement || false}
                        onCheckedChange={(checked) => handleFeatureToggle('orderManagement', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Training Button */}
            <div className="mt-8">
              <Button
                onClick={startTraining}
                disabled={isTraining}
                className="w-full"
                size="lg"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training AI ({Math.round(trainingProgress)}%)
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Train ShopBot with My Settings
                  </>
                )}
              </Button>
              
              {isTraining && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: `${trainingProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    {trainingProgress < 30 ? 'Analyzing your business data...' :
                     trainingProgress < 60 ? 'Building knowledge base...' :
                     trainingProgress < 90 ? 'Fine-tuning AI responses...' :
                     'Finalizing setup...'}
                  </p>
                </div>
              )}
              
              {!isTraining && !userData.aiTraining?.trainingCompleted && (
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  Training helps ShopBot understand your business and provide better customer service
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AITrainingStep;
