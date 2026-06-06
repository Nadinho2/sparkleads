import { createSupabaseAdmin } from '@/lib/supabase';

export async function logActivity(params: {
  workspaceId: string;
  userToken: string;
  memberName: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from('workspace_activity').insert({
    workspace_id: params.workspaceId,
    user_token: params.userToken,
    member_name: params.memberName,
    action: params.action,
    resource_type: params.resourceType || null,
    resource_id: params.resourceId || null,
    metadata: params.metadata || null,
  });
}
