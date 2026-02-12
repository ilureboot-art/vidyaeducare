
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, runTransaction, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const HEAD_ADMIN_PHONE = '9999999999';

const TEST_STUDENT_EMAIL = 'student@vidyaeducare.com';
const TEST_STUDENT_PASSWORD = 'password123';
const TEST_STUDENT_NAME = 'Test Player';

export default function SetupAdminPage() {
  const db = useDb();
  const auth = useAuthService();
  const router = useRouter();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const createHeadAdmin = async () => {
    if (!db || !auth) return;
    setStatus('loading');
    
    try {
        const adminsCollection = collection(db, 'admins');
        const headAdminQuery = query(adminsCollection, where("role", "==", "Head Admin"));
        const headAdminSnapshot = await getDocs(headAdminQuery);

        if (!headAdminSnapshot.empty) {
          toast({ title: "Already Configured", description: "A Head Admin account already exists." });
          setStatus('success');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
        const user = userCredential.user;

        await runTransaction(db, async (transaction) => {
          const adminDocRef = doc(db, "admins", user.uid);
          transaction.set(adminDocRef, {
            name: HEAD_ADMIN_NAME, email: HEAD_ADMIN_EMAIL, phone: HEAD_ADMIN_PHONE,
            role: "Head Admin", status: "Active", joinDate: new Date().toISOString(),
          });

          const userDocRef = doc(db, "users", user.uid);
          transaction.set(userDocRef, {
            id: user.uid, name: HEAD_ADMIN_NAME, email: HEAD_ADMIN_EMAIL, phone: HEAD_ADMIN_PHONE,
            joinDate: new Date().toISOString(), status: "Active",
          });

          const walletDocRef = doc(db, "wallets", user.uid);
          transaction.set(walletDocRef, {
            balance: 0, coins: 0, referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}`
          });
        });

        setStatus('success');
        toast({ title: "Head Admin Created", description: "You can now log in with the admin credentials." });

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setStatus('success');
            toast({ title: "Already Exists", description: "The admin email is already registered." });
        } else {
            console.error("Head Admin creation failed:", error);
            setErrorMessage(error.message);
            setStatus('error');
        }
    }
  };

  const createTestStudent = async () => {
    if (!db || !auth) return;
    setIsCreatingStudent(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            id: user.uid, name: TEST_STUDENT_NAME, email: TEST_STUDENT_EMAIL, phone: "0000000000",
            joinDate: new Date().toISOString(), status: "Active",
        });

        await setDoc(doc(db, "wallets", user.uid), {
            balance: 100, coins: 50, referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}`
        });

        toast({ title: "Student Created!", description: "Test player account is ready for use." });
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({ title: "Already Exists", description: "Test student account is already created." });
        } else {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
    } finally {
        setIsCreatingStudent(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Shield className="text-primary" /> System Setup
          </CardTitle>
          <CardDescription>
            Configure initial accounts for testing and administration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Admin Portal</h3>
            {status === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Head Admin Configured</span>
                    </div>
                    <div className="text-xs space-y-1">
                        <p><strong>Email:</strong> {HEAD_ADMIN_EMAIL}</p>
                        <p><strong>Password:</strong> {HEAD_ADMIN_PASSWORD}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/admin/login')}>Go to Admin Login</Button>
                </div>
            ) : status === 'error' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">Setup Error</span>
                    </div>
                    <p className="text-xs mt-1">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setStatus('idle')}>Try Again</Button>
                </div>
            ) : (
                <Button className="w-full" onClick={createHeadAdmin} disabled={status === 'loading'}>
                    {status === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Shield className="mr-2" />}
                    Configure Head Admin
                </Button>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Player Portal</h3>
            <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-xs text-muted-foreground">Create a test player account to verify student features, mock tests, and the wallet system.</p>
                <div className="text-xs font-mono bg-background p-2 rounded border">
                    Email: {TEST_STUDENT_EMAIL}<br/>
                    Pass: {TEST_STUDENT_PASSWORD}
                </div>
                <Button variant="secondary" className="w-full" onClick={createTestStudent} disabled={isCreatingStudent}>
                    {isCreatingStudent ? <Loader2 className="animate-spin mr-2" /> : <User className="mr-2" />}
                    Create Test Student
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
