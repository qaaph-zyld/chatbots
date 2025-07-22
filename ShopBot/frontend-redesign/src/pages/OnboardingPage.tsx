import React from 'react';
import { OnboardingProvider } from '../components/onboarding/OnboardingContext';
import OnboardingContainer from '../components/onboarding/OnboardingContainer';
import BusinessInfoStep from '../components/onboarding/steps/BusinessInfoStep';
import PlatformIntegrationStep from '../components/onboarding/steps/PlatformIntegrationStep';
import PreferencesStep from '../components/onboarding/steps/PreferencesStep';
import AITrainingStep from '../components/onboarding/steps/AITrainingStep';
import { OnboardingConfig } from '../components/onboarding/OnboardingTypes';
import { useNavigate } from 'react-router-dom';

/**
 * OnboardingPage
 * Main entry point for the ShopBot onboarding experience
 */
const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  // Define onboarding configuration
  const onboardingConfig: OnboardingConfig = {
    steps: [
      {
        id: 'business-info',
        title: 'Business Information',
        description: 'Tell us about your business so we can personalize your ShopBot experience.',
        component: BusinessInfoStep,
        estimatedTimeMinutes: 3,
      },
      {
        id: 'platform-integration',
        title: 'Platform Integration',
        description: 'Connect your e-commerce platform to enable ShopBot to access your product and order data.',
        component: PlatformIntegrationStep,
        estimatedTimeMinutes: 5,
      },
      {
        id: 'preferences',
        title: 'Appearance & Preferences',
        description: 'Customize how ShopBot looks and communicates with your customers.',
        component: PreferencesStep,
        estimatedTimeMinutes: 4,
      },
      {
        id: 'ai-training',
        title: 'AI Training',
        description: 'Train ShopBot with your product information and company policies.',
        component: AITrainingStep,
        estimatedTimeMinutes: 7,
      },
    ],
    welcome: {
      title: 'Welcome to ShopBot',
      description: 'Let\'s set up your ShopBot in just a few steps to start providing exceptional customer service.',
      buttonText: 'Get Started',
    },
    completion: {
      title: 'Setup Complete!',
      description: 'Your ShopBot is now ready to help your customers.',
      buttonText: 'Go to Dashboard',
      onCompleteRedirect: '/dashboard',
    },
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (userData: any) => {
    console.log('Onboarding completed with data:', userData);
    
    // Save completed onboarding data to backend (in a real implementation)
    // saveOnboardingData(userData).then(() => {
    //   navigate('/dashboard');
    // });
    
    // For demo purposes, just navigate to dashboard
    navigate('/dashboard');
  };

  // Handle step completion
  const handleStepComplete = (stepId: string, userData: any) => {
    console.log(`Step ${stepId} completed with data:`, userData);
    
    // Track step completion (in a real implementation)
    // trackStepCompletion(stepId, userData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <OnboardingProvider
        config={onboardingConfig}
        onComplete={handleOnboardingComplete}
        onStepComplete={handleStepComplete}
      >
        <div className="container mx-auto px-4">
          <OnboardingContainer />
        </div>
      </OnboardingProvider>
    </div>
  );
};

export default OnboardingPage;
