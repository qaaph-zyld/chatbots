/**
 * OnboardingTypes.ts
 * Type definitions for the Progressive Onboarding System
 */

/**
 * Represents a step in the onboarding process
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** Component to render for this step */
  component: React.ComponentType<OnboardingStepProps>;
  /** Optional condition to determine if this step should be shown */
  shouldShow?: (userData: UserData) => boolean;
  /** Optional validation function to determine if user can proceed */
  validate?: (data: any) => { valid: boolean; message?: string };
  /** Optional estimated time to complete this step in minutes */
  estimatedTimeMinutes?: number;
  /** Optional tags for categorization and filtering */
  tags?: string[];
}

/**
 * Props passed to each onboarding step component
 */
export interface OnboardingStepProps {
  /** Current step data */
  step: OnboardingStep;
  /** User's current progress data */
  userData: UserData;
  /** Function to update user data */
  updateUserData: (data: Partial<UserData>) => void;
  /** Function to go to the next step */
  goToNextStep: () => void;
  /** Function to go to the previous step */
  goToPreviousStep: () => void;
  /** Function to mark the current step as complete */
  completeStep: () => void;
  /** Function to skip the current step (if allowed) */
  skipStep: () => void;
  /** Whether the step is currently being submitted */
  isSubmitting: boolean;
}

/**
 * User data collected during onboarding
 */
export interface UserData {
  /** User's business information */
  business: {
    name?: string;
    industry?: string;
    size?: 'solo' | 'small' | 'medium' | 'enterprise';
    website?: string;
    monthlySales?: number;
    customerServiceVolume?: number;
  };
  /** User's e-commerce platform information */
  platform: {
    type?: 'shopify' | 'woocommerce' | 'other';
    storeUrl?: string;
    apiIntegrated?: boolean;
    productCount?: number;
  };
  /** User's preferences */
  preferences: {
    aiResponseStyle?: 'friendly' | 'professional' | 'casual' | 'formal';
    notificationPreferences?: {
      email?: boolean;
      push?: boolean;
      slack?: boolean;
    };
    brandColors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    logo?: string;
  };
  /** Onboarding progress tracking */
  progress: {
    completedSteps: string[];
    currentStepId: string;
    percentComplete: number;
    startedAt: string; // ISO date string
    lastActivityAt: string; // ISO date string
  };
}

/**
 * Configuration for the onboarding flow
 */
export interface OnboardingConfig {
  /** All available steps in the onboarding process */
  steps: OnboardingStep[];
  /** Optional welcome screen configuration */
  welcome?: {
    title: string;
    description: string;
    image?: string;
  };
  /** Optional completion screen configuration */
  completion?: {
    title: string;
    description: string;
    image?: string;
    nextSteps?: {
      title: string;
      description: string;
      actionLabel: string;
      actionUrl: string;
    }[];
  };
  /** Optional settings */
  settings?: {
    /** Allow users to skip non-essential steps */
    allowSkipping?: boolean;
    /** Save progress automatically */
    autoSave?: boolean;
    /** Show progress indicator */
    showProgressIndicator?: boolean;
    /** Show estimated time to complete */
    showTimeEstimates?: boolean;
    /** Show confetti on completion */
    celebrateCompletion?: boolean;
  };
}

/**
 * Context for the onboarding system
 */
export interface OnboardingContextType {
  /** Current user data */
  userData: UserData;
  /** Update user data */
  updateUserData: (data: Partial<UserData>) => void;
  /** Current step */
  currentStep: OnboardingStep | null;
  /** All steps */
  steps: OnboardingStep[];
  /** Go to a specific step by ID */
  goToStep: (stepId: string) => void;
  /** Go to the next step */
  goToNextStep: () => void;
  /** Go to the previous step */
  goToPreviousStep: () => void;
  /** Complete the current step */
  completeCurrentStep: () => void;
  /** Skip the current step */
  skipCurrentStep: () => void;
  /** Check if a step is completed */
  isStepCompleted: (stepId: string) => boolean;
  /** Reset the onboarding process */
  resetOnboarding: () => void;
  /** Overall progress percentage */
  progressPercentage: number;
  /** Whether onboarding is complete */
  isComplete: boolean;
  /** Whether onboarding is in progress */
  isInProgress: boolean;
}
