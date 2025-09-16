/**
 * API NOTIFICATIONS - Redirection vers V2
 * Cette API redirige vers les nouvelles APIs notifications-v2
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Rediriger vers l'API V2
  const url = new URL(request.url);
  const newUrl = url.pathname.replace('/api/notifications', '/api/notifications-v2') + url.search;
  
  return NextResponse.redirect(new URL(newUrl, url.origin));
}

export async function POST(request: NextRequest) {
  // Rediriger vers l'API V2
  const url = new URL(request.url);
  const newUrl = url.pathname.replace('/api/notifications', '/api/notifications-v2');
  
  return NextResponse.redirect(new URL(newUrl, url.origin), { status: 307 });
}
