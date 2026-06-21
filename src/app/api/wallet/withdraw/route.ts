import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';

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

    const { amount, upiId } = await request.json();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 650) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹650.' }, { status: 400 });
    }

    if (!upiId || upiId.trim() === '') {
      return NextResponse.json({ error: 'Receiving UPI ID is required.' }, { status: 400 });
    }

    const walletRef = adminDb.collection('wallets').doc(uid);

    await adminDb.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists) {
        throw new Error('Wallet not found.');
      }
      
      const currentBalance = walletDoc.data()?.balance || 0;
      if (currentBalance - withdrawAmount < 200) {
        throw new Error('A minimum wallet balance of ₹200 must be maintained after withdrawal.');
      }
      
      const txRef = adminDb.collection('transactions').doc();
      transaction.set(txRef, {
        type: 'withdrawal',
        description: 'Withdrawal Request',
        amount: -withdrawAmount,
        date: FieldValue.serverTimestamp(),
        status: 'Pending',
        paymentMethod: upiId,
        user: uid
      });
    });

    return NextResponse.json({ success: true, amount: withdrawAmount });
  } catch (error: any) {
    console.error('Withdrawal transaction failed:', error);
    return NextResponse.json({ error: error.message || 'Withdrawal processing failed.' }, { status: 500 });
  }
}
