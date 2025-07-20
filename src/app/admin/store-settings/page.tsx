
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen } from "lucide-react";
import type { TicketPackage, ReferboltSubscription, MockTestSubscription } from "@/lib/store-config";
import {
  storeConfig,
  setPackages,
  setReferralBonus,
  setReferboltSubscription,
  setMockTestSubscription
} from "@/lib/store-config";

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const [packages, setLocalPackages] = useState<TicketPackage[]>([]);
  const [referralBonus, setLocalReferralBonus] = useState(0);
  const [referboltSub, setLocalReferboltSub] = useState<ReferboltSubscription>({ name: '', price: 0, description: '', ticketBonus: 0, gstRate: 0, hsnSacCode: '' });
  const [mockTestSub, setLocalMockTestSub] = useState<MockTestSubscription>({ gstRate: 0, hsnSacCode: '' });

  useEffect(() => {
    setLocalPackages(storeConfig.packages);
    setLocalReferralBonus(storeConfig.referralBonus);
    setLocalReferboltSub(storeConfig.referboltSubscription);
    setLocalMockTestSub(storeConfig.mockTestSubscription);
  }, []);

  const handlePackageChange = (index: number, field: keyof TicketPackage, value: string | number | boolean) => {
    const newPackages = [...packages];
    const pkg = { ...newPackages[index] };

    if (field === 'price' || field === 'tickets' || field === 'games' || field === 'gstRate') {
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
     if (field === 'price' || field === 'ticketBonus' || field === 'gstRate') {
      value = Number(value) || 0;
    }
    (newSub as any)[field] = value;
    setLocalReferboltSub(newSub);
  };
  
  const handleMockTestSubChange = (field: keyof MockTestSubscription, value: string | number) => {
    const newSub = { ...mockTestSub };
     if (field === 'gstRate') {
      value = Number(value) || 0;
    }
    (newSub as any)[field] = value;
    setLocalMockTestSub(newSub);
  }

  const addPackage = () => {
    setLocalPackages([...packages, { tickets: 0, price: 0, bestValue: false, games: 0, gstRate: 18, hsnSacCode: '998439' }]);
  };

  const removePackage = (index: number) => {
    setLocalPackages(packages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setPackages(packages);
    setReferralBonus(referralBonus);
    setReferboltSubscription(referboltSub);
    setMockTestSubscription(mockTestSub);

    toast({
      title: "Settings Saved!",
      description: "Your changes have been applied across the application.",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store & GST Settings</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Packages</CardTitle>
            <CardDescription>Configure ticket packages and their GST rates. These are for the GuessMaster game.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`tickets-${index}`}>Tickets</Label>
                    <Input id={`tickets-${index}`} type="number" value={pkg.tickets} onChange={(e) => handlePackageChange(index, 'tickets', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${index}`}>Base Price (₹)</Label>
                    <Input id={`price-${index}`} type="number" value={pkg.price} onChange={(e) => handlePackageChange(index, 'price', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor={`gst-rate-pkg-${index}`}>GST Rate (%)</Label>
                    <Input id={`gst-rate-pkg-${index}`} type="number" value={pkg.gstRate} onChange={(e) => handlePackageChange(index, 'gstRate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`hsn-sac-pkg-${index}`}>HSN/SAC</Label>
                    <Input id={`hsn-sac-pkg-${index}`} type="text" value={pkg.hsnSacCode} onChange={(e) => handlePackageChange(index, 'hsnSacCode', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id={`best-value-${index}`} checked={pkg.bestValue} onCheckedChange={(checked) => handlePackageChange(index, 'bestValue', !!checked)} />
                  <Label htmlFor={`best-value-${index}`}>Mark as 'Best Value'</Label>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`games-${index}`}>Games Equivalent</Label>
                    <Input id={`games-${index}`} type="number" value={pkg.games} onChange={(e) => handlePackageChange(index, 'games', e.target.value)} />
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
            <CardTitle className="flex items-center gap-2"><BookOpen /> Mock Test Subscriptions</CardTitle>
            <CardDescription>Configure GST for mock test products.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mocktest-gst">GST Rate (%)</Label>
                <Input id="mocktest-gst" type="number" value={mockTestSub.gstRate} onChange={(e) => handleMockTestSubChange('gstRate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mocktest-hsn">HSN/SAC Code</Label>
                <Input id="mocktest-hsn" type="text" value={mockTestSub.hsnSacCode} onChange={(e) => handleMockTestSubChange('hsnSacCode', e.target.value)} />
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
                <Label htmlFor="referboltCost">Base Price (₹)</Label>
                <Input id="referboltCost" type="number" value={referboltSub.price} onChange={(e) => handleReferboltChange('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referboltTickets">Ticket Bonus (on subscribe)</Label>
                <Input id="referboltTickets" type="number" value={referboltSub.ticketBonus} onChange={(e) => handleReferboltChange('ticketBonus', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referbolt-gst">GST Rate (%)</Label>
                <Input id="referbolt-gst" type="number" value={referboltSub.gstRate} onChange={(e) => handleReferboltChange('gstRate', e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="referbolt-hsn">HSN/SAC Code</Label>
                <Input id="referbolt-hsn" type="text" value={referboltSub.hsnSacCode} onChange={(e) => handleReferboltChange('hsnSacCode', e.target.value)} />
              </div>
            </div>
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


        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
