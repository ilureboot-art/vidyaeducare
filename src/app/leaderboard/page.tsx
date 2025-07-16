"use client";

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

// Mock data for the leaderboard
const leaderboardData = [
  { rank: 1, name: "Alice", score: 5400, gamesPlayed: 60 },
  { rank: 2, name: "Bob", score: 4800, gamesPlayed: 55 },
  { rank: 3, name: "Charlie", score: 4250, gamesPlayed: 50 },
  { rank: 4, name: "Diana", score: 3800, gamesPlayed: 48 },
  { rank: 5, name: "Ethan", score: 3500, gamesPlayed: 45 },
  { rank: 6, name: "Fiona", score: 3100, gamesPlayed: 42 },
  { rank: 7, name: "George", score: 2800, gamesPlayed: 40 },
  { rank: 8, name: "Hannah", score: 2500, gamesPlayed: 38 },
  { rank: 9, name: "Ian", score: 2200, gamesPlayed: 35 },
  { rank: 10, name: "Jane", score: 1900, gamesPlayed: 30 },
];

export default function LeaderboardPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Top Players
          </CardTitle>
          <CardDescription className="text-center">
            See who is leading the charts in NumberAce!
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
              {leaderboardData.map((player) => (
                <TableRow key={player.rank} className="font-medium">
                  <TableCell className="text-center">{player.rank}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell className="text-right">{player.gamesPlayed}</TableCell>
                  <TableCell className="text-right text-primary font-bold">₹{player.score.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
