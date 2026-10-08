"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
    const [questions, setQuestions] = useState<Omit<Question, "correctAnswer">[]>([]);
    const revision = useRef(0);
    const deadline = useRef(0);
    const clockOffset = useRef(0);
    const autoFinished = useRef(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [questionCount, setQuestionCount] = useState(1);
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

    const callQuiz = async (action: string, extra: Record<string, unknown> = {}) => {
        if (!user) throw new Error('Sign in to play.');
        const response = await fetch('/api/quiz-clash', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ action, tournamentId, studentId, revision: revision.current, questionId: questions[0]?.id, ...extra }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Quiz sync failed.');
        return data;
    };
    const applyServer = (data: any) => {
        revision.current = data.revision;
        deadline.current = data.deadline;
        clockOffset.current = data.serverNow - Date.now();
        setTournament(data.tournament);
        setQuestions(data.question ? [data.question] : []);
        setCurrentQuestionIndex(0);
        setQuestionNumber(data.questionNumber);
        setQuestionCount(data.questionCount);
        setFinalScore(data.score);
        setUsedLifelines(data.usedLifelines);
        setTimeLeft(Math.max(0, Math.ceil((data.deadline - data.serverNow) / 1000)));
        setSelectedOption(null);
        autoFinished.current = false;
        setGameState(data.status === 'FINISHED' ? 'finished' : 'playing');
        if (data.status === 'FINISHED') router.push(`/quiz-clash/results?tournamentId=${tournamentId}&studentId=${studentId}`);
        setHiddenIndices(data.hiddenIndices || []);
    };
    const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
    useEffect(() => {
        if (!user || !tournamentId || !studentId) return;
        let cancelled = false;
        callQuiz('start').then(data => { if (!cancelled) applyServer(data); }).catch(error => {
            if (cancelled) return;
            toast({ variant: 'destructive', title: 'Unable to start quiz', description: error.message });
            router.push('/quiz-clash');
        });
        return () => { cancelled = true; };
    }, [user?.uid, tournamentId, studentId]);
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => setTimeLeft(Math.max(0, Math.ceil((deadline.current - Date.now() - clockOffset.current) / 1000))), 500);
        return () => clearInterval(timer);
    }, [gameState]);
    useEffect(() => {
        if (gameState === 'playing' && timeLeft <= 0 && !isAnswerLocked && !autoFinished.current) {
            autoFinished.current = true;
            void handleGameOver("Time's up!");
        }
    }, [gameState, timeLeft, isAnswerLocked]);
    const handleOptionSelect = (option: string) => { if (!isAnswerLocked) setSelectedOption(option); };
    const handleLockAnswer = async () => {
        if (!selectedOption || isAnswerLocked) return;
        setIsAnswerLocked(true);
        try {
            const data = await callQuiz('answer', { optionIndex: questions[0].options.mr.indexOf(selectedOption) });
            applyServer(data);
            if (data.feedback) toast({ title: data.feedback.correct ? 'Correct answer' : 'Incorrect answer' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Answer not confirmed', description: error instanceof Error ? error.message : 'Reload to resume.' });
        } finally { setIsAnswerLocked(false); }
    };
    const handleGameOver = async (reason: string) => {
        if (gameState === 'finished' || isAnswerLocked) return;
        setIsAnswerLocked(true);
        try { applyServer(await callQuiz(reason === "Time's up!" ? 'timeout' : 'quit')); }
        catch (error) { toast({ variant: 'destructive', title: 'Quiz sync failed', description: error instanceof Error ? error.message : 'Reload to resume.' }); }
        finally { setIsAnswerLocked(false); }
    };
    const useLifeline = async (lifeline: Lifeline) => {
        if (isAnswerLocked || usedLifelines.includes(lifeline)) return;
        setIsAnswerLocked(true);
        try {
            applyServer(await callQuiz('lifeline', { lifeline }));
            if (lifeline === 'aiHint') toast({ title: 'Concept hint', description: 'Focus on the logical derivation of the concept.' });
        } catch (error) { toast({ variant: 'destructive', title: 'Lifeline unavailable', description: error instanceof Error ? error.message : 'Please retry.' }); }
        finally { setIsAnswerLocked(false); }
    };

    if (gameState === "loading" || !tournament || (gameState === "playing" && !questions.length)) {
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
                            <p className="font-black text-xl">{questionNumber}/{questionCount}</p>
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
                            if (hiddenIndices.includes(index)) return null;
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
                                        isAnswerLocked && isSelected && "border-yellow-400 animate-pulse",
                                        
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
                        <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('fiftyFifty')} disabled={isAnswerLocked || usedLifelines.includes('fiftyFifty')}>
                            <ShieldHalf className="w-6 h-6 mb-1 text-yellow-400"/><span className="text-[10px] font-black uppercase tracking-widest">50:50</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('switchQuestion')} disabled={isAnswerLocked || usedLifelines.includes('switchQuestion')}>
                            <RefreshCw className="w-6 h-6 mb-1 text-yellow-400"/><span className="text-[10px] font-black uppercase tracking-widest">Switch</span>
                        </Button>
                         <Button variant="ghost" className="flex-col h-auto py-3 rounded-xl hover:bg-white/5 disabled:opacity-20" onClick={() => useLifeline('aiHint')} disabled={isAnswerLocked || usedLifelines.includes('aiHint')}>
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
