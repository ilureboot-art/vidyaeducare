"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Sparkles, Loader2, Send, Users, ArrowLeft, MessageSquare, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { StudentProfile } from "@/lib/student-data";
import { solveDoubt, type SolveDoubtOutput } from "@/ai/flows/solve-doubt-flow";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import Link from "next/link";

function AiTutorPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDb();

    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [queryText, setQueryText] = useState("");
    const [isSolving, setIsSolving] = useState(false);
    const [result, setResult] = useState<SolveDoubtOutput | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    useEffect(() => {
        if (user && db) {
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

    const handleAskAi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!queryText.trim() || !selectedStudentId) return;

        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        setIsSolving(true);
        setResult(null);

        try {
            const response = await solveDoubt({
                userDoubt: queryText,
                context: {
                    standard: student.academic.standard,
                    board: student.academic.board,
                }
            });
            setResult(response);
        } catch (error) {
            toast({ variant: 'destructive', title: "AI Error", description: "The AI Tutor could not process your question right now." });
        } finally {
            setIsSolving(false);
        }
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-primary flex items-center gap-2">
                    <BrainCircuit className="w-8 h-8 text-accent" /> AI DOUBT SOLVER
                </h1>
                <Button variant="ghost" asChild size="sm">
                    <Link href="/profile"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
                </Button>
            </div>

            <Card className="border-primary/20 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Ask Your Academic Doubt</CardTitle>
                            <CardDescription>Get instant bilingual conceptual clarity.</CardDescription>
                        </div>
                        <div className="w-full sm:w-48 space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select Student</Label>
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
                    </div>
                </CardHeader>
                <form onSubmit={handleAskAi}>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="query">What is your question?</Label>
                                <Textarea 
                                    id="query"
                                    placeholder="e.g., Why do planets orbit the sun in ellipses? or Give me 5 key points about the Indian Constitution."
                                    className="min-h-[120px] text-lg focus-visible:ring-accent"
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    required
                                />
                            </div>
                            {selectedStudent && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                    <Info size={14} />
                                    <span>AI will answer for <b>{selectedStudent.academic.board} {selectedStudent.academic.standard}</b> level.</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t flex justify-between gap-4">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setQueryText(""); setResult(null); }}
                            disabled={isSolving}
                        >
                            Clear
                        </Button>
                        <Button 
                            type="submit" 
                            className="px-8 font-bold gap-2 bg-accent hover:bg-accent/90" 
                            disabled={isSolving || !queryText.trim()}
                        >
                            {isSolving ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Get Answer</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {isSolving && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                        <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
                        <Loader2 className="absolute inset-0 w-12 h-12 text-accent animate-spin opacity-40" />
                    </div>
                    <p className="text-primary font-bold animate-pulse">AI Tutor is crafting your answer...</p>
                </div>
            )}

            {result && (
                <Card className="border-none shadow-2xl ring-1 ring-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm uppercase tracking-widest font-black text-primary flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-accent" /> ANSWER & EXPLANATION
                            </CardTitle>
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-none">{result.keyConcept}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="p-5 bg-muted/30 rounded-2xl border-l-4 border-primary">
                                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Marathi Explanation</h4>
                                <p className="text-xl font-medium leading-relaxed">{result.explanation.mr}</p>
                            </div>
                            <div className="p-5 bg-muted/30 rounded-2xl border-l-4 border-accent">
                                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">English Explanation</h4>
                                <p className="text-lg leading-relaxed text-muted-foreground">{result.explanation.en}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-primary/5 text-center justify-center p-4">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <MessageSquare size={10} /> Pedagogical AI Guidance Provided by Vidya EduCare
                        </p>
                    </CardFooter>
                </Card>
            )}

            {!result && !isSolving && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-muted/20 border-dashed">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold text-muted-foreground">General Doubts</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground py-0 pb-4">
                            Ask about any topic like history dates, math formulas, or science laws.
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/20 border-dashed">
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-bold text-muted-foreground">Conceptual Clarity</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground py-0 pb-4">
                            Need a deep dive into "Why" something happens? Our AI explains it bilingual.
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function AiTutorPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <AiTutorPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}
