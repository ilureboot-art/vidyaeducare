
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Puzzle, Users, IndianRupee, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";

// Mock data for upcoming tournaments
const mockTournaments = [
    {
        id: "tourney-1",
        title: "Daily Evening Challenge",
        startTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(),
        entryFee: 25,
        registeredPlayers: 88,
        questionCount: 15,
        prizePool: 2200,
    },
    {
        id: "tourney-2",
        title: "Weekend Bonanza",
        startTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        entryFee: 50,
        registeredPlayers: 42,
        questionCount: 20,
        prizePool: 2100,
    }
];

function QuizClashPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<typeof mockTournaments | null>(null);

  useEffect(() => {
    // In a real app, this would fetch data from Firestore
    setTournaments(mockTournaments);
  }, []);

  const handleRegister = (tournament: typeof mockTournaments[0]) => {
    toast({
      title: "Registration Successful!",
      description: `You have been registered for ${tournament.title}. Your wallet has been debited by ₹${tournament.entryFee}.`,
    });
    // Here you would add logic to update Firestore, debit wallet, etc.
    
    // For demo, navigate to the play page
    router.push(`/quiz-clash/play?tournamentId=${tournament.id}`);
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
            <p>1. Register for an upcoming tournament by paying the entry fee from your wallet.</p>
            <p>2. Join the quiz at the scheduled time. All participants play at the same time.</p>
            <p>3. Answer as many questions correctly and as quickly as possible.</p>
            <p>4. The top 4 players on the leaderboard win a share of the total prize pool!</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Tournaments</h2>
        <div className="space-y-4">
          {tournaments.map((tourney) => (
            <Card key={tourney.id} className="shadow-md">
              <CardHeader>
                <CardTitle>{tourney.title}</CardTitle>
                <CardDescription>
                  Goes live at {new Date(tourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(tourney.startTime).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-bold text-lg text-primary">₹{tourney.entryFee}</h4>
                    <p className="text-xs text-muted-foreground">Entry Fee</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-bold text-lg">{tourney.questionCount}</h4>
                    <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                 <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-bold text-lg">{tourney.registeredPlayers}</h4>
                    <p className="text-xs text-muted-foreground">Contestants</p>
                </div>
                 <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <h4 className="font-bold text-lg text-green-700 dark:text-green-300">₹{tourney.prizePool}</h4>
                    <p className="text-xs text-muted-foreground">Current Prize Pool</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleRegister(tourney)}>
                  Register Now (₹{tourney.entryFee})
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizClashPage() {
    return (
        <ProtectedRoute>
            <QuizClashPageContent />
        </ProtectedRoute>
    );
}
