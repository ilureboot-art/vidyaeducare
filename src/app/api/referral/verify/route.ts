import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin-init';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const querySnapshot = await adminDb.collection('wallets')
      .where('referralCode', '==', cleanCode)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const referrerDoc = querySnapshot.docs[0];
      return NextResponse.json({ 
        valid: true, 
        referrerId: referrerDoc.id 
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error: any) {
    console.error('Error verifying referral code:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
