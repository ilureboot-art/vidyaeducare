
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Ticket, Sparkles, Zap, Loader2 } from "lucide-react";
import { initialPackages as ticketPackages, initialReferboltSubscription } from "@/lib/store-config";
import { walletData, addTransaction } from "@/lib/user-data";

export default function StorePage() {
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [isPurchasingReferbolt, setIsPurchasingReferbolt] = useState(false);
  const [balance, setBalance] = useState(walletData.balance);

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
    const pkg = ticketPackages[index];

    setTimeout(() => {
      if (walletData.balance < pkg.price) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Insufficient wallet balance.",
        });
        setIsPurchasing(null);
        return;
      }
      
      // Update central data store
      walletData.balance -= pkg.price;
      addTransaction({
        id: Date.now(),
        type: 'withdrawal',
        description: `Ticket Purchase (${pkg.tickets})`,
        amount: -pkg.price,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      });
      
      // Update local state to trigger re-render
      setBalance(walletData.balance);

      toast({
        title: "Purchase Successful!",
        description: `You've bought ${pkg.tickets} tickets. Your new balance is ₹${walletData.balance.toFixed(2)}.`,
      });

      setIsPurchasing(null);
    }, 1500);
  };

  const handleReferboltPurchase = () => {
    setIsPurchasingReferbolt(true);
    const cost = initialReferboltSubscription.price;
    setTimeout(() => {
      if (walletData.balance < cost) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Insufficient wallet balance.",
        });
        setIsPurchasingReferbolt(false);
        return;
      }

      // Update central data store
      walletData.balance -= cost;
      addTransaction({
        id: Date.now(),
        type: 'withdrawal',
        description: 'ReferBolt Subscription',
        amount: -cost,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      });
      addTransaction({
        id: Date.now() + 1,
        type: 'deposit',
        description: 'ReferBolt Ticket Bonus (4)',
        amount: 0, // No monetary value, just tickets
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      });

      // Update local state to trigger re-render
      setBalance(walletData.balance);

      toast({
          title: "Subscription Activated!",
          description: `You've received a bonus of 4 tickets! Your new balance is ₹${walletData.balance.toFixed(2)}.`,
      });
      
      setIsPurchasingReferbolt(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <ShoppingCart />
            Store
          </CardTitle>
          <CardDescription>
            Stock up on tickets or activate your ReferBolt subscription! Your balance: <span className="font-bold">₹{balance.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {ticketPackages.map((pkg, index) => (
            <Card
              key={index}
              className={`flex flex-col text-center transition-all ${pkg.bestValue ? 'border-primary border-2 shadow-primary/20 shadow-lg' : ''}`}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Ticket className="text-primary" />
                  {pkg.tickets} Tickets
                </CardTitle>
                <CardDescription>({pkg.games} Games)</CardDescription>
                {pkg.bestValue && (
                  <div className="absolute top-0 right-0 -mt-3 -mr-3">
                    <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Best Value
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center space-y-4">
                <p className="text-4xl font-bold">₹{pkg.price}</p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => handlePurchase(index)}
                  disabled={isPurchasing !== null || isPurchasingReferbolt}
                >
                  {isPurchasing === index ? <Loader2 className="animate-spin" /> : "Buy Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
            <Card
              className="flex flex-col text-center transition-all border-accent border-2 shadow-accent/20 shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Zap className="text-accent" />
                  {initialReferboltSubscription.name}
                </CardTitle>
                <CardDescription className="font-semibold">Subscription</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-center items-center space-y-2">
                 <p className="text-sm px-2">{initialReferboltSubscription.description}</p>
                <p className="text-4xl font-bold">₹{initialReferboltSubscription.price}</p>
                <Button 
                  size="lg" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleReferboltPurchase}
                  disabled={isPurchasing !== null || isPurchasingReferbolt}
                >
                  {isPurchasingReferbolt ? <Loader2 className="animate-spin"/> : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
