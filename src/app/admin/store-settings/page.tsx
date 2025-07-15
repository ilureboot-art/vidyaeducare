
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap } from "lucide-react";

// Mock data for ticket packages
const initialPackages = [
  { tickets: 5, price: 10, bestValue: false, games: 10 },
  { tickets: 15, price: 25, bestValue: true, games: 30 },
  { tickets: 30, price: 45, bestValue: false, games: 60 },
];

export default function AdminStoreSettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved!",
            description: "Store settings have been successfully updated.",
        });
    }

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
                {initialPackages.map((pkg, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`tickets-${index}`}>Number of Tickets</Label>
                                <Input id={`tickets-${index}`} type="number" defaultValue={pkg.tickets} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`price-${index}`}>Price (₹)</Label>
                                <Input id={`price-${index}`} type="number" defaultValue={pkg.price} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`games-${index}`}>Games Equivalent</Label>
                                <Input id={`games-${index}`} type="number" defaultValue={pkg.games} />
                            </div>
                        </div>
                         <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id={`best-value-${index}`} defaultChecked={pkg.bestValue} />
                            <Label htmlFor={`best-value-${index}`}>Mark as 'Best Value'</Label>
                        </div>
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Package</span>
                        </Button>
                    </div>
                ))}
                 <Button variant="outline" className="w-full">
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
                        <Input id="referralBonus" type="number" defaultValue="5" />
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
                        <Input id="referboltCost" type="number" defaultValue="100" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referboltCommission">Referral Commission (₹)</Label>
                        <Input id="referboltCommission" type="number" defaultValue="50" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referboltTickets">Ticket Bonus (on subscribe)</Label>
                        <Input id="referboltTickets" type="number" defaultValue="4" />
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
