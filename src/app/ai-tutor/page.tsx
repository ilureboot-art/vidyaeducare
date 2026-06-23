
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Sparkles, Loader2, Send, ArrowLeft, MessageSquare, Info, Lock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import type { StudentProfile } from "@/lib/student-data";
import { solveDoubt, type SolveDoubtOutput } from "@/ai/flows/solve-doubt-flow";
import UserLayout from "@/components/UserLayout";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { exportToPdf, exportToDoc, exportToTxt } from "@/lib/export-utils";

const GUEST_TRIAL_LIMIT = 5;

function AiTutorPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDb();

    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [queryText, setQueryText] = useState("");
    const [isSolving, setIsSolving] = useState(false);
    const [result, setResult] = useState<SolveDoubtOutput | null>(null);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);
    const [hasActivePackage, setHasActivePackage] = useState(false);
    
    const [trialCount, setTrialCount] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && !user) {
            const count = parseInt(localStorage.getItem('trial_ai_tutor_count') || '0');
            setTrialCount(count);
        }
    }, [user]);

    useEffect(() => {
        if (!db) return;

        if (user) {
            setIsLoadingAccess(true);
            
            const checkAccess = async () => {
                try {
                    const studentsColRef = collection(db, "students");
                    const q = query(studentsColRef, where("parentId", "==", user.uid));
                    const studentSnap = await getDocs(q);
                    
                    const codesDocRef = doc(db, "activationCodes", user.uid);
                    const storeConfigRef = doc(db, "configs", "store");
                    const aiAccessRef = doc(db, "aiAccess", user.uid);

                    const unsubCodes = onSnapshot(codesDocRef, async (codeSnap) => {
                        try {
                            const hasCodes = codeSnap.exists() && codeSnap.data().codes?.length > 0;
                            const hasStudents = !studentSnap.empty;
                            const hasMockArena = hasStudents || hasCodes;

                            const [configSnap, aiAccessSnap] = await Promise.all([
                                getDoc(storeConfigRef),
                                getDoc(aiAccessRef)
                            ]);

                            const isFreeAccessAllowed = configSnap.exists() && (configSnap.data() as any).grantFreeAiToolsWithMockArena;
                             
                             let hasActiveSubscription = false;
                             if (aiAccessSnap.exists()) {
                                 const data = aiAccessSnap.data() as any;
                                 if (data.hasDoubtSolver === true) {
                                     hasActiveSubscription = true;
                                 } else if (data.doubtSolverExpiresAt) {
                                     const expiry = data.doubtSolverExpiresAt.toDate ? data.doubtSolverExpiresAt.toDate() : new Date(data.doubtSolverExpiresAt);
                                     if (expiry > new Date()) {
                                         hasActiveSubscription = true;
                                     }
                                 }
                             }

                             setHasActivePackage(hasActiveSubscription || (!!isFreeAccessAllowed && hasMockArena));
                            
                            if (hasStudents) {
                                const list = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
                                setStudents(list);
                                if (list.length > 0) setSelectedStudentId(list[0].id);
                            }
                        } catch (err) {
                            console.error("Access check details error:", err);
                        } finally {
                            setIsLoadingAccess(false);
                        }
                    }, () => {
                        setHasActivePackage(!studentSnap.empty);
                        setIsLoadingAccess(false);
                    });

                    return unsubCodes;
                } catch (e) {
                    setIsLoadingAccess(false);
                }
            };
            
            const cleanup = checkAccess();
            return () => {
                cleanup.then(unsub => unsub && unsub());
            }
        } else {
            setIsLoadingAccess(false);
        }
    }, [user, db]);

    const handleDownloadPdf = () => {
        if (!result) return;
        const filename = `doubt_${result.keyConcept.toLowerCase().replace(/\s+/g, '_')}`;
        const title = `Vidya AI Doubt Solver - ${result.keyConcept}`;
        const sections = [
            { subtitle: "Student Doubt", content: queryText },
            { subtitle: "Marathi Explanation / मराठी स्पष्टीकरण", content: result.explanation.mr },
            { subtitle: "English Explanation", content: result.explanation.en }
        ];
        exportToPdf(filename, title, sections);
        toast({ title: "PDF Exported!", description: "Check your downloads directory." });
    };

    const handleDownloadDoc = () => {
        if (!result) return;
        const filename = `doubt_${result.keyConcept.toLowerCase().replace(/\s+/g, '_')}`;
        const title = `Vidya AI Doubt Solver - ${result.keyConcept}`;
        const html = `
            <h1>Vidya AI Doubt Solver - ${result.keyConcept}</h1>
            <h2>Student Doubt</h2>
            <p>${queryText}</p>
            <h2>मराठी स्पष्टीकरण (Marathi Explanation)</h2>
            <p>${result.explanation.mr}</p>
            <h2>English Explanation</h2>
            <p><i>${result.explanation.en}</i></p>
        `;
        exportToDoc(filename, title, html);
        toast({ title: "Word Document Exported!", description: "Check your downloads directory." });
    };

    const handleDownloadTxt = () => {
        if (!result) return;
        const filename = `doubt_${result.keyConcept.toLowerCase().replace(/\s+/g, '_')}`;
        const title = `Vidya AI Doubt Solver - ${result.keyConcept}`;
        const sections = [
            { subtitle: "Student Doubt", content: queryText },
            { subtitle: "Marathi Explanation / मराठी स्पष्टीकरण", content: result.explanation.mr },
            { subtitle: "English Explanation", content: result.explanation.en }
        ];
        exportToTxt(filename, title, sections);
        toast({ title: "Text Document Exported!", description: "Check your downloads directory." });
    };

    const handleAskAi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!queryText.trim()) return;

        if (!user && trialCount >= GUEST_TRIAL_LIMIT) {
            toast({ variant: 'destructive', title: "Trial Limit Reached", description: "Please sign up to continue using Vidya AI Doubt Solver." });
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        
        const context = student ? {
            standard: student.academic.standard,
            board: student.academic.board,
        } : {
            standard: "General Academic",
            board: "Universal"
        };

        setIsSolving(true);
        setResult(null);

        try {
            const response = await solveDoubt({
                userDoubt: queryText,
                context: context,
                image: undefined
            });
            if (response && 'error' in response) {
                toast({ variant: 'destructive', title: "Doubt Solver Error", description: response.error as string });
            } else {
                setResult(response);

                if (!user) {
                    const newCount = trialCount + 1;
                    setTrialCount(newCount);
                    localStorage.setItem('trial_ai_tutor_count', newCount.toString());
                }
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Doubt Solver Error", description: "Vidya AI could not process your question right now." });
        } finally {
            setIsSolving(false);
        }
    };

    if (isLoadingAccess) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Verifying Academic Access...</p>
            </div>
        );
    }

    if (user && !hasActivePackage) {
        return (
            <div className="w-full max-w-2xl mx-auto py-12">
                <Card className="text-center p-12 border-none shadow-2xl ring-1 ring-primary/10 overflow-hidden rounded-[3rem]">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Lock size={150}/></div>
                    <CardHeader className="space-y-6">
                        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle className="text-4xl font-black text-primary tracking-tighter uppercase italic">Subscription Required</CardTitle>
                        <CardDescription className="text-lg font-bold max-w-sm mx-auto">
                            Vidya AI Doubt Solver is a premium feature available to students with an active MockArena Package.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <Button asChild size="lg" className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl hover:scale-105 transition-transform group">
                            <Link href="/store">
                                VISIT THE STORE <ShoppingCart className="ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unlock unlimited AI assistance today</p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const isLocked = !user && trialCount >= GUEST_TRIAL_LIMIT;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-black text-primary flex items-center gap-2 italic tracking-tighter uppercase">
                    <BrainCircuit className="w-8 h-8 text-accent" /> VIDYA AI DOUBT SOLVER
                </h1>
                <Button variant="ghost" asChild size="sm" className="font-bold">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
            </div>

            {!user && (
                <Alert className={isLocked ? "bg-red-50 border-red-200 print:hidden" : "bg-accent/5 border-accent/20 print:hidden"}>
                    {isLocked ? <Lock className="h-4 w-4 text-red-600" /> : <Sparkles className="h-4 w-4 text-accent" />}
                    <AlertTitle className={isLocked ? "text-red-700 font-black" : "text-accent font-black"}>
                        {isLocked ? "TRIAL LIMIT REACHED" : `FREE AI SOLVER TRIAL ACTIVE (${GUEST_TRIAL_LIMIT - trialCount} Queries Left)`}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                        {isLocked 
                            ? "You have used your 5 free trial queries. Please join Vidya EduCare for unlimited AI Doubt Solver access." 
                            : "No registration required. Get instant conceptual clarity for your academic doubts."}
                        <Link href="/signup" className="ml-2 underline font-bold">Sign up now.</Link>
                    </AlertDescription>
                </Alert>
            )}

            <Card className="border-primary/20 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">AI Doubt Solver Workspace</CardTitle>
                            <CardDescription>Bilingual pedagogical explanations for any topic.</CardDescription>
                        </div>
                        {user && hasActivePackage && (
                            <div className="w-full sm:w-48 space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tailor for</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select student..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.academic.standard})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <form onSubmit={handleAskAi}>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="query" className="font-bold">What is your academic doubt?</Label>
                                <Textarea 
                                    id="query"
                                    placeholder={isLocked ? "Limit reached. Please join us to ask Vidya AI more questions." : "e.g., Why do planets orbit the sun in ellipses? or Explain the 1857 revolt."}
                                    className="min-h-[150px] text-lg focus-visible:ring-accent rounded-2xl"
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    required
                                    disabled={isLocked}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border-dashed border-2">
                                <Info size={14} className="text-primary"/>
                                <span>Vidya AI results are pedagogical and provided in both Marathi and English.</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t flex justify-between gap-4 p-6">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setQueryText(""); setResult(null); }}
                            disabled={isSolving}
                            className="font-bold"
                        >
                            Clear
                        </Button>
                        <Button 
                            type="submit" 
                            className="px-10 font-black gap-2 bg-accent hover:bg-accent/90 shadow-lg text-lg h-14 rounded-2xl" 
                            disabled={isSolving || !queryText.trim() || isLocked}
                        >
                            {isSolving ? <Loader2 className="animate-spin" /> : <><Send size={20} /> ASK VIDYA AI</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {isSolving && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in">
                    <div className="relative">
                        <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
                        <Loader2 className="absolute inset-0 w-16 h-16 text-accent animate-spin opacity-40" />
                    </div>
                    <p className="text-primary font-black animate-pulse text-center uppercase tracking-widest text-xs italic">Vidya AI is crafting a bilingual explanation...</p>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
                        <Button 
                            variant="outline" 
                            onClick={() => { setQueryText(""); setResult(null); }} 
                            className="font-bold"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4"/> Ask Another Question
                        </Button>
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleDownloadPdf} 
                                className="font-bold bg-primary text-white gap-2 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Export PDF
                            </Button>
                            <Button 
                                onClick={handleDownloadTxt} 
                                className="font-bold bg-accent text-white gap-2 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Export TXT
                            </Button>
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl ring-1 ring-primary/20 overflow-hidden">
                        <CardHeader className="pb-2 bg-primary/[0.02] border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm uppercase tracking-widest font-black text-primary flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent" /> BILINGUAL RESOLUTION
                                </CardTitle>
                                <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">{result.keyConcept}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-8 px-8">
                            <div className="space-y-4">
                                <div className="p-6 bg-muted/40 rounded-3xl border-l-8 border-primary relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquare size={40}/></div>
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mb-4">Marathi Explanation • मराठी स्पष्टीकरण</h4>
                                    <p className="text-xl font-medium leading-relaxed whitespace-pre-wrap">{result.explanation.mr}</p>
                                </div>
                                <div className="p-6 bg-muted/20 rounded-3xl border-l-8 border-accent relative">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-accent mb-4">English Explanation</h4>
                                    <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap italic">{result.explanation.en}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/5 text-center justify-center p-4">
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                                <BrainCircuit size={12} className="text-primary" /> Pedagogical AI Guidance provided for your specific doubt.
                            </p>
                        </CardFooter>
                    </Card>

                    {!user && (
                        <Card className="bg-primary text-primary-foreground text-center rounded-[2rem] shadow-2xl border-none p-4">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Ready for more clarity?</CardTitle>
                                <CardDescription className="text-primary-foreground/80 font-medium">Join Vidya EduCare to save your doubt history and get answers tailored to your standard and curriculum.</CardDescription>
                            </CardHeader>
                            <CardFooter className="justify-center">
                                <Button asChild variant="secondary" size="lg" className="font-black px-12 py-8 text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform">
                                    <Link href="/signup">JOIN VIDYA EDUCARE <ArrowLeft className="ml-2 h-5 w-5 rotate-180"/></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AiTutorPage() {
    return (
        <UserLayout>
            <AiTutorPageContent />
        </UserLayout>
    );
}
