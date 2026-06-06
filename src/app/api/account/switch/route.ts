import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { setWorkspaceCookie, getWorkspaceForUser } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId } = body as { workspaceId: string | null };

  if (workspaceId) {
    // Verify user has access to this workspace
    const { workspace, member } = await getWorkspaceForUser(token);
    if (!workspace || workspace.id !== workspaceId || !member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(setWorkspaceCookie(workspaceId || null));
  return response;
}
