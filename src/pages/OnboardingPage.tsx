import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState({
    age_range: '',
    family_status: '',
    asset_types: [] as string[],
    concerns: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleResponse = (field: string, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Rest Easy',
      description: 'Let's create your personalized end-of-life plan together.',
      component: (
        <div className="space-y-6">
          <p className="text-lg text-gray-600">
            We understand that planning for the future can feel overwhelming. 
            We're here to make this process gentle and meaningful.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-calm-50 border-calm-200">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Your Privacy Matters</h3>
                <p className="text-sm text-gray-600">
                  Everything you share is encrypted and secure. Only you control who can access your information.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-calm-50 border-calm-200">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Go at Your Pace</h3>
                <p className="text-sm text-gray-600">
                  Take your time. You can always come back and update your plan later.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'age-family',
      title: 'Tell us about yourself',
      description: 'This helps us personalize your planning experience.',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">What is your age range?</h3>
            <div className="grid grid-cols-2 gap-3">
              {['18-30', '31-50', '51-70', '70+'].map(range => (
                <Button
                  key={range}
                  variant={responses.age_range === range ? 'default' : 'outline'}
                  onClick={() => handleResponse('age_range', range)}
                  className="w-full"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">What is your family status?</h3>
            <div className="grid grid-cols-2 gap-3">
              {['single', 'married', 'divorced', 'widowed', 'other'].map(status => (
                <Button
                  key={status}
                  variant={responses.family_status === status ? 'default' : 'outline'}
                  onClick={() => handleResponse('family_status', status)}
                  className="w-full capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'assets',
      title: 'What would you like to document?',
      description: 'Select all the types of assets you want to include in your plan.',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'financial', label: 'Financial Assets', description: 'Bank accounts, investments, insurance' },
              { id: 'property', label: 'Property', description: 'Home, vehicles, valuable items' },
              { id: 'digital', label: 'Digital Assets', description: 'Online accounts, cryptocurrencies' },
              { id: 'personal', label: 'Personal Items', description: 'Sentimental items, collections' },
              { id: 'business', label: 'Business Interests', description: 'Company ownership, partnerships' },
              { id: 'other', label: 'Other Assets', description: 'Additional items to document' },
            ].map(asset => (
              <Button
                key={asset.id}
                variant={responses.asset_types.includes(asset.id) ? 'default' : 'outline'}
                onClick={() => handleResponse('asset_types', 
                  responses.asset_types.includes(asset.id)
                    ? responses.asset_types.filter(t => t !== asset.id)
                    : [...responses.asset_types, asset.id]
                )}
                className="h-auto p-4 flex flex-col items-start space-y-1"
              >
                <span className="font-medium">{asset.label}</span>
                <span className="text-sm text-left text-muted-foreground">{asset.description}</span>
              </Button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'concerns',
      title: 'What matters most to you?',
      description: 'Select your main concerns about end-of-life planning.',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'family_security', label: 'Family Security', description: 'Ensuring loved ones are provided for' },
              { id: 'asset_distribution', label: 'Asset Distribution', description: 'Fair division of assets' },
              { id: 'medical_wishes', label: 'Medical Wishes', description: 'Healthcare preferences respected' },
              { id: 'digital_legacy', label: 'Digital Legacy', description: 'Managing online presence' },
              { id: 'funeral_arrangements', label: 'Final Arrangements', description: 'Specific wishes honored' },
              { id: 'documentation', label: 'Documentation', description: 'Organizing important papers' },
            ].map(concern => (
              <Button
                key={concern.id}
                variant={responses.concerns.includes(concern.id) ? 'default' : 'outline'}
                onClick={() => handleResponse('concerns',
                  responses.concerns.includes(concern.id)
                    ? responses.concerns.filter(c => c !== concern.id)
                    : [...responses.concerns, concern.id]
                )}
                className="h-auto p-4 flex flex-col items-start space-y-1"
              >
                <span className="font-medium">{concern.label}</span>
                <span className="text-sm text-left text-muted-foreground">{concern.description}</span>
              </Button>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Your Personalized Plan',
      description: 'Here's what we'll help you accomplish.',
      component: (
        <div className="space-y-6">
          <div className="bg-calm-50 border border-calm-200 rounded-lg p-6">
            <h3 className="font-medium mb-4">Your Priority Checklist</h3>
            <div className="space-y-3">
              {responses.asset_types.map(asset => (
                <div key={asset} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-calm-500 mt-0.5" />
                  <div>
                    <p className="font-medium capitalize">{asset.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Document and secure your {asset.replace('_', ' ')} assets</p>
                  </div>
                </div>
              ))}
              {responses.concerns.map(concern => (
                <div key={concern} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-calm-500 mt-0.5" />
                  <div>
                    <p className="font-medium capitalize">{concern.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Address your concerns about {concern.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
  ];

  const handleNext = async () => {
    if (currentStepIndex === steps.length - 1) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('onboarding_responses')
          .insert([
            {
              user_id: user?.id,
              ...responses,
              completed: true
            }
          ]);

        if (error) throw error;
        navigate('/dashboard');
      } catch (error) {
        console.error('Error saving onboarding responses:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <p className="text-muted-foreground">{currentStep.description}</p>
          <div className="w-full bg-gray-100 h-1 mt-6 rounded-full overflow-hidden">
            <div 
              className="h-full bg-calm-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {currentStep.component}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-calm-500 hover:bg-calm-600"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : currentStepIndex === steps.length - 1 ? (
              'Start Planning'
            ) : (
              <span className="flex items-center gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}