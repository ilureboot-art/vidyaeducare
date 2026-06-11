
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, CheckCircle, XCircle, FileQuestion, ArrowLeft, Loader2, Info, BrainCircuit, Sparkles, ScrollText } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { StudentProfile } from "@/lib/student-data";
import type { Question, TestSet } from "@/lib/question-bank";
import type { ScheduledTest } from "@/lib/test-schedule";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useDb } from "@/firebase";
import UserLayout from "@/components/UserLayout";
import { solveDoubt, type SolveDoubtOutput } from "@/ai/flows/solve-doubt-flow";
import { generateStudyNotes, type GenerateNotesOutput } from "@/ai/flows/generate-notes-flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type TestState = "loading" | "in_progress" | "completed" | "review";

function MockTestContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const db = useDb();

    const [testState, setTestState] = useState<TestState>("loading");
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [scheduledTest, setScheduledTest] = useState<ScheduledTest | null>(null);

    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(1800); 
    const [initialDuration, setInitialDuration] = useState(1800);
    const [answers, setAnswers] = useState<{ [key: string]: { en: string; mr: string; } }>({});
    const [score, setScore] = useState(0);
    const [isLiveTest, setIsLiveTest] = useState(false);

    const [isAiSolving, setIsAiSolving] = useState<string | null>(null);
    const [aiExplanation, setAiExplanation] = useState<SolveDoubtOutput | null>(null);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

    const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
    const [aiNotes, setAiNotes] = useState<GenerateNotesOutput | null>(null);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
    
    useEffect(() => {
        if (!db) return;

        const studentId = searchParams.get('studentId');
        const testId = searchParams.get('testId');
        const live = searchParams.get('isLive') === 'true';
        setIsLiveTest(live);
        
        if (!studentId || !testId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Missing student or test ID.' });
            router.push('/profile');
            return;
        }
        
        const fetchData = async () => {
            try {
                const studentDocRef = doc(db, 'students', studentId);
                const studentDoc = await getDoc(studentDocRef).catch(async (e) => {
                    if (e.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'get' }));
                    }
                    throw e;
                });

                if (studentDoc.exists()) {
                    setStudentProfile(studentDoc.data() as StudentProfile);
                } else {
                    throw new Error("Student profile not found");
                }

                const scheduledTestDocRef = doc(db, 'scheduledTests', testId);
                const scheduledTestDoc = await getDoc(scheduledTestDocRef).catch(async (e) => {
                    if (e.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: scheduledTestDocRef.path, operation: 'get' }));
                    }
                    throw e;
                });

                if (scheduledTestDoc.exists()) {
                    const scheduledTestData = scheduledTestDoc.data() as ScheduledTest;
                    setScheduledTest(scheduledTestData);
                    
                    const durationInSeconds = (scheduledTestData.duration || 30) * 60;
                    setTimeLeft(durationInSeconds);
                    setInitialDuration(durationInSeconds);

                    const testSetDocRef = doc(db, 'testSets', scheduledTestData.testSetId);
                    const testSetDoc = await getDoc(testSetDocRef).catch(async (e) => {
                        if (e.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: testSetDocRef.path, operation: 'get' }));
                        }
                        throw e;
                    });

                    if (testSetDoc.exists()) {
                        const testSetData = testSetDoc.data() as TestSet;
                        setActiveQuestions(testSetData.questions);
                        setTestState("in_progress");
                    } else {
                        throw new Error("Test set not found");
                    }
                } else {
                    throw new Error("Scheduled test not found");
                }
            } catch (error: any) {
                console.warn("Test arena sync issue.");
                if (error.code !== 'permission-denied') {
                    toast({ variant: 'destructive', title: 'Failed to load test', description: error.message });
                    router.push('/profile');
                }
            }
        };

        fetchData();
    }, [searchParams, router, toast, db]);

    useEffect(() => {
        if (testState !== "in_progress") return;

        if (timeLeft <= 0) {
            handleSubmitTest();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testState, timeLeft]);


    const handleAnswerSelect = (questionId: string, answerEn: string, answerMr: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: { en: answerEn, mr: answerMr } }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activeQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitTest = async () => {
        if (!scheduledTest || !studentProfile || !db) return;

        let correctAnswers = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id]?.en === q.correctAnswer.en) {
                correctAnswers++;
            }
        });
        
        const finalAccuracy = (correctAnswers / activeQuestions.length) * 100;
        setScore(finalAccuracy);
        
        const timeTaken = initialDuration - timeLeft;
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        try {
            const resultId = `${studentProfile.id}-${scheduledTest.id}`;
            const resultDocRef = doc(db, "testResults", resultId);
            const resultData = {
                studentId: studentProfile.id,
                studentName: studentProfile.name,
                testId: scheduledTest.id,
                testName: scheduledTest.testSetName,
                score: finalAccuracy,
                rawScore: correctAnswers,
                totalQuestions: activeQuestions.length,
                answers: answers,
                timeTaken: timeString,
                date: new Date().toISOString(),
            };

            await setDoc(resultDocRef, resultData).catch(async (e) => {
                if (e.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: resultDocRef.path, operation: 'create', requestResourceData: resultData }));
                }
                throw e;
            });

            if (isLiveTest) {
                const leaderboardDocRef = doc(db, "leaderboard", resultId);
                const leaderboardData = {
                    name: studentProfile.name,
                    avatar: studentProfile.name.charAt(0),
                    score: correctAnswers, 
                    accuracy: finalAccuracy, 
                    totalQuestions: activeQuestions.length,
                    time: timeString
                };
                await setDoc(leaderboardDocRef, leaderboardData).catch(async (e) => {
                    if (e.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: leaderboardDocRef.path, operation: 'create', requestResourceData: leaderboardData }));
                    }
                    throw e;
                });
            }

            const studentRef = doc(db, "students", studentProfile.id);
            const currentStats = studentProfile.stats || { totalEarnings: 0, testsTaken: 0, avgScore: 0, performance: [], recentActivity: [] };
            
            const newTestsTaken = (currentStats.testsTaken || 0) + 1;
            const newAvgScore = Math.round(((currentStats.avgScore || 0) * (currentStats.testsTaken || 0) + finalAccuracy) / newTestsTaken);
            const newPerformance = [...(currentStats.performance || []), { name: scheduledTest.testSetName, score: Math.round(finalAccuracy) }].slice(-10);
            
            await updateDoc(studentRef, {
                "stats.testsTaken": newTestsTaken,
                "stats.avgScore": newAvgScore,
                "stats.performance": newPerformance,
            }).catch(async (e) => {
                if (e.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update' }));
                }
                throw e;
            });

            setTestState("completed");
            toast({
                title: timeLeft <= 0 ? "Time's Up!" : "Test Submitted!",
                description: `You achieved ${finalAccuracy.toFixed(0)}% accuracy (${correctAnswers}/${activeQuestions.length}).`
            });
        } catch (error) {
            console.error("Failed to save test results:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not save your test results." });
        }
    };

    const handleAskAi = async (question: Question) => {
        if (!scheduledTest) return;
        setIsAiSolving(question.id);
        setAiExplanation(null);
        setIsAiDialogOpen(true);

        try {
            const explanation = await solveDoubt({
                question: {
                    text: question.text,
                    options: question.options,
                    correctAnswer: question.correctAnswer
                },
                context: {
                    subject: scheduledTest.subject,
                    standard: scheduledTest.standard,
                    board: scheduledTest.board
                }
            });
            setAiExplanation(explanation);
        } catch (error) {
            toast({ variant: 'destructive', title: "AI Offline", description: "The AI tutor is currently busy. Please try again later." });
            setIsAiDialogOpen(false);
        } finally {
            setIsAiSolving(null);
        }
    };

    const handleGenerateNotes = async () => {
        if (!scheduledTest) return;
        setIsGeneratingNotes(true);
        setAiNotes(null);
        setIsNotesDialogOpen(true);

        const incorrectTopics = activeQuestions
            .filter(q => answers[q.id]?.en !== q.correctAnswer.en)
            .map(q => q.text.en)
            .slice(0, 5)
            .join(", ");

        try {
            const notes = await generateStudyNotes({
                subject: scheduledTest.subject,
                standard: scheduledTest.standard,
                board: scheduledTest.board,
                performanceContext: score < 100 ? `The student struggled with these specific concepts: ${incorrectTopics}` : "The student performed well, generate advanced summary notes.",
                topics: [scheduledTest.testSetName]
            });
            setAiNotes(notes);
        } catch (error) {
            toast({ variant: 'destructive', title: "Generation Failed", description: "AI Study notes could not be generated at this time." });
            setIsNotesDialogOpen(false);
        } finally {
            setIsGeneratingNotes(false);
        }
    };
    
    if (testState === "loading" || !studentProfile || !scheduledTest || activeQuestions.length === 0) {
        return (
             <Card className="w-full max-w-3xl text-center p-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                <CardTitle>Loading Test...</CardTitle>
                <CardDescription>Preparing your questions. Please wait.</CardDescription>
            </Card>
        )
    }
    
    if (testState === "review") {
        return (
            <>
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="text-primary"/> Test Review: {scheduledTest.testSetName}
                    </CardTitle>
                    <CardDescription>Reviewing answers for {studentProfile?.name}. Correct answers are marked in green.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-6">
                            {activeQuestions.map((q, index) => {
                                const userAnswer = answers[q.id];
                                const isCorrect = userAnswer?.en === q.correctAnswer.en;
                                return (
                                <div key={q.id} className="p-4 border rounded-xl space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-bold text-lg">{index + 1}. {q.text.mr}</p>
                                            <p className="font-medium text-muted-foreground">{q.text.en}</p>
                                        </div>
                                        {isCorrect ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1"/> Correct
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                                <XCircle className="w-3 h-3 mr-1"/> Incorrect
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {q.options.mr.map((optionMr, optionIndex) => {
                                            const optionEn = q.options.en[optionIndex];
                                            const isUserAnswer = userAnswer?.mr === optionMr;
                                            const isCorrectAnswer = q.correctAnswer.mr === optionMr;
                                            return (
                                                <div key={optionMr} className={cn(
                                                    "p-3 rounded-lg border text-sm transition-colors",
                                                    isCorrectAnswer && "bg-green-50 border-green-500 text-green-900 font-bold",
                                                    isUserAnswer && !isCorrectAnswer && "bg-red-50 border-red-500 text-red-900 line-through"
                                                )}>
                                                    <p>{optionMr}</p>
                                                    <p className="text-[10px] uppercase opacity-70">{optionEn}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs font-bold gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                                            onClick={() => handleAskAi(q)}
                                        >
                                            <BrainCircuit className="w-4 h-4" />
                                            ASK AI FOR EXPLANATION
                                        </Button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardContent>
                     <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="outline" onClick={() => setTestState("completed")}>
                            <ArrowLeft className="mr-2"/> Back to Results
                        </Button>
                        <Button asChild><Link href="/profile">Back to My Students</Link></Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary">
                            <Sparkles className="w-5 h-5" /> AI Tutor Explanation
                        </DialogTitle>
                        <DialogDescription>Conceptual breakdown of the selected question.</DialogDescription>
                    </DialogHeader>
                    {aiExplanation ? (
                        <div className="space-y-6 pt-4">
                            {aiExplanation.keyConcept && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                    Concept: {aiExplanation.keyConcept}
                                </Badge>
                            )}
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-primary">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-2">Marathi Explanation</h4>
                                    <p className="text-lg leading-relaxed">{aiExplanation.explanation.mr}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-accent">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-2">English Explanation</h4>
                                    <p className="text-lg leading-relaxed text-muted-foreground">{aiExplanation.explanation.en}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse font-medium">AI is thinking...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            </>
        )
    }

    if (testState === "completed") {
        return (
            <>
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">Test Results: {scheduledTest.testSetName}</CardTitle>
                    <CardDescription>For {studentProfile?.name}</CardDescription>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 my-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">You have completed the test.</p>
                    <p className="text-4xl font-bold">Accuracy: {score.toFixed(0)}%</p>
                    {score < 80 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-sm font-medium">
                            <Info size={18}/>
                            <span>Score 80%+ to qualify for leaderboard cash prizes!</span>
                        </div>
                    )}
                    
                    <div className="grid gap-3 pt-6">
                        <Button onClick={handleGenerateNotes} className="w-full py-8 text-lg font-black gap-3 shadow-xl bg-accent hover:bg-accent/90">
                            <ScrollText className="w-6 h-6" />
                            GENERATE AI STUDY NOTES
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={() => setTestState('review')} variant="outline" className="gap-2">
                                <BrainCircuit className="w-4 h-4"/> Review Answers
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/profile">Exit Workspace</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary text-2xl font-black">
                            <ScrollText className="w-7 h-7" /> AI PERSONALIZED STUDY NOTES
                        </DialogTitle>
                        <DialogDescription>Notes tailored to your board, standard, and recent test performance.</DialogDescription>
                    </DialogHeader>
                    
                    {aiNotes ? (
                        <div className="space-y-8 pt-6">
                            <div className="text-center space-y-2 border-b pb-6">
                                <h1 className="text-3xl font-black text-primary">{aiNotes.title}</h1>
                                <Badge variant="secondary" className="px-4 py-1 text-xs">{scheduledTest.board} • {scheduledTest.standard} • {scheduledTest.subject}</Badge>
                            </div>

                            {aiNotes.sections.map((section, idx) => (
                                <div key={idx} className="space-y-4 p-6 bg-muted/20 rounded-2xl border border-muted-foreground/10 group hover:border-primary/30 transition-colors">
                                    <div className="flex flex-col gap-1 border-l-4 border-primary pl-4">
                                        <h2 className="text-xl font-black text-primary">{section.heading.mr}</h2>
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{section.heading.en}</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <p className="text-lg leading-relaxed font-medium">{section.content.mr}</p>
                                            <ul className="space-y-2">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-2 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span>{point.mr}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-2 bg-background/50 p-4 rounded-xl">
                                            <p className="text-md leading-relaxed text-muted-foreground">{section.content.en}</p>
                                            <ul className="space-y-2">
                                                {section.keyPoints.map((point, pIdx) => (
                                                    <li key={pIdx} className="flex gap-2 text-xs text-muted-foreground italic">
                                                        <span>• {point.en}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-widest font-black text-primary flex items-center gap-2"><Sparkles className="w-4 h-4"/> Concept Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xl font-bold leading-relaxed">{aiNotes.summary.mr}</p>
                                    <p className="text-sm text-muted-foreground italic border-t pt-2">{aiNotes.summary.en}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 space-y-6">
                            <div className="relative">
                                <ScrollText className="w-20 h-20 text-primary animate-pulse" />
                                <Loader2 className="absolute inset-0 w-20 h-20 text-accent animate-spin opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-primary animate-pulse">Analyzing Performance...</p>
                                <p className="text-muted-foreground font-medium">Curating bilingual study material just for you.</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            </>
        );
    }
    
    const currentQuestion = activeQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;
    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;
    const isLowTime = timeLeft < 300; 
    const solvedCount = Object.keys(answers).length;


    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl text-primary">{scheduledTest.testSetName}</CardTitle>
                        <CardDescription>For {studentProfile?.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                         <Badge variant={isLiveTest ? "default" : "secondary"}>
                            {isLiveTest ? "Live Test" : "Practice"}
                        </Badge>
                        <Badge 
                            variant={isLowTime ? "destructive" : "secondary"} 
                            className={cn("flex items-center gap-2 font-mono text-lg transition-colors", isLowTime && "animate-pulse")}
                        >
                            <Clock className="w-4 h-4" />
                            {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                        </Badge>
                         <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-500">
                            <CheckCircle className="w-4 h-4" />
                            Solved: {solvedCount}
                        </Badge>
                    </div>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {activeQuestions.length}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <p className="text-2xl font-bold leading-tight">{currentQuestion.text.mr}</p>
                    <p className="text-lg font-medium text-muted-foreground italic">{currentQuestion.text.en}</p>
                </div>
                <RadioGroup 
                    value={answers[currentQuestion.id]?.mr || ""} 
                    onValueChange={(value) => {
                        const optionIndex = currentQuestion.options.mr.indexOf(value);
                        handleAnswerSelect(currentQuestion.id, currentQuestion.options.en[optionIndex], value);
                    }}
                    className="grid gap-3"
                >
                    {currentQuestion.options.mr.map((optionMr, index) => {
                        const optionEn = currentQuestion.options.en[index];
                        return (
                            <Label key={index} className="flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <RadioGroupItem value={optionMr} id={`q${currentQuestion.id}-o${index}`} className="mt-1" />
                                <div className="space-y-1">
                                    <p className="text-lg font-bold">{optionMr}</p>
                                    <p className="text-sm text-muted-foreground uppercase font-black opacity-60">{optionEn}</p>
                                </div>
                            </Label>
                        )
                    })}
                </RadioGroup>

                 <div className="flex justify-between items-center pt-8 border-t mt-4">
                    <Button variant="ghost" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2" /> Previous
                    </Button>
                     {currentQuestionIndex === activeQuestions.length - 1 ? (
                         <Button onClick={handleSubmitTest} className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 font-black">SUBMIT TEST</Button>
                     ) : (
                        <Button onClick={handleNextQuestion} className="px-10 font-black">
                            NEXT
                        </Button>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}


export default function MockTestPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
            </div>
        }>
            <ProtectedRoute>
                <div className="flex justify-center items-center min-h-screen p-4">
                    <MockTestContent />
                </div>
            </ProtectedRoute>
        </Suspense>
    )
}
