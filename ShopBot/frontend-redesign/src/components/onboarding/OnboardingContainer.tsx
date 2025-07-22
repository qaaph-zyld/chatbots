import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';
import { OnboardingStep } from './OnboardingTypes';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Clock, 
  HelpCircle,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface OnboardingContainerProps {
  className?: string;
  showWelcome?: boolean;
  showCompletion?: boolean;
}

/**
 * Main container for the onboarding experience
 */
export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  className,
  showWelcome = true,
  showCompletion = true,
}) => {
  const {
    userData,
    updateUserData,
    currentStep,
    steps,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeCurrentStep,
    skipCurrentStep,
    isStepCompleted,
    resetOnboarding,
    progressPercentage,
    isComplete,
  } = useOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Handle step submission
  const handleSubmit = async () => {
    if (!currentStep) return;
    
    setIsSubmitting(true);
    
    try {
      // If the step has a validation function, run it
      if (currentStep.validate) {
        const result = currentStep.validate(userData);
        if (!result.valid) {
          // Show validation error
          console.error(result.message);
          return;
        }
      }
      
      // Mark step as complete and proceed
      completeCurrentStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render welcome screen
  if (showWelcome && progressPercentage === 0) {
    return (
      <div className={cn("max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg", className)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Welcome to ShopBot</h1>
          <p className="text-lg text-gray-700 mb-8">
            Let's set up your account in just a few steps to get you started with providing
            exceptional customer service through AI.
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => goToNextStep()}
              className="px-8"
            >
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render completion screen
  if (showCompletion && isComplete) {
    return (
      <div className={cn("max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Setup Complete!</h1>
          <p className="text-lg text-gray-700 mb-8">
            Your ShopBot is now ready to help your customers. You can always update your settings later.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => resetOnboarding()}
            >
              Start Over
            </Button>
            <Button>
              Go to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Calculate current step index
  const currentStepIndex = currentStep 
    ? steps.findIndex(step => step.id === currentStep.id) 
    : 0;
  
  // Determine if this is the first or last step
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className={cn("max-w-4xl mx-auto bg-white rounded-lg shadow-lg", className)}>
      {/* Header with progress */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{currentStep?.title}</h2>
          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        
        <Progress value={progressPercentage} className="h-2" />
        
        {/* Step navigation */}
        <div className="flex mt-4 overflow-x-auto pb-2 gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => isStepCompleted(step.id) && goToStep(step.id)}
              className={cn(
                "flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
                currentStep?.id === step.id
                  ? "bg-primary text-primary-foreground"
                  : isStepCompleted(step.id)
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isStepCompleted(step.id) && (
                <Check className="mr-1 h-3 w-3" />
              )}
              {step.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700">{currentStep?.description}</p>
              
              {/* Estimated time */}
              {currentStep?.estimatedTimeMinutes && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Estimated time: {currentStep.estimatedTimeMinutes} min</span>
                </div>
              )}
            </div>
            
            {/* Step component */}
            {currentStep && (
              <currentStep.component
                step={currentStep}
                userData={userData}
                updateUserData={updateUserData}
                goToNextStep={goToNextStep}
                goToPreviousStep={goToPreviousStep}
                completeStep={completeCurrentStep}
                skipStep={skipCurrentStep}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with navigation buttons */}
      <div className="p-4 border-t flex justify-between items-center">
        <div>
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Help button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(!showHelp)}
            className="rounded-full"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          {/* Skip button if allowed */}
          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={skipCurrentStep}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          )}
          
          {/* Continue button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isLastStep ? 'Complete' : 'Continue'}
            {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Help panel */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Help & Information</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="prose prose-sm">
              <h4>About this step</h4>
              <p>{currentStep?.description}</p>
              
              <h4>Why is this important?</h4>
              <p>
                This information helps us customize ShopBot to better serve your specific business needs
                and provide the best possible customer service experience.
              </p>
              
              <h4>Need more help?</h4>
              <p>
                Contact our support team at support@shopbot.ai or check our
                <a href="#" className="text-primary"> documentation</a> for more detailed guides.
              </p>
            </div>
            
            <Button
              className="w-full mt-4"
              onClick={() => setShowHelp(false)}
            >
              Got it
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OnboardingContainer;
