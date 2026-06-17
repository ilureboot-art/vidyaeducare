"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ShieldAlert, CheckCircle2, Loader2, Sparkles, UserCheck, CalendarDays, RefreshCw } from "lucide-react";
import { useDb, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  time: string;
  studentId?: string;
  parentId?: string;
  isRewarded?: boolean;
  rewardedAt?: string;
}

export default function AdminLeaderboardPage() {
  const { toast } = useToast();
  const db = useDb();
  const { isResolved, isAdmin } = useAuth();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [rewardsReport, setRewardsReport] = useState<string[] | null>(null);

  const fetchLeaderboard = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const leaderboardRef = collection(db, "leaderboard");
      const q = query(leaderboardRef, orderBy("score", "desc"), orderBy("time", "asc"), limit(20));
      const snap = await getDocs(q);

      const entries: LeaderboardEntry[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaderboardEntry));

      setLeaderboardData(entries);
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not load global rankings." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isResolved && isAdmin && db) {
      fetchLeaderboard();
    }
  }, [isResolved, isAdmin, db]);

  const handleFinalizeRanks = async () => {
    if (!db || !leaderboardData || leaderboardData.length === 0 || isFinalizing) return;

    setIsFinalizing(true);
    setRewardsReport(null);
    const report: string[] = [];

    try {
      // Reward the top 5 rankers
      const top5 = leaderboardData.slice(0, 5);
      const pendingRewards = top5.filter(entry => !entry.isRewarded);

      if (pendingRewards.length === 0) {
        toast({ title: "Already Rewarded", description: "All top 5 rankers have already received their rewards for this cycle." });
        setIsFinalizing(false);
        return;
      }

      for (let i = 0; i < pendingRewards.length; i++) {
        const ranker = pendingRewards[i];
        const rankIndex = leaderboardData.indexOf(ranker) + 1; // 1-indexed rank

        // Resolve studentId and parentId
        let studentId = ranker.studentId;
        let parentId = ranker.parentId;

        if (!studentId || !parentId) {
          // Fallback parsing from ID (ID format is studentId-testId)
          const parts = ranker.id.split("-");
          studentId = parts[0];

          if (studentId) {
            const studentDoc = await getDoc(doc(db, "students", studentId));
            if (studentDoc.exists()) {
              parentId = studentDoc.data().parentId;
            }
          }
        }

        if (!studentId || !parentId) {
          report.push(`Rank ${rankIndex} (${ranker.name}): Skipped (Unable to resolve parent account)`);
          continue;
        }

        const parentIdStr = parentId; // type safety
        const rank = rankIndex;

        // Run transaction to extend access and update leaderboard document
        await runTransaction(db, async (transaction) => {
          const aiAccessRef = doc(db, "aiAccess", parentIdStr);
          const aiAccessDoc = await transaction.get(aiAccessRef);
          
          const now = new Date();
          let currentDoubtExpiry = now;
          let currentNotesExpiry = now;

          if (aiAccessDoc.exists()) {
            const data = aiAccessDoc.data() as any;
            if (data.doubtSolverExpiresAt) {
              const d = data.doubtSolverExpiresAt.toDate ? data.doubtSolverExpiresAt.toDate() : new Date(data.doubtSolverExpiresAt);
              if (d > now) currentDoubtExpiry = d;
            }
            if (data.notesGeneratorExpiresAt) {
              const d = data.notesGeneratorExpiresAt.toDate ? data.notesGeneratorExpiresAt.toDate() : new Date(data.notesGeneratorExpiresAt);
              if (d > now) currentNotesExpiry = d;
            }
          }

          const extendedDoubtExpiry = new Date(currentDoubtExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
          const extendedNotesExpiry = new Date(currentNotesExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

          let updatePayload: any = {};
          let rewardDescription = "";

          if (rank <= 3) {
            // Rank 1, 2, 3: Both tools extended by 30 days
            updatePayload = {
              doubtSolverExpiresAt: extendedDoubtExpiry,
              notesGeneratorExpiresAt: extendedNotesExpiry
            };
            rewardDescription = `Top 3 Ranker Reward (+30 Days access to Doubt Solver & QuickNotes)`;
          } else {
            // Rank 4, 5: Doubt Solver only extended by 30 days
            updatePayload = {
              doubtSolverExpiresAt: extendedDoubtExpiry
            };
            rewardDescription = `Rank ${rank} Reward (+30 Days access to Doubt Solver)`;
          }

          transaction.set(aiAccessRef, updatePayload, { merge: true });

          // Log reward transaction
          const rewardTxRef = doc(collection(db, "transactions"));
          transaction.set(rewardTxRef, {
            user: parentIdStr,
            amount: 0,
            date: serverTimestamp(),
            description: `Leaderboard Reward: ${rewardDescription} for student ${ranker.name}`,
            status: "Completed",
            type: "Reward"
          });

          // Update leaderboard document
          const leaderboardDocRef = doc(db, "leaderboard", ranker.id);
          transaction.update(leaderboardDocRef, {
            isRewarded: true,
            rewardedAt: new Date().toISOString()
          });
        });

        report.push(`Rank ${rankIndex} (${ranker.name}): Successfully rewarded +30 Days access!`);
      }

      setRewardsReport(report);
      toast({ title: "Rewards Distributed!", description: "Successfully finalized rank rewards." });
      fetchLeaderboard();
    } catch (err: any) {
      console.error("Reward finalization failed:", err);
      toast({ variant: "destructive", title: "Distribution Failed", description: err.message || "An error occurred during rewards finalization." });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Auditing MockArena Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            <Trophy className="text-yellow-500 fill-yellow-500/20" /> Leaderboard Manager
          </h1>
          <p className="text-muted-foreground text-sm">Audit monthly MockArena ranks and finalize student reward distribution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeaderboard}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button 
            className="font-black bg-primary text-white shadow-lg shadow-primary/10 gap-1.5" 
            onClick={handleFinalizeRanks}
            disabled={isFinalizing || !leaderboardData || leaderboardData.length === 0}
          >
            {isFinalizing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Sparkles size={16} /> Finalize Ranks & Rewards</>}
          </Button>
        </div>
      </div>

      {rewardsReport && (
        <Card className="border-green-500/20 bg-green-500/[0.02] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black text-green-700 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck size={16} /> Audit Rewards Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1 font-mono text-green-700 pl-8">
            {rewardsReport.map((line, idx) => (
              <div key={idx}>• {line}</div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-md">
        <CardHeader className="bg-muted/10">
          <CardTitle className="text-base font-black uppercase tracking-tight">Monthly MockArena Standings</CardTitle>
          <CardDescription>Top rankings qualified for academic rewards (Top 3: Both AI tools, Ranks 4-5: Doubt Solver only).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center font-bold">Rank</TableHead>
                <TableHead className="font-bold">Student Name</TableHead>
                <TableHead className="text-center font-bold">Accuracy</TableHead>
                <TableHead className="text-center font-bold">Score (Correct)</TableHead>
                <TableHead className="text-center font-bold">Duration</TableHead>
                <TableHead className="text-center font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData.map((player, index) => {
                  const rank = index + 1;
                  const isTop5 = rank <= 5;
                  
                  return (
                    <TableRow key={player.id} className={isTop5 ? "bg-primary/[0.01]" : ""}>
                      <TableCell className="text-center font-black">
                        {rank === 1 ? (
                          <span className="text-lg">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          rank
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-xs">
                            {player.avatar}
                          </span>
                          <span>{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">
                        {player.accuracy.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground font-medium">
                        {player.score} / {player.totalQuestions || 30}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground font-mono">
                        {player.time}
                      </TableCell>
                      <TableCell className="text-center">
                        {isTop5 ? (
                          player.isRewarded ? (
                            <Badge className="bg-green-600 font-bold gap-1 text-[10px] uppercase">
                              <CheckCircle2 size={12} /> Rewarded
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-600 font-bold gap-1 text-[10px] uppercase animate-pulse">
                              <ShieldAlert size={12} /> Pending Audit
                            </Badge>
                          )
                        ) : (
                          <Badge variant="secondary" className="font-medium text-[10px] uppercase">
                            Non-rewardable
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No leaderboard activity recorded this month.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/5">
          <CalendarDays size={14} className="mr-1.5" /> Distribution grants access extensions dynamically
        </CardFooter>
      </Card>
    </div>
  );
}
