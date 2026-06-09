'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, Database, Activity, Info, ExternalLink, UserCheck, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const HEAD_ADMIN_EMAIL = 'admin@vidyaeducare.com';
const HEAD_ADMIN_PASSWORD = 'password123';
const HEAD_ADMIN_NAME = 'Main Admin';
const FIXED_ADMIN_UID = '1JgG0oF1D6YREaxOCSGedIfpQZ42';

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
  const [auditStatus, setAuditStatus] = useState<{ admin: boolean; student: boolean; loading: boolean }>({ admin: false, student: false, loading: false });
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });
  const isRetrying = useRef(false);

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-12), `${new Date().toLocaleTimeString().split(' ')[0]} > ${msg}`]);
  };

  const runSystemAudit = useCallback(async () => {
    if (!db) return;
    setAuditStatus(prev => ({ ...prev, loading: true }));
    try {
        const adminDoc = await getDoc(doc(db, "admins", FIXED_ADMIN_UID));
        const studentQuery = query(collection(db, "users"), where("email", "==", TEST_USER_EMAIL));
        const studentSnap = await getDocs(studentQuery);

        setAuditStatus({
            admin: adminDoc.exists(),
            student: !studentSnap.empty,
            loading: false
        });
        logProgress(`AUDIT: Admin [${adminDoc.exists() ? 'OK' : 'MISSING'}] | Student [${!studentSnap.empty ? 'OK' : 'MISSING'}]`);
    } catch (e: any) {
        logProgress(`AUDIT ERROR: ${e.message}`);
        setAuditStatus(prev => ({ ...prev, loading: false }));
    }
  }, [db]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
      if (user) {
          setAuthStatus('success');
          logProgress(`AUTH ACTIVE: ${user.email}`);
      } else {
          setAuthStatus('idle');
      }
    });
    if (db) runSystemAudit();
    return () => unsub();
  }, [auth, db, runSystemAudit]);

  const handleAuthenticate = async (type: 'admin' | 'student') => {
    if (!auth) return;
    const email = type === 'admin' ? HEAD_ADMIN_EMAIL : TEST_USER_EMAIL;
    const password = type === 'admin' ? HEAD_ADMIN_PASSWORD : TEST_USER_PASSWORD;

    setAuthStatus('loading');
    setMapStatus('idle');
    setProgressLog([`AUTH: Requesting session for ${email}...`]);

    try {
        await signOut(auth);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            logProgress(`AUTH SUCCESS: Created new ${type} account.`);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                await signInWithEmailAndPassword(auth, email, password);
                logProgress(`AUTH SUCCESS: Identity verified for ${type}.`);
            } else throw e;
        }
        await auth.currentUser?.getIdToken(true);
        setAuthStatus('success');
        toast({ title: "Identity Verified", description: "Step 2 is now unlocked." });
    } catch (error: any) {
        logProgress(`AUTH ERROR: ${error.message}`);
        setAuthStatus('error');
        toast({ variant: 'destructive', title: "Auth Failed", description: error.message });
    }
  };

  const handleMapToDatabase = async () => {
    if (!db || !auth || !auth.currentUser) {
        toast({ variant: 'destructive', title: "Identity Required", description: "Complete Step 1 first." });
        return;
    }

    const type = auth.currentUser.email === HEAD_ADMIN_EMAIL ? 'admin' : 'student';
    const uid = auth.currentUser.uid;

    setMapStatus('loading');
    isRetrying.current = true;
    let attempt = 0;
    const maxAttempts = 5;

    const attemptSync = async (): Promise<boolean> => {
        attempt++;
        logProgress(`MAP: Attempt ${attempt}/${maxAttempts}...`);
        try {
            // Force refresh token to ensure rules engine sees latest claims
            await auth.currentUser?.getIdToken(true);
            
            const batch = writeBatch(db);
            const userDocRef = doc(db, "users", uid);
            const walletDocRef = doc(db, "wallets", uid);
            const adminDocRef = doc(db, "admins", uid);

            batch.set(userDocRef, {
                id: uid,
                name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
                email: auth.currentUser?.email,
                joinDate: new Date().toISOString(),
                status: "Active",
            }, { merge: true });

            batch.set(walletDocRef, {
                balance: type === 'admin' ? 0 : 5000,
                coins: 100,
                referralCode: type === 'admin' ? 'HEADADMIN' : `TESTSTUDENT`
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
            return true;
        } catch (e: any) {
            if (e.code === 'permission-denied' && attempt < maxAttempts) {
                logProgress("MAP: Access pending. Auto-retrying in 5s...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                return attemptSync();
            }
            throw e;
        }
    };

    try {
        await attemptSync();
        logProgress(`SUCCESS: ${type.toUpperCase()} infrastructure initialized.`);
        setMapStatus('success');
        toast({ title: "Mapping Complete!" });
        runSystemAudit();
    } catch (e: any) {
        console.error(e);
        setMapStatus('error');
        logProgress(`ERROR: ${e.message}`);
        toast({ variant: 'destructive', title: "Sync Failed", description: "Permissions still propagating. Please try Step 2 again in 30 seconds." });
    } finally {
        isRetrying.current = false;
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
            Target Instance: <span className="font-mono text-xs font-bold text-black">vidyaeducaredatabase</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                    <Search size={12}/> System Audit
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={runSystemAudit} disabled={auditStatus.loading}>
                    <RefreshCw size={12} className={auditStatus.loading ? 'animate-spin' : ''} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${auditStatus.admin ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-[9px] font-bold uppercase text-center">Admin Profile</p>
                      {auditStatus.admin ? <CheckCircle size={16} className="text-green-600"/> : <AlertCircle size={16} className="text-red-600"/>}
                  </div>
                   <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${auditStatus.student ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-[9px] font-bold uppercase text-center">Student Profile</p>
                      {auditStatus.student ? <CheckCircle size={16} className="text-green-600"/> : <AlertCircle size={16} className="text-red-600"/>}
                  </div>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2">
                  <Activity size={10}/> Sync Console
              </p>
              <div className="space-y-1 min-h-[140px] overflow-hidden">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/30 italic">Handshaking with infrastructure...</p>
                  )}
              </div>
          </div>

          <div className="space-y-4 pt-2">
             <div className="grid grid-cols-2 gap-3">
                <Button className="font-bold text-[10px] py-6" onClick={() => handleAuthenticate('admin')} disabled={authStatus === 'loading' || mapStatus === 'loading'}>
                    {authStatus === 'loading' && currentIdentity.email === HEAD_ADMIN_EMAIL ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH ADMIN"}
                </Button>
                <Button variant="outline" className="font-bold text-[10px] py-6" onClick={() => handleAuthenticate('student')} disabled={authStatus === 'loading' || mapStatus === 'loading'}>
                    {authStatus === 'loading' && currentIdentity.email === TEST_USER_EMAIL ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH STUDENT"}
                </Button>
             </div>

             <Button 
                className="w-full py-10 text-lg font-black bg-accent hover:bg-accent/90 shadow-lg" 
                onClick={handleMapToDatabase} 
                disabled={!currentIdentity.uid || mapStatus === 'loading'}
             >
                 {mapStatus === 'loading' ? (
                     <div className="flex flex-col items-center">
                         <Loader2 className="animate-spin mb-1" />
                         <span className="text-[10px]">SYNCING INFRASTRUCTURE...</span>
                     </div>
                 ) : (
                     <><Database className="mr-2 h-6 w-6" /> STEP 2: MAP TO DATABASE</>
                 )}
             </Button>

             <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3">
                <Info className="text-amber-600 w-5 h-5 shrink-0" />
                <p className="text-[9px] font-bold text-amber-800 leading-tight uppercase">
                    Step 2 will automatically retry 5 times. Stay on this page until the console shows SUCCESS.
                </p>
             </div>
          </div>

          {(auditStatus.admin && auditStatus.student) && (
              <div className="pt-2 animate-in zoom-in duration-500">
                  <Button className="w-full py-8 text-xl font-black bg-green-600 hover:bg-green-700 shadow-2xl" onClick={handleEnterDashboard}>
                      PROCEED TO DASHBOARD <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <UserCheck size={10} className="text-muted-foreground"/>
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic text-center">Identity management synced with regional rules</p>
        </CardFooter>
      </Card>
    </div>
  );
}