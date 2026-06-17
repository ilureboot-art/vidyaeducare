import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultStoreConfig, StoreConfig } from '@/lib/store-config';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    let uid: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication' }, { status: 401 });
    }

    const { amount, referenceId, receiptUrl } = await request.json();
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    if (!referenceId || referenceId.trim() === '') {
      return NextResponse.json({ error: 'Transaction ID / UTR is required.' }, { status: 400 });
    }

    // Fetch Store Config from Firestore to check auto-approve flag
    const storeConfigRef = adminDb.collection('configs').doc('store');
    const storeConfigDoc = await storeConfigRef.get();
    const storeConfig: StoreConfig = storeConfigDoc.exists 
      ? (storeConfigDoc.data() as StoreConfig) 
      : defaultStoreConfig;

    const isAutoApprove = storeConfig.autoApproveDeposits || false;
    const walletRef = adminDb.collection('wallets').doc(uid);

    const txData = {
      type: 'deposit',
      description: 'Fund Deposit Request',
      amount: depositAmount,
      date: FieldValue.serverTimestamp(),
      status: isAutoApprove ? 'Completed' : 'Pending',
      referenceId: referenceId,
      user: uid,
      receiptUrl: receiptUrl || null,
    };

    if (isAutoApprove) {
      await adminDb.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0;
        
        transaction.set(walletRef, { 
          balance: currentBalance + depositAmount,
          coins: walletDoc.exists ? (walletDoc.data()?.coins || 0) : 0,
          referralCode: walletDoc.exists ? (walletDoc.data()?.referralCode || `REF${uid.slice(0, 6).toUpperCase()}`) : `REF${uid.slice(0, 6).toUpperCase()}`
        }, { merge: true });
        
        const txRef = adminDb.collection('transactions').doc();
        transaction.set(txRef, txData);

        const notificationRef = adminDb.collection('notifications').doc();
        transaction.set(notificationRef, {
          userId: uid,
          type: 'deposit_received',
          message: `₹${depositAmount.toFixed(2)} has been instantly credited to your wallet via auto-approval.`,
          status: 'unread',
          timestamp: FieldValue.serverTimestamp(),
        });
      });
    } else {
      await adminDb.collection('transactions').add(txData);
    }

    return NextResponse.json({ success: true, autoApproved: isAutoApprove });
  } catch (error: any) {
    console.error('Deposit processing failed:', error);
    return NextResponse.json({ error: error.message || 'Deposit processing failed.' }, { status: 500 });
  }
}
