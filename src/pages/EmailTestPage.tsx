import EmailTestButton from '../components/EmailTestButton';

export default function EmailTestPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Integration Test</h1>
        <p className="text-gray-500">
          Test your Resend email integration to ensure notifications are working properly
        </p>
      </div>
      
      <EmailTestButton />
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">🔧 Troubleshooting Tips</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Email not received?</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Check your spam/junk folder</li>
              <li>Verify the email address is correct</li>
              <li>Wait a few minutes for delivery</li>
            </ul>
          </div>
          
          <div>
            <strong>API Error?</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Verify your Resend API key is correct</li>
              <li>Check that your Resend account is active</li>
              <li>Ensure you haven't exceeded rate limits</li>
            </ul>
          </div>
          
          <div>
            <strong>Domain Issues?</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Using onboarding@resend.dev (test domain)</li>
              <li>For production, add your own domain to Resend</li>
              <li>Set up SPF/DKIM records for better deliverability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}