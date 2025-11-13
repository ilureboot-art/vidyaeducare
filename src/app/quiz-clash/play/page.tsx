
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";
import type { TestSet, Question } from "@/lib/question-bank";

type Lifeline = "fiftyFifty" | "switchQuestion" | "aiHint";
type GameState = "loading" | "playing" | "finished";

function QuizClashGameContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
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

    useEffect(() => {
        if (!tournamentId || !user) {
            router.push('/quiz-clash');
            return;
        }

        const fetchGameData = async () => {
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
        };

        fetchGameData();
    }, [tournamentId, user, router, toast]);

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
        if (!selectedOption) {
            toast({ variant: "destructive", title: "No option selected", description: "Please select an answer to lock." });
            return;
        }
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
        if (gameState === 'finished' || !user || !tournamentId) return;

        setGameState("finished");
        
        try {
            await addDoc(collection(db, "quizClashResults"), {
                tournamentId: tournamentId,
                userId: user.uid,
                score: finalScore,
                timeTaken: finalTime,
                timestamp: serverTimestamp(),
            });

             toast({
                title: "Quiz Finished!",
                description: `${reason} Your score is being submitted.`,
                duration: 5000,
            });

            // Redirect to a results page after a delay
            setTimeout(() => {
                router.push(`/quiz-clash/results?tournamentId=${tournamentId}`);
            }, 2000);

        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Submission Failed",
                description: "There was an error submitting your score.",
            });
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
            // Also filter corresponding english options
            newQuestions[currentQuestionIndex].options.en = currentOptions.en.filter((_, i) => !optionsToRemove.includes(currentOptions.mr[i]));
            setQuestions(newQuestions);
        }
        else if (lifeline === 'switchQuestion') {
             // In a real app, this would fetch another question from the backend.
             // For now, we'll just show a toast as a placeholder for the logic.
             toast({ title: 'Lifeline Used: Switch', description: 'Question has been switched.'});
             const nextIndex = currentQuestionIndex < questions.length - 1 ? currentQuestionIndex + 1 : 0;
             setCurrentQuestionIndex(nextIndex);
        }
        else if (lifeline === 'aiHint') {
             toast({ title: 'AI Hint', description: "The answer is often the most famous choice among the options."});
        }
    };


    if (gameState === "loading" || !tournament) {
        return <div className="flex justify-center items-center h-screen bg-primary/90 dark:bg-slate-900"><Loader2 className="animate-spin text-white" size={48} /></div>;
    }
    
    if (gameState === "finished") {
        return (
             <div className="flex flex-col gap-4 justify-center items-center h-screen bg-primary/90 dark:bg-slate-900">
                <Trophy className="w-16 h-16 text-yellow-400"/>
                <h1 className="text-2xl font-bold text-white">Quiz Complete!</h1>
                <p className="text-white/80">Calculating results...</p>
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-primary/90 dark:bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white">
            <Card className="w-full max-w-2xl bg-primary-foreground/10 text-white border-primary-foreground/20 backdrop-blur-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-between items-center">
                        <div className="w-24 text-left">
                             <p className="text-sm flex items-center gap-1"><Users className="w-4 h-4"/> {tournament.registeredPlayers.length}</p>
                        </div>
                         <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"/>
                                <circle 
                                    className="text-yellow-400"
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 45}
                                    strokeDashoffset={2 * Math.PI * 45 * (1 - (timeLeft / 30))}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="45" cx="50" cy="50"
                                    style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                />
                            </svg>
                            <span className="text-3xl font-bold z-10">{timeLeft}</span>
                        </div>
                        <div className="w-24 text-right">
                            <p className="text-sm">Question {currentQuestionIndex + 1}/{questions.length}</p>
                             <p className="font-bold text-lg text-yellow-300">Score: {finalScore}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-black/20 rounded-lg text-center min-h-[100px] flex items-center justify-center flex-col">
                        <p className="text-xl font-semibold">{currentQuestion.text.mr}</p>
                        <p className="text-md text-white/70">{currentQuestion.text.en}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        "h-auto py-3 text-lg whitespace-normal justify-start transition-all duration-300 flex flex-col items-start",
                                        "bg-black/20 hover:bg-black/40 border-2 border-primary-foreground/30",
                                        isSelected && !isAnswerLocked && "border-yellow-400 bg-yellow-900/50",
                                        isAnswerLocked && isCorrect && "bg-green-500 border-green-300 animate-pulse",
                                        isAnswerLocked && isSelected && !isCorrect && "bg-red-500 border-red-300",
                                    )}
                                >
                                    <div>
                                        <span className="font-bold text-yellow-400 mr-3">{String.fromCharCode(65 + index)}:</span>
                                        <span>{option}</span>
                                    </div>
                                    <div className="text-sm text-white/60 pl-8">{optionEn}</div>
                                </Button>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                     <Button
                        size="lg"
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                        onClick={handleLockAnswer}
                        disabled={isAnswerLocked || !selectedOption}
                      >
                       {isAnswerLocked ? <Loader2 className="animate-spin" /> : "Lock Answer"}
                    </Button>
                    <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-white/10">
                        <Button variant="ghost" className="flex-col h-auto disabled:opacity-30" onClick={() => useLifeline('fiftyFifty')} disabled={usedLifelines.includes('fiftyFifty')}>
                            <ShieldHalf className="w-8 h-8"/><span>50:50</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto disabled:opacity-30" onClick={() => useLifeline('switchQuestion')} disabled={usedLifelines.includes('switchQuestion')}>
                            <RefreshCw className="w-8 h-8"/><span>Switch</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto disabled:opacity-30" onClick={() => useLifeline('aiHint')} disabled={usedLifelines.includes('aiHint')}>
                            <BrainCircuit className="w-8 h-8"/><span>AI Hint</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
             <Dialog open={isQuitConfirmOpen} onOpenChange={setIsQuitConfirmOpen}>
                <DialogTrigger asChild><Button variant="link" className="mt-4 text-white/50">Quit Game</Button></DialogTrigger>
                <DialogContent className="text-black">
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to quit?</DialogTitle>
                        <DialogDescription>
                            If you quit now, your current score will be submitted, but you cannot continue.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsQuitConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleGameOver("You quit the game.")}>Yes, Quit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function QuizClashGamePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen bg-primary/90 dark:bg-slate-900"><Loader2 className="animate-spin text-white" size={48} /></div>}>
            <ProtectedRoute>
                <QuizClashGameContent/>
            </ProtectedRoute>
        </Suspense>
    )
}
