import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { normalizeUtr, paymentAmount } from '@/lib/payment-validation';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyRequester(request);
    const body = await request.json();
    let amount: number, referenceId: string;
    try { amount = paymentAmount(body.amount); referenceId = normalizeUtr(body.referenceId); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const receiptUrl = typeof body.receiptUrl === 'string' ? body.receiptUrl.slice(0, 2048) : null;
    // Global incoming namespace is server-owned; clients cannot select a scope to bypass duplicate detection.
    const claimRef = adminDb.collection('paymentUtrClaims').doc(createHash('sha256').update(`incoming:${referenceId}`).digest('hex'));
    const txRef = adminDb.collection('transactions').doc();
    const result = await adminDb.runTransaction(async tx => {
      const claim = await tx.get(claimRef);
      if (claim.exists) {
        if (claim.data()?.userId === uid && claim.data()?.amount === amount) return { transactionId: claim.data()!.transactionId, replayed: true };
        throw new RequestAuthError('Duplicate UTR: this reference was already submitted.', 409);
      }
      const migration = await tx.get(adminDb.doc('paymentMigrations/utr'));
      const legacy = migration.data()?.status === 'COMPLETE' ? null : await tx.get(adminDb.collection('transactions'));
      if (legacy?.docs.some(doc => doc.data().type === 'deposit' && typeof doc.data().referenceId === 'string' && doc.data().referenceId.trim().toUpperCase().replace(/\s+/g, '') === referenceId)) throw new RequestAuthError('Duplicate UTR: this reference is already recorded.', 409);
      tx.create(claimRef, { transactionId: txRef.id, userId: uid, amount, normalizedUtr: referenceId, namespace: 'incoming', claimedAt: FieldValue.serverTimestamp() });
      // User-entered references are not proof of payment. Auto-credit requires a verified bank integration.
      tx.create(txRef, { type: 'deposit', description: 'Fund Deposit Request', amount, date: FieldValue.serverTimestamp(), status: 'Pending', referenceId, user: uid, receiptUrl, bankVerified: false });
      tx.create(adminDb.collection('notifications').doc(), { userId: 'admin', type: 'deposit_request', title: 'New deposit request', message: `A fund deposit request of ₹${amount.toFixed(2)} is waiting for bank verification.`, status: 'unread', timestamp: FieldValue.serverTimestamp(), priority: 'high', actionUrl: `/admin/transactions?status=pending&type=student_deposit&id=${txRef.id}`, entityType: 'transaction', entityId: txRef.id, createdBy: uid });
      return { transactionId: txRef.id, replayed: false };
    });
    return NextResponse.json({ success: true, autoApproved: false, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Deposit processing failed.' }, { status: error instanceof RequestAuthError ? error.status : error instanceof SyntaxError ? 400 : 500 });
  }
}
