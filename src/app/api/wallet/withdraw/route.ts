import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { paymentAmount } from '@/lib/payment-validation';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash, randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    let uid: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      uid = decodedToken.uid;
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication' }, { status: 401 });
    }

    const { amount, upiId, requestId } = await request.json();
    if (requestId !== undefined && (typeof requestId !== 'string' || !/^[\w-]{16,100}$/.test(requestId))) return NextResponse.json({ error: 'Invalid withdrawal request ID.' }, { status: 400 });
    let withdrawAmount: number;
    try { withdrawAmount = paymentAmount(amount); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

    if (isNaN(withdrawAmount) || withdrawAmount < 650) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹650.' }, { status: 400 });
    }

    if (typeof upiId !== 'string' || !/^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9.-]{2,100}$/.test(upiId.trim())) {
      return NextResponse.json({ error: 'Receiving UPI ID is required.' }, { status: 400 });
    }

    const walletRef = adminDb.collection('wallets').doc(uid);
    const txRef = adminDb.collection('transactions').doc(`withdraw_${createHash('sha256').update(`${uid}:${requestId || randomUUID()}`).digest('hex')}`);

    await adminDb.runTransaction(async (transaction) => {
      const [walletDoc, existing] = await Promise.all([transaction.get(walletRef), transaction.get(txRef)]);
      if (existing.exists) {
        if (existing.data()?.user !== uid || existing.data()?.amount !== -withdrawAmount || existing.data()?.paymentMethod !== upiId.trim()) throw new Error('Request ID was already used for a different withdrawal.');
        return;
      }
      if (!walletDoc.exists) {
        throw new Error('Wallet not found.');
      }
      
      const currentBalance = Number(walletDoc.data()?.balance || 0);
      const reserved = Number(walletDoc.data()?.reservedBalance || 0);
      if (!Number.isFinite(currentBalance) || !Number.isFinite(reserved) || reserved < 0) throw new Error('Invalid wallet; contact support.');
      if (currentBalance - withdrawAmount < 200) {
        throw new Error('A minimum wallet balance of ₹200 must be maintained after withdrawal.');
      }
      
      transaction.update(walletRef, { balance: Math.round((currentBalance - withdrawAmount) * 100) / 100, reservedBalance: Math.round((reserved + withdrawAmount) * 100) / 100 });
      transaction.set(txRef, {
        type: 'withdrawal',
        description: 'Withdrawal Request',
        amount: -withdrawAmount,
        date: FieldValue.serverTimestamp(),
        status: 'Pending',
        paymentMethod: upiId.trim(),
        reservationApplied: true,
        user: uid
      });

      const notificationRef = adminDb.collection('notifications').doc();
      transaction.set(notificationRef, {
        userId: 'admin',
        type: 'withdrawal_request',
        title: 'New withdrawal request',
        message: `A withdrawal request of ₹${withdrawAmount.toFixed(2)} is waiting for approval.`,
        status: 'unread',
        timestamp: FieldValue.serverTimestamp(),
        priority: 'high',
        actionUrl: `/admin/transactions?status=pending&type=debit&id=${txRef.id}`,
        entityType: 'transaction',
        entityId: txRef.id,
        createdBy: uid,
      });
    });

    return NextResponse.json({ success: true, amount: withdrawAmount, transactionId: txRef.id });
  } catch (error: any) {
    console.error('Withdrawal transaction failed:', error);
    return NextResponse.json({ error: error.message || 'Withdrawal processing failed.' }, { status: 500 });
  }
}
