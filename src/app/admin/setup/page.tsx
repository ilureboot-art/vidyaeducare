'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDb, useAuthService } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, writeBatch, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Shield, Database, Activity, Info, ExternalLink, UserCheck, Search, AlertCircle, RefreshCw, AlertTriangle, Zap, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { defaultAcademicConfig } from "@/lib/academic-config";
import { defaultStoreConfig } from "@/lib/store-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [auditStatus, setAuditStatus] = useState<{ admin: boolean; student: boolean; config: boolean; loading: boolean }>({ admin: false, student: false, config: false, loading: false });
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState<{ email: string | null; uid: string | null }>({ email: null, uid: null });

  const logProgress = (msg: string) => {
      setProgressLog(prev => [...prev.slice(-12), `${new Date().toLocaleTimeString().split(' ')[0]} > ${msg}`]);
  };

  const runSystemAudit = useCallback(async () => {
    if (!db || !auth?.currentUser) return;
    setAuditStatus(prev => ({ ...prev, loading: true }));
    try {
        const adminDoc = await getDoc(doc(db, "admins", auth.currentUser.uid)).catch(() => ({ exists: () => false }));
        const studentQuery = query(collection(db, "users"), where("email", "==", TEST_USER_EMAIL));
        const studentSnap = await getDocs(studentQuery).catch(() => ({ empty: true }));
        const configDoc = await getDoc(doc(db, "configs", "academic")).catch(() => ({ exists: () => false }));

        setAuditStatus({
            admin: adminDoc.exists(),
            student: !studentSnap.empty,
            config: configDoc.exists(),
            loading: false
        });
        logProgress(`AUDIT: Admin [${adminDoc.exists() ? 'OK' : 'MISSING'}] | Student [${!studentSnap.empty ? 'OK' : 'MISSING'}] | Config [${configDoc.exists() ? 'OK' : 'MISSING'}]`);
    } catch (e: any) {
        logProgress(`AUDIT: Database synchronization pending...`);
        setAuditStatus(prev => ({ ...prev, loading: false }));
    }
  }, [db, auth]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentIdentity({ email: user?.email || null, uid: user?.uid || null });
      if (user) {
          setAuthStatus('success');
          logProgress(`AUTH ACTIVE: ${user.email}`);
          if (db) runSystemAudit();
      } else {
          setAuthStatus('idle');
      }
    });
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
            logProgress(`AUTH SUCCESS: Created new account.`);
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                await signInWithEmailAndPassword(auth, email, password);
                logProgress(`AUTH SUCCESS: Identity verified.`);
            } else throw e;
        }
        
        await auth.currentUser?.getIdToken(true);
        setAuthStatus('success');
        toast({ title: "Identity Verified" });
    } catch (error: any) {
        logProgress(`AUTH ERROR: ${error.message}`);
        setAuthStatus('error');
    }
  };

  const handleMapToDatabase = async () => {
    if (!db || !auth || !auth.currentUser) return;

    const type = auth.currentUser.email === HEAD_ADMIN_EMAIL ? 'admin' : 'student';
    const uid = auth.currentUser.uid;
    const email = auth.currentUser.email;

    setMapStatus('loading');
    let attempt = 0;
    const maxAttempts = 3;

    const attemptSync = async (): Promise<void> => {
        attempt++;
        logProgress(`MAP: Syncing Infrastructure (Attempt ${attempt}/${maxAttempts})...`);
        
        try {
            // Force token refresh to ensure email claim is present for isMaster() rule
            await auth.currentUser?.getIdToken(true);
        } catch (e) {}
        
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", uid);
        const walletDocRef = doc(db, "wallets", uid);
        const adminDocRef = doc(db, "admins", uid);
        const academicConfigRef = doc(db, "configs", "academic");
        const storeConfigRef = doc(db, "configs", "store");

        const userData = {
            id: uid,
            name: type === 'admin' ? HEAD_ADMIN_NAME : TEST_USER_NAME,
            email: email,
            joinDate: new Date().toISOString(),
            status: "Active",
        };

        const walletData = {
            balance: type === 'admin' ? 0 : 5000,
            coins: 100,
            referralCode: type === 'admin' ? 'HEADADMIN' : `STUDENT-${uid.slice(-4).toUpperCase()}`
        };

        batch.set(userDocRef, userData, { merge: true });
        batch.set(walletDocRef, walletData, { merge: true });

        if (type === 'admin') {
            batch.set(adminDocRef, {
                name: HEAD_ADMIN_NAME, 
                email: HEAD_ADMIN_EMAIL, 
                role: "Head Admin", 
                status: "Active", 
                joinDate: new Date().toISOString(),
            }, { merge: true });

            if (!auditStatus.config) {
                batch.set(academicConfigRef, defaultAcademicConfig, { merge: true });
                batch.set(storeConfigRef, defaultStoreConfig, { merge: true });
            }
        }

        try {
            await batch.commit();
            logProgress(`SUCCESS: Infrastructure Mapped.`);
            setMapStatus('success');
            runSystemAudit();
            toast({ title: "Setup Complete" });
        } catch (serverError: any) {
            console.error("Setup mapping error:", serverError);
            if (serverError.code === 'permission-denied' && attempt < maxAttempts) {
                logProgress("PENDING: Retrying synchronization (1s)...");
                setTimeout(attemptSync, 1000);
            } else {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'write',
                    requestResourceData: userData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                setMapStatus('error');
                logProgress(`FAILED: Authorization denied.`);
            }
        }
    };

    // Immediate execution
    attemptSync();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black flex items-center justify-center gap-2 text-primary tracking-tighter uppercase italic">
            <Shield className="w-6 h-6" /> CORE INFRASTRUCTURE
          </CardTitle>
          <CardDescription>Target Instance: <span className="font-mono text-xs font-bold text-black bg-primary/10 px-2 py-0.5 rounded">vidyaeducaredatabase</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {auditStatus.config && (
              <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 text-xs font-bold uppercase">System Active</AlertTitle>
                  <AlertDescription className="text-[10px] text-amber-700">Configurations already exist. Mapping will update existing records without resetting package data.</AlertDescription>
              </Alert>
          )}

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Search size={12}/> Deployment Audit</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={runSystemAudit} disabled={auditStatus.loading}>
                    <RefreshCw size={12} className={auditStatus.loading ? 'animate-spin' : ''} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${auditStatus.admin ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-[9px] font-bold uppercase">Admin</p>
                      {auditStatus.admin ? <CheckCircle size={14} className="text-green-600"/> : <AlertCircle size={14} className="text-red-600"/>}
                  </div>
                   <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${auditStatus.student ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-[9px] font-bold uppercase">Student</p>
                      {auditStatus.student ? <CheckCircle size={14} className="text-green-600"/> : <AlertCircle size={14} className="text-red-600"/>}
                  </div>
                   <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${auditStatus.config ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-[9px] font-bold uppercase">Configs</p>
                      {auditStatus.config ? <CheckCircle size={14} className="text-green-600"/> : <Loader2 size={14} className="text-amber-600 animate-spin"/>}
                  </div>
              </div>
          </div>

          <div className="bg-black/90 p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-[9px] font-bold text-white/50 uppercase flex items-center gap-2"><Activity size={10}/> Deployment Stream</p>
              <div className="space-y-1 min-h-[140px] overflow-hidden">
                  {progressLog.length > 0 ? progressLog.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-green-400 animate-in fade-in slide-in-from-left-2">> {log}</p>
                  )) : (
                      <p className="text-[10px] font-mono text-white/20 italic">> Waiting for commands...</p>
                  )}
              </div>
          </div>

          <div className="space-y-4 pt-2">
             <div className="grid grid-cols-2 gap-3">
                <Button className="font-bold text-[10px] py-6 rounded-xl" onClick={() => handleAuthenticate('admin')} disabled={authStatus === 'loading' || mapStatus === 'loading'}>
                    {authStatus === 'loading' && currentIdentity.email === HEAD_ADMIN_EMAIL ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH ADMIN"}
                </Button>
                <Button variant="outline" className="font-bold text-[10px] py-6 rounded-xl" onClick={() => handleAuthenticate('student')} disabled={authStatus === 'loading' || mapStatus === 'loading'}>
                    {authStatus === 'loading' && currentIdentity.email === TEST_USER_EMAIL ? <Loader2 className="animate-spin" /> : "STEP 1: AUTH STUDENT"}
                </Button>
             </div>

             <Button 
                className="w-full py-10 text-lg font-black bg-accent hover:bg-accent/90 shadow-lg rounded-2xl" 
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
          </div>

          {(auditStatus.admin && auditStatus.student && auditStatus.config) && (
              <div className="pt-2 animate-in zoom-in duration-500">
                  <Button className="w-full py-8 text-xl font-black bg-green-600 hover:bg-green-700 shadow-2xl rounded-2xl" onClick={() => router.push('/admin/login')}>
                      OPEN OPERATIONAL HUB <ExternalLink className="ml-2 h-5 w-5"/>
                  </Button>
                  <p className="text-center mt-3 text-[10px] font-bold text-green-600 animate-pulse uppercase tracking-widest">System is Live & Operational</p>
              </div>
          )}
        </CardContent>
        <CardFooter className="bg-primary/5 py-4 border-t justify-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground italic text-center">Vidya EduCare Deployment Salt: V88_CONFIG_PRIORITY_REINFORCED</p>
        </CardFooter>
      </Card>
    </div>
  );
}