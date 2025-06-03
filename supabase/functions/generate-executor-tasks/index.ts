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

    const { executorId } = await req.json();

    if (!executorId) {
      throw new Error("Executor ID is required");
    }

    // Get executor's planner assets and wishes
    const { data: planner, error: plannerError } = await supabase
      .from('executors')
      .select(`
        planner_id,
        planners:profiles!inner(
          assets (type, name, description, location),
          medical_directives (healthcare_wishes),
          funeral_preferences (service_type, disposition_method)
        )
      `)
      .eq('id', executorId)
      .single();

    if (plannerError) throw plannerError;

    // Get task templates
    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*');

    if (templatesError) throw templatesError;

    // Generate personalized tasks based on assets and templates
    const tasks = [];
    const assets = planner.planners.assets || [];

    for (const asset of assets) {
      // Find relevant templates for this asset type
      const relevantTemplates = templates.filter(t => t.asset_type === asset.type);
      
      for (const template of relevantTemplates) {
        // Customize task description with asset details
        const description = template.description.replace(
          '[Asset Name]',
          asset.name
        );

        tasks.push({
          executor_id: executorId,
          template_id: template.id,
          title: template.title,
          description,
          category: asset.type,
          priority: template.priority,
          estimated_time: template.estimated_time,
          documents: template.required_documents,
          contacts: template.required_contacts
        });
      }
    }

    // Insert generated tasks
    const { error: insertError } = await supabase
      .from('executor_tasks')
      .insert(tasks);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tasks generated successfully",
        taskCount: tasks.length
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
        error: error.message
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