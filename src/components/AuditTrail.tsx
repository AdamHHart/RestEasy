import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { FileText, Shield, User, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export default function AuditTrail() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'document_access':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'security_event':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'profile_update':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-calm-500" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="mt-1">{getActionIcon(log.action_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{log.details}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatDate(log.timestamp)}</span>
                  <span>•</span>
                  <span>IP: {log.ip_address}</span>
                </div>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No activity recorded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}