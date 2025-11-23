
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Sparkles, Loader2, BookOpen, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import type { StoreConfig, MockTestPackage, ReferboltSubscription } from "@/lib/store-config";
import type { WalletData } from "@/lib/user-data";
import { useFirebase, useAuth } from "@/firebase/client-provider";
import { doc, getDoc, runTransaction, collection, serverTimestamp, updateDoc, arrayUnion, query, where, getDocs, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

function StorePageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { db, loading } = useFirebase();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  
  const [referralCode1, setReferralCode1] = useState("");
  const [referralCode2, setReferralCode2] = useState("");

  useEffect(() => {
    if (user && !loading && db) {
        const fetchData = async () => {
            const walletDocRef = doc(db, "wallets", user.uid);
            const walletDoc = await getDoc(walletDocRef);
            if(walletDoc.exists()) {
                setWalletData(walletDoc.data() as WalletData);
            }
            
            const storeConfigDoc = await getDoc(doc(db, "configs", "store"));
            if(storeConfigDoc.exists()) {
                setStoreConfig(storeConfigDoc.data() as StoreConfig);
            }
        };
        fetchData();
    }
  }, [user, db, loading]);

  const handlePurchase = async (item: MockTestPackage | ReferboltSubscription, type: 'mock' | 'referbolt') => {
    if (!user || !storeConfig || !walletData || !db) return;

    setIsPurchasing(item.name);

    let priceDetails;
    if (type === 'mock') {
        const baseDiscount = 0.05;
        const hasReferral = referralCode1.trim() !== "";
        const referralDiscount = hasReferral ? 0.10 : 0;
        const totalDiscount = baseDiscount + referralDiscount;
        const discountedBasePrice = item.price * (1 - totalDiscount);
        const gstAmount = discountedBasePrice * (item.gstRate / 100);
        const finalPrice = discountedBasePrice + gstAmount;
        priceDetails = { finalPrice, basePrice: item.price, hasReferral };
    } else {
        const gstAmount = item.price * (item.gstRate / 100);
        const finalPrice = item.price + gstAmount;
        priceDetails = { finalPrice, basePrice: item.price, hasReferral: false };
    }

    if (walletData.balance < priceDetails.finalPrice) {
        toast({ variant: "destructive", title: "Purchase Failed", description: "Insufficient wallet balance." });
        setIsPurchasing(null);
        return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const userWalletRef = doc(db, "wallets", user.uid);
            
            // 1. Deduct from user's balance
            const userWalletDoc = await transaction.get(userWalletRef);
            const currentBalance = userWalletDoc.exists() ? userWalletDoc.data().balance : 0;
            transaction.update(userWalletRef, { balance: currentBalance - priceDetails.finalPrice });

            // 2. Log the purchase transaction
            const purchaseTxRef = doc(collection(db, "transactions"));
            transaction.set(purchaseTxRef, {
                user: user.uid,
                amount: -priceDetails.finalPrice,
                date: serverTimestamp(),
                description: `Purchase: ${item.name}`,
                status: "Completed",
                type: "Purchase",
            });

            // 3. Handle IBA commissions
            if (priceDetails.hasReferral && referralCode1.trim()) {
                const ibasToPay = [referralCode1.trim()];
                if (referralCode2.trim()) ibasToPay.push(referralCode2.trim());

                const baseCommissionRate = 0.1765;
                const commissionAmount = (priceDetails.basePrice * baseCommissionRate) / ibasToPay.length;

                for (const ibaCode of ibasToPay) {
                    const q = query(collection(db, "wallets"), where("referralCode", "==", ibaCode));
                    const ibaQuerySnapshot = await getDocs(q); // Important: This read happens outside the transaction write phase
                    if (!ibaQuerySnapshot.empty) {
                        const ibaUserDoc = ibaQuerySnapshot.docs[0];
                        const ibaId = ibaUserDoc.id;
                        const ibaWalletRef = doc(db, "wallets", ibaId);
                        const ibaCommissionTxRef = doc(collection(db, "transactions"));
                        
                        const ibaWalletDoc = await transaction.get(ibaWalletRef);
                        const ibaCurrentBalance = ibaWalletDoc.exists() ? ibaWalletDoc.data().balance : 0;
                        transaction.update(ibaWalletRef, { balance: ibaCurrentBalance + commissionAmount });
                        
                        transaction.set(ibaCommissionTxRef, {
                            user: ibaId, amount: commissionAmount, date: serverTimestamp(),
                            description: `Commission from ${user.displayName || user.uid.slice(0,5)}`,
                            status: "Completed", type: "Commission",
                        });
                    }
                }
            }

            // 4. Update user status/codes
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

        toast({ title: "Purchase Successful!", description: `You have successfully purchased ${item.name}.`, duration: 7000 });
    } catch (e: any) {
        toast({ variant: "destructive", title: "Purchase Failed", description: e.message || "An error occurred." });
    } finally {
        setIsPurchasing(null);
    }
  };

  if (loading || !walletData || !storeConfig) {
    return (
        <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <ShoppingCart />
            Product Store
          </CardTitle>
          <CardDescription>
            Your balance: <span className="font-bold">₹{walletData.balance.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tests">Mock Tests</TabsTrigger>
              <TabsTrigger value="referbolt">ReferBolt</TabsTrigger>
            </TabsList>
            <TabsContent value="tests" className="space-y-6 pt-6">
                 <div className="max-w-md mx-auto space-y-4 p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-center font-semibold">Enter IBA code(s) to get a discount and support your associates.</p>
                    <div className="space-y-2">
                        <Label htmlFor="referralCode1">Referral Code 1 (For Discount & Commission)</Label>
                        <Input 
                            id="referralCode1" 
                            placeholder="Enter first IBA code"
                            value={referralCode1}
                            onChange={(e) => setReferralCode1(e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referralCode2">Referral Code 2 (For Commission Split - Optional)</Label>
                        <Input 
                            id="referralCode2" 
                            placeholder="Enter second IBA code to split commission"
                            value={referralCode2}
                            onChange={(e) => setReferralCode2(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {storeConfig.mockTestPackages.map((product, index) => {
                    const baseDiscount = 0.05;
                    const referralDiscount = referralCode1.trim() !== "" ? 0.10 : 0;
                    const totalDiscount = baseDiscount + referralDiscount;
                    const discountedBasePrice = product.price * (1 - totalDiscount);
                    const gstAmount = discountedBasePrice * (product.gstRate / 100);
                    const finalPrice = discountedBasePrice + gstAmount;

                  return (
                    <Card
                      key={index}
                      className={`flex flex-col text-center transition-all relative ${product.bestValue ? 'border-primary border-2 shadow-primary/20 shadow-lg' : ''}`}
                    >
                      {product.bestValue && (
                          <div className="absolute top-0 right-0 -mt-3 -mr-3">
                            <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              Best Value
                            </div>
                          </div>
                        )}
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                          <BookOpen className="text-primary" />
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-center items-center space-y-4">
                         <div>
                            <p className="text-muted-foreground line-through">₹{product.price}</p>
                            <p className="text-4xl font-bold">₹{finalPrice.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">
                                (Base: ₹{discountedBasePrice.toFixed(0)} + GST @ {product.gstRate}%)
                            </p>
                            <p className="text-sm font-semibold text-accent mt-1">You save {(totalDiscount * 100).toFixed(0)}%!</p>
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full"
                          onClick={() => handlePurchase(product, 'mock')}
                          disabled={isPurchasing !== null}
                        >
                          {isPurchasing === product.name ? <Loader2 className="animate-spin" /> : "Buy Now"}
                        </Button>
                      </CardContent>
                    </Card>
                )})}
                </div>
            </TabsContent>
            <TabsContent value="referbolt" className="pt-6">
                <Card className="flex flex-col text-center items-center max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2"><Zap className="text-primary"/> {storeConfig.referboltSubscription.name} Subscription</CardTitle>
                         <CardDescription>{storeConfig.referboltSubscription.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-4xl font-bold">₹{storeConfig.referboltSubscription.price + (storeConfig.referboltSubscription.price * (storeConfig.referboltSubscription.gstRate / 100))}</p>
                         <p className="text-xs text-muted-foreground">(Incl. GST)</p>
                        <Button size="lg" className="w-full" onClick={() => handlePurchase(storeConfig.referboltSubscription, 'referbolt')} disabled={isPurchasing !== null}>
                            {isPurchasing === storeConfig.referboltSubscription.name ? <Loader2 className="animate-spin"/> : "Subscribe Now"}
                        </Button>
                    </CardContent>
                     <CardContent>
                        <Button asChild variant="link">
                            <Link href="/referbolt">Learn More about ReferBolt</Link>
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
            <StorePageContent />
        </ProtectedRoute>
    )
}
