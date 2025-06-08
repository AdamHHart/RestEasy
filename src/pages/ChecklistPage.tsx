import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  Users, 
  HeartHandshake, 
  FolderClosed,
  Scale,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimated_time: string;
  required_documents: string[];
  helpful_tips: string[];
  completed: boolean;
  completed_at: string | null;
  order_index: number;
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChecklistItems();
  }, []);

  async function fetchChecklistItems() {
    try {
      const { data, error } = await supabase
        .from('user_checklists')
        .select('*')
        .eq('user_id', user?.id)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setChecklistItems(data || []);
    } catch (err) {
      console.error('Error fetching checklist:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleItemCompletion = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('user_checklists')
        .update({ 
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      if (error) throw error;
      
      setChecklistItems(items =>
        items.map(item =>
          item.id === itemId
            ? { ...item, completed: !completed, completed_at: !completed ? new Date().toISOString() : null }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating checklist item:', err);
    }
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assets':
        return <FolderClosed className="h-5 w-5 text-calm-500" />;
      case 'documents':
        return <FileText className="h-5 w-5 text-calm-500" />;
      case 'wishes':
        return <HeartHandshake className="h-5 w-5 text-calm-500" />;
      case 'executors':
        return <Users className="h-5 w-5 text-calm-500" />;
      case 'legal':
        return <Scale className="h-5 w-5 text-calm-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCategoryAction = (category: string) => {
    switch (category) {
      case 'assets':
        return () => navigate('/assets');
      case 'documents':
        return () => navigate('/documents');
      case 'wishes':
        return () => navigate('/wishes');
      case 'executors':
        return () => navigate('/executors');
      case 'legal':
        return () => navigate('/legal');
      default:
        return () => {};
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredItems = checklistItems.filter(item => {
    if (filter === 'completed') return item.completed;
    if (filter === 'pending') return !item.completed;
    return true;
  });

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const groupedItems = filteredItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Planning Checklist</h1>
          <p className="text-gray-500 mt-1">Complete your end-of-life planning step by step</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-calm-500" />
            Progress Overview
          </CardTitle>
          <CardDescription>
            You've completed {completedCount} of {totalCount} planning tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            {completionPercentage === 100 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">🎉 Congratulations!</h3>
                <p className="text-sm text-green-800">
                  You've completed your end-of-life planning checklist. Your loved ones will have 
                  clear guidance when they need it most.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Tasks ({totalCount})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({totalCount - completedCount})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {/* Checklist Items by Category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getCategoryIcon(category)}
                {category} ({items.filter(item => item.completed).length}/{items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border rounded-lg p-4 transition-all",
                      item.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleItemCompletion(item.id, item.completed)}
                        className="mt-1 flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-400 hover:text-calm-500" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={cn(
                              "font-medium",
                              item.completed ? "text-green-900 line-through" : "text-gray-900"
                            )}>
                              {item.title}
                            </h3>
                            <p className={cn(
                              "text-sm mt-1",
                              item.completed ? "text-green-700" : "text-gray-600"
                            )}>
                              {item.description}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full border",
                                getPriorityColor(item.priority)
                              )}>
                                {item.priority} priority
                              </span>
                              
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {item.estimated_time}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={getCategoryAction(item.category)}
                              className="flex items-center gap-1"
                            >
                              Start
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                            
                            <button
                              onClick={() => toggleItemExpanded(item.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            {item.required_documents.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-900 mb-2">Required Documents:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                  {item.required_documents.map((doc, index) => (
                                    <li key={index}>{doc}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {item.helpful_tips.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-1">
                                  <Lightbulb className="h-4 w-4 text-amber-500" />
                                  Helpful Tips:
                                </h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                  {item.helpful_tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'completed' ? 'No completed tasks yet' : 'No pending tasks'}
            </h3>
            <p className="text-gray-500">
              {filter === 'completed' 
                ? 'Start working on your checklist to see completed items here.'
                : 'Great job! You\'ve completed all your planning tasks.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}