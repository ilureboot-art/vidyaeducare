
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen, GraduationCap, Percent, Loader2, Users, IndianRupee } from "lucide-react";
import type { TicketPackage, ReferboltSubscription, MockTestPackage, ReferboltSettings, GameSettings, StoreConfig, RecommendationSettings } from "@/lib/store-config";
import type { AcademicConfig } from "@/lib/academic-config";
import { Switch } from "@/components/ui/switch";
import { useDb } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const db = useDb();
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);

  useEffect(() => {
    if (!db) return;
    
    const fetchConfigs = async () => {
        try {
            const storeRef = doc(db, "configs", "store");
            const storeConfigDoc = await getDoc(storeRef).catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: storeRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw e;
            });
            if(storeConfigDoc.exists()) {
                setStoreConfig(storeConfigDoc.data() as StoreConfig);
            }

            const academicRef = doc(db, "configs", "academic");
            const academicConfigDoc = await getDoc(academicRef).catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: academicRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw e;
            });
            if(academicConfigDoc.exists()){
                setAcademicConfig(academicConfigDoc.data() as AcademicConfig);
            }
        } catch (error) {
            console.error("Store Sync Error:", error);
        }
    }
    fetchConfigs();
  }, [db, toast]);

  const handleMockTestPackageChange = (index: number, field: keyof MockTestPackage, value: string | number | boolean) => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages];
    const pkg = { ...newPackages[index] };

    if (['price', 'months', 'gstRate', 'baseDiscount', 'referralDiscount', 'specialDiscount'].includes(field)) {
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

  const handleRecSettingsChange = (field: keyof RecommendationSettings, value: number) => {
      if (!storeConfig) return;
      setStoreConfig(prev => prev ? ({ ...prev, recommendationSettings: { ...prev.recommendationSettings, [field]: value } }) : null);
  };

  const addMockTestPackage = () => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages, { 
        name: 'New Subscription', 
        price: 0, 
        months: 1, 
        bestValue: false, 
        gstRate: 18, 
        hsnSacCode: '999294',
        baseDiscount: 0,
        referralDiscount: 0,
        specialDiscount: 0
    }];
    setStoreConfig(prev => prev ? ({...prev, mockTestPackages: newPackages}) : null);
  };
  
  const removeMockTestPackage = (index: number) => {
    if (!storeConfig) return;
    const newPackages = storeConfig.mockTestPackages.filter((_, i) => i !== index);
    setStoreConfig(prev => prev ? ({...prev, mockTestPackages: newPackages }) : null);
  };

  const handleDynamicListChange = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig, index: number, value: string) => {
      setter(prev => {
          if (!prev) return null;
          const newList = [...(prev[listName] as string[])];
          newList[index] = value;
          return { ...prev, [listName]: newList };
      });
  };

  const addToList = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig) => {
      setter(prev => {
          if (!prev) return null;
          const newList = [...(prev[listName] as string[]), ''];
          return { ...prev, [listName]: newList };
      });
  };
  
  const removeFromList = (setter: React.Dispatch<React.SetStateAction<AcademicConfig | null>>, listName: keyof AcademicConfig, index: number) => {
      setter(prev => {
          if (!prev) return null;
          const newList = (prev[listName] as string[]).filter((_, i) => i !== index);
          return { ...prev, [listName]: newList };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeConfig || !academicConfig || !db) return;
    
    const storeRef = doc(db, "configs", "store");
    setDoc(storeRef, storeConfig)
        .then(() => {
            const academicRef = doc(db, "configs", "academic");
            return setDoc(academicRef, academicConfig);
        })
        .then(() => {
            toast({
              title: "Settings Saved!",
              description: "Your changes have been applied across the application.",
            });
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: storeRef.path,
                operation: 'update',
                requestResourceData: { storeConfig, academicConfig },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const renderDynamicList = (
      title: string, 
      listName: keyof AcademicConfig
  ) => {
      if (!academicConfig) return null;
      const list = academicConfig[listName] as string[];
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

  if (!storeConfig || !academicConfig) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Store & Academic Settings</h1>
      <form onSubmit={handleSubmit}>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen /> Mock Test Subscriptions</CardTitle>
            <CardDescription>Configure packages, taxes, and dynamic discount structures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {storeConfig.mockTestPackages.map((pkg, index) => (
                <div key={index} className="p-6 border rounded-xl space-y-6 relative bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="space-y-2 col-span-full lg:col-span-2">
                            <Label className="text-xs uppercase font-black text-muted-foreground">Package Name</Label>
                            <Input value={pkg.name} onChange={(e) => handleMockTestPackageChange(index, 'name', e.target.value)} placeholder="e.g., 1 Year Subscription" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-black text-muted-foreground">Base Price (₹)</Label>
                            <Input type="number" value={pkg.price} onChange={(e) => handleMockTestPackageChange(index, 'price', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label className="text-xs uppercase font-black text-muted-foreground">Duration (Months)</Label>
                            <Input type="number" value={pkg.months} onChange={(e) => handleMockTestPackageChange(index, 'months', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-background rounded-lg border">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-primary">GST Rate (%)</Label>
                            <Input type="number" value={pkg.gstRate} onChange={(e) => handleMockTestPackageChange(index, 'gstRate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-primary">HSN/SAC Code</Label>
                            <Input type="text" value={pkg.hsnSacCode} onChange={(e) => handleMockTestPackageChange(index, 'hsnSacCode', e.target.value)} />
                        </div>
                        <div className="space-y-2 col-span-full lg:col-span-2 flex items-end pb-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox id={`mt-best-value-${index}`} checked={pkg.bestValue} onCheckedChange={(checked) => handleMockTestPackageChange(index, 'bestValue', !!checked)} />
                                <Label htmlFor={`mt-best-value-${index}`} className="text-sm font-bold">Mark as 'Best Value'</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Percent size={14} className="text-accent"/> Customizable Discounts
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">Base Discount (%)</Label>
                                <Input type="number" value={pkg.baseDiscount} onChange={(e) => handleMockTestPackageChange(index, 'baseDiscount', e.target.value)} />
                                <p className="text-[9px] text-muted-foreground">Applied to all users automatically.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">IBA (Referral) Discount (%)</Label>
                                <Input type="number" value={pkg.referralDiscount} onChange={(e) => handleMockTestPackageChange(index, 'referralDiscount', e.target.value)} />
                                <p className="text-[9px] text-muted-foreground">Applied only when using an IBA code.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">Special Discount (%)</Label>
                                <Input type="number" value={pkg.specialDiscount} onChange={(e) => handleMockTestPackageChange(index, 'specialDiscount', e.target.value)} />
                                <p className="text-[9px] text-muted-foreground">Seasonal or promotional extra discount.</p>
                            </div>
                        </div>
                    </div>

                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={() => removeMockTestPackage(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
             <Button type="button" variant="outline" className="w-full py-6 border-dashed" onClick={addMockTestPackage}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Package Configuration
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Recommendation Rewards</CardTitle>
            <CardDescription>Configure extra discounts for users who refer friends quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Additional Discount (%)</Label>
                <Input 
                    type="number" 
                    value={storeConfig.recommendationSettings?.additionalDiscount || 0} 
                    onChange={(e) => handleRecSettingsChange('additionalDiscount', Number(e.target.value))} 
                />
                <p className="text-[10px] text-muted-foreground">Applied on top of all other active discounts.</p>
              </div>
              <div className="space-y-2">
                <Label>Required Referrals</Label>
                <Input 
                    type="number" 
                    value={storeConfig.recommendationSettings?.requiredCount || 0} 
                    onChange={(e) => handleRecSettingsChange('requiredCount', Number(e.target.value))} 
                />
                <p className="text-[10px] text-muted-foreground">Customers needed to unlock discount.</p>
              </div>
              <div className="space-y-2">
                <Label>Time Window (Days)</Label>
                <Input 
                    type="number" 
                    value={storeConfig.recommendationSettings?.windowDays || 0} 
                    onChange={(e) => handleRecSettingsChange('windowDays', Number(e.target.value))} 
                />
                <p className="text-[10px] text-muted-foreground">Since joining or last purchase.</p>
              </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap /> ReferBolt System</CardTitle>
            <CardDescription>Configure the ReferBolt subscription and access rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referboltCost">Base Price (₹)</Label>
                <Input id="referboltCost" type="number" value={storeConfig.referboltSubscription.price} onChange={(e) => handleReferboltChange('price', e.target.value)} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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


        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" className="px-12 font-black shadow-xl">
             <IndianRupee className="mr-2 h-5 w-5"/> SAVE ALL CONFIGURATIONS
          </Button>
        </div>
      </form>
    </div>
  );
}
