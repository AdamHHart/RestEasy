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

    const { executorId, notificationType, message } = await req.json();

    // Verify executor exists and get their details
    const { data: executor, error: executorError } = await supabase
      .from('executors')
      .select('*')
      .eq('id', executorId)
      .single();

    if (executorError) throw executorError;

    // Create notification record
    const { error: notificationError } = await supabase
      .from('executor_notifications')
      .insert({
        executor_id: executorId,
        type: notificationType,
        message: message,
        read: false
      });

    if (notificationError) throw notificationError;

    // Log the notification
    await supabase
      .from('activity_log')
      .insert({
        action_type: 'executor_notification',
        details: `Notification sent to executor ${executor.name}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully"
      }),
      {
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