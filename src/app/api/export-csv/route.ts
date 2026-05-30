import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'json2csv';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { leads, query } = body as {
    leads: Array<{
      name: string;
      phone: string | null;
      email: string | null;
      website: string | null;
      address: string | null;
      rating: number | null;
      status: string;
    }>;
    query: string;
  };

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: 'No leads to export' }, { status: 400 });
  }

  const fields = [
    { label: 'Name', value: 'name' },
    { label: 'Phone', value: 'phone' },
    { label: 'Email', value: 'email' },
    { label: 'Website', value: 'website' },
    { label: 'Address', value: 'address' },
    { label: 'Rating', value: 'rating' },
    { label: 'Status', value: 'status' },
  ];

  const csv = parse(leads, { fields });
  const safeQuery = (query || 'leads').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50);
  const date = new Date().toISOString().split('T')[0];
  const filename = `sparkleads-${safeQuery}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
