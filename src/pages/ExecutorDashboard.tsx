import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle2, ListTodo, Mail, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/toast';

interface ExecutorDashboard {
  plannerId: string;
  plannerName: string;
  taskCount: number;
  completedTasks: number;
  lastAccessed: string;
}

export default function ExecutorDashboard() {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState<ExecutorDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutorDashboards();
  }, []);

  async function loadExecutorDashboards() {
    try {
      // Get all planners where user is executor
      const { data: executorships, error: executorError } = await supabase
        .from('executors')
        .select(`
          id,
          planner:profiles!inner(
            id,
            email
          ),
          ai_executor_tasks(
            id,
            status
          )
        `)
        .eq('email', user?.email)
        .eq('status', 'active');

      if (executorError) throw executorError;

      const dashboards = executorships?.map(exec => ({
        plannerId: exec.planner.id,
        plannerName: exec.planner.email,
        taskCount: exec.ai_executor_tasks.length,
        completedTasks: exec.ai_executor_tasks.filter(t => t.status === 'completed').length,
        lastAccessed: new Date().toISOString() // TODO: Get from access logs
      }));

      setDashboards(dashboards || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load executor dashboards",
        variant: "destructive"
      });
      console.error('Error loading executor dashboards:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage estate tasks for your designated planners</p>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Executorships</h2>
            <p className="text-gray-500">
              You haven't been designated as an executor yet, or your invitations are pending acceptance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.plannerId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{dashboard.plannerName}</span>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasks</span>
                    <span className="font-medium">{dashboard.taskCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium">{dashboard.completedTasks}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-calm-500 transition-all duration-300"
                      style={{ 
                        width: `${dashboard.taskCount > 0 
                          ? (dashboard.completedTasks / dashboard.taskCount) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Last accessed: {new Date(dashboard.lastAccessed).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}