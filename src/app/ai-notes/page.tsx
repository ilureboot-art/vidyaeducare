
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollText, Sparkles, Loader2, Send, FileUp, Info, CheckCircle, ArrowLeft, BrainCircuit, X, Image as ImageIcon, LogIn, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { StudentProfile } from "@/lib/student-data";
import { generateStudyNotes, type GenerateNotesOutput } from "@/ai/flows/generate-notes-flow";
import UserLayout from "@/components/UserLayout";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GUEST_TRIAL_LIMIT = 5;

function AiNotesPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDb();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [materialText, setMaterialText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerateNotesOutput | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // Trial Tracking
    const [trialCount, setTrialCount] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && !user) {
            const count = parseInt(localStorage.getItem('trial_ai_notes_count') || '0');
            setTrialCount(count);
        }
    }, [user]);

    useEffect(() => {
        if (user && db) {
            setIsLoadingStudents(true);
            const fetchStudents = async () => {
                const q = query(collection(db, "students"), where("parentId", "==", user.uid));
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
                setStudents(list);
                if (list.length > 0) setSelectedStudentId(list[0].id);
                setIsLoadingStudents(false);
            };
            fetchStudents();
        }
    }, [user, db]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image (JPG, PNG).' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!materialText.trim() && !imagePreview)) {
            toast({ variant: 'destructive', title: 'Input Required', description: 'Please provide text or an image of your study material.' });
            return;
        }

        if (!user && trialCount >= GUEST_TRIAL_LIMIT) {
            toast({ variant: 'destructive', title: "Trial Limit Reached", description: "Please sign up to continue generating notes." });
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        
        // Trial Context
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
                photoDataUri: imagePreview || undefined,
                subject: 'Academic General',
                standard: academic.standard,
                board: academic.board,
            });
            setResult(response);
            
            // Increment trial if guest
            if (!user) {
                const newCount = trialCount + 1;
                setTrialCount(newCount);
                localStorage.setItem('trial_ai_notes_count', newCount.toString());
            }

            toast({ title: "Notes Generated!", description: "Bilingual study summary is ready." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "AI Error", description: "The AI was unable to process this material right now." });
        } finally {
            setIsGenerating(false);
        }
    };

    const isLocked = !user && trialCount >= GUEST_TRIAL_LIMIT;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-primary flex items-center gap-2">
                    <ScrollText className="w-8 h-8 text-accent" /> AI NOTES GENERATOR
                </h1>
                <Button variant="ghost" asChild size="sm">
                    <Link href={user ? "/profile" : "/"}><ArrowLeft className="mr-2 h-4 w-4" /> {user ? 'Dashboard' : 'Home'}</Link>
                </Button>
            </div>

            {!user && (
                <Alert className={isLocked ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/20"}>
                    {isLocked ? <Lock className="h-4 w-4 text-red-600" /> : <Sparkles className="h-4 w-4 text-primary" />}
                    <AlertTitle className={isLocked ? "text-red-700 font-black uppercase" : "text-primary font-black uppercase tracking-tight"}>
                        {isLocked ? "TRIAL LIMIT REACHED" : `FREE TRIAL MODE (${GUEST_TRIAL_LIMIT - trialCount} Generations Left)`}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                        {isLocked 
                            ? "You have reached the 5-page trial limit. Upgrade to generate unlimited notes." 
                            : "Guest mode active. Notes will be generated for your academic study material."}
                        <Link href="/signup" className="ml-2 underline font-bold">Sign up for full access.</Link>
                    </AlertDescription>
                </Alert>
            )}

            {!result ? (
                <Card className="border-primary/20 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Generate Study Summary</CardTitle>
                                <CardDescription>Convert textbooks or images into bilingual notes.</CardDescription>
                            </div>
                            {user && (
                                <div className="w-full sm:w-48 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tailor for</Label>
                                    {isLoadingStudents ? (
                                        <div className="h-10 bg-muted animate-pulse rounded-md" />
                                    ) : (
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
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <form onSubmit={handleGenerate}>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="material">Study Material (Text)</Label>
                                <Textarea 
                                    id="material"
                                    placeholder={isLocked ? "Trial limit reached. Please join us to ask more." : "Paste text from your chapter, or describe the topic you want notes on..."}
                                    className="min-h-[150px] text-lg focus-visible:ring-accent"
                                    value={materialText}
                                    onChange={(e) => setMaterialText(e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>Or Upload Image (JPG/PNG)</Label>
                                <div className="flex items-center gap-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="border-dashed border-2 h-32 w-full flex-col gap-2 bg-muted/20 hover:bg-muted/40 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLocked}
                                    >
                                        {imagePreview ? (
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="w-6 h-6 text-primary" />
                                                <span className="text-xs font-bold text-primary">Image Attached</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FileUp className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Upload Textbook Photo</span>
                                            </>
                                        )}
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                    />
                                    {imagePreview && (
                                        <div className="relative h-32 w-32 shrink-0 border rounded-lg overflow-hidden group">
                                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setImagePreview(null)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                <Info size={14} />
                                <span>Notes will be generated for your academic study material.</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t flex justify-between gap-4">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => { setMaterialText(""); setImagePreview(null); }}
                                disabled={isGenerating}
                            >
                                Clear All
                            </Button>
                            <Button 
                                type="submit" 
                                className="px-8 font-black gap-2 bg-accent hover:bg-accent/90 shadow-lg" 
                                disabled={isGenerating || isLocked}
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> GENERATE BILINGUAL NOTES</>}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button variant="outline" onClick={() => setResult(null)}><ArrowLeft className="mr-2 h-4 w-4"/> Generate More</Button>
                        <Button variant="ghost" onClick={() => window.print()} className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Download / Print</Button>
                    </div>

                    <Card className="border-none shadow-2xl ring-1 ring-primary/20">
                        <CardHeader className="text-center border-b pb-8">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-primary/10 rounded-2xl"><ScrollText className="w-10 h-10 text-primary" /></div>
                            </div>
                            <CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">{result.title}</CardTitle>
                            <CardDescription className="font-bold text-xs uppercase tracking-widest mt-2">
                                AI CURATED NOTES
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-10 pt-10">
                            {result.sections.map((section, idx) => (
                                <div key={idx} className="space-y-6 group">
                                    <div className="flex flex-col gap-1 border-l-4 border-primary pl-5">
                                        <h2 className="text-2xl font-black text-primary">{section.heading.mr}</h2>
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{section.heading.en}</h3>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="p-5 bg-primary/[0.03] rounded-2xl border border-primary/10">
                                                <p className="text-lg leading-relaxed font-medium">{section.content.mr}</p>
                                            </div>
                                            <ul className="space-y-3">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-3 text-sm">
                                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                        <span className="font-medium">{point.mr}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-5 bg-accent/[0.03] rounded-2xl border border-accent/10 italic">
                                                <p className="text-md leading-relaxed text-muted-foreground">{section.content.en}</p>
                                            </div>
                                            <ul className="space-y-3">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-3 text-xs text-muted-foreground italic">
                                                        <span className="mt-1">•</span>
                                                        <span>{point.en}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {idx < result.sections.length - 1 && <div className="h-px bg-muted w-1/2 mx-auto mt-10" />}
                                </div>
                            ))}

                            <Card className="bg-primary/5 border-none rounded-3xl overflow-hidden mt-12">
                                <div className="bg-primary p-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground opacity-80 flex items-center justify-center gap-2">
                                        <BrainCircuit size={14}/> Summary • मुख्य सारांश
                                    </p>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <p className="text-2xl font-black text-center leading-tight text-primary">{result.summary.mr}</p>
                                    <p className="text-center text-muted-foreground font-medium italic border-t pt-4">{result.summary.en}</p>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t justify-center py-4">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">© Vidya EduCare AI Tutoring Excellence</p>
                        </CardFooter>
                    </Card>

                    {!user && (
                        <Card className="bg-accent text-white text-center shadow-xl border-none">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black italic uppercase">Love these notes?</CardTitle>
                                <CardDescription className="text-white/80">Join Vidya EduCare today to generate personalized notes for all your students across any board and standard.</CardDescription>
                            </CardHeader>
                            <CardFooter className="justify-center">
                                <Button asChild variant="secondary" size="lg" className="font-black">
                                    <Link href="/signup">CREATE FREE ACCOUNT <LogIn className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            )}

            {isGenerating && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                    <div className="relative">
                        <ScrollText className="w-24 h-24 text-primary animate-pulse" />
                        <Loader2 className="absolute inset-0 w-24 h-24 text-accent animate-spin opacity-40" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-primary animate-pulse uppercase tracking-tighter italic">Analyzing Content...</h2>
                        <p className="text-muted-foreground font-medium">Synthesizing bilingual study material for your academic material.</p>
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
