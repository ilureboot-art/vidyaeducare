
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap } from "lucide-react";

type TicketPackage = {
  tickets: number;
  price: number;
  bestValue: boolean;
  games: number;
};

const initialPackages: TicketPackage[] = [
  { tickets: 5, price: 10, bestValue: false, games: 10 },
  { tickets: 15, price: 25, bestValue: true, games: 30 },
  { tickets: 30, price: 45, bestValue: false, games: 60 },
];

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<TicketPackage[]>(initialPackages);
  const [referralBonus, setReferralBonus] = useState(5);
  const [referboltCost, setReferboltCost] = useState(100);
  const [referboltCommission, setReferboltCommission] = useState(50);
  const [referboltTickets, setReferboltTickets] = useState(4);

  const handlePackageChange = (index: number, field: keyof TicketPackage, value: string | number | boolean) => {
    const newPackages = [...packages];
    if (typeof newPackages[index][field] === 'number') {
        value = Number(value);
    }
    (newPackages[index] as any)[field] = value;
    setPackages(newPackages);
  };

  const addPackage = () => {
    setPackages([...packages, { tickets: 0, price: 0, bestValue: false, games: 0 }]);
  };

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings Saved!",
      description: "Store settings have been successfully updated.",
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
            <Button variant="outline" className="w-full" onClick={addPackage}>
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
                <Input id="referralBonus" type="number" value={referralBonus} onChange={(e) => setReferralBonus(Number(e.target.value))} />
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
                <Input id="referboltCost" type="number" value={referboltCost} onChange={(e) => setReferboltCost(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referboltCommission">Referral Commission (₹)</Label>
                <Input id="referboltCommission" type="number" value={referboltCommission} onChange={(e) => setReferboltCommission(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referboltTickets">Ticket Bonus (on subscribe)</Label>
                <Input id="referboltTickets" type="number" value={referboltTickets} onChange={(e) => setReferboltTickets(Number(e.target.value))} />
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
