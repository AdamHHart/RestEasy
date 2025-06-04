import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { executorId, email, name } = await req.json();

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record
    const { error: inviteError } = await supabase
      .from('executor_invitations')
      .insert({
        executor_id: executorId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) throw inviteError;

    // Send invitation email
    const inviteUrl = `${Deno.env.get("PUBLIC_APP_URL")}/executor/accept-invitation?token=${token}`;
    
    // In production, integrate with your email service
    // For demo, we'll just log the invitation
    console.log(`
      To: ${email}
      Subject: You've been invited to be an executor
      
      Dear ${name},
      
      You have been designated as an executor in RestEasy. Please click the link below to accept:
      
      ${inviteUrl}
      
      This link expires in 7 days.
    `);

    // Log the activity
    await supabase
      .from('activity_log')
      .insert({
        action_type: 'executor_invited',
        details: `Invitation sent to executor ${name} (${email})`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});