/**
 * API NOTIFICATIONS MARK-ALL-READ - Redirection vers V2
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const newUrl = `/api/notifications-v2/mark-all-read`;
  
  return NextResponse.redirect(new URL(newUrl, url.origin), { status: 307 });
}
