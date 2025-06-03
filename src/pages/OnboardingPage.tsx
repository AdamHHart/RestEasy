import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Welcome to Rest Easy',
      description: 'We\'ll guide you through creating your end-of-life plan step by step.',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Rest Easy helps you organize important information and documents, making things easier for your loved ones when they need it most.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-calm-100 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-calm-600" />
                Security First
              </h3>
              <p className="text-sm text-muted-foreground">
                Your information is encrypted and secure. Only you and your designated executors can access it.
              </p>
            </div>
            <div className="p-4 bg-calm-100 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-calm-600" />
                Comprehensive Planning
              </h3>
              <p className="text-sm text-muted-foreground">
                Document assets, upload important papers, and share your wishes for medical care and more.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'What you\'ll need to prepare',
      description: 'Gather this information to make planning easier.',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You don't need everything now, but having these items ready will help you create a more complete plan:
          </p>
          <div className="space-y-2">
            {[
              'List of financial accounts (banks, investments, insurance)',
              'Information about your home, vehicles, and valuable possessions',
              'Digital accounts (email, social media, subscriptions)',
              'Legal documents (will, power of attorney, etc.)',
              'Names and contact information for important people',
              'Your wishes for medical care, funeral arrangements, etc.'
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Check className="h-5 w-5 text-calm-500 mt-0.5" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'How it works',
      description: 'Learn how Rest Easy helps you plan and share information.',
      content: (
        <div className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-calm-500 text-white flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Document your information</h3>
                <p className="text-sm text-muted-foreground">
                  Add your assets, upload important documents, and record your wishes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-calm-500 text-white flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">Designate executors</h3>
                <p className="text-sm text-muted-foreground">
                  Choose trusted individuals who will access your information when needed.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-calm-500 text-white flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Set access conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Define when and how executors can access your information.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-calm-500 text-white flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-medium">Review and update</h3>
                <p className="text-sm text-muted-foreground">
                  Keep your plan current by reviewing and updating it regularly.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to get started?',
      description: 'Begin organizing your information and creating your plan.',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're all set to start creating your plan. Begin by adding your assets, documents, or wishes—whichever you prefer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-calm-200 hover:border-calm-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Assets</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Record financial accounts, property, and digital assets.
              </CardContent>
            </Card>
            
            <Card className="border-calm-200 hover:border-calm-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Upload wills, insurance policies, and other important papers.
              </CardContent>
            </Card>
            
            <Card className="border-calm-200 hover:border-calm-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Wishes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Document your preferences for medical care, funeral arrangements, and more.
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    navigate('/dashboard');
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStepData.description}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted h-1 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-calm-500 h-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {currentStepData.content}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-border pt-4">
          <div>
            {currentStep > 0 ? (
              <Button variant="outline\" onClick={handleBack}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
          
          <Button onClick={handleNext} className="bg-calm-500 hover:bg-calm-600">
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}