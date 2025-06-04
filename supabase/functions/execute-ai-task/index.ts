import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "npm:openai@4.28.0";

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

    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    }));

    const { taskId } = await req.json();

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('ai_executor_tasks')
      .select(`
        *,
        template:ai_task_templates(*)
      `)
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    // Update task status
    await supabase
      .from('ai_executor_tasks')
      .update({ status: 'ai_processing', started_at: new Date().toISOString() })
      .eq('id', taskId);

    // Execute AI task
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping execute estate-related tasks professionally and empathetically.",
        },
        {
          role: "user",
          content: task.template.prompt_template,
        },
        {
          role: "user",
          content: JSON.stringify(task.ai_context),
        },
      ],
    });

    const aiResult = completion.choices[0].message;

    // Log AI action
    await supabase.from('ai_action_logs').insert({
      task_id: taskId,
      action_type: 'ai_execution',
      action_details: task.ai_context,
      openai_request: {
        prompt: task.template.prompt_template,
        context: task.ai_context,
      },
      openai_response: aiResult,
    });

    // Update task with results
    await supabase
      .from('ai_executor_tasks')
      .update({
        status: 'reviewing',
        ai_result: aiResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI task executed successfully",
        result: aiResult,
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