import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  CheckCircle2, 
  ListTodo, 
  Mail, 
  AlertCircle, 
  ArrowLeft,
  FolderClosed,
  FileText,
  HeartHandshake,
  Users,
  ChevronRight,
  UserCheck,
  Workflow
} from 'lucide-react';
import ExecutorWorkflow from '../components/executor/ExecutorWorkflow';

interface PlannerProfile {
  id: string;
  email: string;
  assets_count: number;
  documents_count: number;
  wishes_count: number;
  medical_directives_count: number;
  funeral_preferences_count: number;
  personal_messages_count: number;
  executor_name: string;
  relationship: string;
}

export default function ExecutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [executorPlans, setExecutorPlans] = useState<PlannerProfile[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlannerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutorPlans();
  }, [user]);

  async function fetchExecutorPlans() {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('Fetching executor plans for user:', user.email);
      
      // Get all executor roles for this user
      const { data: executorData, error } = await supabase
        .from('executors')
        .select(`
          id,
          name,
          relationship,
          status,
          planner_id,
          planner:profiles!executors_planner_id_fkey (
            id,
            role
          )
        `)
        .eq('email', user.email)
        .eq('status', 'active');

      console.log('Executor query result:', { executorData, error });

      if (error) {
        console.error('Error fetching executor data:', error);
        throw error;
      }

      if (executorData && executorData.length > 0) {
        console.log(`Found ${executorData.length} executor roles`);
        
        // Fetch detailed stats for each planner
        const plannerProfiles = await Promise.all(
          executorData.map(async (executor) => {
            const plannerId = executor.planner_id;
            
            console.log('Fetching data for planner:', plannerId);
            
            // Use a fallback email display instead of trying to fetch from auth.users
            const plannerEmail = `Planner ${plannerId.slice(0, 8)}`;
            
            // Get counts for this planner
            const [
              { count: assets },
              { count: documents }, 
              { count: wishes },
              { count: medicalDirectives },
              { count: funeralPreferences },
              { count: personalMessages }
            ] = await Promise.all([
              supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
              supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
              supabase.from('wishes').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
              supabase.from('medical_directives').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
              supabase.from('funeral_preferences').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
              supabase.from('personal_messages').select('*', { count: 'exact', head: true }).eq('user_id', plannerId)
            ]);

            return {
              id: plannerId,
              email: plannerEmail,
              assets_count: assets || 0,
              documents_count: documents || 0,
              wishes_count: wishes || 0,
              medical_directives_count: medicalDirectives || 0,
              funeral_preferences_count: funeralPreferences || 0,
              personal_messages_count: personalMessages || 0,
              executor_name: executor.name,
              relationship: executor.relationship || 'Not specified'
            };
          })
        );
        
        console.log('Planner profiles:', plannerProfiles);
        setExecutorPlans(plannerProfiles);
        if (plannerProfiles.length > 0) {
          setSelectedPlan(plannerProfiles[0]);
        }
      } else {
        console.log('No active executor roles found for user:', user.email);
      }
    } catch (err) {
      console.error('Error fetching executor plans:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans I Manage</h1>
          <p className="text-gray-500 mt-1">Estate plans where you serve as an executor</p>
        </div>
      </div>

      {executorPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No executor roles yet</h3>
            <p className="text-gray-500 mb-6">
              You'll see estate plans here when someone designates you as their executor and you accept the invitation.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-4">
              <h4 className="font-medium text-blue-900 mb-2">What is an executor?</h4>
              <p className="text-sm text-blue-800">
                An executor is a trusted person responsible for carrying out someone's final wishes and managing their estate after they pass away.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-medium text-amber-900 mb-2">🔍 Troubleshooting</h4>
              <p className="text-sm text-amber-800 mb-2">
                If you recently accepted an executor invitation but don't see it here:
              </p>
              <ul className="text-sm text-amber-700 text-left space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Check that you used the same email address</li>
                <li>• Contact the person who invited you</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executorPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-500" />
                    {plan.email.includes('@') ? plan.email.split('@')[0] : plan.email}
                  </CardTitle>
                  <CardDescription>
                    {plan.relationship} • Executor role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{plan.assets_count}</div>
                      <div className="text-gray-600">Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{plan.documents_count}</div>
                      <div className="text-gray-600">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{plan.wishes_count}</div>
                      <div className="text-gray-600">Wishes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {plan.medical_directives_count + plan.funeral_preferences_count + plan.personal_messages_count}
                      </div>
                      <div className="text-gray-600">Directives</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Plan Details */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-6 w-6 text-blue-500" />
                  {selectedPlan.email.includes('@') ? selectedPlan.email.split('@')[0] : selectedPlan.email}'s Estate Plan
                </CardTitle>
                <CardDescription>
                  You are designated as the executor for this estate plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="wishes">Wishes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FolderClosed className="h-8 w-8 text-blue-500" />
                            <div>
                              <div className="text-2xl font-bold">{selectedPlan.assets_count}</div>
                              <div className="text-sm text-gray-600">Assets</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <div className="text-2xl font-bold">{selectedPlan.documents_count}</div>
                              <div className="text-sm text-gray-600">Documents</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <HeartHandshake className="h-8 w-8 text-blue-500" />
                            <div>
                              <div className="text-2xl font-bold">{selectedPlan.wishes_count}</div>
                              <div className="text-sm text-gray-600">Wishes</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Mail className="h-8 w-8 text-blue-500" />
                            <div>
                              <div className="text-2xl font-bold">{selectedPlan.personal_messages_count}</div>
                              <div className="text-sm text-gray-600">Messages</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="font-medium text-amber-900 mb-2">⚠️ Important Executor Information</h3>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• This information is only accessible to you as the designated executor</li>
                        <li>• Access is granted based on the trigger conditions set by the planner</li>
                        <li>• All access is logged for security and transparency</li>
                        <li>• Contact the planner directly if you have questions about your role</li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="workflow" className="mt-6">
                    <ExecutorWorkflow />
                  </TabsContent>

                  <TabsContent value="assets" className="mt-6">
                    <div className="text-center py-8">
                      <FolderClosed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Information</h3>
                      <p className="text-gray-500 mb-4">
                        Detailed asset information will be available here when access is granted.
                      </p>
                      <Button variant="outline" disabled>
                        View Assets ({selectedPlan.assets_count})
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Document Access</h3>
                      <p className="text-gray-500 mb-4">
                        Important documents will be accessible here when needed.
                      </p>
                      <Button variant="outline" disabled>
                        View Documents ({selectedPlan.documents_count})
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="wishes" className="mt-6">
                    <div className="text-center py-8">
                      <HeartHandshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Final Wishes</h3>
                      <p className="text-gray-500 mb-4">
                        Medical directives, funeral preferences, and personal messages will be available here.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" disabled>
                          Medical Directives ({selectedPlan.medical_directives_count})
                        </Button>
                        <Button variant="outline" disabled>
                          Funeral Preferences ({selectedPlan.funeral_preferences_count})
                        </Button>
                        <Button variant="outline" disabled>
                          Personal Messages ({selectedPlan.personal_messages_count})
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}