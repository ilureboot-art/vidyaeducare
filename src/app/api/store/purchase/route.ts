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
    } else if (productType === 'ai_tool') {
      if (productId === 'ai_doubt') {
        selectedProduct = {
          name: "AI Doubt Solver",
          price: storeConfig.aiDoubtSolverPrice || 750,
          description: "Unlimited access to bilingual AI tutor to solve academic doubts.",
          gstRate: 18,
          hsnSacCode: '998313'
        } as any;
      } else if (productId === 'ai_notes') {
        selectedProduct = {
          name: "AI Notes Generator",
          price: storeConfig.aiNotesGeneratorPrice || 750,
          description: "Generate structured study notes and summaries from academic text.",
          gstRate: 18,
          hsnSacCode: '998313'
        } as any;
      }
    }

    if (!selectedProduct) {
      return NextResponse.json({ error: 'Product not found or invalid type.' }, { status: 404 });
    }

    // Check Recommendation Discount Eligibility on Server (Fast-Mover: 2 referred clients who purchased in last 30 days)
    let recommendationDiscount = 0;
    let isEligibleForRecDiscount = false;
    if (productType === 'mock' && storeConfig.recommendationSettings) {
      const { windowDays, requiredCount, additionalDiscount } = storeConfig.recommendationSettings;
      
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        const joinDate = userDoc.data()?.joinDate ? new Date(userDoc.data()?.joinDate) : new Date();
        
        const txsSnap = await adminDb.collection('transactions')
          .where('user', '==', uid)
          .where('type', '==', 'Purchase')
          .orderBy('date', 'desc')
          .limit(1)
          .get();
        
        let lastPurchaseDate = null;
        if (!txsSnap.empty) {
          const d = txsSnap.docs[0].data().date;
          lastPurchaseDate = d.toDate ? d.toDate() : new Date(d);
        }
        
        const anchorDate = lastPurchaseDate && lastPurchaseDate > joinDate ? lastPurchaseDate : joinDate;
        const windowEnd = new Date(anchorDate.getTime() + (windowDays * 24 * 60 * 60 * 1000));
        const now = new Date();
        
        if (now <= windowEnd) {
          const clientsSnap = await adminDb.collection('clients')
            .where('referrerId', '==', uid)
            .get();
          
          let validCount = 0;
          clientsSnap.forEach(doc => {
            const data = doc.data();
            const pDate = new Date(data.purchaseDate);
            if (pDate >= anchorDate && pDate <= windowEnd) {
              validCount++;
            }
          });
          
          if (validCount >= requiredCount) {
            isEligibleForRecDiscount = true;
            recommendationDiscount = (additionalDiscount || 0) / 100;
          }
        }
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
      
      // Formula: (Base + GST) = Total, Total - Discounts = Final Price
      const originalTotal = basePrice + (basePrice * (gstRate / 100));
      const discountAmount = originalTotal * totalDiscountFactor;
      const finalPrice = originalTotal - discountAmount;

      priceDetails = {
        basePrice: basePrice,
        discountDetails: {
          base: baseDiscount * 100,
          referral: referralDiscount * 100,
          special: specialDiscount * 100,
          recommendation: recommendationDiscount * 100,
          totalPercentage: totalDiscountFactor * 100,
          totalAmount: discountAmount,
        },
        taxableAmount: basePrice,
        gstRate: gstRate,
        gstAmount: basePrice * (gstRate / 100),
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
      
      const aiAccessRef = adminDb.collection('aiAccess').doc(uid);
      const aiAccessDoc = await transaction.get(aiAccessRef);
      
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

        // Grant free AI tools based on freeAiMonths
        const freeAiMonths = mockItem.freeAiMonths || 0;
        if (freeAiMonths > 0) {
          const now = new Date();
          
          let currentDoubtExpiry = now;
          let currentNotesExpiry = now;
          
          if (aiAccessDoc.exists) {
            const data = aiAccessDoc.data() as any;
            if (data.doubtSolverExpiresAt) {
              const d = data.doubtSolverExpiresAt.toDate ? data.doubtSolverExpiresAt.toDate() : new Date(data.doubtSolverExpiresAt);
              if (d > now) currentDoubtExpiry = d;
            }
            if (data.notesGeneratorExpiresAt) {
              const d = data.notesGeneratorExpiresAt.toDate ? data.notesGeneratorExpiresAt.toDate() : new Date(data.notesGeneratorExpiresAt);
              if (d > now) currentNotesExpiry = d;
            }
          }
          
          const newDoubtExpiry = new Date(currentDoubtExpiry.getTime() + freeAiMonths * 30 * 24 * 60 * 60 * 1000);
          const newNotesExpiry = new Date(currentNotesExpiry.getTime() + freeAiMonths * 30 * 24 * 60 * 60 * 1000);
          
          transaction.set(aiAccessRef, { 
            doubtSolverExpiresAt: newDoubtExpiry, 
            notesGeneratorExpiresAt: newNotesExpiry 
          }, { merge: true });
        }

        // Save referred user to clients collection for IBA tracking
        if (priceDetails.ibaUid) {
          const clientRef = adminDb.collection('clients').doc();
          transaction.set(clientRef, {
            name: userName,
            type: "Direct",
            product: selectedProduct.name,
            purchaseDate: new Date().toISOString(),
            validity: new Date(Date.now() + mockItem.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
            referrerId: priceDetails.ibaUid
          });
        }
      } else if (productType === 'referbolt') {
        const studentReferralCode = walletDoc.data()?.referralCode || `REF${uid.slice(0, 6).toUpperCase()}`;
        transaction.set(adminDb.collection('referbolt').doc(uid), { isSubscribed: true, referralCode: studentReferralCode }, { merge: true });
      } else if (productType === 'ai_tool') {
        const now = new Date();
        if (productId === 'ai_doubt') {
          let currentExpiry = now;
          if (aiAccessDoc.exists) {
            const data = aiAccessDoc.data() as any;
            if (data.doubtSolverExpiresAt) {
              const d = data.doubtSolverExpiresAt.toDate ? data.doubtSolverExpiresAt.toDate() : new Date(data.doubtSolverExpiresAt);
              if (d > now) currentExpiry = d;
            }
          }
          const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
          transaction.set(aiAccessRef, { doubtSolverExpiresAt: newExpiry }, { merge: true });
        } else if (productId === 'ai_notes') {
          let currentExpiry = now;
          if (aiAccessDoc.exists) {
            const data = aiAccessDoc.data() as any;
            if (data.notesGeneratorExpiresAt) {
              const d = data.notesGeneratorExpiresAt.toDate ? data.notesGeneratorExpiresAt.toDate() : new Date(data.notesGeneratorExpiresAt);
              if (d > now) currentExpiry = d;
            }
          }
          const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
          transaction.set(aiAccessRef, { notesGeneratorExpiresAt: newExpiry }, { merge: true });
        }
      }
    });

    return NextResponse.json({ success: true, invoice: invoiceData });
  } catch (error: any) {
    console.error('Purchase processing failed:', error);
    return NextResponse.json({ error: error.message || 'Purchase processing failed.' }, { status: 500 });
  }
}
