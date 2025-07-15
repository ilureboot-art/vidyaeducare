
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Ticket, Sparkles, Zap } from "lucide-react";
import { initialPackages as ticketPackages, initialReferboltSubscription } from "@/lib/store-config";

export default function StorePage() {
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
  const [isPurchasingReferbolt, setIsPurchasingReferbolt] = useState(false);

  const handlePurchase = (index: number) => {
    setIsPurchasing(index);
    // Simulate a purchase delay
    setTimeout(() => {
      toast({
        title: "Purchase Successful!",
        description: `You've bought ${ticketPackages[index].tickets} tickets. Happy guessing!`,
      });
      setIsPurchasing(null);
    }, 1500);
  };

  const handleReferboltPurchase = () => {
    setIsPurchasingReferbolt(true);
    setTimeout(() => {
        toast({
            title: "Subscription Activated!",
            description: "You've received a bonus of 4 tickets (8 games) worth ₹100!",
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
            Stock up on tickets or activate your ReferBolt subscription!
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
                  {isPurchasing === index ? "Processing..." : "Buy Now"}
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
                  {isPurchasingReferbolt ? "Processing..." : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
