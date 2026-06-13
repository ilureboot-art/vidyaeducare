"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen, GraduationCap, Percent, Loader2, IndianRupee, RefreshCcw, Landmark } from "lucide-react";
import { type StoreConfig, type MockTestPackage, type ReferboltSubscription, type ReferboltSettings, type RecommendationSettings, defaultStoreConfig } from "@/lib/store-config";
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";
import { Switch } from "@/components/ui/switch";
import { useDb, useAuth } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Badge } from "@/components/ui/badge";

const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const db = useDb();
  const { user, isResolved } = useAuth();
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isLoadingStore || isLoadingAcademic;

  useEffect(() => {
    if (!db || !user || !isResolved) {
        if (isResolved) {
            setIsLoadingStore(false);
            setIsLoadingAcademic(false);
        }
        return;
    }

    const storeRef = doc(db, "configs", "store");
    const unsubStore = onSnapshot(storeRef, (docSnap) => {
        if (docSnap.exists()) {
            setStoreConfig(docSnap.data() as StoreConfig);
        } else {
            setStoreConfig(defaultStoreConfig);
        }
        setIsLoadingStore(false);
    }, async (error) => {
        console.error("Store config sync error:", error.code);
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: storeRef.path,
                operation: 'get',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
        setStoreConfig(prev => prev || defaultStoreConfig);
        setIsLoadingStore(false);
    });

    const academicRef = doc(db, "configs", "academic");
    const unsubAcademic = onSnapshot(academicRef, (docSnap) => {
        if (docSnap.exists()) {
            setAcademicConfig(docSnap.data() as AcademicConfig);
        } else {
            setAcademicConfig(defaultAcademicConfig);
        }
        setIsLoadingAcademic(false);
    }, async (error) => {
        console.error("Academic config sync error:", error.code);
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: academicRef.path,
                operation: 'get',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
        setAcademicConfig(prev => prev || defaultAcademicConfig);
        setIsLoadingAcademic(false);
    });

    return () => {
        unsubStore();
        unsubAcademic();
    };
  }, [db, user, isResolved]);

  const handleMockTestPackageChange = (index: number, field: keyof MockTestPackage, value: string | number | boolean) => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages];
    const pkg = { ...newPackages[index] };
    if (['price', 'months', 'gstRate', 'baseDiscount', 'referralDiscount', 'specialDiscount'].includes(field as string)) {
        value = Number(value) || 0;
    }
    (pkg as any)[field] = value;
    if (field === 'bestValue' && value === true) {
        newPackages.forEach((p, i) => { if (i !== index) p.bestValue = false; });
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
        name: 'New Subscription', price: 0, months: 1, bestValue: false, gstRate: 18, hsnSacCode: '999294',
        baseDiscount: 0, referralDiscount: 0, specialDiscount: 0, grantFreeReferbolt: true
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeConfig || !academicConfig || !db || isSaving) return;
    
    setIsSaving(true);
    const storeRef = doc(db, "configs", "store");
    const academicRef = doc(db, "configs", "academic");

    setDoc(storeRef, storeConfig)
        .then(() => {
            setDoc(academicRef, academicConfig)
                .then(() => {
                    toast({
                      title: "Configurations Saved!",
                      description: "System rules have been updated globally.",
                    });
                })
                .catch(async () => {
                    const permissionError = new FirestorePermissionError({
                        path: academicRef.path,
                        operation: 'update',
                        requestResourceData: academicConfig,
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                });
        })
        .catch(async () => {
            const permissionError = new FirestorePermissionError({
                path: storeRef.path,
                operation: 'update',
                requestResourceData: storeConfig,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSaving(false));
  };

  const renderDynamicList = (title: string, listName: keyof AcademicConfig) => {
      if (!academicConfig) return null;
      const list = academicConfig[listName] as string[];
      return (
          <div className="space-y-4">
              <Label className="text-lg font-semibold">{title}</Label>
              {list.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg even:bg-muted/40 transition-colors">
                      <Input value={item} onChange={(e) => handleDynamicListChange(setAcademicConfig, listName, index, e.target.value)} />
                      <button type="button" className="p-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromList(setAcademicConfig, listName, index)}>
                          <Trash2 className="h-4 w-4" />
                      </button>
                  </div>
              ))}
              <Button type="button" variant="outline" className="w-full mt-2" onClick={() => addToList(setAcademicConfig, listName)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add {title.slice(0, -1)}
              </Button>
          </div>
      );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Synchronizing Ruleset...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Store & Academic Settings</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2"/> Reload Rules
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen /> Mock Test Subscriptions</CardTitle>
            <CardDescription>Configure packages, taxes, and dynamic discount structures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {storeConfig?.mockTestPackages.map((pkg, index) => (
                <div key={index} className={`p-6 border rounded-xl space-y-6 relative transition-colors ${index % 2 === 0 ? 'bg-muted/10' : 'bg-muted/30'}`}>
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
                        <div className="space-y-2 col-span-full lg:col-span-2 flex flex-col justify-end gap-4 pb-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox id={`mt-best-value-${index}`} checked={pkg.bestValue} onCheckedChange={(checked) => handleMockTestPackageChange(index, 'bestValue', !!checked)} />
                                <Label htmlFor={`mt-best-value-${index}`} className="text-sm font-bold">Mark as 'Best Value'</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id={`mt-referbolt-${index}`} checked={pkg.grantFreeReferbolt} onCheckedChange={(checked) => handleMockTestPackageChange(index, 'grantFreeReferbolt', checked)} />
                                <Label htmlFor={`mt-referbolt-${index}`} className="text-sm font-bold text-primary flex items-center gap-1.5"><Zap size={14}/> Grant Free ReferBolt Access</Label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Percent size={14} className="text-accent"/> Customizable Discounts</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">Base Discount (%)</Label>
                                <Input type="number" value={pkg.baseDiscount} onChange={(e) => handleMockTestPackageChange(index, 'baseDiscount', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">IBA (Referral) Discount (%)</Label>
                                <Input type="number" value={pkg.referralDiscount} onChange={(e) => handleMockTestPackageChange(index, 'referralDiscount', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold">Special Discount (%)</Label>
                                <Input type="number" value={pkg.specialDiscount} onChange={(e) => handleMockTestPackageChange(index, 'specialDiscount', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={() => removeMockTestPackage(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
             <Button type="button" variant="outline" className="w-full py-6 border-dashed" onClick={addMockTestPackage}><PlusCircle className="mr-2 h-5 w-5" /> Add New Package Configuration</Button>
          </CardContent>
        </Card>
        
        {storeConfig && (
        <>
        <Card className="mt-6">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Landmark size={20} className="text-primary"/> Financial System Rules</CardTitle>
              <CardDescription>Global rules for payments and wallet management.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-primary/[0.02]">
                  <div className="space-y-1">
                      <Label htmlFor="auto-approve-toggle" className="font-bold flex items-center gap-2">
                          <Zap size={14} className="text-primary fill-primary"/> Auto-Approve Deposits
                      </Label>
                      <p className="text-xs text-muted-foreground max-w-md">When enabled, user payment requests are instantly credited to their wallet without manual admin verification. <span className="text-destructive font-bold">Use with caution.</span></p>
                  </div>
                  <Switch 
                    id="auto-approve-toggle" 
                    checked={storeConfig.autoApproveDeposits} 
                    onCheckedChange={(checked) => setStoreConfig(prev => prev ? ({...prev, autoApproveDeposits: checked}) : null)} 
                  />
              </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" /> Recommendation Rewards</CardTitle><CardDescription>Configure extra discounts for users who refer friends quickly.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2"><Label>Additional Discount (%)</Label><Input type="number" value={storeConfig.recommendationSettings?.additionalDiscount || 0} onChange={(e) => handleRecSettingsChange('additionalDiscount', Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Required Referrals</Label><Input type="number" value={storeConfig.recommendationSettings?.requiredCount || 0} onChange={(e) => handleRecSettingsChange('requiredCount', Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Time Window (Days)</Label><Input type="number" value={storeConfig.recommendationSettings?.windowDays || 0} onChange={(e) => handleRecSettingsChange('windowDays', Number(e.target.value))} /></div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap /> ReferBolt System</CardTitle><CardDescription>Configure the ReferBolt subscription and access rules.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2"><Label htmlFor="referboltCost">Base Price (₹)</Label><Input id="referboltCost" type="number" value={storeConfig.referboltSubscription.price} onChange={(e) => handleReferboltChange('price', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="referbolt-gst">GST Rate (%)</Label><Input id="referbolt-gst" type="number" value={storeConfig.referboltSubscription.gstRate} onChange={(e) => handleReferboltChange('gstRate', e.target.value)} /></div>
               <div className="space-y-2"><Label htmlFor="referbolt-hsn">HSN/SAC Code</Label><Input id="referbolt-hsn" type="text" value={storeConfig.referboltSubscription.hsnSacCode} onChange={(e) => handleReferboltChange('hsnSacCode', e.target.value)} /></div>
               <div className="md:col-span-2 space-y-4">
                 <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch id="free-access" checked={storeConfig.referboltSettings.freeAccessWithMockTest} onCheckedChange={(checked) => handleReferboltSettingsChange('freeAccessWithMockTest', checked)} />
                    <Label htmlFor="free-access">Grant free ReferBolt access with any mock test purchase (Global Legacy)</Label>
                </div>
                 <div className="space-y-2 p-4 border rounded-lg">
                    <Label htmlFor="iba-bonus" className="flex items-center gap-2"><Percent/> IBA Bonus Commission</Label>
                    <Input id="iba-bonus" type="number" value={storeConfig.referboltSettings.ibaBonusCommission} onChange={(e) => handleReferboltSettingsChange('ibaBonusCommission', Number(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader><CardTitle>Referral System</CardTitle><CardDescription>Configure the bonus for simple referrals.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="referralBonus">Referral &amp; Welcome Bonus (₹)</Label><Input id="referralBonus" type="number" value={storeConfig.referralBonus} onChange={(e) => setStoreConfig(prev => prev ? ({...prev, referralBonus: Number(e.target.value)}) : null)} /></div>
            </div>
          </CardContent>
        </Card>
        </>
        )}
        <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap/> Academic Configurations</CardTitle><CardDescription>Manage the options available for education boards, standards, and subjects across the app.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderDynamicList("Boards", "boards")}
                {renderDynamicList("Standards", "standards")}
                {renderDynamicList("Subjects", "subjects")}
            </CardContent>
        </Card>
        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" className="px-12 font-black shadow-xl" disabled={isSaving}>
             {isSaving ? <Loader2 className="animate-spin mr-2"/> : <IndianRupee className="mr-2 h-5 w-5"/>} SAVE ALL CONFIGURATIONS
          </Button>
        </div>
      </form>
    </div>
  );
}