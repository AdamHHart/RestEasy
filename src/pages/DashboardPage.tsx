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
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assets: 0,
    documents: 0,
    wishes: 0,
    executors: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      setLoading(true);
      
      try {
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
        
        setStats({
          assets: assetsCount || 0,
          documents: documentsCount || 0,
          wishes: wishesCount || 0,
          executors: executorsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [user]);
  
  // Determine completion percentage for profile
  const getTotalItems = () => stats.assets + stats.documents + stats.wishes + stats.executors;
  const getCompletionStatus = () => {
    const total = getTotalItems();
    if (total === 0) return 'not started';
    if (total < 5) return 'just started';
    if (total < 10) return 'in progress';
    return 'well prepared';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Welcome Card */}
      <Card className="border-calm-300 bg-gradient-to-r from-calm-100 to-white">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</CardTitle>
          <CardDescription>
            Your end-of-life planning is {getCompletionStatus()}. 
            {getTotalItems() === 0 ? ' Start adding your information to secure your legacy.' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="h-2 flex-1 bg-calm-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-calm-500 rounded-full"
                style={{ 
                  width: `${Math.min(100, getTotalItems() * 5)}%`,
                  transition: 'width 1s ease-in-out'
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.min(100, getTotalItems() * 5)}%
            </span>
          </div>
        </CardContent>
        {getTotalItems() === 0 && (
          <CardFooter>
            <Button 
              variant="calm" 
              className="mt-2"
              onClick={() => navigate('/assets')}
            >
              Start adding assets
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/assets" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <FolderClosed className="h-5 w-5 mr-2 text-calm-500" />
                  Assets
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.assets}</p>
              <p className="text-sm text-muted-foreground">Financial, physical, and digital</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/documents" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-calm-500" />
                  Documents
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.documents}</p>
              <p className="text-sm text-muted-foreground">Wills, policies, and certificates</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/wishes" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <HeartHandshake className="h-5 w-5 mr-2 text-calm-500" />
                  Wishes
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.wishes}</p>
              <p className="text-sm text-muted-foreground">Medical, funeral, and personal</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/executors" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-calm-500" />
                  Executors
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? '...' : stats.executors}</p>
              <p className="text-sm text-muted-foreground">Trusted individuals</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
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
              Action Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.executors === 0 && (
              <div className="p-3 bg-warning-100 rounded-md">
                <h3 className="font-medium">No executors assigned</h3>
                <p className="text-sm text-muted-foreground mb-2">Designate someone you trust to access your information when needed.</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/executors')}
                >
                  Add executor
                </Button>
              </div>
            )}
            
            {stats.documents === 0 && (
              <div className="p-3 bg-warning-100 rounded-md">
                <h3 className="font-medium">No documents uploaded</h3>
                <p className="text-sm text-muted-foreground mb-2">Upload important documents like your will or insurance policies.</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/documents')}
                >
                  Upload documents
                </Button>
              </div>
            )}
            
            {stats.executors > 0 && stats.documents > 0 && (
              <div className="p-3 bg-success-100 rounded-md">
                <h3 className="font-medium flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-success-500" />
                  Great progress!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed the essential steps. Continue adding more details to ensure your wishes are clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}