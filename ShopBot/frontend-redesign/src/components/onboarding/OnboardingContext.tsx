import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  OnboardingContextType, 
  OnboardingStep, 
  UserData,
  OnboardingConfig
} from './OnboardingTypes';

// Create context with default values
const OnboardingContext = createContext<OnboardingContextType>({
  userData: {
    business: {},
    platform: {},
    preferences: {},
    progress: {
      completedSteps: [],
      currentStepId: '',
      percentComplete: 0,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    },
  },
  updateUserData: () => {},
  currentStep: null,
  steps: [],
  goToStep: () => {},
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  completeCurrentStep: () => {},
  skipCurrentStep: () => {},
  isStepCompleted: () => false,
  resetOnboarding: () => {},
  progressPercentage: 0,
  isComplete: false,
  isInProgress: false,
});

// Local storage key for saving onboarding progress
const STORAGE_KEY = 'shopbot_onboarding_progress';

interface OnboardingProviderProps {
  children: React.ReactNode;
  config: OnboardingConfig;
  // Optional initial user data
  initialUserData?: Partial<UserData>;
  // Optional callback when onboarding is completed
  onComplete?: (userData: UserData) => void;
  // Optional callback when a step is completed
  onStepComplete?: (stepId: string, userData: UserData) => void;
}

/**
 * Provider component for the onboarding system
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  config,
  initialUserData,
  onComplete,
  onStepComplete,
}) => {
  // Filter steps based on shouldShow condition
  const availableSteps = useMemo(() => {
    return config.steps.filter(step => {
      if (!step.shouldShow) return true;
      return step.shouldShow(userData);
    });
  }, [config.steps]);

  // Initialize user data with defaults and any provided initial data
  const [userData, setUserData] = useState<UserData>(() => {
    // Try to load saved progress from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    // Default user data structure
    const defaultUserData: UserData = {
      business: {},
      platform: {},
      preferences: {},
      progress: {
        completedSteps: [],
        currentStepId: availableSteps.length > 0 ? availableSteps[0].id : '',
        percentComplete: 0,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      },
    };
    
    // If we have saved data, parse and use it
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Update last activity timestamp
        parsedData.progress.lastActivityAt = new Date().toISOString();
        return { ...defaultUserData, ...parsedData, ...initialUserData };
      } catch (e) {
        console.error('Failed to parse saved onboarding data', e);
      }
    }
    
    // Otherwise use default + initial data
    return { ...defaultUserData, ...initialUserData };
  });

  // Current step state
  const [currentStepId, setCurrentStepId] = useState<string>(
    userData.progress.currentStepId || (availableSteps.length > 0 ? availableSteps[0].id : '')
  );

  // Get the current step object
  const currentStep = useMemo(() => {
    return availableSteps.find(step => step.id === currentStepId) || null;
  }, [availableSteps, currentStepId]);

  // Calculate overall progress percentage
  const progressPercentage = useMemo(() => {
    if (availableSteps.length === 0) return 100;
    return Math.round((userData.progress.completedSteps.length / availableSteps.length) * 100);
  }, [availableSteps.length, userData.progress.completedSteps.length]);

  // Determine if onboarding is complete
  const isComplete = useMemo(() => {
    return progressPercentage === 100;
  }, [progressPercentage]);

  // Determine if onboarding is in progress
  const isInProgress = useMemo(() => {
    return progressPercentage > 0 && progressPercentage < 100;
  }, [progressPercentage]);

  // Update user data
  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prevData => {
      const newData = {
        ...prevData,
        ...data,
        progress: {
          ...prevData.progress,
          ...data.progress,
          lastActivityAt: new Date().toISOString(),
        },
      };
      
      // Save to localStorage if autoSave is enabled (default true)
      if (config.settings?.autoSave !== false) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      }
      
      return newData;
    });
  };

  // Go to a specific step by ID
  const goToStep = (stepId: string) => {
    const stepExists = availableSteps.some(step => step.id === stepId);
    if (stepExists) {
      setCurrentStepId(stepId);
      updateUserData({
        progress: {
          currentStepId: stepId,
        },
      });
    } else {
      console.error(`Step with ID ${stepId} not found`);
    }
  };

  // Go to the next step
  const goToNextStep = () => {
    const currentIndex = availableSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex < availableSteps.length - 1) {
      const nextStep = availableSteps[currentIndex + 1];
      goToStep(nextStep.id);
    } else {
      // We're at the last step, mark onboarding as complete
      if (onComplete) {
        onComplete(userData);
      }
    }
  };

  // Go to the previous step
  const goToPreviousStep = () => {
    const currentIndex = availableSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      const prevStep = availableSteps[currentIndex - 1];
      goToStep(prevStep.id);
    }
  };

  // Complete the current step
  const completeCurrentStep = () => {
    if (!currentStep) return;
    
    // Add to completed steps if not already completed
    if (!userData.progress.completedSteps.includes(currentStep.id)) {
      const updatedCompletedSteps = [...userData.progress.completedSteps, currentStep.id];
      
      updateUserData({
        progress: {
          completedSteps: updatedCompletedSteps,
          percentComplete: Math.round((updatedCompletedSteps.length / availableSteps.length) * 100),
        },
      });
      
      // Call the onStepComplete callback if provided
      if (onStepComplete) {
        onStepComplete(currentStep.id, userData);
      }
    }
    
    // Move to the next step
    goToNextStep();
  };

  // Skip the current step
  const skipCurrentStep = () => {
    // Only allow skipping if enabled in config
    if (config.settings?.allowSkipping !== false) {
      goToNextStep();
    }
  };

  // Check if a step is completed
  const isStepCompleted = (stepId: string) => {
    return userData.progress.completedSteps.includes(stepId);
  };

  // Reset the onboarding process
  const resetOnboarding = () => {
    const resetData: UserData = {
      business: {},
      platform: {},
      preferences: {},
      progress: {
        completedSteps: [],
        currentStepId: availableSteps.length > 0 ? availableSteps[0].id : '',
        percentComplete: 0,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      },
    };
    
    setUserData(resetData);
    
    if (availableSteps.length > 0) {
      setCurrentStepId(availableSteps[0].id);
    }
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  };

  // Save progress when user data changes
  useEffect(() => {
    if (config.settings?.autoSave !== false) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    }
  }, [userData, config.settings?.autoSave]);

  // Context value
  const contextValue: OnboardingContextType = {
    userData,
    updateUserData,
    currentStep,
    steps: availableSteps,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeCurrentStep,
    skipCurrentStep,
    isStepCompleted,
    resetOnboarding,
    progressPercentage,
    isComplete,
    isInProgress,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * Hook to use the onboarding context
 */
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
