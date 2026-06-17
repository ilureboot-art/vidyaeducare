import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultStoreConfig, StoreConfig, MockTestPackage, ReferboltSubscription } from '@/lib/store-config';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    let uid: string;
    let userEmail: string;
    let userName: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
      userEmail = decodedToken.email || 'student@vidyaeducare.com';
      userName = decodedToken.name || 'Vidya EduCare Student';
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json({ error: 'Unauthorized: Invalid authentication' }, { status: 401 });
    }

    const { productId, productType, referralCode } = await request.json();

    // Fetch Store Config from Firestore
    const storeConfigRef = adminDb.collection('configs').doc('store');
    const storeConfigDoc = await storeConfigRef.get();
    const storeConfig: StoreConfig = storeConfigDoc.exists 
      ? (storeConfigDoc.data() as StoreConfig) 
      : defaultStoreConfig;

    let selectedProduct: MockTestPackage | ReferboltSubscription | null = null;

    if (productType === 'mock') {
      selectedProduct = storeConfig.mockTestPackages.find(p => p.name === productId) || null;
    } else if (productType === 'referbolt') {
      selectedProduct = storeConfig.referboltSubscription.name === productId ? storeConfig.referboltSubscription : null;
    }

    if (!selectedProduct) {
      return NextResponse.json({ error: 'Product not found or invalid type.' }, { status: 404 });
    }

    // Check Recommendation Discount Eligibility on Server
    let recommendationDiscount = 0;
    let isEligibleForRecDiscount = false;
    if (productType === 'mock' && storeConfig.recommendationSettings) {
      const { windowDays, requiredCount, additionalDiscount } = storeConfig.recommendationSettings;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - windowDays);

      const usersSnap = await adminDb.collection('users')
        .where('referredBy', '==', uid)
        .where('createdAt', '>=', limitDate)
        .get();

      if (usersSnap.size >= requiredCount) {
        isEligibleForRecDiscount = true;
        recommendationDiscount = (additionalDiscount || 0) / 100;
      }
    }

    // Determine pricing and discount details
    let basePrice = selectedProduct.price;
    let gstRate = selectedProduct.gstRate;
    let priceDetails: {
      basePrice: number;
      discountDetails: {
        base: number;
        referral: number;
        special: number;
        recommendation: number;
        totalPercentage: number;
        totalAmount: number;
      };
      taxableAmount: number;
      gstRate: number;
      gstAmount: number;
      finalPrice: number;
      ibaUid: string | null;
    };

    if (productType === 'mock') {
      const mockItem = selectedProduct as MockTestPackage;
      const baseDiscount = (mockItem.baseDiscount || 0) / 100;
      
      let referralDiscount = 0;
      let ibaUid: string | null = null;
      
      if (referralCode && referralCode.trim() !== '') {
        const walletsSnap = await adminDb.collection('wallets')
          .where('referralCode', '==', referralCode.trim())
          .get();
        if (!walletsSnap.empty) {
          ibaUid = walletsSnap.docs[0].id;
          referralDiscount = (mockItem.referralDiscount || 0) / 100;
        }
      }

      const specialDiscount = (mockItem.specialDiscount || 0) / 100;
      const totalDiscountFactor = baseDiscount + referralDiscount + specialDiscount + recommendationDiscount;
      const discountedBasePrice = basePrice * (1 - totalDiscountFactor);
      const gstAmount = discountedBasePrice * (gstRate / 100);
      const finalPrice = discountedBasePrice + gstAmount;

      priceDetails = {
        basePrice: basePrice,
        discountDetails: {
          base: baseDiscount * 100,
          referral: referralDiscount * 100,
          special: specialDiscount * 100,
          recommendation: recommendationDiscount * 100,
          totalPercentage: totalDiscountFactor * 100,
          totalAmount: basePrice * totalDiscountFactor,
        },
        taxableAmount: discountedBasePrice,
        gstRate: gstRate,
        gstAmount: gstAmount,
        finalPrice: finalPrice,
        ibaUid: ibaUid
      };
    } else {
      const gstAmount = basePrice * (gstRate / 100);
      const finalPrice = basePrice + gstAmount;

      priceDetails = {
        basePrice: basePrice,
        discountDetails: {
          base: 0,
          referral: 0,
          special: 0,
          recommendation: 0,
          totalPercentage: 0,
          totalAmount: 0,
        },
        taxableAmount: basePrice,
        gstRate: gstRate,
        gstAmount: gstAmount,
        finalPrice: finalPrice,
        ibaUid: null
      };
    }

    const studentWalletRef = adminDb.collection('wallets').doc(uid);
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-${uid.slice(0, 4).toUpperCase()}`;

    const invoiceData = {
      invoiceNumber: invoiceNum,
      packageName: selectedProduct.name,
      basePrice: priceDetails.basePrice,
      discountDetails: priceDetails.discountDetails,
      taxableAmount: priceDetails.taxableAmount,
      gstRate: priceDetails.gstRate,
      gstAmount: priceDetails.gstAmount,
      finalPrice: priceDetails.finalPrice,
      hsnSacCode: selectedProduct.hsnSacCode || '999294',
      date: new Date().toISOString(),
      billingDetails: {
        email: userEmail,
        name: userName,
      }
    };

    await adminDb.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(studentWalletRef);
      if (!walletDoc.exists) {
        throw new Error('Wallet not found.');
      }
      
      const currentBalance = walletDoc.data()?.balance || 0;
      if (currentBalance < priceDetails.finalPrice) {
        throw new Error('Insufficient wallet balance. Please add funds.');
      }

      transaction.update(studentWalletRef, { balance: currentBalance - priceDetails.finalPrice });

      const purchaseTxRef = adminDb.collection('transactions').doc();
      transaction.set(purchaseTxRef, {
        user: uid,
        amount: -priceDetails.finalPrice,
        date: FieldValue.serverTimestamp(),
        description: `Purchase: ${selectedProduct.name}`,
        status: 'Completed',
        type: 'Purchase',
        
        // Detailed Invoice Fields
        invoiceNumber: invoiceData.invoiceNumber,
        basePrice: invoiceData.basePrice,
        discountDetails: invoiceData.discountDetails,
        taxableAmount: invoiceData.taxableAmount,
        gstRate: invoiceData.gstRate,
        gstAmount: invoiceData.gstAmount,
        finalPrice: invoiceData.finalPrice,
        billingDetails: invoiceData.billingDetails,
        hsnSacCode: invoiceData.hsnSacCode,
        packageName: invoiceData.packageName,
      });

      // Handle IBA Commissions
      if (priceDetails.ibaUid) {
        const baseCommissionRate = (storeConfig.ibaCommissionRate || 10) / 100;
        const commissionAmount = priceDetails.basePrice * baseCommissionRate;

        const ibaWalletRef = adminDb.collection('wallets').doc(priceDetails.ibaUid);
        const ibaWalletDoc = await transaction.get(ibaWalletRef);
        
        if (ibaWalletDoc.exists) {
          const ibaCurrentBalance = ibaWalletDoc.data()?.balance || 0;
          transaction.update(ibaWalletRef, { balance: ibaCurrentBalance + commissionAmount });
          
          const ibaTxRef = adminDb.collection('transactions').doc();
          transaction.set(ibaTxRef, {
            user: priceDetails.ibaUid,
            amount: commissionAmount,
            date: FieldValue.serverTimestamp(),
            description: `Commission from student purchase`,
            status: 'Completed',
            type: 'deposit'
          });
        }
      }

      // Handle Student Entitlements (Activation Codes & ReferBolt Subscriptions)
      if (productType === 'mock') {
        const mockItem = selectedProduct as MockTestPackage;
        const activationCode = `PROD-${Date.now().toString().slice(-6)}`;
        const activationCodesRef = adminDb.collection('activationCodes').doc(uid);
        transaction.set(activationCodesRef, { codes: FieldValue.arrayUnion(activationCode) }, { merge: true });

        if (mockItem.grantFreeReferbolt || storeConfig.referboltSettings?.freeAccessWithMockTest) {
          const studentReferralCode = walletDoc.data()?.referralCode || `REF${uid.slice(0, 6).toUpperCase()}`;
          transaction.set(adminDb.collection('referbolt').doc(uid), { isSubscribed: true, referralCode: studentReferralCode }, { merge: true });
        }
      } else if (productType === 'referbolt') {
        const studentReferralCode = walletDoc.data()?.referralCode || `REF${uid.slice(0, 6).toUpperCase()}`;
        transaction.set(adminDb.collection('referbolt').doc(uid), { isSubscribed: true, referralCode: studentReferralCode }, { merge: true });
      }
    });

    return NextResponse.json({ success: true, invoice: invoiceData });
  } catch (error: any) {
    console.error('Purchase processing failed:', error);
    return NextResponse.json({ error: error.message || 'Purchase processing failed.' }, { status: 500 });
  }
}
