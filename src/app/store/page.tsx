"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Sparkles, Loader2, BookOpen, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import type { StoreConfig, MockTestPackage, ReferboltSubscription } from "@/lib/store-config";
import type { WalletData } from "@/lib/user-data";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, runTransaction, collection, serverTimestamp, arrayUnion, query, where, getDocs, orderBy, limit, Timestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { Badge } from "@/components/ui/badge";

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
  const [referralCode2, setReferralCode2] = useState("");

  const checkRecEligibility = useCallback(async (db: Firestore, userId: string, config: StoreConfig) => {
    if (!config.recommendationSettings) {
        setIsCheckingEligibility(false);
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return;
        const joinDate = userDoc.data().joinDate ? new Date(userDoc.data().joinDate) : new Date();

        const qT = query(
            collection(db, "transactions"), 
            where("user", "==", userId), 
            where("type", "==", "Purchase"), 
            orderBy("date", "desc"), 
            limit(1)
        );
        const tSnap = await getDocs(qT).catch(() => null);
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

        const qC = query(collection(db, "clients"), where("referrerId", "==", userId));
        const cSnap = await getDocs(qC).catch(() => null);
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
        console.error("Eligibility check error:", e);
    } finally {
        setIsCheckingEligibility(false);
    }
  }, []);

  useEffect(() => {
    if (user && db) {
        const fetchData = async () => {
            const walletDocRef = doc(db, "wallets", user.uid);
            const storeConfigRef = doc(db, "configs", "store");
            
            const [walletSnap, configSnap] = await Promise.all([
                getDoc(walletDocRef),
                getDoc(storeConfigRef)
            ]).catch(e => {
                console.error("Store init fetch error:", e);
                return [null, null];
            });

            if(walletSnap && walletSnap.exists()) {
                setWalletData(walletSnap.data() as WalletData);
            }
            
            if(configSnap && configSnap.exists()) {
                const config = configSnap.data() as StoreConfig;
                setStoreConfig(config);
                checkRecEligibility(db, user.uid, config);
            }
        };
        fetchData();
    }
  }, [user, db, checkRecEligibility]);

  const handlePurchase = async (item: MockTestPackage | ReferboltSubscription, type: 'mock' | 'referbolt') => {
    if (!user || !storeConfig || !walletData || !db) return;

    setIsPurchasing(item.name);

    let priceDetails;
    if (type === 'mock') {
        const mockItem = item as MockTestPackage;
        const baseDiscount = (mockItem.baseDiscount || 0) / 100;
        const referralDiscount = referralCode1.trim() !== "" ? (mockItem.referralDiscount || 0) / 100 : 0;
        const specialDiscount = (mockItem.specialDiscount || 0) / 100;
        const recommendationDiscount = isEligibleForRecDiscount ? (storeConfig.recommendationSettings?.additionalDiscount || 0) / 100 : 0;
        
        const totalDiscountFactor = baseDiscount + referralDiscount + specialDiscount + recommendationDiscount;
        const discountedBasePrice = item.price * (1 - totalDiscountFactor);
        const gstAmount = discountedBasePrice * (item.gstRate / 100);
        const finalPrice = discountedBasePrice + gstAmount;
        priceDetails = { finalPrice, basePrice: item.price, hasReferral: referralCode1.trim() !== "" };
    } else {
        const gstAmount = item.price * (item.gstRate / 100);
        const finalPrice = item.price + gstAmount;
        priceDetails = { finalPrice, basePrice: item.price, hasReferral: false };
    }

    if (walletData.balance < priceDetails.finalPrice) {
        toast({ variant: "destructive", title: "Purchase Failed", description: "Insufficient wallet balance. Please add funds to your wallet." });
        setIsPurchasing(null);
        return;
    }

    try {
        // PRE-RESOLUTION: Resolve referral codes to UIDs outside of transaction (queries not allowed in transactions)
        const ibaUids: string[] = [];
        if (priceDetails.hasReferral) {
            const codes = [referralCode1.trim()];
            if (referralCode2.trim()) codes.push(referralCode2.trim());
            
            for (const code of codes) {
                const q = query(collection(db, "wallets"), where("referralCode", "==", code));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    ibaUids.push(snap.docs[0].id);
                }
            }
        }

        await runTransaction(db, async (transaction) => {
            const userWalletRef = doc(db, "wallets", user.uid);
            const userWalletDoc = await transaction.get(userWalletRef);
            if (!userWalletDoc.exists()) throw new Error("User wallet record not found.");
            
            const currentBalance = userWalletDoc.data().balance;
            if (currentBalance < priceDetails.finalPrice) throw new Error("Insufficient balance.");

            transaction.update(userWalletRef, { balance: currentBalance - priceDetails.finalPrice });

            const purchaseTxRef = doc(collection(db, "transactions"));
            transaction.set(purchaseTxRef, {
                user: user.uid,
                amount: -priceDetails.finalPrice,
                date: serverTimestamp(),
                description: `Purchase: ${item.name}`,
                status: "Completed",
                type: "Purchase",
            });

            if (ibaUids.length > 0) {
                const baseCommissionRate = 0.1765;
                const commissionAmount = (priceDetails.basePrice * baseCommissionRate) / ibaUids.length;

                for (const ibaId of ibaUids) {
                    const ibaWalletRef = doc(db, "wallets", ibaId);
                    const ibaWalletDoc = await transaction.get(ibaWalletRef);
                    if (ibaWalletDoc.exists()) {
                        const ibaCurrentBalance = ibaWalletDoc.data().balance || 0;
                        transaction.update(ibaWalletRef, { balance: ibaCurrentBalance + commissionAmount });
                        
                        const ibaCommissionTxRef = doc(collection(db, "transactions"));
                        transaction.set(ibaCommissionTxRef, {
                            user: ibaId, amount: commissionAmount, date: serverTimestamp(),
                            description: `Commission from student purchase`,
                            status: "Completed", type: "Commission",
                        });
                    }
                }
            }

            if (type === 'mock') {
                const activationCode = `PROD-${Date.now().toString().slice(-6)}`;
                const activationCodesRef = doc(db, 'activationCodes', user.uid);
                transaction.set(activationCodesRef, { codes: arrayUnion(activationCode) }, { merge: true });

                if (storeConfig.referboltSettings.freeAccessWithMockTest) {
                     transaction.set(doc(db, "referbolt", user.uid), { isSubscribed: true }, { merge: true });
                }
            } else if (type === 'referbolt') {
                 transaction.set(doc(db, "referbolt", user.uid), { isSubscribed: true, referralCode: walletData.referralCode }, { merge: true });
            }
        });

        toast({ title: "Purchase Successful!", description: `You have successfully purchased ${item.name}. Activation code added to your profile.`, duration: 7000 });
        checkRecEligibility(db, user.uid, storeConfig);
    } catch (e: any) {
        console.error("Store Purchase Error:", e);
        toast({ variant: "destructive", title: "Purchase Failed", description: e.message || "An unexpected error occurred during checkout." });
    } finally {
        setIsPurchasing(null);
    }
  };

  if (!walletData || !storeConfig) {
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={40}/>
            <p className="text-muted-foreground animate-pulse text-sm font-medium">Connecting to Secure Store...</p>
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
            Your secure gateway to academic excellence. Wallet Balance: <span className="font-black text-primary">₹{walletData.balance.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="tests" className="font-bold">MOCK TEST PACKS</TabsTrigger>
              <TabsTrigger value="referbolt" className="font-bold">REFERBOLT ACCESS</TabsTrigger>
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
                                            ? `You've recommended ${recommendationCount} customers within your joining window. Congrats!` 
                                            : `Recommend ${storeConfig.recommendationSettings?.requiredCount} customers within ${storeConfig.recommendationSettings?.windowDays} days to unlock.`}
                                    </p>
                                </div>
                            </div>
                            {!isEligibleForRecDiscount && (
                                <Badge variant="secondary" className="font-mono">{recommendationCount} / {storeConfig.recommendationSettings?.requiredCount}</Badge>
                            )}
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
                    const discountedBasePrice = product.price * (1 - totalDiscount);
                    const gstAmount = discountedBasePrice * (product.gstRate / 100);
                    const finalPrice = discountedBasePrice + gstAmount;

                  return (
                    <Card
                      key={index}
                      className={`flex flex-col text-center transition-all relative ${product.bestValue ? 'border-primary border-2 shadow-primary/10 shadow-lg' : 'hover:shadow-md'}`}
                    >
                      {product.bestValue && (
                          <div className="absolute top-0 right-0 -mt-3 -mr-3">
                            <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-tighter rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                              <Sparkles className="w-3 h-3" />
                              Most Popular
                            </div>
                          </div>
                        )}
                      <CardHeader>
                        <CardTitle className="text-2xl font-black flex items-center justify-center gap-2">
                          <BookOpen className="text-primary h-5 w-5" />
                          {product.name}
                        </CardTitle>
                        <CardDescription className="font-bold text-xs uppercase">{product.months} Months Premium Access</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-center items-center space-y-6">
                         <div className="space-y-1">
                            <p className="text-muted-foreground line-through text-sm">₹{product.price}</p>
                            <p className="text-5xl font-black text-primary tracking-tighter">₹{finalPrice.toFixed(0)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">
                                (Base: ₹{discountedBasePrice.toFixed(0)} + {product.gstRate}% GST)
                            </p>
                            {totalDiscount > 0 && (
                                <Badge variant="secondary" className="mt-4 bg-accent/10 text-accent border-none font-black text-[11px] py-1 px-4 rounded-full">
                                    YOU SAVE {(totalDiscount * 100).toFixed(0)}% TODAY
                                </Badge>
                            )}
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full font-black py-7 text-lg shadow-xl"
                          onClick={() => handlePurchase(product, 'mock')}
                          disabled={isPurchasing !== null}
                        >
                          {isPurchasing === product.name ? <><Loader2 className="animate-spin mr-2" /> PROCESSING...</> : "ACTIVATE NOW"}
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
                        <CardTitle className="text-2xl font-black">{storeConfig.referboltSubscription.name} Access</CardTitle>
                         <CardDescription className="font-medium">{storeConfig.referboltSubscription.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-5xl font-black text-primary tracking-tighter">₹{(storeConfig.referboltSubscription.price + (storeConfig.referboltSubscription.price * (storeConfig.referboltSubscription.gstRate / 100))).toFixed(0)}</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inclusive of all taxes</p>
                        <Button size="lg" className="w-full font-black py-7 mt-4" onClick={() => handlePurchase(storeConfig.referboltSubscription, 'referbolt')} disabled={isPurchasing !== null}>
                            {isPurchasing === storeConfig.referboltSubscription.name ? <Loader2 className="animate-spin"/> : "START EARNING CYCLES"}
                        </Button>
                    </CardContent>
                     <CardContent>
                        <Button asChild variant="link" className="text-xs font-bold opacity-70">
                            <Link href="/referbolt">View Detailed Earning Structure →</Link>
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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