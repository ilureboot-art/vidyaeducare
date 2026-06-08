
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, runTransaction, getDocs, collection, query, where, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const HEAD_ADMIN_PHONE = '9999999999';

const TEST_USER_EMAIL = 'student@vidyaeducare.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USER_NAME = 'Test User';

export default function SetupAdminPage() {
  const db = useDb();
  const auth = useAuthService();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Helper to ensure records exist even if Auth creation is bypassed
  const ensureRecords = async (uid: string, type: 'admin' | 'student') => {
    if (!db) return;
    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists()) {
        transaction.set(userDocRef, {
          id: uid,
          name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
          email: type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL,
          phone: type === 'admin' ? HEAD_ADMIN_PHONE : "0000000000",
          joinDate: new Date().toISOString(),
          status: "Active",
        });
      }

      const walletDocRef = doc(db, "wallets", uid);
      const walletSnap = await transaction.get(walletDocRef);
      if (!walletSnap.exists()) {
        transaction.set(walletDocRef, {
          balance: type === 'admin' ? 0 : 100,
          coins: 50,
          referralCode: type === 'admin' ? 'HEADADMIN' : `REF${uid.slice(0, 6).toUpperCase()}`
        });
      }

      if (type === 'admin') {
        const adminDocRef = doc(db, "admins", uid);
        const adminSnap = await transaction.get(adminDocRef);
        if (!adminSnap.exists()) {
          transaction.set(adminDocRef, {
            name: HEAD_ADMIN_NAME, email: HEAD_ADMIN_EMAIL, phone: HEAD_ADMIN_PHONE,
            role: "Head Admin", status: "Active", joinDate: new Date().toISOString(),
          });
        }
      }
    });
  };

  const createHeadAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                // Find existing user (This is tricky on client side without Admin SDK, we rely on standard query if records exist)
                const q = query(collection(db, "users"), where("email", "==", HEAD_ADMIN_EMAIL));
                const snap = await getDocs(q);
                if (!snap.empty) uid = snap.docs[0].id;
                else throw new Error("User exists in Auth but no record found in Database. Please use a different email or delete user in Firebase Console.");
            } else throw e;
        }

        await ensureRecords(uid, 'admin');
        
        sessionStorage.clear();
        setStatus('success');
        toast({ title: "Head Admin Synchronized", description: "Administrative workspace is now active." });

    } catch (error: any) {
        console.error("Head Admin creation failed:", error);
        setErrorMessage(error.message);
        setStatus('error');
    }
  };

  const createTestUser = async () => {
    if (!db || !auth) return;
    setIsCreatingUser(true);
    
    try {
        let uid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
            uid = userCredential.user.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                const q = query(collection(db, "users"), where("email", "==", TEST_USER_EMAIL));
                const snap = await getDocs(q);
                if (!snap.empty) uid = snap.docs[0].id;
                else throw new Error("Student exists in Auth but no record found in Database.");
            } else throw e;
        }

        await ensureRecords(uid, 'student');
        toast({ title: "Test User Ready", description: "Student profile is fully synchronized." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setIsCreatingUser(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary">
            <Shield className="w-6 h-6" /> SYSTEM INITIALIZATION
          </CardTitle>
          <CardDescription>
            Configure the master administrative account and test profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Master Administrator</h3>
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-black text-sm">HEAD ADMIN CONFIGURED</span>
                    </div>
                    <div className="text-xs space-y-1 font-medium">
                        <p><strong>Login Email:</strong> {HEAD_ADMIN_EMAIL}</p>
                        <p><strong>Initial Pass:</strong> {HEAD_ADMIN_PASSWORD}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-bold" onClick={() => router.push('/admin/login')}>Proceed to Admin Portal</Button>
                </div>
            ) : status === 'error' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">Initialization Failed</span>
                    </div>
                    <p className="text-xs mt-2 opacity-80">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="w-full mt-4 font-bold" onClick={() => setStatus('idle')}>Retry Configuration</Button>
                </div>
            ) : (
                <Button className="w-full py-6 text-lg font-black shadow-lg" onClick={createHeadAdmin} disabled={status === 'loading'}>
                    {status === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2 h-5 w-5" />}
                    CONFIGURE HEAD ADMIN
                </Button>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Standard User (Testing)</h3>
            <div className="bg-muted p-4 rounded-xl space-y-3">
                <p className="text-[10px] text-muted-foreground font-medium">Create or sync the student profile to verify academic flows and AI tools.</p>
                <div className="text-xs font-mono bg-background p-3 rounded-lg border border-dashed">
                    Email: {TEST_USER_EMAIL}<br/>
                    Pass: {TEST_USER_PASSWORD}
                </div>
                <Button variant="secondary" className="w-full font-bold" onClick={createTestUser} disabled={isCreatingUser}>
                    {isCreatingUser ? <Loader2 className="animate-spin mr-2" /> : <User className="mr-2 h-4 w-4" />}
                    SYNC TEST USER
                </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center">
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Vidya EduCare Security Infrastructure</p>
        </CardFooter>
      </Card>
    </div>
  );
}
