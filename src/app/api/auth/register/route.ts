import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultStoreConfig, StoreConfig } from '@/lib/store-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    let uid: string;
    let authEmail: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
      authEmail = decodedToken.email || '';
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication' }, { status: 401 });
    }

    const { name, email, phone, referralCode } = await request.json();

    // Fetch Store Config from Firestore to get referral bonus
    const storeConfigRef = adminDb.collection('configs').doc('store');
    const storeConfigDoc = await storeConfigRef.get();
    const storeConfig: StoreConfig = storeConfigDoc.exists 
      ? (storeConfigDoc.data() as StoreConfig) 
      : defaultStoreConfig;

    const referralBonus = storeConfig.referralBonus ?? 5;
    let welcomeBonus = 0;
    let referrerId: string | null = null;

    const cleanRefCode = referralCode ? referralCode.trim().toUpperCase() : '';
    
    if (cleanRefCode) {
      const walletsSnap = await adminDb.collection('wallets')
        .where('referralCode', '==', cleanRefCode)
        .limit(1)
        .get();

      if (!walletsSnap.empty) {
        referrerId = walletsSnap.docs[0].id;
        welcomeBonus = referralBonus;
      } else {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
      }
    }

    // Resolve Head Admin UID for routing ReferBolt subscription renewal revenue
    let adminUid: string | null = null;
    const adminsSnap = await adminDb.collection('admins')
      .where('role', '==', 'Head Admin')
      .limit(1)
      .get();
    if (!adminsSnap.empty) {
      adminUid = adminsSnap.docs[0].id;
    } else {
      const usersSnap = await adminDb.collection('users')
        .where('email', '==', 'admin@vidyaeducare.com')
        .limit(1)
        .get();
      if (!usersSnap.empty) {
        adminUid = usersSnap.docs[0].id;
      }
    }

    await adminDb.runTransaction(async (transaction) => {
      const newUserRef = adminDb.collection('users').doc(uid);
      const newWalletRef = adminDb.collection('wallets').doc(uid);
      const newReferboltRef = adminDb.collection('referbolt').doc(uid);

      transaction.set(newUserRef, {
        id: uid,
        name: name,
        email: email,
        phone: phone,
        joinDate: new Date().toISOString(),
        status: "Active",
        referredBy: referrerId || null,
        createdAt: FieldValue.serverTimestamp(),
      });

      const myReferralCode = `REF${uid.slice(0, 6).toUpperCase()}`;

      transaction.set(newWalletRef, {
        balance: welcomeBonus,
        coins: 50, 
        referralCode: myReferralCode,
      });

      transaction.set(newReferboltRef, {
        isSubscribed: false,
        referralCode: myReferralCode,
        totalCommissions: 0,
        totalReferrals: 0,
        cycleProgress: 0,
        cycleGoal: 3,
        autoRenew: false,
        referralHistory: []
      });

      if (referrerId && referralBonus > 0) {
        const referrerWalletRef = adminDb.collection('wallets').doc(referrerId);
        const referrerWalletDoc = await transaction.get(referrerWalletRef);
        if (referrerWalletDoc.exists) {
          const referrerBalance = referrerWalletDoc.data()?.balance || 0;
          transaction.update(referrerWalletRef, { balance: referrerBalance + referralBonus });

          const referrerTxRef = adminDb.collection('transactions').doc();
          transaction.set(referrerTxRef, { 
            user: referrerId, 
            amount: referralBonus, 
            date: FieldValue.serverTimestamp(), 
            description: `Referral bonus for ${name}`, 
            status: "Completed", 
            type: "Referral Bonus" 
          });
          
          if (welcomeBonus > 0) {
            const newUserTxRef = adminDb.collection('transactions').doc();
            transaction.set(newUserTxRef, { 
              user: uid, 
              amount: welcomeBonus, 
              date: FieldValue.serverTimestamp(), 
              description: "Welcome bonus from referral", 
              status: "Completed", 
              type: "Welcome Bonus" 
            });
          }

          // Update ReferBolt cycle progress and history if the referrer is subscribed
          const referrerReferboltRef = adminDb.collection('referbolt').doc(referrerId);
          const referrerReferboltDoc = await transaction.get(referrerReferboltRef);
          if (referrerReferboltDoc.exists) {
            const rData = referrerReferboltDoc.data() || {};
            if (rData.isSubscribed === true) {
              const currentProgress = rData.cycleProgress || 0;
              const goal = rData.cycleGoal || 3;
              const newProgress = currentProgress + 1;

              const updatedReferbolt: any = {
                totalReferrals: (rData.totalReferrals || 0) + 1,
                referralHistory: FieldValue.arrayUnion({
                  id: uid,
                  name: name,
                  date: new Date().toISOString(),
                  commission: referralBonus
                })
              };

              if (newProgress >= goal) {
                // Cycle completed! Reset progress and increment completed cycles
                updatedReferbolt.cycleProgress = 0;
                updatedReferbolt.cyclesCompleted = (rData.cyclesCompleted || 0) + 1;

                const ibaBonus = storeConfig.referboltSettings?.ibaBonusCommission || 5;
                updatedReferbolt.totalCommissions = (rData.totalCommissions || 0) + ibaBonus;

                if (rData.autoRenew === true) {
                  const referboltSub = storeConfig.referboltSubscription || { price: 100, gstRate: 18 };
                  const subPrice = referboltSub.price || 100;
                  const subGstRate = referboltSub.gstRate || 0;
                  const rejoiningFee = subPrice + (subPrice * (subGstRate / 100));

                  // Credit cycle bonus & deduct rejoining fee
                  transaction.update(referrerWalletRef, { balance: referrerBalance + referralBonus + ibaBonus - rejoiningFee });

                  // Keep subscribed
                  updatedReferbolt.isSubscribed = true;

                  // User transaction logs: Credit for cycle bonus, Debit for auto-renewal fee
                  const cycleTxRef = adminDb.collection('transactions').doc();
                  transaction.set(cycleTxRef, {
                    user: referrerId,
                    amount: ibaBonus,
                    date: FieldValue.serverTimestamp(),
                    description: "ReferBolt Success Cycle Bonus",
                    status: "Completed",
                    type: "Commission"
                  });

                  const renewTxRef = adminDb.collection('transactions').doc();
                  transaction.set(renewTxRef, {
                    user: referrerId,
                    amount: -rejoiningFee,
                    date: FieldValue.serverTimestamp(),
                    description: "ReferBolt Auto-Renewal Subscription Fee",
                    status: "Completed",
                    type: "Purchase"
                  });

                  // Route rejoining fee to Head Admin wallet
                  if (adminUid) {
                    const adminWalletRef = adminDb.collection('wallets').doc(adminUid);
                    const adminWalletDoc = await transaction.get(adminWalletRef);
                    const adminCurrentBalance = adminWalletDoc.exists ? (adminWalletDoc.data()?.balance || 0) : 0;

                    transaction.set(adminWalletRef, {
                      balance: adminCurrentBalance + rejoiningFee,
                      coins: adminWalletDoc.exists ? (adminWalletDoc.data()?.coins || 0) : 0,
                      referralCode: adminWalletDoc.exists ? (adminWalletDoc.data()?.referralCode || 'HEADADMIN') : 'HEADADMIN'
                    }, { merge: true });

                    const adminRevenueTxRef = adminDb.collection('transactions').doc();
                    transaction.set(adminRevenueTxRef, {
                      user: adminUid,
                      amount: rejoiningFee,
                      date: FieldValue.serverTimestamp(),
                      description: `Revenue: ReferBolt Auto-Renewal for user ${referrerId}`,
                      status: 'Completed',
                      type: 'deposit'
                    });
                  }
                } else {
                  // Auto-renew disabled: unsubscribe the user since cycle has completed
                  updatedReferbolt.isSubscribed = false;

                  // Credit cycle bonus only
                  transaction.update(referrerWalletRef, { balance: referrerBalance + referralBonus + ibaBonus });

                  // User transaction logs: Credit for cycle bonus
                  const cycleTxRef = adminDb.collection('transactions').doc();
                  transaction.set(cycleTxRef, {
                    user: referrerId,
                    amount: ibaBonus,
                    date: FieldValue.serverTimestamp(),
                    description: "ReferBolt Success Cycle Bonus",
                    status: "Completed",
                    type: "Commission"
                  });
                }
              } else {
                updatedReferbolt.cycleProgress = newProgress;
              }

              transaction.update(referrerReferboltRef, updatedReferbolt);
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Registration processing failed:', error);
    return NextResponse.json({ error: error.message || 'Registration processing failed.' }, { status: 500 });
  }
}
