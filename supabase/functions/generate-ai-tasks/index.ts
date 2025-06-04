import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Asset {
  id: string;
  type: string;
  name: string;
  details: Record<string, any>;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  required_data: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { executorId, plannerId } = await req.json();

    if (!executorId || !plannerId) {
      throw new Error("Executor ID and Planner ID are required");
    }

    // Fetch planner's assets and preferences
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', plannerId);

    if (assetsError) throw assetsError;

    // Fetch AI task templates
    const { data: templates, error: templatesError } = await supabase
      .from('ai_task_templates')
      .select('*');

    if (templatesError) throw templatesError;

    // Generate tasks based on assets
    const tasks = [];
    
    for (const asset of (assets || [])) {
      // Find relevant templates for this asset type
      const relevantTemplates = templates.filter(template => {
        const requiredData = template.required_data.required as string[];
        const availableData = Object.keys(asset.details || {});
        return requiredData.every(field => availableData.includes(field));
      });

      for (const template of relevantTemplates) {
        // Build AI context from asset data
        const aiContext = {
          asset: {
            type: asset.type,
            name: asset.name,
            ...asset.details,
          },
          template: {
            name: template.name,
            prompt: template.prompt_template,
          },
        };

        tasks.push({
          executor_id: executorId,
          planner_id: plannerId,
          template_id: template.id,
          title: `${template.name} for ${asset.name}`,
          description: template.description,
          ai_context: aiContext,
          status: 'pending',
          fee_cents: template.fee_cents,
        });
      }
    }

    // Insert generated tasks
    if (tasks.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_executor_tasks')
        .insert(tasks);

      if (insertError) throw insertError;
    }

    // Log task generation
    await supabase.from('activity_log').insert({
      user_id: plannerId,
      action_type: 'ai_tasks_generated',
      details: `Generated ${tasks.length} AI tasks for executor ${executorId}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI tasks generated successfully",
        taskCount: tasks.length,
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