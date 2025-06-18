import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FolderClosed, 
  FileText, 
  HeartHandshake, 
  Users, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  UserCheck,
  Crown
} from 'lucide-react';

interface PlannerProfile {
  id: string;
  email: string;
  assets_count: number;
  documents_count: number;
  wishes_count: number;
  executor_name: string;
  relationship: string;
}

export default function DashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assets: 0,
    documents: 0,
    wishes: 0,
    executors: 0,
    checklistCompleted: 0,
    checklistTotal: 0,
  });
  const [executorPlans, setExecutorPlans] = useState<PlannerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  
  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Check if user has completed onboarding
        const { data: onboardingData } = await supabase
          .from('onboarding_responses')
          .select('completed')
          .eq('user_id', user.id)
          .single();
        
        setHasOnboarded(!!onboardingData?.completed);

        // Fetch count of assets
        const { count: assetsCount } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch count of documents
        const { count: documentsCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch count of wishes
        const { count: wishesCount } = await supabase
          .from('wishes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch count of executors
        const { count: executorsCount } = await supabase
          .from('executors')
          .select('*', { count: 'exact', head: true })
          .eq('planner_id', user.id);

        // Fetch checklist progress
        const { data: checklistData } = await supabase
          .from('user_checklists')
          .select('completed')
          .eq('user_id', user.id);

        const checklistTotal = checklistData?.length || 0;
        const checklistCompleted = checklistData?.filter(item => item.completed).length || 0;

        // If user is an executor, fetch plans they manage
        if (userRole === 'executor' || userRole === 'planner') {
          const { data: executorData } = await supabase
            .from('executors')
            .select(`
              id,
              name,
              relationship,
              planner:profiles!executors_planner_id_fkey (
                id,
                role
              )
            `)
            .eq('email', user.email)
            .eq('status', 'active');

          if (executorData && executorData.length > 0) {
            // Fetch stats for each planner they manage
            const plannerProfiles = await Promise.all(
              executorData.map(async (executor) => {
                const plannerId = executor.planner.id;
                
                // Get planner's email
                const { data: authUser } = await supabase.auth.admin.getUserById(plannerId);
                
                // Get counts for this planner
                const [
                  { count: assets },
                  { count: documents }, 
                  { count: wishes }
                ] = await Promise.all([
                  supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
                  supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', plannerId),
                  supabase.from('wishes').select('*', { count: 'exact', head: true }).eq('user_id', plannerId)
                ]);

                return {
                  id: plannerId,
                  email: authUser?.user?.email || 'Unknown',
                  assets_count: assets || 0,
                  documents_count: documents || 0,
                  wishes_count: wishes || 0,
                  executor_name: executor.name,
                  relationship: executor.relationship || 'Not specified'
                };
              })
            );
            
            setExecutorPlans(plannerProfiles);
          }
        }
        
        setStats({
          assets: assetsCount || 0,
          documents: documentsCount || 0,
          wishes: wishesCount || 0,
          executors: executorsCount || 0,
          checklistCompleted,
          checklistTotal,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [user, userRole]);
  
  // Determine completion percentage for profile
  const getTotalItems = () => stats.assets + stats.documents + stats.wishes + stats.executors;
  const getCompletionStatus = () => {
    const total = getTotalItems();
    if (total === 0) return 'not started';
    if (total < 5) return 'just started';
    if (total < 10) return 'in progress';
    return 'well prepared';
  };

  const checklistProgress = stats.checklistTotal > 0 ? (stats.checklistCompleted / stats.checklistTotal) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Plan Card */}
        <Card className="border-calm-300 bg-gradient-to-r from-calm-100 to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-plan')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-calm-600" />
              My Plan
            </CardTitle>
            <CardDescription>
              Manage your own end-of-life planning documents and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-calm-600">{stats.assets}</div>
                <div className="text-gray-600">Assets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-calm-600">{stats.documents}</div>
                <div className="text-gray-600">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-calm-600">{stats.wishes}</div>
                <div className="text-gray-600">Wishes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-calm-600">{stats.executors}</div>
                <div className="text-gray-600">Executors</div>
              </div>
            </div>
            {hasOnboarded && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Planning Progress</span>
                  <span>{Math.min(100, getTotalItems() * 5)}%</span>
                </div>
                <div className="h-2 bg-calm-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-calm-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, getTotalItems() * 5)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="calm" className="w-full">
              {hasOnboarded ? 'Continue Planning' : 'Start Planning'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Plans I Manage Card */}
        <Card className="border-blue-300 bg-gradient-to-r from-blue-100 to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/executor-dashboard')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              Plans I Manage
            </CardTitle>
            <CardDescription>
              Access and manage estate plans where you serve as an executor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executorPlans.length > 0 ? (
              <div className="space-y-3">
                {executorPlans.slice(0, 2).map((plan) => (
                  <div key={plan.id} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-blue-900">{plan.email.split('@')[0]}</p>
                        <p className="text-sm text-blue-700">{plan.relationship}</p>
                      </div>
                      <div className="text-right text-sm text-blue-600">
                        <div>{plan.assets_count + plan.documents_count + plan.wishes_count} items</div>
                      </div>
                    </div>
                  </div>
                ))}
                {executorPlans.length > 2 && (
                  <p className="text-sm text-blue-600 text-center">
                    +{executorPlans.length - 2} more plans
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <UserCheck className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-600 font-medium">No executor roles yet</p>
                <p className="text-sm text-blue-500">You'll see plans here when someone designates you as their executor</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
              {executorPlans.length > 0 ? 'Manage Plans' : 'Learn About Executor Role'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Onboarding prompt for new users */}
      {!hasOnboarded && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-100 to-white">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Rest Easy!</CardTitle>
            <CardDescription>
              Let's get you started with a quick setup to create your personalized planning checklist.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="calm" 
              onClick={() => navigate('/onboarding')}
            >
              Start Setup (5 minutes)
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Security and Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-calm-500" />
              Trust & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">End-to-end encryption</h3>
                <p className="text-sm text-muted-foreground">Your data is encrypted before it leaves your device</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Multi-factor authentication</h3>
                <p className="text-sm text-muted-foreground">Secure access with 2-step verification</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Controlled executor access</h3>
                <p className="text-sm text-muted-foreground">Executors can only access information when needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-warning-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/assets')}
            >
              <FolderClosed className="h-4 w-4 mr-2" />
              Add Assets
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/documents')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/executors')}
            >
              <Users className="h-4 w-4 mr-2" />
              Invite Executor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}