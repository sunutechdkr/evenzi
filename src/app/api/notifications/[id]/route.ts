/**
 * API NOTIFICATIONS [ID] - Redirection vers V2
 */

import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const newUrl = `/api/notifications-v2/${id}`;
  
  return NextResponse.redirect(new URL(newUrl, url.origin), { status: 307 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const newUrl = `/api/notifications-v2/${id}`;
  
  return NextResponse.redirect(new URL(newUrl, url.origin), { status: 307 });
}
