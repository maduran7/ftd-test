import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });

  const targetUrl = `${process.env.BANK_API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'x-api-key': process.env.BANK_API_KEY || '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Network Failure' }, { status: 502 });
  }
}