"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollText, Sparkles, Loader2, Info, CheckCircle, ArrowLeft, BrainCircuit, LogIn, Lock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import type { StudentProfile } from "@/lib/student-data";
import { generateStudyNotes, type GenerateNotesOutput } from "@/ai/flows/generate-notes-flow";
import UserLayout from "@/components/UserLayout";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { exportToPdf, exportToDoc, exportToTxt } from "@/lib/export-utils";

const GUEST_TRIAL_LIMIT = 5;

function AiNotesPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDb();

    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [materialText, setMaterialText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerateNotesOutput | null>(null);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);
    const [hasActivePackage, setHasActivePackage] = useState(false);

    const [trialCount, setTrialCount] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && !user) {
            const count = parseInt(localStorage.getItem('trial_ai_notes_count') || '0');
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
                                 if (data.hasNotesGenerator === true) {
                                     hasActiveSubscription = true;
                                 } else if (data.notesGeneratorExpiresAt) {
                                     const expiry = data.notesGeneratorExpiresAt.toDate ? data.notesGeneratorExpiresAt.toDate() : new Date(data.notesGeneratorExpiresAt);
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
        const filename = `quicknotes_${result.title.toLowerCase().replace(/\s+/g, '_')}`;
        const title = `Vidya QuickNotes - ${result.title}`;
        
        const sections: { subtitle?: string; content: string }[] = [];
        sections.push({ subtitle: "Concept Summary / मुख्य सारांश", content: `${result.summary.mr}\n\n${result.summary.en}` });

        for (const s of result.sections) {
            sections.push({ subtitle: `${s.heading.mr} (${s.heading.en})`, content: `${s.content.mr}\n\n${s.content.en}` });
            
            const pointsText = s.keyPoints.map(p => `• ${p.mr}\n  (${p.en})`).join('\n');
            sections.push({ content: pointsText });
        }

        exportToPdf(filename, title, sections);
        toast({ title: "PDF Exported!", description: "Check your downloads directory." });
    };

    const handleDownloadTxt = () => {
        if (!result) return;
        const filename = `quicknotes_${result.title.toLowerCase().replace(/\s+/g, '_')}`;
        const title = `Vidya QuickNotes - ${result.title}`;
        
        const sections: { subtitle?: string; content: string }[] = [];
        sections.push({ subtitle: "Concept Summary / मुख्य सारांश", content: `${result.summary.mr}\n\n${result.summary.en}` });

        for (const s of result.sections) {
            sections.push({ subtitle: `${s.heading.mr} (${s.heading.en})`, content: `${s.content.mr}\n\n${s.content.en}` });
            
            const pointsText = s.keyPoints.map(p => `• ${p.mr}\n  (${p.en})`).join('\n');
            sections.push({ content: pointsText });
        }

        exportToTxt(filename, title, sections);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialText.trim()) {
            toast({ variant: 'destructive', title: 'Input Required', description: 'Please provide text of your study material.' });
            return;
        }

        if (!user && trialCount >= GUEST_TRIAL_LIMIT) {
            toast({ variant: 'destructive', title: "Trial Limit Reached", description: "Please sign up to continue generating QuickNotes." });
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        
        const academic = student ? {
            standard: student.academic.standard,
            board: student.academic.board,
        } : {
            standard: "General Academic",
            board: "Universal"
        };

        setIsGenerating(true);
        setResult(null);

        try {
            const response = await generateStudyNotes({
                materialDescription: materialText,
                photoDataUri: undefined,
                subject: 'Academic General',
                standard: academic.standard,
                board: academic.board,
            });
            setResult(response);
            
            if (!user) {
                const newCount = trialCount + 1;
                setTrialCount(newCount);
                localStorage.setItem('trial_ai_notes_count', newCount.toString());
            }

            toast({ title: "QuickNotes Ready!", description: "Your bilingual study summary is ready." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "QuickNotes Error", description: "The AI was unable to process this material right now." });
        } finally {
            setIsGenerating(false);
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

    // Registered user check
    if (user && !hasActivePackage) {
        return (
            <div className="w-full max-w-2xl mx-auto py-12">
                <Card className="text-center p-12 border-none shadow-2xl ring-1 ring-primary/10 overflow-hidden rounded-[3rem]">
                    <div className="absolute top-0 left-0 p-8 opacity-5"><Lock size={150}/></div>
                    <CardHeader className="space-y-6">
                        <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="w-12 h-12 text-accent" />
                        </div>
                        <CardTitle className="text-4xl font-black text-primary tracking-tighter uppercase italic">Subscription Required</CardTitle>
                        <CardDescription className="text-lg font-bold max-w-sm mx-auto">
                            Vidya QuickNotes is a premium tool available to users with an active MockArena Package.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <Button asChild size="lg" className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl hover:scale-105 transition-transform group bg-accent hover:bg-accent/90">
                            <Link href="/store">
                                ACTIVATE PACKAGE <ShoppingCart className="ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Transform your study habits with QuickNotes</p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const isLocked = !user && trialCount >= GUEST_TRIAL_LIMIT;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-black text-primary flex items-center gap-2 italic uppercase tracking-tighter">
                    <ScrollText className="w-8 h-8 text-accent" /> VIDYA QUICKNOTES
                </h1>
                <Button variant="ghost" asChild size="sm" className="font-bold">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
            </div>

            {!user && (
                <Alert className={isLocked ? "bg-red-50 border-red-200 print:hidden" : "bg-primary/5 border-primary/20 print:hidden"}>
                    {isLocked ? <Lock className="h-4 w-4 text-red-600" /> : <Sparkles className="h-4 w-4 text-primary" />}
                    <AlertTitle className={isLocked ? "text-red-700 font-black" : "text-primary font-black uppercase tracking-tight"}>
                        {isLocked ? "TRIAL LIMIT REACHED" : `FREE QUICKNOTES TRIAL ACTIVE (${GUEST_TRIAL_LIMIT - trialCount} Generations Left)`}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                        {isLocked 
                            ? "You have reached the 5-page trial limit. Upgrade to use QuickNotes without limits." 
                            : "No registration required. Instantly convert textbooks into bilingual structured summaries."}
                        <Link href="/signup" className="ml-2 underline font-bold">Sign up for full access.</Link>
                    </AlertDescription>
                </Alert>
            )}

            {!result ? (
                <Card className="border-primary/20 shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">QuickNotes Workspace</CardTitle>
                                <CardDescription>Paste text or upload a photo of your chapter.</CardDescription>
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
                    <form onSubmit={handleGenerate}>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="material" className="font-bold">Text Material</Label>
                                <Textarea 
                                    id="material"
                                    placeholder={isLocked ? "Trial limit reached. Please join us to use QuickNotes." : "Paste text from your chapter, or describe the topic you want notes on..."}
                                    className="min-h-[150px] text-lg focus-visible:ring-accent rounded-2xl"
                                    value={materialText}
                                    onChange={(e) => setMaterialText(e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/50 p-4 rounded-2xl border-dashed border-2">
                                <Info size={16} className="text-primary"/>
                                <span>QuickNotes will generate structured key points in both English and Marathi.</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t flex justify-between gap-4 p-6">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => { setMaterialText(""); }}
                                disabled={isGenerating}
                                className="font-bold"
                            >
                                Clear All
                            </Button>
                            <Button 
                                type="submit" 
                                className="px-10 font-black gap-2 bg-primary hover:bg-primary/90 shadow-xl text-lg h-14 rounded-2xl" 
                                disabled={isGenerating || isLocked}
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> SYNTHESIZE QUICKNOTES</>}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <div className="space-y-6">
                     <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
                        <Button variant="outline" onClick={() => setResult(null)} className="font-bold"><ArrowLeft className="mr-2 h-4 w-4"/> New Material</Button>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                onClick={handleDownloadPdf} 
                                className="font-bold bg-primary text-white gap-2 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Export PDF
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleDownloadTxt} 
                                className="font-bold bg-accent text-white gap-2 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Export TXT
                            </Button>
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl ring-1 ring-primary/20 rounded-[3rem] overflow-hidden">
                        <CardHeader className="text-center border-b pb-12 pt-12 bg-primary/[0.02]">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-primary/10 rounded-3xl"><ScrollText className="w-12 h-12 text-primary" /></div>
                            </div>
                            <CardTitle className="text-4xl font-black text-primary uppercase tracking-tighter italic">{result.title}</CardTitle>
                            <CardDescription className="font-black text-[10px] uppercase tracking-[0.3em] mt-3 text-muted-foreground">
                                QUICKNOTES BILINGUAL SYNOPSIS
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-12 pt-12 px-8 md:px-16">
                            {result.sections.map((section, idx) => (
                                <div key={idx} className="space-y-8 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <div className="flex flex-col gap-1 border-l-8 border-primary pl-6">
                                        <h2 className="text-3xl font-black text-primary tracking-tight">{section.heading.mr}</h2>
                                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">{section.heading.en}</h3>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="p-6 bg-primary/[0.03] rounded-[2rem] border border-primary/10 relative">
                                                <p className="text-xl leading-relaxed font-medium">{section.content.mr}</p>
                                            </div>
                                            <ul className="space-y-4">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-4 text-sm bg-background p-3 rounded-2xl border shadow-sm">
                                                        <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                                        <span className="font-bold">{point.mr}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-6 bg-accent/[0.03] rounded-[2rem] border border-accent/10 italic">
                                                <p className="text-md leading-relaxed text-muted-foreground">{section.content.en}</p>
                                            </div>
                                            <ul className="space-y-4">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-3 text-[11px] text-muted-foreground italic pl-2 border-l-2 border-dashed">
                                                        <span className="font-bold">•</span>
                                                        <span className="font-medium">{point.en}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {idx < result.sections.length - 1 && <div className="h-1 bg-muted/30 w-1/4 mx-auto mt-12 rounded-full" />}
                                </div>
                            ))}

                            <Card className="bg-primary text-white border-none rounded-[3rem] overflow-hidden mt-16 shadow-2xl">
                                <div className="p-4 text-center border-b border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center justify-center gap-2">
                                        <BrainCircuit size={16} className="fill-white"/> Concept Summary • मुख्य सारांश
                                    </p>
                                </div>
                                <CardContent className="p-10 space-y-6">
                                    <p className="text-3xl font-black text-center leading-tight tracking-tighter italic">{result.summary.mr}</p>
                                    <p className="text-center text-primary-foreground/70 font-medium italic border-t border-white/10 pt-6 px-4">{result.summary.en}</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t justify-center py-6 mt-12">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">© Vidya EduCare QuickNotes Excellence</p>
                        </CardFooter>
                    </Card>

                    {!user && (
                        <Card className="bg-accent text-white text-center shadow-2xl border-none rounded-[3rem] p-4">
                            <CardHeader>
                                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Loved QuickNotes?</CardTitle>
                                <CardDescription className="text-white/80 font-bold text-lg">Join Vidya EduCare today to generate unlimited personalized QuickNotes for all your subjects and standards.</CardDescription>
                            </CardHeader>
                            <CardFooter className="justify-center pt-4">
                                <Button asChild variant="secondary" size="lg" className="font-black px-12 py-10 text-2xl rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                                    <Link href="/signup">CREATE FREE ACCOUNT <LogIn className="ml-2 h-6 w-6"/></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            )}

            {isGenerating && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute -inset-10 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                        <ScrollText className="w-24 h-24 text-primary animate-bounce relative z-10" />
                        <Loader2 className="absolute inset-0 w-24 h-24 text-accent animate-spin opacity-30 z-20" />
                    </div>
                    <div className="text-center space-y-3 px-8">
                        <h2 className="text-4xl font-black text-primary animate-pulse uppercase tracking-tighter italic leading-none">Synthesizing QuickNotes...</h2>
                        <p className="text-muted-foreground font-bold text-lg max-w-sm mx-auto">Curating structured, bilingual study material from your academic source.</p>
                    </div>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AiNotesPage() {
    return (
        <UserLayout>
            <AiNotesPageContent />
        </UserLayout>
    );
}
