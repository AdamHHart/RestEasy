import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  planner_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { planner_id }: RequestBody = await req.json()

    if (!planner_id) {
      return new Response(
        JSON.stringify({ error: 'planner_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user info using service role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(planner_id)

    if (authError) {
      console.error('Error fetching user:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user info' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract name from email or use fallback
    const plannerName = authUser?.user?.email 
      ? authUser.user.email.split('@')[0] 
      : `Planner ${planner_id.slice(0, 8)}`

    return new Response(
      JSON.stringify({ 
        success: true, 
        planner_name: plannerName,
        email: authUser?.user?.email 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-planner-info function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})