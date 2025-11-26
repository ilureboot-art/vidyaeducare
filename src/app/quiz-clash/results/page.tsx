
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Trophy, Award, Users, IndianRupee } from "lucide-react";
import Link from "next/link";
import { useAuth, useDbService } from "@/firebase/provider";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";

type Result = {
    userId: string;
    score: number;
    timeTaken: number;
    rank?: number;
    prize?: number;
    userName?: string;
};

const getRankColor = (rank: number) => {
    if (rank === 1) return "border-yellow-400";
    if (rank === 2) return "border-gray-400";
    if (rank === 3) return "border-amber-600";
    return "border-transparent";
}

function QuizClashResultsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournamentId');
    const db = useDbService();

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
                // If results are already calculated, just fetch them
                const q = query(collection(db, "quizClashResults"), where("tournamentId", "==", tournamentId), orderBy("rank", "asc"));
                const resultsSnap = await getDocs(q);
                const resultsData = resultsSnap.docs.map(d => d.data() as Result);
                setResults(resultsData);
                const currentUserResult = resultsData.find(r => r.userId === user?.uid);
                setUserResult(currentUserResult || null);
            } else {
                // Calculate results
                const q = query(collection(db, "quizClashResults"), where("tournamentId", "==", tournamentId), orderBy("score", "desc"), orderBy("timeTaken", "asc"));
                const resultsSnap = await getDocs(q);
                const fetchedResults = resultsSnap.docs.map(d => ({...d.data(), id: d.id}) as Result & { id: string });

                // Fetch user names
                for (let result of fetchedResults) {
                    const userDoc = await getDoc(doc(db, "users", result.userId));
                    result.userName = userDoc.exists() ? userDoc.data().name : "Unknown Player";
                }

                let finalResults: Result[] = [];

                if (tourneyData.type === 'Pro') {
                    // Calculate prizes for Pro tournaments
                    const distributablePool = tourneyData.prizePool * 0.80;
                    const prizeDistribution = [0.40, 0.30, 0.20, 0.10];
                    const winners = fetchedResults.slice(0, 4);

                    winners.forEach((winner, index) => {
                        winner.prize = distributablePool * prizeDistribution[index];
                        winner.rank = index + 1;
                    });
                    
                    finalResults = fetchedResults.map((r, i) => ({ ...r, rank: r.rank || i + 1 }));

                     // Save results and distribute prizes in a transaction
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
                            }
                        }
                        transaction.update(tournamentDocRef, { status: "completed" });
                    });
                } else {
                    // Just rank for Practice tournaments
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
            <div className="flex flex-col gap-4 justify-center items-center h-screen bg-primary/90 dark:bg-slate-900">
                <Trophy className="w-16 h-16 text-yellow-400"/>
                <h1 className="text-2xl font-bold text-white">Calculating Final Ranks...</h1>
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card className="shadow-lg text-center mt-4">
                <CardHeader>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500"/>
                    <CardTitle className="text-3xl font-bold text-primary">Final Results</CardTitle>
                    <CardDescription>{tournament.title} ({tournament.type} Clash)</CardDescription>
                </CardHeader>
                <CardContent>
                    {userResult ? (
                        <div className="p-6 bg-primary/10 rounded-lg">
                            <p className="text-muted-foreground">Your Rank</p>
                            <p className="text-6xl font-bold">#{userResult.rank}</p>
                            {userResult.prize ? (
                                <p className="text-2xl font-semibold text-green-600 mt-2">You Won ₹{userResult.prize.toFixed(2)}!</p>
                            ) : (
                                <p className="text-lg font-semibold text-muted-foreground mt-2">
                                    {tournament.type === 'Pro' ? "Better luck next time!" : "Great practice!"}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">You did not participate in this tournament.</p>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users/> Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {results.slice(0,10).map((res) => (
                             <div key={res.userId} className={`flex items-center justify-between p-3 rounded-lg border-2 ${getRankColor(res.rank || 0)}`}>
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-lg w-8 text-center">{res.rank || '-'}</div>
                                    <div>
                                        <p className="font-semibold">{res.userId === user?.uid ? "You" : res.userName}</p>
                                        <p className="text-xs text-muted-foreground">Score: {res.score} | Time: {res.timeTaken}s</p>
                                    </div>
                                </div>
                                {res.prize && (
                                    <div className="font-bold text-green-600 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-500" />
                                        ₹{res.prize.toFixed(2)}
                                    </div>
                                )}
                             </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/quiz-clash">Back to Quiz Clash</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}


export default function QuizClashResultsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen bg-primary/90 dark:bg-slate-900"><Loader2 className="animate-spin text-white" size={48} /></div>}>
            <ProtectedRoute>
                <QuizClashResultsContent />
            </ProtectedRoute>
        </Suspense>
    );
}
