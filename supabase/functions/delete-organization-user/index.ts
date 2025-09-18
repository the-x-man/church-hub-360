import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json' 
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Verify the user's session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { userId, organizationId } = await req.json()

    if (!userId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'User ID and Organization ID are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify the requesting user has admin permissions in the organization
    const { data: requestingUserOrg, error: requestingUserError } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (requestingUserError || !requestingUserOrg || !['owner', 'admin', 'branch_admin'].includes(requestingUserOrg.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Get user details for logging
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single()

    if (targetUserError) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Get branch IDs for this organization first
    const { data: branchIds, error: branchIdsError } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('organization_id', organizationId)

    if (branchIdsError) {
      console.error('Error fetching branch IDs:', branchIdsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch organization branches' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Remove user from all branches in this organization
    const branchIdArray = branchIds?.map(branch => branch.id) || []
    const { error: userBranchesError } = await supabaseAdmin
      .from('user_branches')
      .delete()
      .eq('user_id', userId)
      .in('branch_id', branchIdArray)

    if (userBranchesError) {
      console.error('Error removing user from branches:', userBranchesError)
      return new Response(
        JSON.stringify({ error: 'Failed to remove user from branches' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Remove user from organization
    const { error: userOrgError } = await supabaseAdmin
      .from('user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (userOrgError) {
      console.error('Error removing user from organization:', userOrgError)
      return new Response(
        JSON.stringify({ error: 'Failed to remove user from organization' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Log the activity
    // const { error: activityError } = await supabaseAdmin
    //   .from('activities')
    //   .insert({
    //     organization_id: organizationId,
    //     user_id: user.id,
    //     action: 'user_deleted_from_organization',
    //     details: {
    //       deleted_user_id: userId,
    //       deleted_user_email: targetUser.email,
    //       deleted_user_name: `${targetUser.first_name} ${targetUser.last_name}`.trim()
    //     }
    //   })

    // if (activityError) {
    //   console.error('Error logging activity:', activityError)
    //   // Don't fail the request for logging errors
    // }

    return new Response(
      JSON.stringify({ 
        message: 'User successfully removed from organization',
        deletedUser: {
          id: userId,
          email: targetUser.email,
          name: `${targetUser.first_name} ${targetUser.last_name}`.trim()
        }
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in delete-organization-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})