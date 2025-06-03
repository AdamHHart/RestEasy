import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle2, ListTodo, Mail, AlertCircle } from 'lucide-react';
import TaskList from '../components/executor/TaskList';
import CommunicationCenter from '../components/executor/CommunicationCenter';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ExecutorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from('executor_tasks')
        .select('status');

      if (error) throw error;

      const stats = (data || []).reduce((acc, task) => {
        switch (task.status) {
          case 'pending':
            acc.pending++;
            break;
          case 'in_progress':
            acc.inProgress++;
            break;
          case 'completed':
            acc.completed++;
            break;
        }
        return acc;
      }, { pending: 0, inProgress: 0, completed: 0 });

      setStats(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalTasks = stats.pending + stats.inProgress + stats.completed;
  const completionPercentage = totalTasks > 0 
    ? (stats.completed / totalTasks) * 100 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage estate administration tasks and communications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-calm-500" />
              Tasks Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-medium">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium">{stats.completed}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-calm-500 transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-calm-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">Document Uploaded</p>
                <p className="text-gray-600">Death Certificate added</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Task Completed</p>
                <p className="text-gray-600">Notified Social Security</p>
                <p className="text-xs text-gray-400">5 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-calm-500" />
              Important Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">Tax Return Due</p>
                <p className="text-gray-600">Estate Tax Return</p>
                <p className="text-xs text-gray-400">In 45 days</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Court Filing</p>
                <p className="text-gray-600">Inventory Report</p>
                <p className="text-xs text-gray-400">In 60 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Communication
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <TaskList />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <CommunicationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}