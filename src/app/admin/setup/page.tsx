'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, Database, Activity, Info, ExternalLink, UserCheck, KeyRound, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';

const TEST_USER_EMAIL = 'student@vidyaeducare.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USER_NAME = 'Test User';

export default function SetupAdminPage() {
  const db = useDb();
  const auth = useAuthService();
  const router = useRouter();
  const { toast } = useToast();
  
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
    });
    return () => unsub();
  }, [auth]);

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-12), msg]);
  };

  const handleAuthenticate = async (type: 'admin' | 'student') => {
    if (!auth) return;
    const email = type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL;
    const password = type === 'admin' ? HEAD_ADMIN_PASSWORD : TEST_USER_PASSWORD;

    setAuthStatus('loading');
    setMapStatus('idle');
    setProgressLog([`AUTH: Requesting login for ${email}...`]);

    try {
        await signOut(auth);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            logProgress(`AUTH SUCCESS: New account created for ${type.toUpperCase()}.`);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                await signInWithEmailAndPassword(auth, email, password);
                logProgress(`AUTH SUCCESS: Identity linked for ${type.toUpperCase()}.`);
            } else throw e;
        }
        await auth.currentUser?.getIdToken(true);
        setAuthStatus('success');
        toast({ title: "Authenticated", description: "Identity confirmed. Proceed to step 2." });
    } catch (error: any) {
        logProgress(`AUTH ERROR: ${error.message}`);
        setAuthStatus('error');
        toast({ variant: 'destructive', title: "Auth Failed", description: error.message });
    }
  };

  const handleMapToDatabase = async () => {
    if (!db || !auth || !auth.currentUser) {
        toast({ variant: 'destructive', title: "Identity Required", description: "Please complete Step 1 first." });
        return;
    }

    const type = auth.currentUser.email === HEAD_ADMIN_EMAIL ? 'admin' : 'student';
    const uid = auth.currentUser.uid;

    setMapStatus('loading');
    setProgressLog(prev => [...prev, `MAP: Pushing metadata to vidyaeducaredatabase...`]);

    try {
        logProgress("MAP: Forcing identity handshake...");
        await auth.currentUser.getIdToken(true);

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", uid);
        const walletDocRef = doc(db, "wallets", uid);
        const adminDocRef = doc(db, "admins", uid);

        batch.set(userDocRef, {
            id: uid,
            name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
            email: auth.currentUser.email,
            joinDate: new Date().toISOString(),
            status: "Active",
        }, { merge: true });

        batch.set(walletDocRef, {
            balance: type === 'admin' ? 0 : 1000,
            coins: 100,
            referralCode: type === 'admin' ? 'HEADADMIN' : `REF${uid.slice(0, 6).toUpperCase()}`
        }, { merge: true });

        if (type === 'admin') {
            batch.set(adminDocRef, {
                name: HEAD_ADMIN_NAME, 
                email: HEAD_ADMIN_EMAIL, 
                role: "Head Admin", 
                status: "Active", 
                joinDate: new Date().toISOString(),
            }, { merge: true });
        }

        await batch.commit();
        logProgress(`SUCCESS: Infrastructure initialized for ${type.toUpperCase()}.`);
        setMapStatus('success');
        toast({ title: "Mapping Complete!" });
    } catch (e: any) {
        console.warn(`Infrastructure Error: ${e.code} - ${e.message}`);
        setMapStatus('error');
        if (e.code === 'permission-denied') {
            logProgress("MAP FAIL: Permission Denied. Rules propagation pending.");
            logProgress("TIP: Wait 5 seconds and click 'STEP 2' again.");
        } else {
            logProgress(`MAP ERROR: ${e.message}`);
        }
        toast({ variant: 'destructive', title: "Mapping Failed", description: "Permissions not yet propagated. Retry in 5 seconds." });
    }
  };

  const handleEnterDashboard = () => {
      sessionStorage.clear();
      localStorage.clear();
      router.push('/admin/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary tracking-tighter uppercase italic">
            <Shield className="w-6 h-6" /> INFRASTRUCTURE SETUP
          </CardTitle>
          <CardDescription>
            Manual Mapping Mode for <span className="font-mono text-xs font-bold text-black">vidyaeducaredatabase</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <UserCheck size={12}/> Identity Handshake
              </p>
              <div className="space-y-1">
                  <p className="text-[10px] font-mono"><span className="text-muted-foreground">Email:</span> <span className="font-bold text-primary">{currentIdentity.email || 'None (Step 1 Needed)'}</span></p>
                  <p className="text-[10px] font-mono"><span className="text-muted-foreground">Auth UID:</span> <span className="font-bold truncate block">{currentIdentity.uid || 'N/A'}</span></p>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2">
                  <Activity size={10}/> Sync Console
              </p>
              <div className="space-y-1 min-h-[150px] overflow-hidden">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/30 italic">Ready for bootstrap...</p>
                  )}
              </div>
          </div>

          <div className="space-y-4 pt-2">
             <div className="grid grid-cols-2 gap-3">
                <Button className="font-bold text-[10px] py-6" onClick={() => handleAuthenticate('admin')} disabled={authStatus === 'loading'}>
                    {authStatus === 'loading' ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH ADMIN"}
                </Button>
                <Button variant="outline" className="font-bold text-[10px] py-6" onClick={() => handleAuthenticate('student')} disabled={authStatus === 'loading'}>
                    {authStatus === 'loading' ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH STUDENT"}
                </Button>
             </div>

             <Button 
                className="w-full py-10 text-lg font-black bg-accent hover:bg-accent/90 shadow-lg" 
                onClick={handleMapToDatabase} 
                disabled={authStatus !== 'success' || mapStatus === 'loading'}
             >
                 {mapStatus === 'loading' ? (
                     <div className="flex flex-col items-center">
                         <Loader2 className="animate-spin mb-1" />
                         <span className="text-[10px]">COMMITTING TO DATABASE...</span>
                     </div>
                 ) : (
                     <><Database className="mr-2 h-6 w-6" /> STEP 2: MAP TO DATABASE</>
                 )}
             </Button>

             {mapStatus === 'error' && (
                 <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertTriangle className="text-amber-600 w-4 h-4 shrink-0" />
                    <span className="text-[9px] font-bold text-amber-700 uppercase leading-tight">Rules still loading. Click STEP 2 again in 5 seconds.</span>
                 </div>
             )}
          </div>

          {mapStatus === 'success' && (
              <div className="pt-4 animate-in zoom-in duration-500">
                  <Button className="w-full py-8 text-xl font-black bg-green-600 hover:bg-green-700 shadow-2xl" onClick={handleEnterDashboard}>
                      PROCEED TO DASHBOARD <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <Info size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic text-center">Infrastructure Status: Target Named Database Ready</p>
        </CardFooter>
      </Card>
    </div>
  );
}