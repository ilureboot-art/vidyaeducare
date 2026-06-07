
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Puzzle, Users, IndianRupee, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, runTransaction, serverTimestamp } from "firebase/firestore";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";
import { Badge } from "@/components/ui/badge";
import UserLayout from "@/components/UserLayout";


function QuizClashPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const db = useDb();
  const [tournaments, setTournaments] = useState<QuizClashTournament[] | null>(null);

  useEffect(() => {
    if (!db) return;
    const fetchTournaments = async () => {
        const q = query(collection(db, "quizClashTournaments"), where("status", "==", "scheduled"));
        const querySnapshot = await getDocs(q);
        const tournamentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizClashTournament));
        setTournaments(tournamentList);
    };
    fetchTournaments();
  }, [db]);

  const handleRegister = async (tournament: QuizClashTournament) => {
    if (!user || !db) {
        toast({ variant: "destructive", title: "Not logged in" });
        return;
    }
    
    if (tournament.registeredUsers.includes(user.uid)) {
        toast({ title: "Already Registered", description: "You are already registered for this tournament."});
        return;
    }

    try {
        if (tournament.type === 'Pro') {
            await runTransaction(db, async (transaction) => {
                const userWalletRef = doc(db, "wallets", user.uid);
                const tournamentRef = doc(db, "quizClashTournaments", tournament.id);

                const userWalletDoc = await transaction.get(userWalletRef);
                if (!userWalletDoc.exists() || userWalletDoc.data().balance < tournament.entryFee) {
                    throw new Error("Insufficient wallet balance.");
                }

                // 1. Deduct fee and update wallet
                const newBalance = userWalletDoc.data().balance - tournament.entryFee;
                transaction.update(userWalletRef, { balance: newBalance });

                // 2. Add user to tournament users list and update prize pool
                transaction.update(tournamentRef, { 
                    registeredUsers: arrayUnion(user.uid),
                    prizePool: (tournament.prizePool || 0) + tournament.entryFee,
                });

                // 3. Log user's transaction
                const purchaseTxRef = doc(collection(db, "transactions"));
                transaction.set(purchaseTxRef, {
                    user: user.uid,
                    amount: -tournament.entryFee,
                    date: serverTimestamp(),
                    description: `Entry Fee for Quiz Clash: ${tournament.title}`,
                    status: "Completed",
                    type: "Purchase",
                });
            });
        } else { // For Practice tournaments
            const tournamentRef = doc(db, "quizClashTournaments", tournament.id);
            await updateDoc(tournamentRef, {
                registeredUsers: arrayUnion(user.uid)
            });
        }

        toast({
            title: "Registration Successful!",
            description: `You have been registered for ${tournament.title}.`,
        });

        // Optimistically update UI
        setTournaments(prev => prev!.map(t => 
            t.id === tournament.id 
                ? { ...t, registeredUsers: [...t.registeredUsers, user.uid], prizePool: t.type === 'Pro' ? t.prizePool + t.entryFee : t.prizePool }
                : t
        ));

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "Could not complete registration.",
        });
    }
  };
  
  if (!tournaments) {
    return (
      <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
          <Puzzle className="w-10 h-10" /> Quiz Clash
        </h1>
        <p className="text-muted-foreground mt-2">Compete in live quiz tournaments and win big!</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Register for an upcoming tournament. Pro Clashes require an entry fee, Practice Clashes are free.</p>
            <p>2. Join the quiz at the scheduled time. All participants play at the same time.</p>
            <p>3. Answer as many questions correctly and as quickly as possible.</p>
            <p>4. Top users on the leaderboard win a share of the prize pool in Pro Clashes, or bragging rights in Practice Clashes!</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Tournaments</h2>
        {tournaments.length > 0 ? (
            <div className="space-y-4">
            {tournaments.map((tourney) => {
                const isRegistered = user ? tourney.registeredUsers.includes(user.uid) : false;
                const canPlay = new Date(tourney.startTime) <= new Date();

                return (
                    <Card key={tourney.id} className="shadow-md">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle>{tourney.title}</CardTitle>
                                <CardDescription>
                                Goes live at {new Date(tourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(tourney.startTime).toLocaleDateString()}
                                </CardDescription>
                            </div>
                             <Badge variant={tourney.type === 'Pro' ? 'default' : 'secondary'}>{tourney.type} Clash</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg text-primary">{tourney.type === 'Pro' ? `₹${tourney.entryFee}`: 'FREE'}</h4>
                            <p className="text-xs text-muted-foreground">Entry Fee</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg">{tourney.questionCount}</h4>
                            <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg">{tourney.registeredUsers.length}</h4>
                            <p className="text-xs text-muted-foreground">Users Registered</p>
                        </div>
                        {tourney.type === 'Pro' ? (
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <h4 className="font-bold text-lg text-green-700 dark:text-green-300">₹{tourney.prizePool}</h4>
                                <p className="text-xs text-muted-foreground">Current Prize Pool</p>
                            </div>
                        ) : (
                             <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <h4 className="font-bold text-lg text-blue-700 dark:text-blue-300">Practice</h4>
                                <p className="text-xs text-muted-foreground">For Glory</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        {isRegistered ? (
                             canPlay ? (
                                <Button className="w-full" onClick={() => router.push(`/quiz-clash/play?tournamentId=${tourney.id}`)}>
                                    Enter Game
                                </Button>
                             ) : (
                                <Button className="w-full" disabled>Registered</Button>
                             )
                        ) : (
                            <Button className="w-full" onClick={() => handleRegister(tourney)}>
                                {tourney.type === 'Pro' ? `Register Now (₹${tourney.entryFee})` : 'Register for Free'}
                            </Button>
                        )}
                    </CardFooter>
                    </Card>
                )
            })}
            </div>
        ) : (
             <Card>
                <CardContent className="text-center p-12">
                    <p className="text-muted-foreground">No upcoming tournaments scheduled. Check back soon!</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

export default function QuizClashPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <QuizClashPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}
