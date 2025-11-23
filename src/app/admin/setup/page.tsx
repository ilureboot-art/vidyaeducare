
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, runTransaction, getDocs, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Admin, AdminRole } from '@/lib/admin-data';

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const HEAD_ADMIN_PHONE = '9999999999';

export default function SetupAdminPage() {
  const { db, auth } = useFirebase();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_exists'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!db || !auth) {
      return;
    }

    const createHeadAdmin = async () => {
      try {
        // 1. Check if a Head Admin already exists before doing anything
        const adminsCollection = collection(db, 'admins');
        const headAdminQuery = query(adminsCollection, where("role", "==", "Head Admin"));
        const headAdminSnapshot = await getDocs(headAdminQuery);

        if (!headAdminSnapshot.empty) {
          setStatus('already_exists');
          return;
        }

        // 2. Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, HEAD_ADMIN_EMAIL, HEAD_ADMIN_PASSWORD);
        const user = userCredential.user;

        // 3. Use a transaction to create all related database documents
        await runTransaction(db, async (transaction) => {
          // Define roles and status
          const role: AdminRole = "Head Admin";
          const status: Admin['status'] = "Active";
          
          // Create document in /admins collection
          const adminDocRef = doc(db, "admins", user.uid);
          transaction.set(adminDocRef, {
            name: HEAD_ADMIN_NAME,
            email: HEAD_ADMIN_EMAIL,
            phone: HEAD_ADMIN_PHONE,
            role: role,
            status: status,
            joinDate: new Date().toISOString(),
          });

          // Create document in /users collection
          const userDocRef = doc(db, "users", user.uid);
          transaction.set(userDocRef, {
            id: user.uid,
            name: HEAD_ADMIN_NAME,
            email: HEAD_ADMIN_EMAIL,
            phone: HEAD_ADMIN_PHONE,
            joinDate: new Date().toISOString(),
            status: "Active",
          });

          // Create document in /wallets collection
          const walletDocRef = doc(db, "wallets", user.uid);
          transaction.set(walletDocRef, {
            balance: 0,
            coins: 0,
            referralCode: `REF${user.uid.slice(0, 6).toUpperCase()}`
          });
        });

        setStatus('success');

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setStatus('already_exists');
        } else {
            console.error("Head Admin creation failed:", error);
            setErrorMessage(error.message);
            setStatus('error');
        }
      }
    };

    createHeadAdmin();
  }, [db, auth, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Head Admin Setup</CardTitle>
          <CardDescription>
            One-time process to create the primary administrator account.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p>Creating Head Admin account...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-semibold">Head Admin created successfully!</p>
              <div className="text-sm text-left bg-gray-100 p-3 rounded-md w-full">
                <p><strong>Email:</strong> {HEAD_ADMIN_EMAIL}</p>
                <p><strong>Password:</strong> {HEAD_ADMIN_PASSWORD}</p>
              </div>
              <p className="text-xs text-muted-foreground">You can now log in. Please change your password after logging in for security.</p>
              <Button onClick={() => router.push('/admin/login')} className="w-full">
                Go to Admin Login
              </Button>
            </>
          )}

           {status === 'already_exists' && (
            <>
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
              <p className="font-semibold">Head Admin Already Exists</p>
               <p className="text-sm text-muted-foreground">A Head Admin account with this email already exists or another Head Admin is present. No new account was created.</p>
              <Button onClick={() => router.push('/admin/login')} className="w-full">
                Go to Admin Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <p className="font-semibold">An Error Occurred</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
