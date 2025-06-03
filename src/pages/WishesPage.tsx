import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Trash2, Edit, HeartHandshake, User } from 'lucide-react';

interface Wish {
  id: string;
  type: 'medical' | 'funeral' | 'personal_message' | 'item_distribution';
  title: string;
  content: string;
  recipient_id: string | null;
  created_at: string;
}

export default function WishesPage() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishes();
  }, []);

  async function fetchWishes() {
    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching wishes');
    } finally {
      setLoading(false);
    }
  }

  const getTypeColor = (type: Wish['type']) => {
    const colors = {
      medical: 'bg-blue-100 text-blue-800',
      funeral: 'bg-purple-100 text-purple-800',
      personal_message: 'bg-green-100 text-green-800',
      item_distribution: 'bg-amber-100 text-amber-800',
    };
    return colors[type];
  };

  const getTypeIcon = (type: Wish['type']) => {
    switch (type) {
      case 'medical':
        return <HeartHandshake className="h-6 w-6 text-blue-600" />;
      case 'funeral':
        return <HeartHandshake className="h-6 w-6 text-purple-600" />;
      case 'personal_message':
        return <HeartHandshake className="h-6 w-6 text-green-600" />;
      case 'item_distribution':
        return <HeartHandshake className="h-6 w-6 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wishes</h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add Wish
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishes.map((wish) => (
          <Card key={wish.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded">
                  {getTypeIcon(wish.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{wish.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(wish.type)}`}>
                    {wish.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{wish.content}</p>
            
            {wish.recipient_id && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <User className="h-4 w-4" />
                <span>Has designated recipient</span>
              </div>
            )}
            
            <div className="text-xs text-gray-400 mt-4">
              Created {new Date(wish.created_at).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {wishes.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No wishes added yet</p>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Your First Wish
          </Button>
        </Card>
      )}
    </div>
  );
}