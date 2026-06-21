
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Loader2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, runTransaction, collection, query, where, getDocs, serverTimestamp, arrayUnion } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuthService, useDb } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const db = useDb();
  const auth = useAuthService();
  
  const [referralCode, setReferralCode] = useState('');
  const [referralBonus, setReferralBonus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Allow the page to be interactable even if config is slow
  const isFirebaseReady = !!auth && !!db;

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
    const fetchConfig = async () => {
        if (!db) return;
        const configDocRef = doc(db, "configs", "store");
        try {
            const storeConfigDoc = await getDoc(configDocRef).catch(async (e) => {
                if (e.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configDocRef.path, operation: 'get' }));
                }
                throw e;
            });
            if(storeConfigDoc.exists()) {
                setReferralBonus(storeConfigDoc.data().referralBonus);
            } else {
                setReferralBonus(5); // Default fallback
            }
        } catch (e) {
            console.warn("Config initialization issue, using default bonus.");
            setReferralBonus(5);
        }
    };
    fetchConfig();
  }, [searchParams, db]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady || !auth || !db) {
         toast({
            variant: "destructive",
            title: "System Not Ready",
            description: "The authentication service is still loading. Please try again.",
        });
        return;
    };
    setIsLoading(true);
    
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      let welcomeBonus = 0;
      let referrerId: string | null = null;
      
      const cleanRefCode = referralCode.trim().toUpperCase();
      if (cleanRefCode) {
        const walletsColRef = collection(db, "wallets");
        const q = query(walletsColRef, where("referralCode", "==", cleanRefCode));
        const querySnapshot = await getDocs(q).catch((e) => {
            console.error("Referral validation error:", e);
            throw new Error("Could not verify referral code. Please check your internet connection.");
        });
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          referrerId = referrerDoc.id;
          welcomeBonus = referralBonus || 5;
        } else if (cleanRefCode !== "") {
            toast({ variant: 'destructive', title: "Invalid Referral Code", description: "The code you entered was not found." });
            setIsLoading(false);
            return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await runTransaction(db, async (transaction) => {
        const newUserRef = doc(db, "users", user.uid);
        const newWalletRef = doc(db, "wallets", user.uid);
        const newReferboltRef = doc(db, "referbolt", user.uid);

        transaction.set(newUserRef, {
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            joinDate: new Date().toISOString(),
            status: "Active",
            referredBy: referrerId || null,
            createdAt: serverTimestamp(),
        });

        const myReferralCode = `REF${user.uid.slice(0, 6).toUpperCase()}`;

        transaction.set(newWalletRef, {
            balance: welcomeBonus,
            coins: 50, 
            referralCode: myReferralCode,
        });

        transaction.set(newReferboltRef, {
            isSubscribed: false,
            referralCode: myReferralCode,
            totalCommissions: 0,
            totalReferrals: 0,
            cycleProgress: 0,
            cycleGoal: 3,
            autoRenew: false,
            referralHistory: []
        });

        if (referrerId && (referralBonus || 5) > 0) {
            const bonus = referralBonus || 5;
            const referrerWalletRef = doc(db, "wallets", referrerId);
            const referrerWalletDoc = await transaction.get(referrerWalletRef);
            if (referrerWalletDoc.exists()) {
                const referrerBalance = referrerWalletDoc.data().balance || 0;
                transaction.update(referrerWalletRef, { balance: referrerBalance + bonus });

                const referrerTxRef = doc(collection(db, "transactions"));
                transaction.set(referrerTxRef, { 
                    user: referrerId, 
                    amount: bonus, 
                    date: serverTimestamp(), 
                    description: `Referral bonus for ${name}`, 
                    status: "Completed", 
                    type: "Referral Bonus" 
                });
                
                if (welcomeBonus > 0) {
                    const newUserTxRef = doc(collection(db, "transactions"));
                    transaction.set(newUserTxRef, { 
                        user: user.uid, 
                        amount: welcomeBonus, 
                        date: serverTimestamp(), 
                        description: "Welcome bonus from referral", 
                        status: "Completed", 
                        type: "Welcome Bonus" 
                    });
                }

                // Update ReferBolt cycle progress and history if the referrer is subscribed
                const referrerReferboltRef = doc(db, "referbolt", referrerId);
                const referrerReferboltDoc = await transaction.get(referrerReferboltRef);
                if (referrerReferboltDoc.exists()) {
                    const rData = referrerReferboltDoc.data();
                    if (rData.isSubscribed === true) {
                        const currentProgress = rData.cycleProgress || 0;
                        const goal = rData.cycleGoal || 3;
                        const newProgress = currentProgress + 1;

                        const updatedReferbolt: any = {
                            totalReferrals: (rData.totalReferrals || 0) + 1,
                            referralHistory: arrayUnion({
                                id: user.uid,
                                name: name,
                                date: new Date().toISOString(),
                                commission: bonus
                            })
                        };

                        if (newProgress >= goal) {
                            // Cycle completed! Reset progress and increment completed cycles
                            updatedReferbolt.cycleProgress = 0;
                            updatedReferbolt.cyclesCompleted = (rData.cyclesCompleted || 0) + 1;

                            // Fetch store configurations to retrieve the ReferBolt cycle bonus amount
                            const storeConfigRef = doc(db, "configs", "store");
                            const storeConfigDoc = await transaction.get(storeConfigRef);
                            const ibaBonus = storeConfigDoc.exists()
                                ? (storeConfigDoc.data().referboltSettings?.ibaBonusCommission || 5)
                                : 5;

                            updatedReferbolt.totalCommissions = (rData.totalCommissions || 0) + ibaBonus;

                            // Update wallet balance with the cycle bonus (referrerBalance already includes the signup bonus)
                            transaction.update(referrerWalletRef, { balance: referrerBalance + bonus + ibaBonus });

                            // Create transaction record for the ReferBolt Success Cycle Bonus
                            const cycleTxRef = doc(collection(db, "transactions"));
                            transaction.set(cycleTxRef, {
                                user: referrerId,
                                amount: ibaBonus,
                                date: serverTimestamp(),
                                description: "ReferBolt Success Cycle Bonus",
                                status: "Completed",
                                type: "Commission"
                            });
                        } else {
                            updatedReferbolt.cycleProgress = newProgress;
                        }

                        transaction.update(referrerReferboltRef, updatedReferbolt);
                    }
                }
            }
        }
      });
      
      toast({
          title: "Account Created Successfully!",
          description: `Welcome to Vidya EduCare! ${welcomeBonus > 0 ? `Your ₹${welcomeBonus} bonus has been applied.` : ''} Redirecting...`,
      });
      router.push("/login");

    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
       <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center tracking-tighter">
            <Gamepad2 className="w-10 h-10" /> VIDYA EDUCARE
        </h1>
        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Start Your Academic Journey</p>
      </div>
      <Card className="w-full border-primary/10 shadow-xl">
        <form onSubmit={handleSignup}>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Alex Doe" required disabled={isLoading} />
              <p className="text-[10px] text-muted-foreground">Your full name as it appears on your documents.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+91 12345 67890" required disabled={isLoading} />
            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} required disabled={isLoading} />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowPassword(prev => !prev)}
                        disabled={isLoading}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">At least 6 characters.</p>
            </div>
            <Separator />
            <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/10">
              <Label htmlFor="referral" className="text-primary font-bold">Referral Code (Optional)</Label>
              <Input 
                id="referral" 
                name="referral"
                placeholder="ENTER CODE"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                readOnly={!!searchParams.get('ref')}
                className={!!searchParams.get('ref') ? 'bg-muted/50 border-primary' : 'bg-background'}
                disabled={isLoading}
              />
              {referralCode && <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Bonus will be applied after signup</p>}
            </div>
          </CardContent>
          <CardContent>
            <Button className="w-full py-6 text-lg font-black shadow-lg" type="submit" disabled={isLoading || !isFirebaseReady}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> CREATING ACCOUNT...</> : 'JOIN VIDYA EDUCARE'}
            </Button>
          </CardContent>
        </form>
      </Card>
      <div className="text-center text-sm font-medium">
        Already have an account?{" "}
         <Link href="/login" className="text-primary font-bold hover:underline">Login here</Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-10 h-10 animate-spin text-primary"/>
        </div>
    }>
        <SignupForm />
    </Suspense>
  );
}
