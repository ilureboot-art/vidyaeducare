
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, RefreshCw, Star, Trophy, X, Check, Timer, Coins, ShieldHalf, BrainCircuit, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";
import type { TestSet, Question } from "@/lib/question-bank";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type Lifeline = "fiftyFifty" | "switchQuestion" | "aiHint";
type GameState = "loading" | "playing" | "finished";

function QuizClashGameContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const db = useDb();
    
    const [gameState, setGameState] = useState<GameState>("loading");
    const [tournament, setTournament] = useState<QuizClashTournament | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [usedLifelines, setUsedLifelines] = useState<Lifeline[]>([]);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [finalTime, setFinalTime] = useState(0);
    
    const tournamentId = searchParams.get('tournamentId');
    const studentId = searchParams.get('studentId');

    useEffect(() => {
        if (!tournamentId || !user || !db) {
            if(!tournamentId || !user) router.push('/quiz-clash');
            return;
        }

        const fetchGameData = async () => {
            try {
                const tournamentDocRef = doc(db, "quizClashTournaments", tournamentId);
                const tournamentSnap = await getDoc(tournamentDocRef);

                if (!tournamentSnap.exists()) {
                    toast({ variant: 'destructive', title: "Tournament not found." });
                    router.push('/quiz-clash');
                    return;
                }
                const tourneyData = tournamentSnap.data() as QuizClashTournament;
                setTournament(tourneyData);

                const testSetDocRef = doc(db, "testSets", tourneyData.testSetId);
                const testSetSnap = await getDoc(testSetDocRef);

                if (!testSetSnap.exists()) {
                    toast({ variant: 'destructive', title: "Question set not found." });
                    router.push('/quiz-clash');
                    return;
                }
                const testSetData = testSetSnap.data() as TestSet;
                setQuestions(testSetData.questions);
                setGameState("playing");
            } catch (error) {
                console.error("Game data sync error.");
                router.push('/quiz-clash');
            }
        };

        fetchGameData();
    }, [tournamentId, user, router, toast, db]);

    useEffect(() => {
        if (gameState !== "playing" || isAnswerLocked) return;

        if (timeLeft <= 0) {
            handleGameOver("Time's up!");
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
            setFinalTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAnswerLocked, gameState]);

    const handleOptionSelect = (option: string) => {
        if (isAnswerLocked) return;
        setSelectedOption(option);
    };
    
    const handleLockAnswer = () => {
        if (!selectedOption) return;
        setIsAnswerLocked(true);
        
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer.mr || selectedOption === currentQuestion.correctAnswer.en;
        
        setTimeout(() => {
            if (isCorrect) {
                setFinalScore(prev => prev + 1);
                 if (currentQuestionIndex === questions.length - 1) {
                    handleGameOver("Congratulations! You finished the quiz!");
                } else {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedOption(null);
                    setIsAnswerLocked(false);
                    setTimeLeft(30);
                }
            } else {
                 handleGameOver("That was the wrong answer.");
            }
        }, 2000);
    };

    const handleGameOver = async (reason: string) => {
        if (gameState === 'finished' || !user || !tournamentId || !db) return;

        setGameState("finished");
        
        try {
            const resultsColRef = collection(db, "quizClashResults");
            const resultData = {
                tournamentId: tournamentId,
                userId: user.uid,
                studentId: studentId || "Unknown",
                score: finalScore,
                timeTaken: finalTime,
                timestamp: serverTimestamp(),
            };

            await addDoc(resultsColRef, resultData);
            
            toast({ title: "Quiz Finished!", description: `${reason} Syncing results with profile...`, duration: 5000 });

            setTimeout(() => {
                router.push(`/quiz-clash/results?tournamentId=${tournamentId}&studentId=${studentId}`);
            }, 2000);

        } catch (error) {
             toast({ variant: 'destructive', title: "Submission Failed" });
             router.push('/quiz-clash');
        }
    };

    const useLifeline = (lifeline: Lifeline) => {
        if (usedLifelines.includes(lifeline)) return;
        setUsedLifelines(prev => [...prev, lifeline]);
        
        if (lifeline === 'fiftyFifty') {
            const currentQuestion = questions[currentQuestionIndex];
            const incorrectOptions = currentQuestion.options.mr.filter(opt => opt !== currentQuestion.correctAnswer.mr);
            const optionsToRemove = incorrectOptions.slice(0, 2);
            
            const newQuestions = [...questions];
            const currentOptions = newQuestions[currentQuestionIndex].options;
            newQuestions[currentQuestionIndex].options.mr = currentOptions.mr.filter(opt => !optionsToRemove.includes(opt));
            newQuestions[currentQuestionIndex].options.en = currentOptions.en.filter((_, i) => !optionsToRemove.includes(currentOptions.mr[i]));
            setQuestions(newQuestions);
        } else if (lifeline === 'switchQuestion') {
             setCurrentQuestionIndex(prev => (prev < questions.length - 1 ? prev + 1 : 0));
        } else if (lifeline === 'aiHint') {
             toast({ title: 'AI Hint', description: "Focus on the logical derivation of the concept."});
        }
    };


    if (gameState === "loading" || !tournament) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-primary/90 gap-4">
                <Loader2 className="animate-spin text-white" size={48} />
                <p className="text-white animate-pulse font-bold tracking-widest uppercase text-xs">Synchronizing Challenge...</p>
            </div>
        );
    }
    
    if (gameState === "finished") {
        return (
             <div className="flex flex-col gap-4 justify-center items-center h-screen bg-primary/90">
                <Trophy className="w-16 h-16 text-yellow-400"/>
                <h1 className="text-2xl font-bold text-white">Quiz Complete!</h1>
                <p className="text-white/80">Calculating results...</p>
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-primary/90 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white">
            <Card className="w-full max-w-2xl bg-primary-foreground/10 text-white border-primary-foreground/20 backdrop-blur-lg">
                <CardHeader className="text-center pb-0">
                    <div className="flex justify-between items-center">
                        <div className="w-24 text-left">
                             <p className="text-sm flex items-center gap-1"><Users className="w-4 h-4"/> {tournament.registeredUsers.length}</p>
                        </div>
                         <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                <circle 
                                    className={cn("transition-all duration-1000", timeLeft < 10 ? "text-red-500" : "text-yellow-400")}
                                    strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - (timeLeft / 30))}
                                    strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"
                                />
                            </svg>
                            <span className={cn("text-3xl font-black z-10", timeLeft < 10 && "text-red-500 animate-pulse")}>{timeLeft}</span>
                        </div>
                        <div className="w-24 text-right">
                            <p className="text-xs opacity-70">Question</p>
                            <p className="font-black text-xl">{currentQuestionIndex + 1}/{questions.length}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="p-6 bg-black/20 rounded-2xl text-center min-h-[120px] flex items-center justify-center flex-col gap-2 border border-white/5">
                        <p className="text-2xl font-black leading-tight">{currentQuestion.text.mr}</p>
                        <p className="text-md text-white/60 italic">{currentQuestion.text.en}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.mr.map((option, index) => {
                            const isSelected = selectedOption === option;
                            const isCorrect = option === currentQuestion.correctAnswer.mr;
                            const optionEn = currentQuestion.options.en[index] || '';
                            return (
                                <Button
                                    key={index}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={isAnswerLocked}
                                    className={cn(
                                        "h-auto py-4 px-6 text-lg whitespace-normal justify-start transition-all duration-300 flex flex-col items-start rounded-2xl",
                                        "bg-black/20 hover:bg-black/40 border-2 border-white/10",
                                        isSelected && !isAnswerLocked && "border-yellow-400 bg-yellow-900/40",
                                        isAnswerLocked && isCorrect && "bg-green-50 border-green-300 animate-pulse text-white",
                                        isAnswerLocked && isSelected && !isCorrect && "bg-red-50 border-red-300 text-white",
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-black border border-white/10">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="font-bold">{option}</span>
                                    </div>
                                    <div className="text-xs opacity-50 pl-11 font-medium">{optionEn}</div>
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 pb-8">
                     <Button
                        size="lg"
                        className="w-full h-16 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xl shadow-xl rounded-2xl"
                        onClick={handleLockAnswer}
                        disabled={isAnswerLocked || !selectedOption}
                      >
                       {isAnswerLocked ? <Loader2 className="animate-spin" /> : "LOCK FINAL ANSWER"}
                    </Button>
                    <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-white/5">
                        <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('fiftyFifty')} disabled={usedLifelines.includes('fiftyFifty')}>
                            <ShieldHalf className="w-6 h-6 mb-1 text-yellow-400"/><span className="text-[10px] font-black uppercase tracking-widest">50:50</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('switchQuestion')} disabled={usedLifelines.includes('switchQuestion')}>
                            <RefreshCw className="w-6 h-6 mb-1 text-yellow-400"/><span className="text-[10px] font-black uppercase tracking-widest">Switch</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('aiHint')} disabled={usedLifelines.includes('aiHint')}>
                            <BrainCircuit className="w-6 h-6 mb-1 text-yellow-400"/><span className="text-[10px] font-black uppercase tracking-widest">AI Hint</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
             <Dialog open={isQuitConfirmOpen} onOpenChange={setIsQuitConfirmOpen}>
                <DialogTrigger asChild><Button variant="link" className="mt-4 text-white/30 hover:text-white/60 font-bold uppercase tracking-widest text-[10px]">Quit Challenge</Button></DialogTrigger>
                <DialogContent className="text-black">
                    <DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsQuitConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleGameOver("You quit.")}>Yes, Quit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function QuizClashGamePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen bg-primary/90"><Loader2 className="animate-spin text-white" size={48} /></div>}>
            <ProtectedRoute>
                <div className="min-h-screen">
                    <QuizClashGameContent/>
                </div>
            </ProtectedRoute>
        </Suspense>
    )
}
