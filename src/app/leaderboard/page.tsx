
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
import { Trophy, Award, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

type Player = {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  time: string; // e.g., "15:32"
  prize?: number;
};

const getRankColor = (rank: number) => {
    if (rank === 1) return "border-yellow-400";
    if (rank === 2) return "border-gray-400";
    if (rank === 3) return "border-amber-600";
    return "border-transparent";
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<Player[] | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
        const leaderboardRef = collection(db, "leaderboard");
        // Fetch top 50, ordered by score descending, then time ascending.
        const q = query(leaderboardRef, orderBy("score", "desc"), orderBy("time", "asc"), limit(50));
        const querySnapshot = await getDocs(q);
        const leaderboard = querySnapshot.docs.map((doc, index) => ({
            rank: index + 1,
            ...doc.data()
        } as Player));
        setLeaderboardData(leaderboard);
    };
    fetchLeaderboard();
  }, []);

  if (!leaderboardData) {
    return (
      <div className="w-full max-w-3xl mx-auto flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Live Mock Test Leaderboard
          </CardTitle>
          <CardDescription className="text-center">
            See who's at the top of their game! Top 5 scorers win cash rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Time Taken</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-right">Prize</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.length > 0 ? leaderboardData.map((player) => (
                <TableRow key={player.rank} className="font-medium">
                  <TableCell className="text-center text-lg font-bold">
                    {player.rank <= 3 ? (
                        <Award className={`w-8 h-8 mx-auto ${
                            player.rank === 1 ? 'text-yellow-400' : 
                            player.rank === 2 ? 'text-gray-400' :
                            'text-amber-600'
                        }`} />
                    ) : player.rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className={`w-10 h-10 border-2 ${getRankColor(player.rank)}`}>
                             <AvatarImage src={`https://placehold.co/40x40.png?text=${player.avatar}`} data-ai-hint="profile avatar" />
                            <AvatarFallback>{player.avatar}</AvatarFallback>
                        </Avatar>
                        <span>{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{player.time}</TableCell>
                  <TableCell className="text-center text-primary font-bold text-lg">{player.score} / 50</TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {player.prize ? (
                        <div className="flex items-center justify-end gap-2" data-ai-hint="cash prize">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            ₹{player.prize}
                        </div>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">The leaderboard is empty. Be the first to take a test!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    