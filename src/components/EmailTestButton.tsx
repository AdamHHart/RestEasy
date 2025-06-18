import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Mail, Send, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function EmailTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('hello@adamhart.ca');
  const [subject, setSubject] = useState('Rest Easy - Email Delivery Test');
  const [message, setMessage] = useState('This is a test email to verify delivery to your custom domain!');

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

  const testBothEmails = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test both emails
      const emails = ['adamhayhart@gmail.com', 'hello@adamhart.ca'];
      const results = [];

      for (const testEmail of emails) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: testEmail,
              subject: `${subject} - ${testEmail}`,
              message: `${message}\n\nSent to: ${testEmail}`
            }),
          });

          const data = await response.json();
          results.push({
            email: testEmail,
            ...data
          });
        } catch (error) {
          results.push({
            email: testEmail,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setResult({
        multiTest: true,
        results: results
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to send test emails',
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
          Email Delivery Testing
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

        <div className="flex gap-2">
          <Button 
            onClick={sendTestEmail} 
            disabled={loading || !email}
            className="flex-1 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>

          <Button 
            onClick={testBothEmails} 
            disabled={loading}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {loading ? 'Testing...' : 'Test Both Emails'}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            {result.multiTest ? (
              <div className="space-y-3">
                <h3 className="font-medium">Email Delivery Comparison:</h3>
                {result.results.map((emailResult: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    emailResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {emailResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className="font-medium">
                        {emailResult.email} - {emailResult.success ? 'Success' : 'Failed'}
                      </h4>
                    </div>
                    
                    {emailResult.success ? (
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Email ID:</strong> {emailResult.emailId}</p>
                        <p><strong>Status:</strong> Sent successfully</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-red-800">
                        <p><strong>Error:</strong> {emailResult.error}</p>
                        {emailResult.details && <p><strong>Details:</strong> {emailResult.details}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
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
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><strong>Error:</strong> {result.error}</p>
                    <p><strong>Details:</strong> {result.details}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Custom Domain Issues</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>If emails work for Gmail but not your custom domain:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check your domain's MX records are configured</li>
                  <li>Verify SPF record includes Resend: <code className="bg-blue-100 px-1 rounded">v=spf1 include:_spf.resend.com ~all</code></li>
                  <li>Add your domain to Resend and verify it</li>
                  <li>Check spam/junk folders</li>
                  <li>Ensure your email server accepts external emails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">🔧 Quick Fixes to Try:</h4>
          <div className="text-sm text-amber-800 space-y-1">
            <p><strong>1. Check DNS:</strong> Ensure your domain has proper MX records</p>
            <p><strong>2. Verify Domain:</strong> Add adamhart.ca to your Resend account</p>
            <p><strong>3. Test Delivery:</strong> Use the "Test Both Emails" button above</p>
            <p><strong>4. Check Logs:</strong> Look at your email server logs for rejections</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}