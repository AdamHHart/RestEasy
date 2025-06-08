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

    const { email, resetUrl } = await req.json();

    if (!email || !resetUrl) {
      throw new Error("Email and reset URL are required");
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .security-note { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .code { font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Reset your Rest Easy password</p>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            
            <p>We received a request to reset the password for your Rest Easy account associated with <strong>${email}</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            
            <div class="security-note">
              <h3 style="margin-top: 0; color: #92400e;">⚠️ Security Notice</h3>
              <ul style="margin-bottom: 0;">
                <li>This link will expire in 1 hour for your security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>Make sure you're on the official Rest Easy website when entering your new password</li>
              </ul>
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p class="code" style="word-break: break-all;">${resetUrl}</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, this link will expire in 1 hour. If you need a new reset link, please visit the login page and click "Forgot Password" again.</p>
            
            <p>Best regards,<br>The Rest Easy Team</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This email was sent to ${email}. If you didn't request a password reset, please ignore this email.
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
        subject: 'Reset Your Rest Easy Password',
        html,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send password reset email');
    }

    // Log the activity
    await supabase.from('activity_log').insert({
      action_type: 'password_reset_requested',
      details: `Password reset email sent to ${email}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Password reset email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});