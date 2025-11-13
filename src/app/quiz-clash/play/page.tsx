
"use client";

import { useState, useEffect } from "react";
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

const prizeLadder = [
    { q: 1, amount: 100 }, { q: 2, amount: 200 }, { q: 3, amount: 300 }, { q: 4, amount: 500 },
    { q: 5, amount: 1000, safe: true }, { q: 6, amount: 2000 }, { q: 7, amount: 4000 }, { q: 8, amount: 8000 },
    { q: 9, amount: 16000 }, { q: 10, amount: 32000, safe: true }, { q: 11, amount: 64000 }, { q: 12, amount: 125000 },
    { q: 13, amount: 250000 }, { q: 14, amount: 500000 }, { q: 15, amount: 1000000 }
];

const mockQuestions = prizeLadder.map(p => ({
    id: `q${p.q}`,
    text: `This is dummy question number ${p.q}. What is the capital of France?`,
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris"
}));

type Lifeline = "fiftyFifty" | "switchQuestion" | "aiHint";

function QuizClashGameContent() {
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState(mockQuestions);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [usedLifelines, setUsedLifelines] = useState<Lifeline[]>([]);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
    
    useEffect(() => {
        // Fetch questions for the tournament from the backend
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isAnswerLocked || isLoading) return;

        if (timeLeft <= 0) {
            handleGameOver("Time's up!");
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAnswerLocked, isLoading]);

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
        
        const isCorrect = selectedOption === questions[currentQuestionIndex].correctAnswer;
        
        setTimeout(() => {
            if (isCorrect) {
                 if (currentQuestionIndex === questions.length - 1) {
                    handleGameOver("Congratulations! You've won the grand prize!", true);
                } else {
                    // Move to next question
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedOption(null);
                    setIsAnswerLocked(false);
                    setTimeLeft(30);
                }
            } else {
                 handleGameOver("That was the wrong answer.");
            }
        }, 2000); // Wait 2 seconds to show correct/incorrect status
    };

    const handleGameOver = (reason: string, isGrandPrizeWinner = false) => {
        let winnings = 0;
        if(isGrandPrizeWinner) {
             winnings = prizeLadder[prizeLadder.length - 1].amount;
        } else {
            const lastSafePoint = [...prizeLadder]
                .reverse()
                .find(p => p.safe && p.q <= currentQuestionIndex);
            winnings = lastSafePoint?.amount || 0;
        }

        toast({
            title: "Game Over!",
            description: `${reason} You've won ₹${winnings}.`,
            duration: 10000
        });
        router.push("/quiz-clash");
    };
    
    const handleQuit = () => {
        const lastQuestionIndex = currentQuestionIndex - 1;
        const winnings = lastQuestionIndex < 0 ? 0 : prizeLadder[lastQuestionIndex].amount;
        toast({
            title: "You Quit!",
            description: `You've walked away with ₹${winnings}.`,
            duration: 10000
        });
        router.push("/quiz-clash");
    }

    const useLifeline = (lifeline: Lifeline) => {
        if (usedLifelines.includes(lifeline)) return;
        
        setUsedLifelines(prev => [...prev, lifeline]);
        
        if (lifeline === 'fiftyFifty') {
            const currentQuestion = questions[currentQuestionIndex];
            const incorrectOptions = currentQuestion.options.filter(opt => opt !== currentQuestion.correctAnswer);
            const optionsToRemove = incorrectOptions.slice(0, 2);
            
            const newQuestions = [...questions];
            const currentOptions = newQuestions[currentQuestionIndex].options;
            newQuestions[currentQuestionIndex].options = currentOptions.filter(opt => !optionsToRemove.includes(opt));
            setQuestions(newQuestions);
        }
        else if (lifeline === 'switchQuestion') {
             const newQuestions = [...questions];
             newQuestions[currentQuestionIndex] = { id: 'switched', text: "This is a new switched question. What is 2+2?", options: ["3", "4", "5", "6"], correctAnswer: "4" };
             setQuestions(newQuestions);
        }
        else if (lifeline === 'aiHint') {
             toast({ title: 'AI Hint', description: "The answer is often the most famous choice among the options."});
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-primary/90 dark:bg-slate-900"><Loader2 className="animate-spin text-white" size={48} /></div>;
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const currentPrize = prizeLadder[currentQuestionIndex];

    return (
        <div className="bg-primary/90 dark:bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-white">
            <Card className="w-full max-w-2xl bg-primary-foreground/10 text-white border-primary-foreground/20 backdrop-blur-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-between items-center">
                        <div className="w-24 text-left">
                             <p className="text-sm flex items-center gap-1"><Users className="w-4 h-4"/> 125</p>
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
                            <p className="font-bold text-lg text-yellow-300">₹{currentPrize.amount.toLocaleString()}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-black/20 rounded-lg text-center min-h-[100px] flex items-center justify-center">
                        <p className="text-xl font-semibold">{currentQuestion.text}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === option;
                            const isCorrect = currentQuestion.correctAnswer === option;
                            return (
                                <Button
                                    key={index}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={isAnswerLocked}
                                    className={cn(
                                        "h-auto py-3 text-lg whitespace-normal justify-start transition-all duration-300",
                                        "bg-black/20 hover:bg-black/40 border-2 border-primary-foreground/30",
                                        isSelected && !isAnswerLocked && "border-yellow-400 bg-yellow-900/50",
                                        isAnswerLocked && isCorrect && "bg-green-500 border-green-300 animate-pulse",
                                        isAnswerLocked && isSelected && !isCorrect && "bg-red-500 border-red-300",
                                    )}
                                >
                                    <span className="font-bold text-yellow-400 mr-3">{String.fromCharCode(65 + index)}:</span>
                                    <span>{option}</span>
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
                            If you quit now, you will walk away with the prize money from the last question you answered correctly.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsQuitConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleQuit}>Yes, Quit Game</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function QuizClashGamePage() {
    return (
        <ProtectedRoute>
            <QuizClashGameContent/>
        </ProtectedRoute>
    )
}
