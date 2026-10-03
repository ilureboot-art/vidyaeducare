import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin-init';
import { defaultPageInstructions } from '@/lib/page-instructions';
export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest) {
 try { const snap = await adminDb.collection('configs').doc('pageInstructions').get(); const data = snap.data();
 return NextResponse.json({ registration: { ...defaultPageInstructions.registration, ...data?.registration }, wallet: { ...defaultPageInstructions.wallet, ...data?.wallet } });
 } catch { return NextResponse.json({ error: 'Unable to load instructions.' }, { status: 503 }); }
}
