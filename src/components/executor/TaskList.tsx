```typescript
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'legal' | 'personal' | 'digital';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  estimatedTime: string;
  documents?: string[];
  contacts?: Array<{
    name: string;
    role: string;
    contact: string;
  }>;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const getPriorityColor = (priority: Task['priority']) => {
    return {
      high: 'text-red-600 bg-red-50',
      medium: 'text-amber-600 bg-amber-50',
      low: 'text-green-600 bg-green-50',
    }[priority];
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const filteredTasks = tasks.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Tasks
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      <div className="space-y-4">
        {filteredTasks.map(task => (
          <Card key={task.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getPriorityColor(task.priority)
                  )}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateTaskStatus(task.id, 
                    task.status === 'completed' ? 'pending' :
                    task.status === 'in_progress' ? 'completed' : 'in_progress'
                  )}
                >
                  {getStatusIcon(task.status)}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  Estimated time: {task.estimatedTime}
                </div>
                
                {task.documents && task.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Required Documents:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {task.documents.map((doc, index) => (
                        <li key={index}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {task.contacts && task.contacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key Contacts:</p>
                    <div className="space-y-2">
                      {task.contacts.map((contact, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-gray-600">{contact.role}: {contact.contact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-6">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No tasks found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```