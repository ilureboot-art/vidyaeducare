
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap } from "lucide-react";
import type { TicketPackage, ReferboltSubscription } from "@/lib/store-config";
import {
  storeConfig,
  setPackages,
  setReferralBonus,
  setReferboltSubscription
} from "@/lib/store-config";

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const [packages, setLocalPackages] = useState<TicketPackage[]>([]);
  const [referralBonus, setLocalReferralBonus] = useState(0);
  const [referboltSub, setLocalReferboltSub] = useState<ReferboltSubscription>({ name: '', price: 0, description: '', ticketBonus: 0 });

  useEffect(() => {
    setLocalPackages(storeConfig.packages);
    setLocalReferralBonus(storeConfig.referralBonus);
    setLocalReferboltSub(storeConfig.referboltSubscription);
  }, []);

  const handlePackageChange = (index: number, field: keyof TicketPackage, value: string | number | boolean) => {
    const newPackages = [...packages];
    const pkg = { ...newPackages[index] };

    if (typeof pkg[field] === 'number') {
      value = Number(value) || 0;
    }
    
    (pkg as any)[field] = value;

    if (field === 'bestValue' && value === true) {
        newPackages.forEach((p, i) => {
            if (i !== index) {
                p.bestValue = false;
            }
        });
    }

    newPackages[index] = pkg;
    setLocalPackages(newPackages);
  };
  
  const handleReferboltChange = (field: keyof ReferboltSubscription, value: string | number) => {
    const newSub = { ...referboltSub };
     if (typeof newSub[field] === 'number') {
      value = Number(value) || 0;
    }
    (newSub as any)[field] = value;
    setLocalReferboltSub(newSub);
  };

  const addPackage = () => {
    setLocalPackages([...packages, { tickets: 0, price: 0, bestValue: false, games: 0 }]);
  };

  const removePackage = (index: number) => {
    setLocalPackages(packages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call the setter functions to update the shared configuration
    setPackages(packages);
    setReferralBonus(referralBonus);
    setReferboltSubscription(referboltSub);

    toast({
      title: "Settings Saved!",
      description: "Your changes have been applied across the application.",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store Settings</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Packages</CardTitle>
            <CardDescription>Configure the ticket packages available for players to purchase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`tickets-${index}`}>Number of Tickets</Label>
                    <Input id={`tickets-${index}`} type="number" value={pkg.tickets} onChange={(e) => handlePackageChange(index, 'tickets', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${index}`}>Price (₹)</Label>
                    <Input id={`price-${index}`} type="number" value={pkg.price} onChange={(e) => handlePackageChange(index, 'price', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`games-${index}`}>Games Equivalent</Label>
                    <Input id={`games-${index}`} type="number" value={pkg.games} onChange={(e) => handlePackageChange(index, 'games', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id={`best-value-${index}`} checked={pkg.bestValue} onCheckedChange={(checked) => handlePackageChange(index, 'bestValue', !!checked)} />
                  <Label htmlFor={`best-value-${index}`}>Mark as 'Best Value'</Label>
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removePackage(index)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove Package</span>
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={addPackage}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Package
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Referral System</CardTitle>
            <CardDescription>Configure the bonus for simple referrals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referralBonus">Referral & Welcome Bonus (₹)</Label>
                <Input id="referralBonus" type="number" value={referralBonus} onChange={(e) => setLocalReferralBonus(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">This amount is given to both the referrer and the new user.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap /> ReferBolt System</CardTitle>
            <CardDescription>Configure the ReferBolt subscription and commissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referboltCost">Subscription Cost (₹)</Label>
                <Input id="referboltCost" type="number" value={referboltSub.price} onChange={(e) => handleReferboltChange('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referboltTickets">Ticket Bonus (on subscribe)</Label>
                <Input id="referboltTickets" type="number" value={referboltSub.ticketBonus} onChange={(e) => handleReferboltChange('ticketBonus', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
