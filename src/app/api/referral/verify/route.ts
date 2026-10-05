import { NextRequest, NextResponse } from 'next/server';
import { resolveReferralCode } from '@/lib/referral-code';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
 try { const referral = await resolveReferralCode(request.nextUrl.searchParams.get('code')); return NextResponse.json({valid:!!referral,code:referral?.code || null}); }
 catch { return NextResponse.json({valid:false}); }
}
