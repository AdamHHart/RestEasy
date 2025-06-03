import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { triggerId, verificationCode, verifierDetails } = await req.json();

    if (!triggerId || !verificationCode || !verifierDetails) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
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

    // Get the trigger event
    const { data: triggerEvent, error: triggerError } = await supabase
      .from("trigger_events")
      .select("*")
      .eq("id", triggerId)
      .single();

    if (triggerError || !triggerEvent) {
      return new Response(
        JSON.stringify({
          error: "Trigger event not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // In a real application, we would validate the verification code and verifier details
    // For this demo, we'll just check if the verification code matches a dummy value
    const isVerified = verificationCode === "123456"; // Dummy code for demo

    if (!isVerified) {
      return new Response(
        JSON.stringify({
          error: "Invalid verification code",
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

    // Update the trigger event
    const { error: updateError } = await supabase
      .from("trigger_events")
      .update({
        triggered: true,
        triggered_date: new Date().toISOString(),
      })
      .eq("id", triggerId);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Failed to update trigger event",
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

    // Log the verification
    await supabase.from("activity_log").insert({
      user_id: triggerEvent.user_id,
      action_type: "trigger_verification",
      details: `Trigger event ${triggerEvent.type} verified by ${verifierDetails.name}`,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Trigger event verified successfully",
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
    return new Response(
      JSON.stringify({
        error: error.message,
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