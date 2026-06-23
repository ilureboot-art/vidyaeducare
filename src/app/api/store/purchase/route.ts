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

    const { productId, productType, referralCode, referralCode2 } = await request.json();

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
      ibaUid2: string | null;
    };

    // Fetch buyer user document for custom discount override
    const buyerUserRef = adminDb.collection('users').doc(uid);
    const buyerUserDoc = await buyerUserRef.get();
    const buyerData = buyerUserDoc.exists ? buyerUserDoc.data() : null;

    if (productType === 'mock') {
      const mockItem = selectedProduct as MockTestPackage;
      const baseDiscount = (mockItem.baseDiscount || 0) / 100;
      
      let referralDiscount = 0;
      let ibaUid: string | null = null;
      let ibaUid2: string | null = null;
      
      if (referralCode && referralCode.trim() !== '') {
        const walletsSnap = await adminDb.collection('wallets')
          .where('referralCode', '==', referralCode.trim())
          .get();
        if (!walletsSnap.empty) {
          ibaUid = walletsSnap.docs[0].id;
          referralDiscount = (mockItem.referralDiscount || 0) / 100;
        }
      }

      if (referralCode2 && referralCode2.trim() !== '') {
        const walletsSnap2 = await adminDb.collection('wallets')
          .where('referralCode', '==', referralCode2.trim())
          .get();
        if (!walletsSnap2.empty) {
          ibaUid2 = walletsSnap2.docs[0].id;
          referralDiscount = (mockItem.referralDiscount || 0) / 100;
        }
      }

      // Check user-specific discount override
      let specialDiscount = (mockItem.specialDiscount || 0) / 100;
      if (buyerData && typeof buyerData.discount_rate === 'number') {
        specialDiscount = buyerData.discount_rate / 100;
      }

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
        ibaUid: ibaUid,
        ibaUid2: ibaUid2
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
        ibaUid: null,
        ibaUid2: null
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
      },
      companyName: storeConfig.companyName || 'Vidya EduCare Private Ltd.',
      companyGstin: storeConfig.companyGstin || '27AACCV1234F1Z5',
      companyAddress: storeConfig.companyAddress || 'Mumbai, Maharashtra, India',
    };

    let activationCode: string | undefined;

    // Resolve Head Admin UID for crediting purchase revenue
    let adminUid: string | null = null;
    const adminsSnap = await adminDb.collection('admins')
      .where('role', '==', 'Head Admin')
      .limit(1)
      .get();
    if (!adminsSnap.empty) {
      adminUid = adminsSnap.docs[0].id;
    } else {
      // Fallback: search users collection by email
      const usersSnap = await adminDb.collection('users')
        .where('email', '==', 'admin@vidyaeducare.com')
        .limit(1)
        .get();
      if (!usersSnap.empty) {
        adminUid = usersSnap.docs[0].id;
      }
    }

    await adminDb.runTransaction(async (transaction) => {
      // 1. All Reads First
      const walletDoc = await transaction.get(studentWalletRef);
      if (!walletDoc.exists) {
        throw new Error('Wallet not found.');
      }
      
      const aiAccessRef = adminDb.collection('aiAccess').doc(uid);
      const aiAccessDoc = await transaction.get(aiAccessRef);

      const buyerUserRef = adminDb.collection('users').doc(uid);
      const buyerUserDocTrans = await transaction.get(buyerUserRef);

      let adminWalletDoc = null;
      if (adminUid) {
        adminWalletDoc = await transaction.get(adminDb.collection('wallets').doc(adminUid));
      }

      let ibaWalletDoc = null;
      let ibaUserDoc = null;
      if (priceDetails.ibaUid) {
        ibaWalletDoc = await transaction.get(adminDb.collection('wallets').doc(priceDetails.ibaUid));
        ibaUserDoc = await transaction.get(adminDb.collection('users').doc(priceDetails.ibaUid));
      }

      let ibaWalletDoc2 = null;
      let ibaUserDoc2 = null;
      if (priceDetails.ibaUid2) {
        ibaWalletDoc2 = await transaction.get(adminDb.collection('wallets').doc(priceDetails.ibaUid2));
        ibaUserDoc2 = await transaction.get(adminDb.collection('users').doc(priceDetails.ibaUid2));
      }

      // 2. Business Logic and Writes
      const currentBalance = walletDoc.data()?.balance || 0;
      if (currentBalance < priceDetails.finalPrice) {
        throw new Error('Insufficient wallet balance. Please add funds.');
      }

      transaction.update(studentWalletRef, { balance: currentBalance - priceDetails.finalPrice });

      // Mark user as having purchased a mock test
      if (productType === 'mock') {
        transaction.set(buyerUserRef, { purchasedMockTest: true }, { merge: true });
      }

      // Credit purchase revenue to Head Admin wallet
      if (adminUid) {
        const adminWalletRef = adminDb.collection('wallets').doc(adminUid);
        const adminCurrentBalance = adminWalletDoc && adminWalletDoc.exists ? (adminWalletDoc.data()?.balance || 0) : 0;
        
        transaction.set(adminWalletRef, { 
          balance: adminCurrentBalance + priceDetails.finalPrice,
          coins: adminWalletDoc && adminWalletDoc.exists ? (adminWalletDoc.data()?.coins || 0) : 0,
          referralCode: adminWalletDoc && adminWalletDoc.exists ? (adminWalletDoc.data()?.referralCode || 'HEADADMIN') : 'HEADADMIN'
        }, { merge: true });

        const adminRevenueTxRef = adminDb.collection('transactions').doc();
        transaction.set(adminRevenueTxRef, {
          user: adminUid,
          amount: priceDetails.finalPrice,
          date: FieldValue.serverTimestamp(),
          description: `Revenue: Purchase of ${selectedProduct.name} by ${userName}`,
          status: 'Completed',
          type: 'deposit'
        });
      }

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
      if (priceDetails.ibaUid || priceDetails.ibaUid2) {
        const paidCommissionRate = storeConfig.ibaCommissionRate ?? 10;
        const freeCommissionRate = storeConfig.freeIbaCommissionRate ?? 5;

        // If both are present, split 50%-50%. Otherwise, the active one gets 100% of the commission.
        const isSplit = !!(priceDetails.ibaUid && priceDetails.ibaUid2);
        const splitFactor = isSplit ? 0.5 : 1.0;

        if (priceDetails.ibaUid && ibaWalletDoc) {
          const ibaWalletRef = adminDb.collection('wallets').doc(priceDetails.ibaUid);
          if (ibaWalletDoc.exists) {
            const ibaCurrentBalance = ibaWalletDoc.data()?.balance || 0;
            const ibaData = ibaUserDoc?.data();
            const isIbaPaid = ibaUserDoc && ibaUserDoc.exists && ibaData?.purchasedMockTest === true;
            let rate = isIbaPaid ? paidCommissionRate : freeCommissionRate;
            let isCustomRate = false;
            if (ibaUserDoc && ibaUserDoc.exists && ibaData && typeof ibaData.commission_rate === 'number') {
              rate = ibaData.commission_rate;
              isCustomRate = true;
            }
            const amountForIba = priceDetails.basePrice * (rate / 100) * splitFactor;
            
            transaction.update(ibaWalletRef, { balance: ibaCurrentBalance + amountForIba });
            
            const ibaTxRef = adminDb.collection('transactions').doc();
            transaction.set(ibaTxRef, {
              user: priceDetails.ibaUid,
              amount: amountForIba,
              date: FieldValue.serverTimestamp(),
              description: `Commission from student purchase${isSplit ? " (50% Primary IBA Split)" : ""}${isCustomRate ? " [Custom rate: " + rate + "%]" : isIbaPaid ? " [Paid rate: " + paidCommissionRate + "%]" : " [Free rate: " + freeCommissionRate + "%]"}`,
              status: 'Completed',
              type: 'deposit'
            });
          }
        }

        if (priceDetails.ibaUid2 && ibaWalletDoc2) {
          const ibaWalletRef2 = adminDb.collection('wallets').doc(priceDetails.ibaUid2);
          if (ibaWalletDoc2.exists) {
            const ibaCurrentBalance2 = ibaWalletDoc2.data()?.balance || 0;
            const ibaData2 = ibaUserDoc2?.data();
            const isIbaPaid2 = ibaUserDoc2 && ibaUserDoc2.exists && ibaData2?.purchasedMockTest === true;
            let rate2 = isIbaPaid2 ? paidCommissionRate : freeCommissionRate;
            let isCustomRate2 = false;
            if (ibaUserDoc2 && ibaUserDoc2.exists && ibaData2 && typeof ibaData2.commission_rate === 'number') {
              rate2 = ibaData2.commission_rate;
              isCustomRate2 = true;
            }
            const amountForIba2 = priceDetails.basePrice * (rate2 / 100) * splitFactor;
            
            transaction.update(ibaWalletRef2, { balance: ibaCurrentBalance2 + amountForIba2 });
            
            const ibaTxRef2 = adminDb.collection('transactions').doc();
            transaction.set(ibaTxRef2, {
              user: priceDetails.ibaUid2,
              amount: amountForIba2,
              date: FieldValue.serverTimestamp(),
              description: `Commission from student purchase${isSplit ? " (50% Secondary IBA Split)" : ""}${isCustomRate2 ? " [Custom rate: " + rate2 + "%]" : isIbaPaid2 ? " [Paid rate: " + paidCommissionRate + "%]" : " [Free rate: " + freeCommissionRate + "%]"}`,
              status: 'Completed',
              type: 'deposit'
            });
          }
        }
      }

      // Handle Student Entitlements (Activation Codes & ReferBolt Subscriptions)
      if (productType === 'mock') {
        const mockItem = selectedProduct as MockTestPackage;
        activationCode = `PROD-${Date.now().toString().slice(-6)}`;
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

        if (priceDetails.ibaUid2) {
          const clientRef2 = adminDb.collection('clients').doc();
          transaction.set(clientRef2, {
            name: userName,
            type: "Direct",
            product: selectedProduct.name,
            purchaseDate: new Date().toISOString(),
            validity: new Date(Date.now() + mockItem.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
            referrerId: priceDetails.ibaUid2
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

    return NextResponse.json({ 
      success: true, 
      invoice: invoiceData, 
      activationCode: productType === 'mock' ? activationCode : undefined 
    });
  } catch (error: any) {
    console.error('Purchase processing failed:', error);
    return NextResponse.json({ error: error.message || 'Purchase processing failed.' }, { status: 500 });
  }
}
