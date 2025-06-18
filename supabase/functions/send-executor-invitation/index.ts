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

    const { executorId, email, name, plannerName } = await req.json();

    if (!executorId || !email || !name) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: executorId, email, and name are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate a secure invitation token
    const token = crypto.randomUUID();
    
    // Use the current domain - updated to the new Netlify URL
    const appUrl = "https://splendorous-taffy-cfab45.netlify.app";
    const invitationUrl = `${appUrl}/executor/accept/${token}`;

    // Store the invitation token
    const { error: inviteError } = await supabase
      .from('executor_invitations')
      .insert([
        {
          executor_id: executorId,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }
      ]);

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
      throw inviteError;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've Been Invited as an Executor</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .info-box { background: #f0f9ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .responsibility { margin: 15px 0; padding: 10px; background: #fefce8; border-left: 4px solid #eab308; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Executor Invitation</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been trusted with an important responsibility</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p><strong>${plannerName || 'Someone'}</strong> has invited you to serve as an executor for their end-of-life plan through Ever Ease.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1d4ed8;">What does this mean?</h3>
              <p>As an executor, you would be responsible for carrying out their wishes and managing their affairs when the time comes. This is a significant responsibility that shows how much they trust you.</p>
            </div>
            
            <h3>Your responsibilities would include:</h3>
            
            <div class="responsibility">
              <strong>📋 Following their documented wishes</strong><br>
              Access their detailed instructions for asset distribution, funeral arrangements, and personal messages.
            </div>
            
            <div class="responsibility">
              <strong>💼 Managing their assets</strong><br>
              Handle financial accounts, property, and other assets according to their instructions.
            </div>
            
            <div class="responsibility">
              <strong>📄 Handling legal requirements</strong><br>
              Work with attorneys and courts to properly settle their estate.
            </div>
            
            <div class="responsibility">
              <strong>🤝 Communicating with beneficiaries</strong><br>
              Keep family members and beneficiaries informed throughout the process.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days. If you accept, you'll be able to access their planning documents and receive guidance on your responsibilities.</p>
            
            <p>If you have questions about this role or need to discuss this responsibility, please reach out to ${plannerName || 'the person who invited you'} directly.</p>
            
            <p>Thank you for being someone they trust during this important time.</p>
            
            <p>Best regards,<br>The Ever Ease Team</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This invitation was sent to ${email}. If you weren't expecting this invitation, please contact ${plannerName || 'the sender'} directly.
            </p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
              Invitation link: ${invitationUrl}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email directly using Resend API
    const resendApiKey = "re_NkHUzen8_NQLt4whNQbqWhcYgmRTynzRm";
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [email],
        subject: `You've been invited as an executor by ${plannerName || 'someone'}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Log the activity
    await supabase
      .from('activity_log')
      .insert([
        {
          action_type: 'executor_invited',
          details: `Invitation sent to executor ${name} (${email})`,
        }
      ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        invitationUrl,
        emailId: emailResult.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Executor invitation error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});