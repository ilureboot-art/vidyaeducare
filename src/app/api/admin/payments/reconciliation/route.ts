import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { walletReconciliation } from '@/lib/wallet-reconciliation';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    await verifyRequester(request, true);
    const cursor = request.nextUrl.searchParams.get('cursor');
    if (cursor && (cursor.includes('/') || cursor.length > 1500)) return NextResponse.json({ error: 'Invalid cursor.' }, { status: 400 });
    let query = adminDb.collection('wallets').orderBy(FieldPath.documentId()).limit(21);
    if (cursor) query = query.startAfter(cursor);
    const wallets = await query.get();
    const page = wallets.docs.slice(0, 20);
    const rows = await Promise.all(page.map(async wallet => {
      const payments = await adminDb.collection('transactions').where('user', '==', wallet.id).limit(201).get();
      return { userId: wallet.id, ...walletReconciliation(wallet.data(), payments.docs.slice(0, 200).map(p => p.data()), payments.size <= 200) };
    }));
    return NextResponse.json({ rows, nextCursor: wallets.size > 20 ? page[page.length - 1].id : null, evaluatedAt: new Date().toISOString(), scope: 'Withdrawal reservations only. Scan-limited rows require review; this report does not modify balances or prove bank settlement.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof RequestAuthError ? error.message : 'Unable to load wallet reconciliation.' }, { status: error instanceof RequestAuthError ? error.status : 500 });
  }
}
