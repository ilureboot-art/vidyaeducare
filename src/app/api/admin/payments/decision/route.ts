import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { normalizeUtr, walletAfterDecision } from '@/lib/payment-validation';

export async function POST(request: NextRequest) {
  try {
    const actor = await verifyRequester(request, true);
    const body = await request.json();
    if (typeof body.transactionId !== 'string' || !/^[\w-]{1,150}$/.test(body.transactionId) || !['Completed', 'Rejected'].includes(body.status)) return NextResponse.json({ error: 'Invalid payment decision.' }, { status: 400 });
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (reason.length < 3) return NextResponse.json({ error: 'Record a decision reason (at least 3 characters).' }, { status: 400 });
    const ref = adminDb.collection('transactions').doc(body.transactionId);
    const audit = adminDb.collection('adminAuditLogs').doc();
    const notification = adminDb.collection('notifications').doc();
    const result = await adminDb.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw new RequestAuthError('Transaction not found.', 404);
      const payment = snapshot.data()!;
      if (payment.status !== 'Pending') throw new RequestAuthError('This transaction has already been processed. Refresh the list.', 409);
      if (!['deposit', 'withdrawal'].includes(payment.type) || typeof payment.user !== 'string' || !payment.user || payment.user.includes('/')) throw new RequestAuthError('Unsupported payment request.', 400);
      const walletRef = adminDb.collection('wallets').doc(payment.user);
      const wallet = await tx.get(walletRef);
      const before = wallet.exists ? Number(wallet.data()?.balance ?? 0) : 0;
      let after = before;
      const reservedBefore = Number(wallet.data()?.reservedBalance || 0);
      let reservedAfter = reservedBefore;
      const held = payment.type === 'withdrawal' && payment.reservationApplied === true;
      if (held) {
        const amount = Math.abs(Number(payment.amount));
        if (!wallet.exists || !Number.isFinite(before) || before < 0 || !Number.isFinite(reservedBefore) || !Number.isFinite(amount) || payment.amount >= 0 || amount < 650 || reservedBefore < amount) throw new RequestAuthError('Withdrawal reservation mismatch; review the wallet.', 409);
        reservedAfter = Math.round((reservedBefore - amount) * 100) / 100;
        if (body.status === 'Rejected') after = Math.round((before + amount) * 100) / 100;
      }
      let referenceId = payment.referenceId || null;
      if (body.status === 'Completed') {
        try { referenceId = normalizeUtr(payment.type === 'withdrawal' ? body.referenceId : payment.referenceId); } catch (e) { throw new RequestAuthError((e as Error).message, 400); }
        if (body.bankVerified !== true) throw new RequestAuthError('Verify the amount and UTR against the bank statement before approval.', 400);
        const namespace = payment.type === 'deposit' ? 'incoming' : 'outgoing';
        const claimRef = adminDb.collection('paymentUtrClaims').doc(createHash('sha256').update(`${namespace}:${referenceId}`).digest('hex'));
        const claim = await tx.get(claimRef);
        const legacy = await tx.get(adminDb.collection('transactions'));
        if (claim.exists && claim.data()?.transactionId !== ref.id || legacy.docs.some(doc => doc.id !== ref.id && doc.data().type === payment.type && typeof doc.data().referenceId === 'string' && doc.data().referenceId.trim().toUpperCase().replace(/\s+/g, '') === referenceId)) throw new RequestAuthError('Duplicate UTR: another transaction already uses this reference.', 409);
        if (!held) { try { after = walletAfterDecision(before, payment.amount, payment.type); } catch (e) { throw new RequestAuthError((e as Error).message, 409); } }
        tx.set(claimRef, { transactionId: ref.id, userId: payment.user, normalizedUtr: referenceId, namespace, claimedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(walletRef, { balance: after, ...(held ? { reservedBalance: reservedAfter } : {}), ...(!wallet.exists ? { coins: 0, referralCode: `REF${payment.user.slice(0, 6).toUpperCase()}` } : {}) }, { merge: true });
      }
      if (held && body.status === 'Rejected') tx.set(walletRef, { balance: after, reservedBalance: reservedAfter }, { merge: true });
      tx.update(ref, { status: body.status, referenceId, decisionReason: reason, decidedBy: actor.uid, decidedAt: FieldValue.serverTimestamp(), bankVerified: body.status === 'Completed' });
      tx.create(audit, { action: 'payment_decision', entityId: ref.id, actorUid: actor.uid, actorEmail: actor.email, reason, previousStatus: 'Pending', newStatus: body.status, walletBefore: before, walletAfter: after, reservedBefore, reservedAfter, amount: payment.amount, type: payment.type, referenceId, createdAt: FieldValue.serverTimestamp() });
      tx.create(notification, { userId: payment.user, type: payment.type === 'deposit' ? (body.status === 'Completed' ? 'deposit_received' : 'deposit_rejected') : (body.status === 'Completed' ? 'withdrawal_approved' : 'withdrawal_rejected'), message: `Your ${payment.type} request of ₹${Math.abs(payment.amount).toFixed(2)} was ${body.status === 'Completed' ? 'approved' : 'rejected'}. ${reason}`, status: 'unread', timestamp: FieldValue.serverTimestamp(), entityType: 'transaction', entityId: ref.id, actionUrl: '/transactions' });
      return { status: body.status, auditId: audit.id };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment decision failed.' }, { status: error instanceof RequestAuthError ? error.status : error instanceof SyntaxError ? 400 : 500 });
  }
}
