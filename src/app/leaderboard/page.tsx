
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Award, Loader2, Star, Coins, AlertCircle, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDb } from "@/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import UserLayout from "@/components/UserLayout";
import { cn } from "@/lib/utils";

type UserEntry = {
  rank: number;
  name: string;
  avatar: string;
  score: number; // Raw correct answers count
  accuracy?: number; // Accuracy percentage (80% qualification)
  totalQuestions?: number;
  time: string; 
  prize?: number;
};

const getRankStyles = (rank: number) => {
    if (rank === 1) return "border-yellow-400 bg-yellow-400/5 ring-2 ring-yellow-400/20";
    if (rank === 2) return "border-slate-300 bg-slate-300/5";
    if (rank === 3) return "border-amber-600 bg-amber-600/5";
    if (rank <= 5) return "border-primary/20 bg-primary/5";
    return "border-transparent";
}

const getPrizeForRank = (rank: number, accuracy: number = 0) => {
    // Qualification check: Must have 80% accuracy
    if (accuracy < 80) return null;

    switch (rank) {
        case 1: return 250;
        case 2: return 200;
        case 3: return 150;
        case 4: return 100;
        case 5: return 50;
        default: return null;
    }
}

const RankIdentifier = ({ rank }: { rank: number }) => {
    if (rank === 1) return (
        <div className="relative inline-block">
            <Trophy className="w-10 h-10 text-yellow-500 animate-bounce" />
            <div className="absolute -top-1 -right-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>
        </div>
    );
    if (rank === 2) return <Award className="w-10 h-10 text-slate-400" />;
    if (rank === 3) return <Award className="w-10 h-10 text-amber-600" />;
    if (rank <= 5) return (
        <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 shadow-md">
            TOP {rank}
        </Badge>
    );
    return <span className="text-muted-foreground font-bold text-xl">{rank}</span>;
}

export default function LeaderboardPage() {
  const db = useDb();
  const [leaderboardData, setLeaderboardData] = useState<UserEntry[] | null>(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
        if (!db) return;
        const leaderboardRef = collection(db, "leaderboard");
        // Fetch top 50, ordered by score descending, then time ascending.
        const q = query(leaderboardRef, orderBy("score", "desc"), orderBy("time", "asc"), limit(50));
        const querySnapshot = await getDocs(q);
        const leaderboard = querySnapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                rank: index + 1,
                ...data
            } as UserEntry;
        });
        setLeaderboardData(leaderboard);
    };
    if (db) {
        fetchLeaderboard();
    }
  }, [db]);

  if (!leaderboardData) {
    return (
      <UserLayout>
        <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-2xl border-none ring-1 ring-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 text-center pb-8 border-b">
            <CardTitle className="text-4xl font-black text-primary flex items-center justify-center gap-3 tracking-tighter uppercase italic">
              <Trophy className="w-10 h-10 text-yellow-500" />
              Live Achievement Board
            </CardTitle>
            <CardDescription className="text-center font-bold uppercase tracking-widest text-xs mt-2 text-primary">
              National Mock Test Rankings • 80%+ Accuracy Required for Rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px] text-center font-black uppercase text-[10px] tracking-widest">Standing</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Excellence Candidate</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Duration</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Score Accuracy</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Cash Rewards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.length > 0 ? leaderboardData.map((player) => {
                  // Fallback for legacy records that don't have accuracy stored: assume 50 questions
                  const playerAccuracy = player.accuracy !== undefined ? player.accuracy : (player.score / (player.totalQuestions || 50)) * 100;
                  const rankPrize = getPrizeForRank(player.rank, playerAccuracy);
                  const meetsCriteria = playerAccuracy >= 80;

                  return (
                  <TableRow key={player.rank} className={cn("transition-colors group", getRankStyles(player.rank))}>
                    <TableCell className="text-center">
                       <RankIdentifier rank={player.rank} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className={cn(
                                "w-12 h-12 border-2 shadow-lg group-hover:scale-110 transition-transform",
                                player.rank === 1 ? "border-yellow-400" : "border-background"
                            )}>
                                <AvatarImage src={`https://picsum.photos/seed/${player.rank}/60/60`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black">{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {player.rank <= 3 && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <Star className={cn(
                                        "w-3 h-3 fill-current",
                                        player.rank === 1 ? "text-yellow-400" : player.rank === 2 ? "text-slate-300" : "text-amber-600"
                                    )} />
                                </div>
                            )}
                          </div>
                          <div>
                              <p className="font-black text-lg uppercase tracking-tight leading-none">{player.name}</p>
                              {player.rank <= 5 && <p className="text-[9px] font-black text-primary uppercase mt-1 tracking-widest">{meetsCriteria ? "Elite Tier Ranker" : "High Performer"}</p>}
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-muted-foreground">{player.time}</TableCell>
                    <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                            <span className={cn("text-xl font-black", meetsCriteria ? "text-primary" : "text-amber-600")}>
                                {playerAccuracy.toFixed(0)}%
                            </span>
                            <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                <div className={cn("h-full", meetsCriteria ? "bg-primary" : "bg-amber-500")} style={{ width: `${Math.min(playerAccuracy, 100)}%` }} />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {rankPrize ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-600 rounded-full font-black text-lg shadow-sm border border-green-500/20">
                              <Coins className="w-4 h-4" />
                              ₹{rankPrize.toLocaleString()}
                          </div>
                      ) : (player.rank <= 5 && !meetsCriteria) ? (
                          <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200 bg-amber-50 gap-1 font-bold">
                              <AlertCircle size={10}/> ACCURACY &lt; 80%
                          </Badge>
                      ) : (
                          <span className="text-muted-foreground/30 font-black">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}) : (
                  <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <Trophy className="w-12 h-12 opacity-10 mb-2" />
                            <p className="font-bold">No Records Found</p>
                            <p className="text-xs">Be the first to complete a mock test and claim your rank!</p>
                        </div>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 border-t justify-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                  <Info size={14} className="text-primary"/>
                  Prize eligibility requires top 5 rank AND 80% accuracy
              </div>
          </CardFooter>
        </Card>
      </div>
    </UserLayout>
  );
}
