
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen, GraduationCap } from "lucide-react";
import type { TicketPackage, ReferboltSubscription, MockTestPackage } from "@/lib/store-config";
import {
  storeConfig,
  setPackages,
  setReferralBonus,
  setReferboltSubscription,
  setMockTestPackages
} from "@/lib/store-config";
import { academicConfig, setBoards, setStandards, setSubjects } from "@/lib/academic-config";

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const [packages, setLocalPackages] = useState<TicketPackage[]>([]);
  const [mockTestPackages, setLocalMockTestPackages] = useState<MockTestPackage[]>([]);
  const [referralBonus, setLocalReferralBonus] = useState(0);
  const [referboltSub, setLocalReferboltSub] = useState<ReferboltSubscription>({ name: '', price: 0, description: '', ticketBonus: 0, gstRate: 0, hsnSacCode: '' });
  
  // State for academic config
  const [boards, setLocalBoards] = useState<string[]>([]);
  const [standards, setLocalStandards] = useState<string[]>([]);
  const [subjects, setLocalSubjects] = useState<string[]>([]);

  useEffect(() => {
    setLocalPackages(storeConfig.packages);
    setLocalMockTestPackages(storeConfig.mockTestPackages);
    setLocalReferralBonus(storeConfig.referralBonus);
    setLocalReferboltSub(storeConfig.referboltSubscription);
    // Load academic configs
    setLocalBoards([...academicConfig.boards]);
    setLocalStandards([...academicConfig.standards]);
    setLocalSubjects([...academicConfig.subjects]);
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
  
  const handleMockTestPackageChange = (index: number, field: keyof MockTestPackage, value: string | number | boolean) => {
    const newPackages = [...mockTestPackages];
    const pkg = { ...newPackages[index] };

    if (field === 'price' || field === 'months' || field === 'gstRate') {
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
    setLocalMockTestPackages(newPackages);
  };
  
  const handleReferboltChange = (field: keyof ReferboltSubscription, value: string | number) => {
    const newSub = { ...referboltSub };
     if (field === 'price' || field === 'ticketBonus' || field === 'gstRate') {
      value = Number(value) || 0;
    }
    (newSub as any)[field] = value;
    setLocalReferboltSub(newSub);
  };

  const addPackage = () => {
    setLocalPackages([...packages, { tickets: 0, price: 0, bestValue: false, games: 0, gstRate: 28, hsnSacCode: '998439' }]);
  };

  const removePackage = (index: number) => {
    setLocalPackages(packages.filter((_, i) => i !== index));
  };
  
  const addMockTestPackage = () => {
    setLocalMockTestPackages([...mockTestPackages, { name: 'New Subscription', price: 0, months: 1, bestValue: false, gstRate: 18, hsnSacCode: '999294' }]);
  };
  
  const removeMockTestPackage = (index: number) => {
      setLocalMockTestPackages(mockTestPackages.filter((_,i) => i !== index));
  };

  const handleDynamicListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
      setter(prev => {
          const newList = [...prev];
          newList[index] = value;
          return newList;
      });
  };

  const addToList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter(prev => [...prev, '']);
  };
  
  const removeFromList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
      setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setPackages(packages);
    setMockTestPackages(mockTestPackages);
    setReferralBonus(referralBonus);
    setReferboltSubscription(referboltSub);
    setBoards(boards);
    setStandards(standards);
    setSubjects(subjects);

    toast({
      title: "Settings Saved!",
      description: "Your changes have been applied across the application.",
    });
  };

  const renderDynamicList = (
      title: string, 
      list: string[], 
      setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
      <div className="space-y-4">
          <Label className="text-lg font-semibold">{title}</Label>
          {list.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                  <Input value={item} onChange={(e) => handleDynamicListChange(setter, index, e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromList(setter, index)}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={() => addToList(setter)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add {title.slice(0, -1)}
          </Button>
      </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store & Academic Settings</h1>
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
            <CardDescription>Configure mock test subscription packages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mockTestPackages.map((pkg, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor={`mt-name-${index}`}>Package Name</Label>
                            <Input id={`mt-name-${index}`} type="text" value={pkg.name} onChange={(e) => handleMockTestPackageChange(index, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`mt-price-${index}`}>Base Price (₹)</Label>
                            <Input id={`mt-price-${index}`} type="number" value={pkg.price} onChange={(e) => handleMockTestPackageChange(index, 'price', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`mt-months-${index}`}>Duration (Months)</Label>
                            <Input id={`mt-months-${index}`} type="number" value={pkg.months} onChange={(e) => handleMockTestPackageChange(index, 'months', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`mt-gst-${index}`}>GST Rate (%)</Label>
                            <Input id={`mt-gst-${index}`} type="number" value={pkg.gstRate} onChange={(e) => handleMockTestPackageChange(index, 'gstRate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`mt-hsn-${index}`}>HSN/SAC Code</Label>
                            <Input id={`mt-hsn-${index}`} type="text" value={pkg.hsnSacCode} onChange={(e) => handleMockTestPackageChange(index, 'hsnSacCode', e.target.value)} />
                        </div>
                    </div>
                     <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id={`mt-best-value-${index}`} checked={pkg.bestValue} onCheckedChange={(checked) => handleMockTestPackageChange(index, 'bestValue', !!checked)} />
                        <Label htmlFor={`mt-best-value-${index}`}>Mark as 'Best Value'</Label>
                    </div>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeMockTestPackage(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Package</span>
                    </Button>
                </div>
            ))}
             <Button type="button" variant="outline" className="w-full" onClick={addMockTestPackage}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Subscription
            </Button>
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

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap/> Academic Configurations</CardTitle>
                <CardDescription>Manage the options available for education boards, standards, and subjects across the app.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderDynamicList("Boards", boards, setLocalBoards)}
                {renderDynamicList("Standards", standards, setLocalStandards)}
                {renderDynamicList("Subjects", subjects, setLocalSubjects)}
            </CardContent>
        </Card>


        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
