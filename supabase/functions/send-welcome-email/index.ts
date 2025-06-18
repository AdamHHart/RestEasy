import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, name } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const appUrl = Deno.env.get("APP_URL") || "https://everease.netlify.app";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Ever Ease</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .feature { margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px; }
          .security-note { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Ever Ease</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure end-of-life planning made simple</p>
          </div>
          
          <div class="content">
            <h2>Hello${name ? ` ${name}` : ''}!</h2>
            
            <p>Thank you for joining Ever Ease. We're here to help you create a comprehensive end-of-life plan that gives you peace of mind and provides clear guidance for your loved ones.</p>
            
            <div class="security-note">
              <h3 style="margin-top: 0; color: #059669;">🔒 Your Privacy & Security</h3>
              <p style="margin-bottom: 0;">All your information is protected with end-to-end encryption. Only you control who can access your data, and only when it's needed.</p>
            </div>
            
            <h3>What you can do with Ever Ease:</h3>
            
            <div class="feature">
              <strong>📋 Personalized Planning Checklist</strong><br>
              Get a customized checklist based on your specific situation and concerns.
            </div>
            
            <div class="feature">
              <strong>💼 Asset Documentation</strong><br>
              Securely document your financial, physical, and digital assets.
            </div>
            
            <div class="feature">
              <strong>📄 Document Storage</strong><br>
              Upload and organize important documents like wills, insurance policies, and certificates.
            </div>
            
            <div class="feature">
              <strong>💝 Personal Wishes</strong><br>
              Record your medical directives, funeral preferences, and personal messages.
            </div>
            
            <div class="feature">
              <strong>👥 Executor Management</strong><br>
              Designate trusted individuals to carry out your wishes when needed.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/onboarding" class="button">Start Your Planning Journey</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The Ever Ease Team</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This email was sent to ${email}. If you didn't create an account with Ever Ease, please ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using the send-email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Welcome to Ever Ease - Start Your Planning Journey',
        html,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send welcome email');
    }

    // Log the email activity
    await supabase.from('activity_log').insert({
      action_type: 'welcome_email_sent',
      details: `Welcome email sent to ${email}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});