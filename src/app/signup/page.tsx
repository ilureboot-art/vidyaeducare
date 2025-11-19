

"use client";

import { useEffect, useState } from "react";
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
import { db as dbPromise, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, runTransaction, collection, query, where, getDocs, type Firestore } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [referralCode, setReferralCode] = useState('');
  const [referralBonus, setReferralBonus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

    useEffect(() => {
        const initDb = async () => {
          const dbInstance = await dbPromise;
          setDb(dbInstance);
        };
        initDb();
    }, []);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
    const fetchConfig = async () => {
        if (!db) return;
        const storeConfigDoc = await getDoc(doc(db, "configs", "store"));
        if(storeConfigDoc.exists()) {
            setReferralBonus(storeConfigDoc.data().referralBonus);
        }
    };
    if (db) fetchConfig();
  }, [searchParams, db]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsLoading(true);
    
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newUserRef = doc(db, "users", user.uid);
      const newWalletRef = doc(db, "wallets", user.uid);
      
      let welcomeBonus = 0;
      
      // Firestore transaction
      await runTransaction(db, async (transaction) => {
        // Create user document
        transaction.set(newUserRef, {
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            joinDate: new Date().toISOString(),
            status: "Active",
        });

        // Handle referral bonus
        if (referralCode && referralBonus) {
            const q = query(collection(db, "wallets"), where("referralCode", "==", referralCode));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                const referrerWalletRef = doc(db, "wallets", referrerDoc.id);
                const referrerWalletDoc = await transaction.get(referrerWalletRef);

                if (referrerWalletDoc.exists()) {
                    const referrerBalance = referrerWalletDoc.data().balance || 0;
                    transaction.update(referrerWalletRef, { balance: referrerBalance + referralBonus });

                    const referrerTx = { user: referrerDoc.id, amount: referralBonus, date: new Date().toISOString(), description: `Referral bonus for ${name}`, status: "Completed", type: "Referral Bonus" };
                    transaction.set(doc(collection(db, "transactions")), referrerTx);
                    
                    welcomeBonus = referralBonus;
                }
            }
        }
        
        // Create wallet for new user
        transaction.set(newWalletRef, {
            balance: welcomeBonus,
            coins: 50, // Welcome coins
            referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}`,
        });

        if (welcomeBonus > 0) {
            const newUserTx = { user: user.uid, amount: welcomeBonus, date: new Date().toISOString(), description: "Welcome bonus from referral", status: "Completed", type: "Welcome Bonus" };
            transaction.set(doc(collection(db, "transactions")), newUserTx);
        }
      });
      
      toast({
          title: "Account Created Successfully!",
          description: `Welcome to Vidya EduCare! ${referralCode && referralBonus ? `Your ₹${welcomeBonus} welcome bonus has been applied.` : ''} Redirecting you to login.`,
      });
      router.push("/login");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  if (referralBonus === null) {
      return (
          <div className="w-full max-w-md mx-auto flex items-center justify-center h-screen">
              <Loader2 className="animate-spin text-primary" size={32} />
          </div>
      );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-screen space-y-4 p-4">
       <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2 justify-center">
            <Gamepad2 className="w-10 h-10" /> Vidya EduCare
        </h1>
        <p className="text-muted-foreground">Create your account to start your journey.</p>
      </div>
      <Card className="w-full">
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
              <Input id="name" name="name" placeholder="Alex Doe" required />
              <p className="text-xs text-muted-foreground">Your full name as it appears on your documents.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                <p className="text-xs text-muted-foreground">Used for login and account recovery.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+91 12345 67890" required />
              <p className="text-xs text-muted-foreground">We'll use this for important notifications.</p>
            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type={showPassword ? "text" : "password"} required />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-6 h-7 w-7"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
                <p className="text-xs text-muted-foreground">Choose a strong password with at least 6 characters.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input 
                id="referral" 
                name="referral"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                readOnly={!!searchParams.get('ref')}
                className={!!searchParams.get('ref') ? 'bg-muted/50' : ''}
              />
              {referralCode && <p className="text-xs text-green-500">Referral code applied! You'll receive a welcome bonus.</p>}
            </div>
          </CardContent>
          <CardContent>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </CardContent>
        </form>
      </Card>
      <div className="text-center text-sm">
        Already have an account?{" "}
         <Link href="/login" passHref>
            <Button variant="link" className="px-1">Login</Button>
        </Link>
      </div>
    </div>
  );
}
