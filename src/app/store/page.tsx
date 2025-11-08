
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
import type { StoreConfig } from "@/lib/store-config";
import type { WalletData } from "@/lib/user-data";
import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function StorePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);

  const [isPurchasing, setIsPurchasing] = useState<number | string | null>(null);
  
  const [referralCode1, setReferralCode1] = useState("");
  const [referralCode2, setReferralCode2] = useState("");

  useEffect(() => {
    if (user) {
        const fetchData = async () => {
            const walletDocRef = doc(db, "wallets", user.uid);
            const walletDoc = await getDoc(walletDocRef);
            if(walletDoc.exists()) {
                setWalletData(walletDoc.data() as WalletData);
            } else {
                setWalletData({ balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0,6).toUpperCase()}`, transactions: [], adminPaymentMethods: {} as any });
            }
            
            const storeConfigDoc = await getDoc(doc(db, "configs", "store"));
            if(storeConfigDoc.exists()) {
                setStoreConfig(storeConfigDoc.data() as StoreConfig);
            }
        };
        fetchData();
    }
  }, [user]);

  if (!walletData || !storeConfig) {
    return (
        <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
    )
  }

  const handlePurchase = async (type: 'mock' | 'referbolt', index?: number) => {
    if (!user || !storeConfig || !walletData) return;

    let product, priceDetails;
    if (type === 'mock' && index !== undefined) {
        product = storeConfig.mockTestPackages[index];
        setIsPurchasing(index);
        const baseDiscount = 0.05;
        const hasReferral = referralCode1.trim() !== "";
        const referralDiscount = hasReferral ? 0.10 : 0;
        const totalDiscount = baseDiscount + referralDiscount;
        const discountedBasePrice = product.price * (1 - totalDiscount);
        const gstAmount = discountedBasePrice * (product.gstRate / 100);
        const finalPrice = discountedBasePrice + gstAmount;
        priceDetails = { finalPrice, discountedBasePrice, totalDiscount, hasReferral };
    } else {
        product = storeConfig.referboltSubscription;
        setIsPurchasing('referbolt');
        const gstAmount = product.price * (product.gstRate / 100);
        const finalPrice = product.price + gstAmount;
        priceDetails = { finalPrice, discountedBasePrice: product.price, totalDiscount: 0, hasReferral: false };
    }

    if (walletData.balance < priceDetails.finalPrice) {
        toast({ variant: "destructive", title: "Purchase Failed", description: "Insufficient wallet balance." });
        setIsPurchasing(null);
        return;
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const userWalletRef = doc(db, "wallets", user.uid);
            const userWalletDoc = await transaction.get(userWalletRef);

            if (!userWalletDoc.exists()) {
                throw new Error("User wallet does not exist!");
            }
            
            // 1. Deduct from user's balance
            const newBalance = userWalletDoc.data().balance - priceDetails.finalPrice;
            transaction.update(userWalletRef, { balance: newBalance });

            // 2. Log the user's purchase transaction
            const purchaseTx = {
                user: user.uid,
                amount: -priceDetails.finalPrice,
                date: serverTimestamp(),
                description: `Purchase: ${product.name}`,
                status: "Completed",
                type: "Purchase",
            };
            transaction.set(doc(collection(db, "transactions")), purchaseTx);

            // 3. Handle IBA commissions
            if (priceDetails.hasReferral) {
                const baseCommissionRate = 0.1765; // 17.65%
                const ibaBonusCommission = storeConfig.referboltSettings.ibaBonusCommission / 100;
                
                // Simplified check if IBA is a ReferBolt subscriber
                const iba1Ref = doc(db, "referbolt", referralCode1); // Assuming ref code is UID
                const iba1Snap = await transaction.get(iba1Ref);
                const iba1Bonus = (iba1Snap.exists() && iba1Snap.data().isSubscribed) ? ibaBonusCommission : 0;

                const totalCommissionRate = baseCommissionRate + iba1Bonus;
                let totalCommission = priceDetails.discountedBasePrice * totalCommissionRate;

                const ibasToPay = [referralCode1];
                if (referralCode2.trim()) ibasToPay.push(referralCode2.trim());

                const commissionPerIba = totalCommission / ibasToPay.length;

                for (const ibaId of ibasToPay) {
                    const ibaWalletRef = doc(db, "wallets", ibaId);
                    const ibaWalletDoc = await transaction.get(ibaWalletRef);
                    if (ibaWalletDoc.exists()) {
                        const newIbaBalance = (ibaWalletDoc.data().balance || 0) + commissionPerIba;
                        transaction.update(ibaWalletRef, { balance: newIbaBalance });

                        const commissionTx = {
                            user: ibaId,
                            amount: commissionPerIba,
                            date: serverTimestamp(),
                            description: `Commission from ${user.uid.slice(0,5)} sale`,
                            status: "Completed",
                            type: "Commission",
                        };
                        transaction.set(doc(collection(db, "transactions")), commissionTx);
                    }
                }
            }
            
            // 4. Update user subscription status
            if(type === 'mock') {
                // Add logic to update user's mock test subscription validity
            } else if (type === 'referbolt') {
                transaction.update(userWalletRef, { isReferboltSubscriber: true });
            }
        });

        const activationCode = `PROD-${String(Date.now()).slice(-5)}`;
        let successDescription = `You've purchased the ${product.name}. Your Activation Code is: ${activationCode}. Use this code in 'My Students' to add a profile.`;
        if (storeConfig.referboltSettings.freeAccessWithMockTest && type === 'mock') {
            successDescription += " As a bonus, you've been granted free access to the ReferBolt system!";
        }
        
        toast({ title: "Purchase Successful!", description: successDescription, duration: 10000 });

    } catch (e) {
        console.error("Transaction failed: ", e);
        toast({ variant: "destructive", title: "Purchase Failed", description: "An error occurred during the transaction." });
    } finally {
        setIsPurchasing(null);
    }
  };


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
                 <div className="max-w-md mx-auto space-y-4">
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
                      className={`flex flex-col text-center transition-all ${product.bestValue ? 'border-primary border-2 shadow-primary/20 shadow-lg' : ''}`}
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                          <BookOpen className="text-primary" />
                          {product.name}
                        </CardTitle>
                        {product.bestValue && (
                          <div className="absolute top-0 right-0 -mt-3 -mr-3">
                            <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              Best Value
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-center items-center space-y-4">
                         <div>
                            <p className="text-muted-foreground line-through">₹{product.price}</p>
                            <p className="text-4xl font-bold">₹{finalPrice.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">
                                (Base: ₹{discountedBasePrice.toFixed(0)} + GST @ {product.gstRate}%: ₹{gstAmount.toFixed(0)})
                            </p>
                            <p className="text-sm font-semibold text-accent">You save {(totalDiscount * 100).toFixed(0)}%!</p>
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full"
                          onClick={() => handlePurchase('mock', index)}
                          disabled={isPurchasing !== null}
                        >
                          {isPurchasing === index ? <Loader2 className="animate-spin" /> : "Buy Now"}
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
                        <Button size="lg" className="w-full" onClick={() => handlePurchase('referbolt')} disabled={isPurchasing !== null}>
                            {isPurchasing === 'referbolt' ? <Loader2 className="animate-spin"/> : "Subscribe Now"}
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

    