import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('adamhayhart@gmail.com');
  const [subject, setSubject] = useState('Rest Easy - Email Test');
  const [message, setMessage] = useState('This is a test email to verify Resend integration is working!');

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          message: message
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-calm-500" />
          Test Resend Email Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Test message content"
            />
          </div>
        </div>

        <Button 
          onClick={sendTestEmail} 
          disabled={loading || !email}
          className="w-full flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Sending Test Email...' : 'Send Test Email'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <h3 className="font-medium">
                {result.success ? 'Email Sent Successfully!' : 'Email Failed'}
              </h3>
            </div>
            
            {result.success ? (
              <div className="space-y-2 text-sm">
                <p><strong>Email ID:</strong> {result.emailId}</p>
                <p><strong>Recipient:</strong> {result.recipient}</p>
                <p><strong>Service:</strong> {result.details?.service}</p>
                <p><strong>From:</strong> {result.details?.from}</p>
                <p className="text-green-700 font-medium">
                  ✅ Check your inbox! The email should arrive within a few minutes.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p><strong>Error:</strong> {result.error}</p>
                <p><strong>Details:</strong> {result.details}</p>
                <p className="text-red-700 font-medium">
                  ❌ Please check your Resend API key and configuration.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📧 What This Tests:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Resend API key validity</li>
            <li>• Email delivery functionality</li>
            <li>• Template rendering</li>
            <li>• Edge function configuration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}