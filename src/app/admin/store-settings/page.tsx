
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen, GraduationCap, Percent } from "lucide-react";
import type { TicketPackage, ReferboltSubscription, MockTestPackage, ReferboltSettings, GameSettings, StoreConfig } from "@/lib/store-config";
import {
  getStoreConfig,
  setPackages,
  setReferralBonus,
  setReferboltSubscription,
  setMockTestPackages,
  setReferboltSettings,
  setGameSettings
} from "@/lib/store-config";
import { getAcademicConfig, setBoards, setStandards, setSubjects, type AcademicConfig } from "@/lib/academic-config";
import { Switch } from "@/components/ui/switch";

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setStoreConfig(getStoreConfig());
    setAcademicConfig(getAcademicConfig());
  }, []);

  const handlePackageChange = (index: number, field: keyof TicketPackage, value: string | number | boolean) => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.packages];
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
    setStoreConfig(prev => prev ? ({ ...prev, packages: newPackages }) : null);
  };
  
  const handleMockTestPackageChange = (index: number, field: keyof MockTestPackage, value: string | number | boolean) => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages];
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
    setStoreConfig(prev => prev ? ({...prev, mockTestPackages: newPackages}) : null);
  };
  
  const handleReferboltChange = (field: keyof ReferboltSubscription, value: string | number) => {
    if (!storeConfig) return;
    setStoreConfig(prev => {
        if (!prev) return null;
        const newSub = { ...prev.referboltSubscription };
        if (field === 'price' || field === 'ticketBonus' || field === 'gstRate') {
            value = Number(value) || 0;
        }
        (newSub as any)[field] = value;
        return { ...prev, referboltSubscription: newSub };
    });
  };

  const handleReferboltSettingsChange = (field: keyof ReferboltSettings, value: boolean | number) => {
      if (!storeConfig) return;
      setStoreConfig(prev => prev ? ({ ...prev, referboltSettings: { ...prev.referboltSettings, [field]: value } }) : null);
  };

  const addPackage = () => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.packages, { tickets: 0, price: 0, bestValue: false, games: 0, gstRate: 28, hsnSacCode: '998439' }];
    setStoreConfig(prev => prev ? ({...prev, packages: newPackages}) : null);
  };

  const removePackage = (index: number) => {
    if (!storeConfig) return;
    const newPackages = storeConfig.packages.filter((_, i) => i !== index);
    setStoreConfig(prev => prev ? ({ ...prev, packages: newPackages }) : null);
  };
  
  const addMockTestPackage = () => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages, { name: 'New Subscription', price: 0, months: 1, bestValue: false, gstRate: 18, hsnSacCode: '999294' }];
    setStoreConfig(prev => prev ? ({ ...prev, mockTestPackages: newPackages }) : null);
  };
  
  const removeMockTestPackage = (index: number) => {
    if (!storeConfig) return;
    const newPackages = storeConfig.mockTestPackages.filter((_, i) => i !== index);
    setStoreConfig(prev => prev ? ({ ...prev, mockTestPackages: newPackages }) : null);
  };

  const handleDynamicListChange = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig, index: number, value: string) => {
      setter(prev => {
          if (!prev) return null;
          const newList = [...prev[listName]];
          newList[index] = value;
          return { ...prev, [listName]: newList };
      });
  };

  const addToList = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig) => {
      setter(prev => {
          if (!prev) return null;
          const newList = [...prev[listName], ''];
          return { ...prev, [listName]: newList };
      });
  };
  
  const removeFromList = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig, index: number) => {
      setter(prev => {
          if (!prev) return null;
          const newList = prev[listName].filter((_, i) => i !== index);
          return { ...prev, [listName]: newList };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeConfig || !academicConfig) return;
    
    setPackages(storeConfig.packages);
    setMockTestPackages(storeConfig.mockTestPackages);
    setReferralBonus(storeConfig.referralBonus);
    setReferboltSubscription(storeConfig.referboltSubscription);
    setReferboltSettings(storeConfig.referboltSettings);
    setBoards(academicConfig.boards);
    setStandards(academicConfig.standards);
    setSubjects(academicConfig.subjects);
    if(storeConfig.gameSettings){
        setGameSettings(storeConfig.gameSettings);
    }

    toast({
      title: "Settings Saved!",
      description: "Your changes have been applied across the application.",
    });
  };

  const renderDynamicList = (
      title: string, 
      listName: keyof AcademicConfig
  ) => {
      if (!academicConfig) return null;
      const list = academicConfig[listName];
      return (
          <div className="space-y-4">
              <Label className="text-lg font-semibold">{title}</Label>
              {list.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                      <Input value={item} onChange={(e) => handleDynamicListChange(setAcademicConfig, listName, index, e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromList(setAcademicConfig, listName, index)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={() => addToList(setAcademicConfig, listName)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add {title.slice(0, -1)}
              </Button>
          </div>
      );
  };

  if (!isClient || !storeConfig || !academicConfig) {
    return null;
  }

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
            {storeConfig.packages.map((pkg, index) => (
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
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removePackage(index)}>
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
            {storeConfig.mockTestPackages.map((pkg, index) => (
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
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeMockTestPackage(index)}>
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
            <CardDescription>Configure the ReferBolt subscription and access rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referboltCost">Base Price (₹)</Label>
                <Input id="referboltCost" type="number" value={storeConfig.referboltSubscription.price} onChange={(e) => handleReferboltChange('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referboltTickets">Ticket Bonus (on subscribe)</Label>
                <Input id="referboltTickets" type="number" value={storeConfig.referboltSubscription.ticketBonus} onChange={(e) => handleReferboltChange('ticketBonus', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referbolt-gst">GST Rate (%)</Label>
                <Input id="referbolt-gst" type="number" value={storeConfig.referboltSubscription.gstRate} onChange={(e) => handleReferboltChange('gstRate', e.target.value)} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="referbolt-hsn">HSN/SAC Code</Label>
                <Input id="referbolt-hsn" type="text" value={storeConfig.referboltSubscription.hsnSacCode} onChange={(e) => handleReferboltChange('hsnSacCode', e.target.value)} />
              </div>
               <div className="md:col-span-2 space-y-4">
                 <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch
                        id="free-access"
                        checked={storeConfig.referboltSettings.freeAccessWithMockTest}
                        onCheckedChange={(checked) => handleReferboltSettingsChange('freeAccessWithMockTest', checked)}
                    />
                    <Label htmlFor="free-access">Grant free ReferBolt access with any mock test purchase</Label>
                </div>
                 <div className="space-y-2 p-4 border rounded-lg">
                    <Label htmlFor="iba-bonus" className="flex items-center gap-2"><Percent/> IBA Bonus Commission</Label>
                    <Input 
                        id="iba-bonus" 
                        type="number" 
                        value={storeConfig.referboltSettings.ibaBonusCommission} 
                        onChange={(e) => handleReferboltSettingsChange('ibaBonusCommission', Number(e.target.value) || 0)} 
                    />
                    <p className="text-xs text-muted-foreground">
                        Additional commission (%) for IBAs who are also ReferBolt subscribers.
                    </p>
                </div>
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
                <Label htmlFor="referralBonus">Referral &amp; Welcome Bonus (₹)</Label>
                <Input id="referralBonus" type="number" value={storeConfig.referralBonus} onChange={(e) => setStoreConfig(prev => prev ? ({...prev, referralBonus: Number(e.target.value)}) : null)} />
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
                {renderDynamicList("Boards", "boards")}
                {renderDynamicList("Standards", "standards")}
                {renderDynamicList("Subjects", "subjects")}
            </CardContent>
        </Card>


        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
