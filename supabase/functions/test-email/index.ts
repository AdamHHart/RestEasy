import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = "re_NkHUzen8_NQLt4whNQbqWhcYgmRTynzRm";
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, subject, message } = await req.json();

    // Use the provided email or default to your email
    const recipientEmail = to || "adamhayhart@gmail.com";
    const emailSubject = subject || "Rest Easy - Email Test";
    const emailMessage = message || "This is a test email from Rest Easy to verify Resend integration is working!";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Email Test Successful!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Rest Easy Email Integration</p>
          </div>
          
          <div class="content">
            <div class="success">
              <h3 style="margin-top: 0; color: #059669;">✅ Resend Integration Working!</h3>
              <p style="margin-bottom: 0;">Your Resend API key is properly configured and emails are being sent successfully.</p>
            </div>
            
            <h2>Test Details:</h2>
            <ul>
              <li><strong>Service:</strong> Resend</li>
              <li><strong>API Key:</strong> re_NkHUzen8_*** (configured)</li>
              <li><strong>From:</strong> onboarding@resend.dev</li>
              <li><strong>To:</strong> ${recipientEmail}</li>
              <li><strong>Status:</strong> Successfully delivered</li>
            </ul>
            
            <p><strong>Message:</strong></p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; font-style: italic;">
              ${emailMessage}
            </p>
            
            <p>This confirms that:</p>
            <ul>
              <li>Your Resend API key is valid and active</li>
              <li>The email service integration is working correctly</li>
              <li>Users will receive registration confirmations</li>
              <li>Executor invitations will be delivered</li>
              <li>Password reset emails will work properly</li>
            </ul>
            
            <p>You're all set to start sending production emails through Rest Easy!</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is a test email from Rest Easy. If you received this, your email integration is working perfectly!
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [recipientEmail],
        subject: emailSubject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test email sent successfully!",
        emailId: result.id,
        recipient: recipientEmail,
        details: {
          service: "Resend",
          from: "onboarding@resend.dev",
          subject: emailSubject,
          status: "delivered"
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Email test error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "Failed to send test email. Check your Resend API key and configuration."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});