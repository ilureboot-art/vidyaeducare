
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Sparkles, Loader2, BookOpen, Zap, CheckCircle2, AlertCircle, FileText, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadInvoicePDF } from "@/lib/pdf-export";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { type StoreConfig, type MockTestPackage, type ReferboltSubscription, defaultStoreConfig } from "@/lib/store-config";
import type { WalletData } from "@/lib/user-data";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, runTransaction, collection, serverTimestamp, arrayUnion, query, where, getDocs, orderBy, limit, Timestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function StorePageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDb();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligibleForRecDiscount, setIsEligibleForRecDiscount] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState(0);
  
  const [referralCode1, setReferralCode1] = useState("");
  const [purchasedInvoice, setPurchasedInvoice] = useState<any | null>(null);

  const checkRecEligibility = useCallback(async (db: Firestore, userId: string, config: StoreConfig) => {
    if (!config.recommendationSettings) {
        setIsCheckingEligibility(false);
        return;
    }

    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef).catch(async (e) => {
            if (e.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'get' }));
            }
            throw e;
        });

        if (!userDoc || !userDoc.exists()) return;
        const joinDate = userDoc.data().joinDate ? new Date(userDoc.data().joinDate) : new Date();

        const txColRef = collection(db, "transactions");
        const qT = query(
            txColRef, 
            where("user", "==", userId), 
            where("type", "==", "Purchase"), 
            orderBy("date", "desc"), 
            limit(1)
        );
        const tSnap = await getDocs(qT).catch(async (e) => {
            if (e.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: txColRef.path, operation: 'list' }));
            }
            throw e;
        });

        let lastPurchaseDate = null;
        if (tSnap && !tSnap.empty) {
            const d = tSnap.docs[0].data().date;
            lastPurchaseDate = d instanceof Timestamp ? d.toDate() : new Date(d);
        }

        const anchorDate = lastPurchaseDate && lastPurchaseDate > joinDate ? lastPurchaseDate : joinDate;
        const windowEnd = new Date(anchorDate.getTime() + (config.recommendationSettings.windowDays * 24 * 60 * 60 * 1000));
        const now = new Date();

        if (now > windowEnd) {
            setIsEligibleForRecDiscount(false);
            setIsCheckingEligibility(false);
            return;
        }

        const clientsColRef = collection(db, "clients");
        const qC = query(clientsColRef, where("referrerId", "==", userId));
        const cSnap = await getDocs(qC).catch(async (e) => {
            if (e.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: clientsColRef.path, operation: 'list' }));
            }
            throw e;
        });

        let validCount = 0;
        if (cSnap) {
            cSnap.forEach(doc => {
                const data = doc.data();
                const pDate = data.purchaseDate instanceof Timestamp ? data.purchaseDate.toDate() : new Date(data.purchaseDate);
                if (pDate >= anchorDate && pDate <= windowEnd) {
                    validCount++;
                }
            });
        }

        setRecommendationCount(validCount);
        setIsEligibleForRecDiscount(validCount >= config.recommendationSettings.requiredCount);
    } catch (e) {
        console.warn("Eligibility check sync issue.");
    } finally {
        setIsCheckingEligibility(false);
    }
  }, []);

  useEffect(() => {
    if (user && db) {
        const fetchData = async () => {
            const walletDocRef = doc(db, "wallets", user.uid);
            const storeConfigRef = doc(db, "configs", "store");
            
            try {
                const results = await Promise.allSettled([
                    getDoc(walletDocRef),
                    getDoc(storeConfigRef)
                ]);

                const walletRes = results[0];
                const configRes = results[1];

                if (walletRes.status === 'fulfilled' && walletRes.value.exists()) {
                    setWalletData(walletRes.value.data() as WalletData);
                } else {
                    if (walletRes.status === 'rejected' && walletRes.reason?.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: walletDocRef.path, operation: 'get' }));
                    }
                    setWalletData({ balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}` } as WalletData);
                }
                
                if (configRes.status === 'fulfilled' && configRes.value.exists()) {
                    const config = configRes.value.data() as StoreConfig;
                    setStoreConfig(config);
                    checkRecEligibility(db, user.uid, config);
                } else {
                    if (configRes.status === 'rejected' && configRes.reason?.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: storeConfigRef.path, operation: 'get' }));
                    }
                    // FALLBACK: Use defaults to prevent spinning error
                    setStoreConfig(defaultStoreConfig);
                    setIsCheckingEligibility(false);
                }
            } catch (e) {
                console.warn("Store initialization sync error.");
                setStoreConfig(defaultStoreConfig);
                setIsCheckingEligibility(false);
            }
        };
        fetchData();
    }
  }, [user, db, checkRecEligibility]);

  const handlePurchase = async (item: MockTestPackage | ReferboltSubscription | { name: string; price: number; gstRate: number; hsnSacCode: string }, type: 'mock' | 'referbolt' | 'ai_tool') => {
    if (!user || !storeConfig || !walletData || !db) return;

    setIsPurchasing(item.name);

    let priceDetails = {
        basePrice: 0,
        discountDetails: {
            base: 0,
            referral: 0,
            special: 0,
            recommendation: 0,
            totalPercentage: 0,
            totalAmount: 0,
        },
        taxableAmount: 0,
        gstRate: 0,
        gstAmount: 0,
        finalPrice: 0,
        hasReferral: false
    };

    if (type === 'mock') {
        const mockItem = item as MockTestPackage;
        const baseDiscount = (mockItem.baseDiscount || 0) / 100;
        const referralDiscount = referralCode1.trim() !== "" ? (mockItem.referralDiscount || 0) / 100 : 0;
        const specialDiscount = (mockItem.specialDiscount || 0) / 100;
        const recommendationDiscount = isEligibleForRecDiscount ? (storeConfig.recommendationSettings?.additionalDiscount || 0) / 100 : 0;
        
        const totalDiscountFactor = baseDiscount + referralDiscount + specialDiscount + recommendationDiscount;
        
        // Transparent Billing: (Base + GST) = Total, then Total - Discounts = Final Price
        const basePrice = item.price;
        const gstAmountPkg = basePrice * (item.gstRate / 100);
        const originalTotal = basePrice + gstAmountPkg;
        const discountAmount = originalTotal * totalDiscountFactor;
        const finalPrice = originalTotal - discountAmount;

        // Bundled values
        const freeAiMonths = mockItem.freeAiMonths || 0;
        const referboltValue = mockItem.grantFreeReferbolt ? (storeConfig.referboltSubscription.price * 1.18) : 0;
        const aiToolsValue = freeAiMonths > 0 ? (((storeConfig.aiDoubtSolverPrice || 750) * 1.18) + ((storeConfig.aiNotesGeneratorPrice || 750) * 1.18)) * freeAiMonths : 0;
        const bundledValue = referboltValue + aiToolsValue;

        const marketValue = originalTotal + bundledValue;
        const totalSavings = discountAmount + bundledValue;

        priceDetails = {
            basePrice: item.price,
            discountDetails: {
                base: baseDiscount * 100,
                referral: referralDiscount * 100,
                special: specialDiscount * 100,
                recommendation: recommendationDiscount * 100,
                totalPercentage: totalDiscountFactor * 100,
                totalAmount: discountAmount, // calculated on Total (Base + GST)
            },
            taxableAmount: basePrice,
            gstRate: item.gstRate,
            gstAmount: gstAmountPkg,
            finalPrice: finalPrice,
            hasReferral: referralCode1.trim() !== "",
            
            // New Transparent Billing / Savings Fields
            originalTotal: originalTotal,
            bundledValue: bundledValue,
            marketValue: marketValue,
            totalSavings: totalSavings,
            freeAiMonths: freeAiMonths,
            referboltValue: referboltValue,
            aiToolsValue: aiToolsValue
        } as any;
    } else if (type === 'referbolt' || type === 'ai_tool') {
        const gstAmount = item.price * (item.gstRate / 100);
        const finalPrice = item.price + gstAmount;

        priceDetails = {
            basePrice: item.price,
            discountDetails: {
                base: 0,
                referral: 0,
                special: 0,
                recommendation: 0,
                totalPercentage: 0,
                totalAmount: 0,
            },
            taxableAmount: item.price,
            gstRate: item.gstRate,
            gstAmount: gstAmount,
            finalPrice: finalPrice,
            hasReferral: false
        };
    }

    if (walletData.balance < priceDetails.finalPrice) {
        toast({ variant: "destructive", title: "Purchase Failed", description: "Insufficient wallet balance. Please add funds." });
        setIsPurchasing(null);
        return;
    }

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}-${user.uid.slice(0, 4).toUpperCase()}`;
    const invoiceData = {
        invoiceNumber: invoiceNum,
        packageName: item.name,
        basePrice: priceDetails.basePrice,
        discountDetails: priceDetails.discountDetails,
        taxableAmount: priceDetails.taxableAmount,
        gstRate: priceDetails.gstRate,
        gstAmount: priceDetails.gstAmount,
        finalPrice: priceDetails.finalPrice,
        hsnSacCode: item.hsnSacCode || "999294",
        date: new Date().toISOString(),
        billingDetails: {
            email: user.email || "student@vidyaeducare.com",
            name: user.displayName || "Vidya EduCare Student",
        },
        originalTotal: (priceDetails as any).originalTotal || priceDetails.finalPrice,
        bundledValue: (priceDetails as any).bundledValue || 0,
        marketValue: (priceDetails as any).marketValue || priceDetails.finalPrice,
        totalSavings: (priceDetails as any).totalSavings || 0,
        freeAiMonths: (priceDetails as any).freeAiMonths || 0,
        referboltValue: (priceDetails as any).referboltValue || 0,
        aiToolsValue: (priceDetails as any).aiToolsValue || 0
    };

    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/store/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                productId: item.name === 'AI Doubt Solver' ? 'ai_doubt' : (item.name === 'AI Notes Generator' ? 'ai_notes' : item.name),
                productType: type,
                referralCode: referralCode1.trim()
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Purchase processing failed.');
        }

        toast({ title: "Purchase Successful!", description: `${item.name} activated.` });
        setPurchasedInvoice(data.invoice);
        checkRecEligibility(db, user.uid, storeConfig);
    } catch (e: any) {
        console.error("Store Purchase Error:", e);
        toast({ variant: "destructive", title: "Purchase Failed", description: e.message || "An unexpected error occurred." });
    } finally {
        setIsPurchasing(null);
    }
  };

  if (!walletData || !storeConfig) {
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={40}/>
            <p className="text-muted-foreground animate-pulse text-sm font-medium">Connecting to Store...</p>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2 tracking-tighter">
            <ShoppingCart className="w-8 h-8" /> PRODUCT STORE
          </CardTitle>
          <CardDescription className="text-center font-medium">
            Wallet Balance: <span className="font-black text-primary">₹{walletData.balance.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="tests" className="font-bold uppercase text-[10px]">MockArena Packs</TabsTrigger>
              <TabsTrigger value="referbolt" className="font-bold uppercase text-[10px]">ReferBolt Access</TabsTrigger>
              <TabsTrigger value="ai-tools" className="font-bold uppercase text-[10px]">AI Learning Tools</TabsTrigger>
            </TabsList>
            <TabsContent value="tests" className="space-y-6 pt-6">
                 
                 {!isCheckingEligibility && (
                    <Card className={`border-dashed border-2 transition-all ${isEligibleForRecDiscount ? 'border-green-500 bg-green-500/5' : 'border-primary/20 bg-muted/20'}`}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {isEligibleForRecDiscount ? (
                                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                                ) : (
                                    <AlertCircle className="text-primary w-8 h-8" />
                                )}
                                <div>
                                    <p className="font-bold text-sm">
                                        {isEligibleForRecDiscount 
                                            ? `Fast-Mover Bonus Applied!` 
                                            : `Unlock +${storeConfig.recommendationSettings?.additionalDiscount}% Extra Discount`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isEligibleForRecDiscount 
                                            ? `You've referred enough customers within your joining window!` 
                                            : `Refer ${storeConfig.recommendationSettings?.requiredCount} customers within ${storeConfig.recommendationSettings?.windowDays} days.`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 )}

                 <div className="max-w-md mx-auto space-y-4 p-5 border rounded-xl bg-muted/30 mt-4">
                    <div className="text-center space-y-1 mb-2">
                        <p className="text-sm font-bold">Have an IBA referral code?</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Support your associate & get a discount</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="referralCode1" className="text-[10px] font-bold uppercase">Primary IBA Code</Label>
                        <Input 
                            id="referralCode1" 
                            placeholder="Enter IBA code here"
                            value={referralCode1}
                            onChange={(e) => setReferralCode1(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {storeConfig.mockTestPackages.map((product, index) => {
                    const baseDisc = (product.baseDiscount || 0) / 100;
                    const referralDisc = referralCode1.trim() !== "" ? (product.referralDiscount || 0) / 100 : 0;
                    const specialDisc = (product.specialDiscount || 0) / 100;
                    const recommendationDisc = isEligibleForRecDiscount ? (storeConfig.recommendationSettings?.additionalDiscount || 0) / 100 : 0;
                    
                    const totalDiscount = baseDisc + referralDisc + specialDisc + recommendationDisc;
                    
                    // Transparent Billing: (Base + GST) = Total, then Total - Discounts = Final Price
                    const basePrice = product.price;
                    const gstAmountPkg = basePrice * (product.gstRate / 100);
                    const originalTotal = basePrice + gstAmountPkg;
                    
                    const discountAmount = originalTotal * totalDiscount;
                    const finalPrice = originalTotal - discountAmount;

                    // Bundled products
                    const freeAiMonths = product.freeAiMonths || 0;
                    const referboltValue = product.grantFreeReferbolt ? (storeConfig.referboltSubscription.price * 1.18) : 0;
                    const aiToolsValue = freeAiMonths > 0 ? (((storeConfig.aiDoubtSolverPrice || 750) * 1.18) + ((storeConfig.aiNotesGeneratorPrice || 750) * 1.18)) * freeAiMonths : 0;
                    const bundledValue = referboltValue + aiToolsValue;

                    const marketValue = originalTotal + bundledValue;
                    const totalSavings = discountAmount + bundledValue;

                  return (
                    <Card
                      key={index}
                      className={`flex flex-col text-center transition-all relative ${product.bestValue ? 'border-primary border-2 shadow-primary/10 shadow-lg' : 'hover:shadow-md'}`}
                    >
                      {product.bestValue && (
                          <div className="absolute top-0 right-0 -mt-3 -mr-3">
                            <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-tighter rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                              <Sparkles className="w-3 h-3" />
                              Best Value
                            </div>
                          </div>
                        )}
                      <CardHeader>
                        <CardTitle className="text-2xl font-black flex items-center justify-center gap-2">
                          <BookOpen className="text-primary h-5 w-5" />
                          {product.name}
                        </CardTitle>
                        <CardDescription className="font-bold text-xs uppercase">{product.months} Months Access</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-center items-center space-y-6">
                         <div className="space-y-1 w-full">
                            <p className="text-muted-foreground line-through text-sm">₹{product.price}</p>
                            <p className="text-5xl font-black text-primary tracking-tighter">₹{finalPrice.toFixed(0)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">
                                (Inc. {product.gstRate}% GST)
                            </p>
                            {totalDiscount > 0 && (
                                <Badge variant="secondary" className="mt-4 bg-accent/10 text-accent border-none font-black text-[11px] py-1 px-4 rounded-full">
                                    SAVE {(totalDiscount * 100).toFixed(0)}%
                                </Badge>
                            )}
                                                   <div className="text-xs text-muted-foreground border-t pt-4 w-full mt-4 space-y-2 font-medium text-left">
                                <div className="flex justify-between">
                                    <span>Market Value (Bundle Total):</span>
                                    <span className="font-bold text-foreground">₹{marketValue.toFixed(2)}</span>
                                </div>
                                <div className="text-[10px] pl-2 border-l border-primary/20 space-y-1">
                                    <div className="flex justify-between">
                                        <span>• MockArena Base Price:</span>
                                        <span>₹{basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>• MockArena GST ({product.gstRate}%):</span>
                                        <span>₹{gstAmountPkg.toFixed(2)}</span>
                                    </div>
                                    {referboltValue > 0 && (
                                        <div className="flex justify-between text-primary font-bold">
                                            <span>• Bundled ReferBolt Access (Included):</span>
                                            <span>₹{referboltValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {aiToolsValue > 0 && (
                                        <div className="flex justify-between text-accent font-bold">
                                            <span>• Bundled AI Learning Tools ({freeAiMonths} Months):</span>
                                            <span>₹{aiToolsValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {totalSavings > 0 && (
                                    <div className="space-y-1 bg-green-500/[0.03] p-2.5 rounded-xl border border-green-500/10">
                                        <div className="text-[9px] font-black text-green-600 uppercase tracking-wider mb-1">Applied Savings & Discounts:</div>
                                        {baseDisc > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600">
                                                <span>• Package Base Discount ({product.baseDiscount}%):</span>
                                                <span>-₹{(originalTotal * baseDisc).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {referralDisc > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600">
                                                <span>• IBA Referral Discount ({product.referralDiscount}%):</span>
                                                <span>-₹{(originalTotal * referralDisc).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {specialDisc > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600">
                                                <span>• Package Special Discount ({product.specialDiscount}%):</span>
                                                <span>-₹{(originalTotal * specialDisc).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {recommendationDisc > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600">
                                                <span>• Fast-Mover Bonus ({(storeConfig.recommendationSettings?.additionalDiscount || 0)}%):</span>
                                                <span>-₹{(originalTotal * recommendationDisc).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {referboltValue > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600 font-bold">
                                                <span>• Free ReferBolt Access:</span>
                                                <span>-₹{referboltValue.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {aiToolsValue > 0 && (
                                            <div className="flex justify-between text-[11px] text-green-600 font-bold">
                                                <span>• Free AI Learning Tools:</span>
                                                <span>-₹{aiToolsValue.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex justify-between border-t border-dashed pt-1.5 mt-1.5 text-green-600 font-bold">
                                    <span>Total Savings:</span>
                                    <span>-₹{totalSavings.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed pt-1.5 mt-1.5 text-sm font-black text-primary">
                                     <span>Final Price:</span>
                                     <span>₹{finalPrice.toFixed(2)}</span>
                                 </div>
                            </div>

                            {product.grantFreeReferbolt && (
                                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 py-1.5 rounded-lg border border-primary/20">
                                    <Zap size={12} className="fill-primary" /> Free ReferBolt Included
                                </div>
                            )}
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full font-black py-7 text-lg shadow-xl"
                          onClick={() => handlePurchase(product, 'mock')}
                          disabled={isPurchasing !== null}
                        >
                          {isPurchasing === product.name ? <Loader2 className="animate-spin" /> : "ACTIVATE NOW"}
                        </Button>
                      </CardContent>
                    </Card>
                )})}
                </div>
            </TabsContent>
            <TabsContent value="referbolt" className="pt-6">
                <Card className="flex flex-col text-center items-center max-w-md mx-auto p-4 border-2 border-dashed border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="text-primary w-8 h-8 fill-primary" />
                        </div>
                        <CardTitle className="text-2xl font-black">{storeConfig.referboltSubscription.name}</CardTitle>
                         <CardDescription className="font-medium">Continuous Referral Earning Cycle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 w-full">
                        <p className="text-5xl font-black text-primary tracking-tighter">₹{(storeConfig.referboltSubscription.price + (storeConfig.referboltSubscription.price * (storeConfig.referboltSubscription.gstRate / 100))).toFixed(0)}</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inclusive of GST</p>
                        
                        <div className="text-xs text-muted-foreground border-t pt-4 w-full mt-4 space-y-1 font-medium">
                            <div className="flex justify-between">
                                <span>Base Price:</span>
                                <span className="font-bold text-foreground">₹{storeConfig.referboltSubscription.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST ({storeConfig.referboltSubscription.gstRate}%):</span>
                                <span className="font-bold text-foreground">₹{(storeConfig.referboltSubscription.price * (storeConfig.referboltSubscription.gstRate / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed pt-1 mt-1 text-sm font-black text-primary">
                                <span>Total Price:</span>
                                <span>₹{(storeConfig.referboltSubscription.price + (storeConfig.referboltSubscription.price * (storeConfig.referboltSubscription.gstRate / 100))).toFixed(2)}</span>
                            </div>
                        </div>

                        <Button size="lg" className="w-full font-black py-7 mt-4" onClick={() => handlePurchase(storeConfig.referboltSubscription, 'referbolt')} disabled={isPurchasing !== null}>
                            {isPurchasing === storeConfig.referboltSubscription.name ? <Loader2 className="animate-spin"/> : "START EARNING"}
                        </Button>
                    </CardContent>
                     <CardContent>
                        <Button asChild variant="link" className="text-xs font-bold opacity-70">
                            <Link href="/referbolt">View Detailed Earning Structure →</Link>
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="ai-tools" className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card for AI Doubt Solver */}
                    <Card className="flex flex-col text-center items-center p-4 border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="m12 3-1.912 5.886L4.2 9l5.886 1.912L12 16.8l1.912-5.886L19.8 9l-5.886-1.912Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
                            </div>
                            <CardTitle className="text-2xl font-black">AI Doubt Solver</CardTitle>
                            <CardDescription className="font-medium">Unlimited bilingual explanations & answers for academic queries.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 w-full flex-grow flex flex-col justify-end">
                            <div>
                                <p className="text-5xl font-black text-primary tracking-tighter">₹{((storeConfig.aiDoubtSolverPrice || 750) * 1.18).toFixed(0)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Inclusive of 18% GST (Base: ₹{storeConfig.aiDoubtSolverPrice || 750})</p>
                            </div>
                            
                            <div className="text-xs text-muted-foreground border-t pt-4 w-full mt-4 space-y-1 font-medium text-left">
                                <div className="flex justify-between">
                                    <span>Base Price:</span>
                                    <span>₹{(storeConfig.aiDoubtSolverPrice || 750).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GST (18%):</span>
                                    <span>₹{((storeConfig.aiDoubtSolverPrice || 750) * 0.18).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed pt-1 mt-1 text-sm font-black text-primary">
                                    <span>Total Price:</span>
                                    <span>₹{((storeConfig.aiDoubtSolverPrice || 750) * 1.18).toFixed(2)}</span>
                                </div>
                            </div>

                            <Button 
                                size="lg" 
                                className="w-full font-black py-7 mt-4" 
                                onClick={() => handlePurchase({
                                    name: "AI Doubt Solver",
                                    price: storeConfig.aiDoubtSolverPrice || 750,
                                    gstRate: 18,
                                    hsnSacCode: '998313'
                                }, 'ai_tool')} 
                                disabled={isPurchasing !== null}
                            >
                                {isPurchasing === "AI Doubt Solver" ? <Loader2 className="animate-spin"/> : "ACTIVATE SOLVER"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Card for AI Notes Generator */}
                    <Card className="flex flex-col text-center items-center p-4 border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-primary w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl font-black">AI Notes Generator</CardTitle>
                            <CardDescription className="font-medium">Generate structured keynotes and bilingual chapter summaries.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 w-full flex-grow flex flex-col justify-end">
                            <div>
                                <p className="text-5xl font-black text-primary tracking-tighter">₹{((storeConfig.aiNotesGeneratorPrice || 750) * 1.18).toFixed(0)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Inclusive of 18% GST (Base: ₹{storeConfig.aiNotesGeneratorPrice || 750})</p>
                            </div>
                            
                            <div className="text-xs text-muted-foreground border-t pt-4 w-full mt-4 space-y-1 font-medium text-left">
                                <div className="flex justify-between">
                                    <span>Base Price:</span>
                                    <span>₹{(storeConfig.aiNotesGeneratorPrice || 750).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GST (18%):</span>
                                    <span>₹{((storeConfig.aiNotesGeneratorPrice || 750) * 0.18).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed pt-1 mt-1 text-sm font-black text-primary">
                                    <span>Total Price:</span>
                                    <span>₹{((storeConfig.aiNotesGeneratorPrice || 750) * 1.18).toFixed(2)}</span>
                                </div>
                            </div>

                            <Button 
                                size="lg" 
                                className="w-full font-black py-7 mt-4" 
                                onClick={() => handlePurchase({
                                    name: "AI Notes Generator",
                                    price: storeConfig.aiNotesGeneratorPrice || 750,
                                    gstRate: 18,
                                    hsnSacCode: '998313'
                                }, 'ai_tool')} 
                                disabled={isPurchasing !== null}
                            >
                                {isPurchasing === "AI Notes Generator" ? <Loader2 className="animate-spin"/> : "ACTIVATE GENERATOR"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {purchasedInvoice && (
        <Dialog open={!!purchasedInvoice} onOpenChange={(open) => !open && setPurchasedInvoice(null)}>
            <DialogContent className="max-w-2xl p-8 rounded-[2rem] border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                <div id="invoice-print-area" className="bg-background text-foreground space-y-6">
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #invoice-print-area, #invoice-print-area * {
                          visibility: visible;
                        }
                        #invoice-print-area {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                        }
                      }
                    `}</style>
                    <div className="flex justify-between items-start border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-primary italic uppercase tracking-tighter">VIDYA <span className="text-accent">EDUCARE</span></h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Academic Excellence Platform</p>
                        </div>
                        <div className="text-right">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-xs uppercase tracking-widest px-4 py-1.5">TAX INVOICE</Badge>
                            <p className="text-xs font-mono font-bold mt-2">{purchasedInvoice.invoiceNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(purchasedInvoice.date).toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <h3 className="font-black uppercase text-[10px] text-muted-foreground tracking-wider mb-2">Billed To</h3>
                            <p className="font-black text-foreground">{purchasedInvoice.billingDetails.name}</p>
                            <p className="text-muted-foreground text-xs">{purchasedInvoice.billingDetails.email}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-black uppercase text-[10px] text-muted-foreground tracking-wider mb-2">Service Provider</h3>
                            <p className="font-black text-foreground">Vidya EduCare Private Ltd.</p>
                            <p className="text-muted-foreground text-xs">GSTIN: 27AACCV1234F1Z5</p>
                        </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden mt-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-center">HSN/SAC</th>
                                    <th className="p-4 text-right">Base Price</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-bold">
                                <tr className="border-b">
                                    <td className="p-4">
                                        <p className="text-foreground font-black">{purchasedInvoice.packageName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Bilingual Mock Test Portal</p>
                                    </td>
                                    <td className="p-4 text-center font-mono text-xs">{purchasedInvoice.hsnSacCode}</td>
                                    <td className="p-4 text-right">₹{purchasedInvoice.basePrice.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-4">
                        <div className="w-80 space-y-3 text-sm font-bold">
                            <div className="flex justify-between text-muted-foreground text-xs">
                                <span>Base Product Price:</span>
                                <span>₹{purchasedInvoice.basePrice.toFixed(2)}</span>
                            </div>
                            {purchasedInvoice.discountDetails.totalAmount > 0 && (
                                <div className="space-y-1 bg-accent/5 p-3 rounded-xl border border-accent/10 animate-in fade-in">
                                    <div className="text-[10px] font-black text-accent uppercase tracking-wider mb-1">Applied Discounts:</div>
                                    {purchasedInvoice.discountDetails.base > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Base Discount ({purchasedInvoice.discountDetails.base}%):</span>
                                            <span>-₹{(purchasedInvoice.basePrice * purchasedInvoice.discountDetails.base / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {purchasedInvoice.discountDetails.referral > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Referral Discount ({purchasedInvoice.discountDetails.referral}%):</span>
                                            <span>-₹{(purchasedInvoice.basePrice * purchasedInvoice.discountDetails.referral / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {purchasedInvoice.discountDetails.recommendation > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Fast-Mover Bonus ({purchasedInvoice.discountDetails.recommendation}%):</span>
                                            <span>-₹{(purchasedInvoice.basePrice * purchasedInvoice.discountDetails.recommendation / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {purchasedInvoice.discountDetails.special > 0 && (
                                        <div className="flex justify-between text-xs text-accent">
                                            <span>• Special Promotion ({purchasedInvoice.discountDetails.special}%):</span>
                                            <span>-₹{(purchasedInvoice.basePrice * purchasedInvoice.discountDetails.special / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-black border-t border-dashed border-accent/20 pt-1.5 mt-1.5 text-accent">
                                        <span>Total Discount:</span>
                                        <span>-₹{purchasedInvoice.discountDetails.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="border-t pt-2 mt-2 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Market Value (Bundle Total):</span>
                                    <span>₹{(purchasedInvoice.marketValue || purchasedInvoice.finalPrice).toFixed(2)}</span>
                                </div>
                                <div className="text-[10px] pl-2 border-l border-primary/20 space-y-0.5 text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>• MockArena Base Price:</span>
                                        <span>₹{purchasedInvoice.basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>• MockArena GST ({purchasedInvoice.gstRate}%):</span>
                                        <span>₹{purchasedInvoice.gstAmount.toFixed(2)}</span>
                                    </div>
                                    {purchasedInvoice.referboltValue > 0 && (
                                        <div className="flex justify-between">
                                            <span>• Bundled ReferBolt Access:</span>
                                            <span>₹{purchasedInvoice.referboltValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {purchasedInvoice.aiToolsValue > 0 && (
                                        <div className="flex justify-between">
                                            <span>• Bundled AI Learning Tools ({purchasedInvoice.freeAiMonths} M):</span>
                                            <span>₹{purchasedInvoice.aiToolsValue.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                {purchasedInvoice.totalSavings > 0 && (
                                    <div className="flex justify-between text-green-600 font-bold">
                                        <span>Total Savings:</span>
                                        <span>-₹{purchasedInvoice.totalSavings.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-dashed pt-2 text-base font-black text-primary">
                                    <span>Final Total (Paid):</span>
                                    <span>₹{purchasedInvoice.finalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 text-center text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em]">
                        Thank you for choosing Vidya EduCare!
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t print:hidden">
                    <Button variant="ghost" onClick={() => setPurchasedInvoice(null)} className="font-bold">Close</Button>
                    <Button onClick={() => downloadInvoicePDF(purchasedInvoice)} className="font-black gap-2 bg-primary text-white shadow-lg"><Printer size={16} /> Download PDF</Button>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function StorePage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <StorePageContent />
            </UserLayout>
        </ProtectedRoute>
    )
}
