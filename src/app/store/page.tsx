
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Sparkles, Loader2, BookOpen } from "lucide-react";
import { walletData, addTransaction } from "@/lib/user-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const subscriptionProducts = [
    { name: "1 Year Subscription", price: 3000, months: 12, bestValue: true },
    { name: "6 Months Subscription", price: 1500, months: 6, bestValue: false },
];

export default function StorePage() {
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [balance, setBalance] = useState(walletData.balance);
  const [referralCode, setReferralCode] = useState("");

  // This effect keeps the local balance in sync with the central data store
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletData.balance !== balance) {
        setBalance(walletData.balance);
      }
    }, 500); // Check for updates periodically
    return () => clearInterval(interval);
  }, [balance]);

  const handlePurchase = (index: number) => {
    setIsPurchasing(index);
    const product = subscriptionProducts[index];
    
    // Calculate discount
    const baseDiscount = 0.05; // 5% direct discount
    const referralDiscount = referralCode ? 0.10 : 0; // 10% additional for referral
    const totalDiscount = baseDiscount + referralDiscount;
    const discountedPrice = product.price * (1 - totalDiscount);

    setTimeout(() => {
      if (walletData.balance < discountedPrice) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Insufficient wallet balance.",
        });
        setIsPurchasing(null);
        return;
      }
      
      // Update central data store
      walletData.balance -= discountedPrice;
      addTransaction({
        id: Date.now(),
        type: 'withdrawal',
        description: `${product.name} Purchase`,
        amount: -discountedPrice,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      });
      
      // Update local state to trigger re-render
      setBalance(walletData.balance);

      toast({
        title: "Purchase Successful!",
        description: `You've subscribed for ${product.months} months. Your new balance is ₹${walletData.balance.toFixed(2)}.`,
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
            Purchase a subscription to access our premium mock tests. Your balance: <span className="font-bold">₹{balance.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="max-w-sm mx-auto">
                <Label htmlFor="referralCode">IBA Referral Code (Optional)</Label>
                <Input 
                    id="referralCode" 
                    placeholder="Enter IBA code for 10% extra discount"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {subscriptionProducts.map((product, index) => {
                const baseDiscount = 0.05;
                const referralDiscount = referralCode ? 0.10 : 0;
                const totalDiscount = baseDiscount + referralDiscount;
                const discountedPrice = product.price * (1 - totalDiscount);
              
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
                        <p className="text-4xl font-bold">₹{discountedPrice.toFixed(0)}</p>
                        <p className="text-sm font-semibold text-accent">You save {(totalDiscount * 100).toFixed(0)}%!</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => handlePurchase(index)}
                      disabled={isPurchasing !== null}
                    >
                      {isPurchasing === index ? <Loader2 className="animate-spin" /> : "Buy Now"}
                    </Button>
                  </CardContent>
                </Card>
            )})}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
