
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

export default function StorePage() {
  const { toast } = useToast();

  const [walletData, setLocalWalletData] = useState<WalletData | null>(null);
  const [storeConfig, setLocalStoreConfig] = useState<StoreConfig | null>(null);

  const [isPurchasing, setIsPurchasing] = useState<number | string | null>(null);
  
  const [referralCode1, setReferralCode1] = useState("");
  const [referralCode2, setReferralCode2] = useState("");

  useEffect(() => {
    // In a real app, this data would be fetched from Firestore
    // setLocalWalletData(defaultWalletData);
    // setLocalStoreConfig(defaultStoreConfig);
  }, []);

  if (!walletData || !storeConfig) {
    return (
        <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
    )
  }

  const handleSubscriptionPurchase = (index: number) => {
    setIsPurchasing(index);
    const product = storeConfig.mockTestPackages[index];
    
    const baseDiscount = 0.05; 
    const hasReferral = referralCode1.trim() !== "";
    const referralDiscount = hasReferral ? 0.10 : 0; 
    const totalDiscount = baseDiscount + referralDiscount;
    const discountedBasePrice = product.price * (1 - totalDiscount);
    
    const gstAmount = discountedBasePrice * (product.gstRate / 100);
    const finalPrice = discountedBasePrice + gstAmount;

    setTimeout(() => {
      if (walletData.balance < finalPrice) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Insufficient wallet balance.",
        });
        setIsPurchasing(null);
        return;
      }
      
      // Simulate backend logic
      const newBalance = walletData.balance - finalPrice;
      const newTransaction = {
        id: Date.now(),
        type: 'withdrawal' as 'withdrawal',
        description: `${product.name} Purchase`,
        amount: -finalPrice,
        date: new Date().toISOString(),
        status: 'Completed' as 'Completed',
        user: "Alex Doe"
      };
      setLocalWalletData(prev => prev ? ({...prev, balance: newBalance, transactions: [...prev.transactions, newTransaction]}) : null);

      if (hasReferral) {
        const baseCommissionRate = 0.1765;
        const isIbaReferboltSubscriber = true; 
        const bonusCommission = isIbaReferboltSubscriber ? (storeConfig.referboltSettings.ibaBonusCommission / 100) : 0;
        const totalCommissionRate = baseCommissionRate + bonusCommission;
        const totalCommission = discountedBasePrice * totalCommissionRate;

        let commissionToastDescription = "";

        if (referralCode2.trim() !== "") {
            const commissionPerIba = totalCommission / 2;
            commissionToastDescription = `Commission of ₹${commissionPerIba.toFixed(2)} each for IBA codes ${referralCode1} and ${referralCode2} has been logged.`;
        } else {
             commissionToastDescription = `A commission of ₹${totalCommission.toFixed(2)} for IBA code ${referralCode1} has been logged for this sale.`;
        }
        
        if (bonusCommission > 0) {
            commissionToastDescription += ` (Includes a ${storeConfig.referboltSettings.ibaBonusCommission}% ReferBolt bonus!)`;
        }
        
        toast({
            title: "IBA Commission Logged (Simulation)",
            description: commissionToastDescription,
            duration: 9000
        });
      }
      
      const activationCode = `PROD-${String(Date.now()).slice(-5)}`;
      // In a real app, this would be saved to the user's account
      console.log("New activation code:", activationCode);
      
      let successDescription = `You've purchased the ${product.name}. Your Activation Code is: ${activationCode}. Use this code in 'My Students' to add a profile.`;
      
      if (storeConfig.referboltSettings.freeAccessWithMockTest) {
        successDescription += " As a bonus, you've been granted free access to the ReferBolt system!"
      }

      toast({
        title: "Purchase Successful!",
        description: successDescription,
        duration: 10000,
      });

      setIsPurchasing(null);
    }, 1500);
  };
  
  const handleReferboltPurchase = () => {
    setIsPurchasing('referbolt');
    const cost = storeConfig.referboltSubscription.price;
    const gstAmount = cost * (storeConfig.referboltSubscription.gstRate / 100);
    const finalPrice = cost + gstAmount;

    setTimeout(() => {
        if (walletData.balance < finalPrice) {
            toast({ variant: 'destructive', title: "Purchase Failed", description: "Insufficient wallet balance." });
            setIsPurchasing(null);
            return;
        }
        
        const newBalance = walletData.balance - finalPrice;
        const newTransaction = {
            id: Date.now(),
            type: 'withdrawal' as 'withdrawal',
            description: 'ReferBolt Subscription',
            amount: -finalPrice,
            date: new Date().toISOString(),
            status: 'Completed' as 'Completed',
            user: 'Alex Doe',
        };
        setLocalWalletData(prev => prev ? ({...prev, balance: newBalance, transactions: [...prev.transactions, newTransaction]}) : null);

        toast({ 
            title: "Purchase Successful!", 
            description: `You are now subscribed to ReferBolt!`,
            duration: 7000
        });
        setIsPurchasing(null);
    }, 1500);
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
                          onClick={() => handleSubscriptionPurchase(index)}
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
                        <Button size="lg" className="w-full" onClick={handleReferboltPurchase} disabled={isPurchasing !== null}>
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
