
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy } from "lucide-react";

type Player = {
  rank: number;
  name: string;
  score: number;
  gamesPlayed: number;
};

// In a real app, this data would be fetched from a server.
const initialLeaderboardData: Player[] = [];

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<Player[]>(initialLeaderboardData);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Top Players
          </CardTitle>
          <CardDescription className="text-center">
            See who is leading the charts in GuessMaster!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Games Played</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.length > 0 ? leaderboardData.map((player) => (
                <TableRow key={player.rank} className="font-medium">
                  <TableCell className="text-center">{player.rank}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell className="text-right">{player.gamesPlayed}</TableCell>
                  <TableCell className="text-right text-primary font-bold">₹{player.score.toLocaleString()}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">The leaderboard is empty. Be the first to play!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
