
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Zap, BookOpen, GraduationCap, Percent, Loader2, IndianRupee, RefreshCcw, Landmark, ShieldCheck, FileText } from "lucide-react";
import { type StoreConfig, type MockTestPackage, type ReferboltSubscription, type ReferboltSettings, type RecommendationSettings, defaultStoreConfig } from "@/lib/store-config";
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";
import { Switch } from "@/components/ui/switch";
import { useDb, useAuth } from "@/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const db = useDb();
  const { isResolved, isAdmin } = useAuth();
  
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isLoadingStore || isLoadingAcademic;

  useEffect(() => {
    if (!db || !isResolved || !isAdmin) {
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
        if (error.code === 'permission-denied') {
            console.warn("Store config access restricted, using defaults.");
        }
        setStoreConfig(defaultStoreConfig);
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
        if (error.code === 'permission-denied') {
             console.warn("Academic config access restricted, using defaults.");
        }
        setAcademicConfig(defaultAcademicConfig);
        setIsLoadingAcademic(false);
    });

    return () => {
        unsubStore();
        unsubAcademic();
    };
  }, [db, isResolved, isAdmin]);

  const handleMockTestPackageChange = (index: number, field: keyof MockTestPackage, value: string | number | boolean) => {
    if (!storeConfig) return;
    const newPackages = [...storeConfig.mockTestPackages];
    const pkg = { ...newPackages[index] };
    if (['price', 'months', 'gstRate', 'baseDiscount', 'referralDiscount', 'specialDiscount', 'freeAiMonths'].includes(field as string)) {
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
        if (field === 'price' || field === 'gstRate') {
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
        baseDiscount: 0, referralDiscount: 0, specialDiscount: 0, grantFreeReferbolt: true, freeAiMonths: 0
    }];
    setStoreConfig(prev => prev ? ({...prev, mockTestPackages: newPackages}) : null);
  };
  
  const removeMockTestPackage = (index: number) => {
    if (!storeConfig) return;
    const newPackages = storeConfig.mockTestPackages.filter((_, i) => i !== index);
    setStoreConfig(prev => prev ? ({...prev, mockTestPackages: newPackages }) : null);
  };

  const handleDynamicListChange = (listName: keyof AcademicConfig, index: number, value: string) => {
      setAcademicConfig(prev => {
          if (!prev) return null;
          const newList = [...(prev[listName] as string[])];
          newList[index] = value;
          return { ...prev, [listName]: newList };
      });
  };

  const addToList = (listName: keyof AcademicConfig) => {
      setAcademicConfig(prev => {
          if (!prev) return null;
          const newList = [...(prev[listName] as string[]), ''];
          return { ...prev, [listName]: newList };
      });
  };
  
  const removeFromList = (listName: keyof AcademicConfig, index: number) => {
      setAcademicConfig(prev => {
          if (!prev) return null;
          const newList = (prev[listName] as string[]).filter((_, i) => i !== index);
          return { ...prev, [listName]: newList };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeConfig || !academicConfig || !db || isSaving) return;
    
    setIsSaving(true);
    const storeRef = doc(db, "configs", "store");
    const academicRef = doc(db, "configs", "academic");

    try {
        await setDoc(storeRef, storeConfig).catch(async (e) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: storeRef.path,
                operation: 'update',
                requestResourceData: storeConfig
            }));
        });

        await setDoc(academicRef, academicConfig).catch(async (e) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: academicRef.path,
                operation: 'update',
                requestResourceData: academicConfig
            }));
        });

        toast({ title: "Configurations Saved!", description: "System settings have been updated successfully." });
    } catch (err) {
        console.error("Save error:", err);
    } finally {
        setIsSaving(false);
    }
  };

  const renderDynamicList = (title: string, listName: keyof AcademicConfig) => {
      if (!academicConfig) return null;
      const list = academicConfig[listName] as string[];
      return (
          <div className="space-y-4">
              <Label className="text-lg font-semibold">{title}</Label>
              {list.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg even:bg-muted/40 transition-colors">
                      <Input value={item} onChange={(e) => handleDynamicListChange(listName, index, e.target.value)} />
                      <button type="button" className="p-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromList(listName, index)}>
                          <Trash2 className="h-4 w-4" />
                      </button>
                  </div>
              ))}
              <Button type="button" variant="outline" className="w-full mt-2" onClick={() => addToList(listName)}>
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
            <CardTitle className="flex items-center gap-2"><BookOpen /> MockArena Subscriptions</CardTitle>
            <CardDescription>Configure packages, taxes, and dynamic discount structures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {storeConfig?.mockTestPackages.map((pkg, index) => (
                <div key={index} className={`p-6 border rounded-xl space-y-6 relative transition-colors ${index % 2 === 0 ? 'bg-muted/10' : 'bg-muted/30'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="space-y-2 col-span-full lg:col-span-2">
                            <Label className="text-xs uppercase font-black text-muted-foreground">Package Name</Label>
                            <Input value={pkg.name} onChange={(e) => handleMockTestPackageChange(index, 'name', e.target.value)} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-background rounded-lg border">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-primary">GST Rate (%)</Label>
                            <Input type="number" value={pkg.gstRate} onChange={(e) => handleMockTestPackageChange(index, 'gstRate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-primary">HSN/SAC Code</Label>
                            <Input type="text" value={pkg.hsnSacCode} onChange={(e) => handleMockTestPackageChange(index, 'hsnSacCode', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-primary">Free AI Access (Months)</Label>
                            <Input type="number" value={pkg.freeAiMonths || 0} onChange={(e) => handleMockTestPackageChange(index, 'freeAiMonths', e.target.value)} />
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
              <CardTitle className="flex items-center gap-2"><ShieldCheck size={20} className="text-primary"/> Associate Commissions</CardTitle>
              <CardDescription>Adjust the standard commission rate for all IBAs.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border rounded-xl bg-primary/[0.02]">
                  <div className="space-y-2">
                      <Label htmlFor="iba-comm-rate" className="font-bold flex items-center gap-2">
                          <Percent size={14} className="text-primary"/> Standard IBA Commission (%)
                      </Label>
                      <Input 
                        id="iba-comm-rate" 
                        type="number" 
                        value={storeConfig.ibaCommissionRate} 
                        onChange={(e) => setStoreConfig(prev => prev ? ({...prev, ibaCommissionRate: Number(e.target.value)}) : null)} 
                      />
                      <p className="text-[10px] text-muted-foreground italic">Applied to the base price of every MockArena sale.</p>
                  </div>
              </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Landmark size={20} className="text-primary"/> Financial System Rules</CardTitle>
              <CardDescription>Global rules for payments, wallet management, and rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-primary/[0.02]">
                  <div className="space-y-1">
                      <Label htmlFor="auto-approve-toggle" className="font-bold flex items-center gap-2">
                          <Zap size={14} className="text-primary fill-primary"/> Auto-Approve Deposits
                      </Label>
                      <p className="text-xs text-muted-foreground max-w-md">When enabled, user payment requests are instantly credited without manual admin verification.</p>
                  </div>
                  <Switch 
                    id="auto-approve-toggle" 
                    checked={storeConfig.autoApproveDeposits} 
                    onCheckedChange={(checked) => setStoreConfig(prev => prev ? ({...prev, autoApproveDeposits: checked}) : null)} 
                  />
              </div>

              <div className="space-y-2 p-4 border rounded-xl bg-primary/[0.02]">
                  <Label htmlFor="monthly-reward-amount" className="font-bold flex items-center gap-2">
                      <IndianRupee size={14} className="text-primary"/> Monthly 1st Ranker Cash Reward (₹)
                  </Label>
                  <Input 
                    id="monthly-reward-amount" 
                    type="number" 
                    value={storeConfig.monthlyFirstRankerReward ?? 1000} 
                    onChange={(e) => setStoreConfig(prev => prev ? ({...prev, monthlyFirstRankerReward: Number(e.target.value) || 0}) : null)} 
                  />
                  <p className="text-[10px] text-muted-foreground italic">Cash prize credited to the parent's wallet of the monthly 1st ranker upon finalization.</p>
              </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle><Zap className="w-5 h-5 mr-2 inline" /> ReferBolt System</CardTitle><CardDescription>Configure ReferBolt pricing and IBA bonuses.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Base Price (₹)</Label><Input type="number" value={storeConfig.referboltSubscription.price} onChange={(e) => handleReferboltChange('price', e.target.value)} /></div>
              <div className="space-y-2"><Label>GST Rate (%)</Label><Input type="number" value={storeConfig.referboltSubscription.gstRate} onChange={(e) => handleReferboltChange('gstRate', e.target.value)} /></div>
               <div className="space-y-2"><Label>HSN/SAC Code</Label><Input type="text" value={storeConfig.referboltSubscription.hsnSacCode} onChange={(e) => handleReferboltChange('hsnSacCode', e.target.value)} /></div>
               <div className="md:col-span-2 space-y-4 pt-2">
                 <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch id="free-access" checked={storeConfig.referboltSettings.freeAccessWithMockTest} onCheckedChange={(checked) => handleReferboltSettingsChange('freeAccessWithMockTest', checked)} />
                    <Label htmlFor="free-access">Grant free ReferBolt access with any MockArena purchase</Label>
                </div>
                 <div className="space-y-2 p-4 border rounded-lg">
                    <Label className="flex items-center gap-2"><Percent size={14}/> IBA Bonus Commission (₹)</Label>
                    <Input type="number" value={storeConfig.referboltSettings.ibaBonusCommission} onChange={(e) => handleReferboltSettingsChange('ibaBonusCommission', Number(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.886L4.2 9l5.886 1.912L12 16.8l1.912-5.886L19.8 9l-5.886-1.912Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
              AI Tools Monetization & Rules
            </CardTitle>
            <CardDescription>Configure pricing and purchase rules for AI Doubt Solver & QuickNotes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ai-doubt-price">AI Doubt Solver Price (₹)</Label>
                <Input 
                  id="ai-doubt-price" 
                  type="number" 
                  value={storeConfig.aiDoubtSolverPrice || 0} 
                  onChange={(e) => setStoreConfig(prev => prev ? ({...prev, aiDoubtSolverPrice: Number(e.target.value) || 0}) : null)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-notes-price">AI Notes Generator Price (₹)</Label>
                <Input 
                  id="ai-notes-price" 
                  type="number" 
                  value={storeConfig.aiNotesGeneratorPrice || 0} 
                  onChange={(e) => setStoreConfig(prev => prev ? ({...prev, aiNotesGeneratorPrice: Number(e.target.value) || 0}) : null)} 
                />
              </div>
              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-primary/[0.02]">
                  <div className="space-y-1">
                    <Label htmlFor="grant-free-ai-toggle" className="font-bold">
                      Allow free access to both AI tools on MockArena purchase
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">When enabled, purchasing any MockArena package automatically activates access to both AI Doubt Solver & QuickNotes.</p>
                  </div>
                  <Switch 
                    id="grant-free-ai-toggle" 
                    checked={storeConfig.grantFreeAiToolsWithMockArena || false} 
                    onCheckedChange={(checked) => setStoreConfig(prev => prev ? ({...prev, grantFreeAiToolsWithMockArena: checked}) : null)} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} className="text-primary"/> Invoice & Company Settings
            </CardTitle>
            <CardDescription>Configure billing name, GSTIN, and company address printed on purchase invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="font-bold">Company Name</Label>
                <Input 
                  id="company-name" 
                  type="text" 
                  value={storeConfig.companyName || ''} 
                  onChange={(e) => setStoreConfig(prev => prev ? ({...prev, companyName: e.target.value}) : null)} 
                  placeholder="e.g. Vidya EduCare Private Ltd."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-gstin" className="font-bold">GSTIN</Label>
                <Input 
                  id="company-gstin" 
                  type="text" 
                  value={storeConfig.companyGstin || ''} 
                  onChange={(e) => setStoreConfig(prev => prev ? ({...prev, companyGstin: e.target.value}) : null)} 
                  placeholder="e.g. 27AACCV1234F1Z5"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-address" className="font-bold">Company Address</Label>
                <Input 
                  id="company-address" 
                  type="text" 
                  value={storeConfig.companyAddress || ''} 
                  onChange={(e) => setStoreConfig(prev => prev ? ({...prev, companyAddress: e.target.value}) : null)} 
                  placeholder="e.g. Mumbai, Maharashtra, India"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </>
        )}

        <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap/> Academic Configurations</CardTitle><CardDescription>Manage the options for education boards, standards, and subjects.</CardDescription></CardHeader>
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
