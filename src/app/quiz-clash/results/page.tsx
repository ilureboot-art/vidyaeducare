
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Trophy, Award, Users, IndianRupee, Star } from "lucide-react";
import Link from "next/link";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";
import UserLayout from "@/components/UserLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Result = {
    userId: string;
    studentId?: string;
    score: number;
    timeTaken: number;
    rank?: number;
    prize?: number;
    userName?: string;
};

const getRankStyles = (rank: number) => {
    if (rank === 1) return "border-yellow-400 bg-yellow-400/5 ring-1 ring-yellow-400/20";
    if (rank === 2) return "border-slate-300 bg-slate-300/5";
    if (rank === 3) return "border-amber-600 bg-amber-600/5";
    if (rank <= 5) return "border-primary/20 bg-primary/5";
    return "border-transparent";
}

const RankIdentifier = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />;
    if (rank === 2) return <Award className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    if (rank <= 5) return (
        <Badge className="bg-primary text-primary-foreground font-black text-[9px] px-2 h-5">
            TOP {rank}
        </Badge>
    );
    return <span className="text-muted-foreground font-bold w-6 text-center">{rank}</span>;
}

function QuizClashResultsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournamentId');
    const studentIdParam = searchParams.get('studentId');
    const db = useDb();

    const [tournament, setTournament] = useState<QuizClashTournament | null>(null);
    const [results, setResults] = useState<Result[] | null>(null);
    const [userResult, setUserResult] = useState<Result | null>(null);

    useEffect(() => {
        if (!tournamentId || !db) {
            if (!tournamentId) router.push('/quiz-clash');
            return;
        }

        const processResults = async () => {
            const tournamentDocRef = doc(db, "quizClashTournaments", tournamentId);
            const tournamentSnap = await getDoc(tournamentDocRef);
            if (!tournamentSnap.exists()) { router.push('/quiz-clash'); return; }
            
            const tourneyData = tournamentSnap.data() as QuizClashTournament;
            setTournament(tourneyData);

            if (tourneyData.status === 'completed') {
                const q = query(collection(db, "quizClashResults"), where("tournamentId", "==", tournamentId), orderBy("rank", "asc"));
                const resultsSnap = await getDocs(q);
                const resultsData = resultsSnap.docs.map(d => d.data() as Result);
                setResults(resultsData);
                const currentUserResult = resultsData.find(r => r.userId === user?.uid);
                setUserResult(currentUserResult || null);
            } else {
                const q = query(collection(db, "quizClashResults"), where("tournamentId", "==", tournamentId), orderBy("score", "desc"), orderBy("timeTaken", "asc"));
                const resultsSnap = await getDocs(q);
                const fetchedResults = resultsSnap.docs.map(d => ({...d.data(), id: d.id}) as Result & { id: string });

                for (let result of fetchedResults) {
                    const userDoc = await getDoc(doc(db, "users", result.userId));
                    result.userName = userDoc.exists() ? userDoc.data().name : "Unknown User";
                }

                let finalResults: Result[] = [];

                if (tourneyData.type === 'Pro') {
                    const distributablePool = tourneyData.prizePool * 0.80;
                    const prizeDistribution = [0.40, 0.30, 0.20, 0.10];
                    const winners = fetchedResults.slice(0, 4);

                    winners.forEach((winner, index) => {
                        winner.prize = distributablePool * prizeDistribution[index];
                        winner.rank = index + 1;
                    });
                    
                    finalResults = fetchedResults.map((r, i) => ({ ...r, rank: r.rank || i + 1 }));

                    await runTransaction(db, async (transaction) => {
                        for (const winner of winners) {
                            if (winner.prize && winner.prize > 0) {
                                const userWalletRef = doc(db, "wallets", winner.userId);
                                const userWalletDoc = await transaction.get(userWalletRef);
                                const currentBalance = userWalletDoc.exists() ? userWalletDoc.data()?.balance || 0 : 0;
                                transaction.update(userWalletRef, { balance: currentBalance + winner.prize });
                            
                                const prizeTxRef = doc(collection(db, "transactions"));
                                transaction.set(prizeTxRef, {
                                    user: winner.userId,
                                    amount: winner.prize,
                                    date: serverTimestamp(),
                                    description: `Prize for Quiz Clash: ${tourneyData.title} (Rank #${winner.rank})`,
                                    status: "Completed",
                                    type: "Prize",
                                });

                                // --- SYNC EARNINGS TO STUDENT PROFILE ---
                                if (winner.studentId) {
                                    const studentRef = doc(db, "students", winner.studentId);
                                    const studentSnap = await transaction.get(studentRef);
                                    if (studentSnap.exists()) {
                                        const currentEarnings = studentSnap.data().stats?.totalEarnings || 0;
                                        transaction.update(studentRef, { "stats.totalEarnings": currentEarnings + winner.prize });
                                    }
                                }
                            }
                        }
                        transaction.update(tournamentDocRef, { status: "completed" });
                    });
                } else {
                    finalResults = fetchedResults.map((r, i) => ({ ...r, rank: i + 1 }));
                    await updateDoc(tournamentDocRef, { status: "completed" });
                }

                setResults(finalResults);
                const currentUserResult = finalResults.find(r => r.userId === user?.uid);
                setUserResult(currentUserResult || null);
            }
        };

        processResults();
    }, [tournamentId, router, user, db]);

    if (!results || !tournament) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center h-screen bg-primary/90">
                <Trophy className="w-16 h-16 text-yellow-400"/>
                <h1 className="text-2xl font-bold text-white">Calculating Final Ranks...</h1>
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }
    
    return (
        <UserLayout>
            <div className="w-full max-w-2xl mx-auto space-y-6">
                <Card className="shadow-2xl border-none ring-1 ring-primary/10 text-center mt-4 overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-8 border-b">
                        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-2"/>
                        <CardTitle className="text-3xl font-black text-primary uppercase italic tracking-tight">Final Standings</CardTitle>
                        <CardDescription className="font-bold">{tournament.title} • {tournament.type} Clash</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {userResult ? (
                            <div className="p-8 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Your Final Performance</p>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <p className="text-6xl font-black text-primary tracking-tighter">#{userResult.rank}</p>
                                        <p className="text-[10px] font-black uppercase text-primary">GLOBAL RANK</p>
                                    </div>
                                    <div className="w-px h-16 bg-primary/10" />
                                    <div className="text-center">
                                        <p className="text-4xl font-black tracking-tighter">{userResult.score}</p>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">SCORE</p>
                                    </div>
                                </div>
                                {userResult.prize ? (
                                    <div className="mt-8 py-3 px-6 bg-green-500 text-white rounded-2xl font-black text-xl shadow-lg animate-pulse inline-flex items-center gap-2">
                                        <Star className="w-5 h-5 fill-white" />
                                        WON ₹{userResult.prize.toFixed(2)}
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-muted-foreground mt-6 uppercase tracking-widest">
                                        {tournament.type === 'Pro' ? "Keep practicing to win!" : "Excellent progress!"}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No participation record found for this session.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-xl ring-1 ring-primary/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase italic text-primary">
                            <Users size={20}/> Challenge Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-6">
                        {results.slice(0,10).map((res) => (
                                 <div key={res.userId} className={cn(
                                     "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group hover:scale-[1.01]",
                                     getRankStyles(res.rank || 0)
                                 )}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 flex justify-center">
                                            <RankIdentifier rank={res.rank || 0} />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-tight">{res.userId === user?.uid ? "YOU" : res.userName}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Score: {res.score} • Time: {res.timeTaken}s</p>
                                        </div>
                                    </div>
                                    {res.prize && (
                                        <div className="font-black text-green-600 flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                            <Star className="w-3 h-3 fill-green-600" />
                                            <span className="text-sm">₹{res.prize.toFixed(0)}</span>
                                        </div>
                                    )}
                                 </div>
                            ))}
                    </CardContent>
                    <CardFooter className="p-6 bg-muted/20">
                        <Button asChild className="w-full font-black py-6">
                            <Link href="/quiz-clash">RETURN TO ARENA</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </UserLayout>
    )
}


export default function QuizClashResultsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen bg-primary/90"><Loader2 className="animate-spin text-white" size={48} /></div>}>
            <ProtectedRoute>
                <QuizClashResultsContent />
            </ProtectedRoute>
        </Suspense>
    );
}
