"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ShieldAlert, CheckCircle2, Loader2, Sparkles, UserCheck, CalendarDays, RefreshCw, Coins, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDb, useAuth } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  studentId: string;
  testId: string;
  name: string;
  avatar: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  time: string;
  createdAt: string;
  parentId?: string;
  isRewarded?: boolean;
  rewardedAt?: string;
}

interface ScheduledTestSummary {
  id: string;
  name: string;
  dateTime: string;
}

const getPrizeForRank = (rank: number, accuracy: number = 0) => {
    if (accuracy < 80) return 0;
    switch (rank) {
        case 1: return 250;
        case 2: return 200;
        case 3: return 150;
        case 4: return 100;
        case 5: return 50;
        default: return 0;
    }
}

export default function AdminLeaderboardPage() {
  const { toast } = useToast();
  const db = useDb();
  const { isResolved, isAdmin } = useAuth();

  const [allEntries, setAllEntries] = useState<LeaderboardEntry[] | null>(null);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTestSummary[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"mockTest" | "monthly">("mockTest");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<string[] | null>(null);
  const [isMonthlyFinalized, setIsMonthlyFinalized] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-06"

  const fetchAdminData = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      // 1. Fetch scheduled tests
      const schedulesRef = collection(db, "scheduledTests");
      const schedulesSnap = await getDocs(schedulesRef);
      const tests = schedulesSnap.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              name: data.testSetName || "Unnamed Test",
              dateTime: data.dateTime || ""
          };
      }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      
      setScheduledTests(tests);
      if (tests.length > 0 && !selectedTestId) {
          setSelectedTestId(tests[0].id);
      }

      // 2. Check if monthly AI rewards have already been finalized
      const monthlyRewardsRef = doc(db, "monthlyRewards", currentYearMonth);
      const monthlyRewardsSnap = await getDoc(monthlyRewardsRef);
      setIsMonthlyFinalized(monthlyRewardsSnap.exists());

      // 3. Fetch store configuration for cash reward amount
      const storeRef = doc(db, "configs", "store");
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) {
        setStoreConfig(storeSnap.data());
      }

      // 4. Fetch leaderboard entries
      const leaderboardRef = collection(db, "leaderboard");
      const leaderboardSnap = await getDocs(leaderboardRef);

      const parsedEntries: LeaderboardEntry[] = leaderboardSnap.docs.map(doc => {
          const data = doc.data();
          const parts = doc.id.split("-");
          const studentId = data.studentId || parts[0] || "";
          const testId = data.testId || parts[1] || "";
          
          const rawScore = data.score || 0;
          const totalQuestions = data.totalQuestions || 30;
          const accuracy = data.accuracy !== undefined ? data.accuracy : (rawScore / totalQuestions) * 100;

          return {
              id: doc.id,
              studentId,
              testId,
              name: data.name || "Unknown Student",
              avatar: data.avatar || "S",
              score: rawScore,
              accuracy,
              totalQuestions,
              time: data.time || "00:00",
              createdAt: data.createdAt || data.date || new Date().toISOString(),
              parentId: data.parentId || "",
              isRewarded: data.isRewarded || false,
              rewardedAt: data.rewardedAt || ""
          };
      });

      setAllEntries(parsedEntries);
    } catch (e) {
      console.error("Admin leaderboard fetch failed:", e);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not load ranks." });
    } finally {
      setIsLoading(false);
    }
  }, [db, currentYearMonth, selectedTestId, toast]);

  useEffect(() => {
    if (isResolved && isAdmin && db) {
      fetchAdminData();
    }
  }, [isResolved, isAdmin, db, fetchAdminData]);

  // Grouped and sorted mock test list
  const mockTestRankings = (() => {
    if (!allEntries || !selectedTestId) return [];
    return allEntries
      .filter(entry => entry.testId === selectedTestId)
      .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.time.localeCompare(b.time);
      })
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  })();

  // Grouped and sorted monthly list
  const monthlyRankings = (() => {
      if (!allEntries) return [];

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const currentMonthEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.createdAt);
          return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
      });

      const studentBestMap: Record<string, LeaderboardEntry> = {};
      currentMonthEntries.forEach(entry => {
          const existing = studentBestMap[entry.studentId];
          if (!existing) {
              studentBestMap[entry.studentId] = entry;
          } else {
              if (entry.score > existing.score) {
                  studentBestMap[entry.studentId] = entry;
              } else if (entry.score === existing.score) {
                  if (entry.time.localeCompare(existing.time) < 0) {
                      studentBestMap[entry.studentId] = entry;
                  }
              }
          }
      });

      return Object.values(studentBestMap)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time.localeCompare(b.time);
        })
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  })();

  // Finalize Cash Rewards for a specific Mock Test
  const handleFinalizeMockTestCash = async () => {
    if (!db || !selectedTestId || mockTestRankings.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setReport(null);
    const logs: string[] = [];
    const testName = scheduledTests.find(t => t.id === selectedTestId)?.name || "Mock Test";

    try {
      const top5 = mockTestRankings.slice(0, 5);
      const pendingRewards = top5.filter(entry => !entry.isRewarded && entry.accuracy >= 80);

      if (pendingRewards.length === 0) {
        toast({ title: "No Pending Rewards", description: "No top 5 rankers with 80%+ accuracy require cash prize finalization." });
        setIsProcessing(false);
        return;
      }

      for (let i = 0; i < pendingRewards.length; i++) {
        const ranker = pendingRewards[i];
        const prize = getPrizeForRank(ranker.rank, ranker.accuracy);

        if (prize === 0) continue;

        let parentId = ranker.parentId;
        if (!parentId) {
          const studentDoc = await getDoc(doc(db, "students", ranker.studentId));
          if (studentDoc.exists()) {
            parentId = studentDoc.data().parentId;
          }
        }

        if (!parentId) {
          logs.push(`Rank ${ranker.rank} (${ranker.name}): Skipped (Unable to resolve parent account)`);
          continue;
        }

        const parentIdStr = parentId;

        await runTransaction(db, async (transaction) => {
          // 1. Get/Update Wallet
          const walletRef = doc(db, "wallets", parentIdStr);
          const walletSnap = await transaction.get(walletRef);
          const currentBalance = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;
          
          transaction.set(walletRef, { balance: currentBalance + prize }, { merge: true });

          // 2. Write Transaction
          const txRef = doc(collection(db, "transactions"));
          transaction.set(txRef, {
            user: parentIdStr,
            amount: prize,
            date: serverTimestamp(),
            description: `Leaderboard Cash Prize: Rank ${ranker.rank} on ${testName} (Student: ${ranker.name})`,
            status: "Completed",
            type: "Reward"
          });

          // 3. Mark Leaderboard Entry
          const leaderboardDocRef = doc(db, "leaderboard", ranker.id);
          transaction.update(leaderboardDocRef, {
            isRewarded: true,
            rewardType: "cash",
            rewardedAt: new Date().toISOString(),
            cashPrizeAwarded: prize
          });
        });

        logs.push(`Rank ${ranker.rank} (${ranker.name}): Awarded ₹${prize} cash prize to parent wallet!`);
      }

      setReport(logs);
      toast({ title: "Cash Rewards Finalized!", description: `Distributed rewards for ${testName}.` });
      fetchAdminData();
    } catch (err: any) {
      console.error("Cash reward finalization failed:", err);
      toast({ variant: "destructive", title: "Distribution Failed", description: err.message || "An error occurred." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Finalize AI Access Extensions & Cash Rewards for the Monthly Leaderboard
  const handleFinalizeMonthlyAI = async () => {
    if (!db || monthlyRankings.length === 0 || isProcessing || isMonthlyFinalized) return;

    setIsProcessing(true);
    setReport(null);
    const logs: string[] = [];
    const cashReward = storeConfig?.monthlyFirstRankerReward ?? 1000;

    try {
      const top5 = monthlyRankings.slice(0, 5);

      for (let i = 0; i < top5.length; i++) {
        const ranker = top5[i];
        const isRank1 = ranker.rank === 1;
        const prizeAmount = isRank1 ? cashReward : 0;
        
        let parentId = ranker.parentId;
        if (!parentId) {
          const studentDoc = await getDoc(doc(db, "students", ranker.studentId));
          if (studentDoc.exists()) {
            parentId = studentDoc.data().parentId;
          }
        }

        if (!parentId) {
          logs.push(`Rank ${ranker.rank} (${ranker.name}): Skipped (Unable to resolve parent account)`);
          continue;
        }

        const parentIdStr = parentId;

        await runTransaction(db, async (transaction) => {
          // 1. Get and update AI Access
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

          transaction.set(aiAccessRef, {
            doubtSolverExpiresAt: extendedDoubtExpiry,
            notesGeneratorExpiresAt: extendedNotesExpiry
          }, { merge: true });

          // 2. If Rank 1, credit parent wallet
          if (isRank1 && prizeAmount > 0) {
            const walletRef = doc(db, "wallets", parentIdStr);
            const walletSnap = await transaction.get(walletRef);
            const currentBalance = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;
            transaction.set(walletRef, { balance: currentBalance + prizeAmount }, { merge: true });
          }

          // 3. Log transaction
          const txRef = doc(collection(db, "transactions"));
          transaction.set(txRef, {
            user: parentIdStr,
            amount: prizeAmount,
            date: serverTimestamp(),
            description: isRank1 
              ? `Monthly Leaderboard 1st Rank Reward: ₹${prizeAmount} Cash + +30 Days access to Doubt Solver & QuickNotes (Student: ${ranker.name})`
              : `Monthly Leaderboard AI Reward: +30 Days access to Doubt Solver & QuickNotes (Student: ${ranker.name})`,
            status: "Completed",
            type: "Reward"
          });
        });

        if (isRank1 && prizeAmount > 0) {
          logs.push(`Rank ${ranker.rank} (${ranker.name}): Granted +30 days AI access and awarded ₹${prizeAmount} cash prize to parent wallet!`);
        } else {
          logs.push(`Rank ${ranker.rank} (${ranker.name}): Granted +30 days access extension for Doubt Solver & QuickNotes!`);
        }
      }

      // Record monthly finalization document
      const monthlyRewardsRef = doc(db, "monthlyRewards", currentYearMonth);
      await setDoc(monthlyRewardsRef, {
        finalizedAt: new Date().toISOString(),
        yearMonth: currentYearMonth,
        winners: top5.map(w => ({ studentId: w.studentId, name: w.name, rank: w.rank })),
        cashRewardAmount: cashReward
      });

      setIsMonthlyFinalized(true);
      setReport(logs);
      toast({ title: "Monthly AI Access Distributed!", description: `Successfully finalized AI access rewards for ${currentYearMonth}.` });
      fetchAdminData();
    } catch (err: any) {
      console.error("Monthly reward finalization failed:", err);
      toast({ variant: "destructive", title: "Distribution Failed", description: err.message || "An error occurred." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Leaderboard Manager...</p>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            <Trophy className="text-yellow-500 fill-yellow-500/20" /> Leaderboard Manager
          </h1>
          <p className="text-muted-foreground text-sm">Distribute cash prizes for Mock Tests or AI Access for monthly top students.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAdminData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          
          {activeTab === "mockTest" ? (
            <Button 
              className="font-black bg-primary text-white shadow-lg shadow-primary/10 gap-1.5" 
              onClick={handleFinalizeMockTestCash}
              disabled={isProcessing || !selectedTestId || mockTestRankings.length === 0}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Coins size={16} /> Finalize Cash Prizes</>}
            </Button>
          ) : (
            <Button 
              className="font-black bg-accent text-accent-foreground shadow-lg shadow-accent/10 gap-1.5" 
              onClick={handleFinalizeMonthlyAI}
              disabled={isProcessing || isMonthlyFinalized || monthlyRankings.length === 0}
            >
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Sparkles size={16} /> Finalize Monthly AI Access</>}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-start">
        <div className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => {
              setActiveTab("mockTest");
              setReport(null);
            }}
            className={cn(
              "py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === "mockTest"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Trophy className="w-4.5 h-4.5" /> Mock Test Cash
          </button>
          <button
            onClick={() => {
              setActiveTab("monthly");
              setReport(null);
            }}
            className={cn(
              "py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === "monthly"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4.5 h-4.5" /> Monthly AI Access
          </button>
        </div>
      </div>

      {/* Audit Logs */}
      {report && (
        <Card className="border-green-500/20 bg-green-500/[0.02] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black text-green-700 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck size={16} /> Audit Rewards Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1 font-mono text-green-700 pl-8">
            {report.map((line, idx) => (
              <div key={idx}>• {line}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="border shadow-md">
        <CardHeader className="bg-muted/10">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <CardTitle className="text-base font-black uppercase tracking-tight">
                      {activeTab === "mockTest" ? "Mock Test Rankings" : `Monthly Standings - ${currentMonthName}`}
                  </CardTitle>
                  <CardDescription>
                      {activeTab === "mockTest" 
                        ? "Top rankers for the selected test. Accuracy >= 80% required for cash prizes."
                        : "Overall monthly rankings (best attempt per student). Top 5 receive +30 Days Both AI Tools access."}
                  </CardDescription>
              </div>

              {activeTab === "mockTest" && scheduledTests.length > 0 && (
                  <div className="w-64">
                      <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                          <SelectTrigger className="border-primary/20">
                              <SelectValue placeholder="Select Mock Test" />
                          </SelectTrigger>
                          <SelectContent>
                              {scheduledTests.map(test => (
                                  <SelectItem key={test.id} value={test.id}>
                                      {test.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              )}
          </div>
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
                <TableHead className="text-center font-bold">Reward Status / Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTab === "mockTest" ? (
                mockTestRankings.length > 0 ? (
                  mockTestRankings.map((player) => {
                    const meetsCriteria = player.accuracy >= 80;
                    const prize = getPrizeForRank(player.rank, player.accuracy);
                    const isTop5 = player.rank <= 5;

                    return (
                      <TableRow key={player.id} className={isTop5 ? "bg-primary/[0.01]" : ""}>
                        <TableCell className="text-center font-black">
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : player.rank}
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
                            !meetsCriteria ? (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 font-bold uppercase">
                                Low Accuracy
                              </Badge>
                            ) : player.isRewarded ? (
                              <Badge className="bg-green-600 font-bold gap-1 text-[10px] uppercase">
                                <CheckCircle2 size={12} /> Paid ₹{prize}
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-600 font-bold gap-1 text-[10px] uppercase animate-pulse">
                                <ShieldAlert size={12} /> Pending ₹{prize}
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
                      No leaderboard activity recorded for this Mock Test.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                monthlyRankings.length > 0 ? (
                  monthlyRankings.map((player) => {
                    const isTop5 = player.rank <= 5;
                    
                    return (
                      <TableRow key={player.id} className={isTop5 ? "bg-primary/[0.01]" : ""}>
                        <TableCell className="text-center font-black">
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : player.rank}
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
                            player.rank === 1 ? (
                              <div className="flex flex-col items-center gap-1">
                                {isMonthlyFinalized ? (
                                  <>
                                    <Badge className="bg-green-600 font-bold gap-1 text-[10px] uppercase">
                                      <CheckCircle2 size={12} /> Paid ₹{(storeConfig?.monthlyFirstRankerReward ?? 1000).toLocaleString()}
                                    </Badge>
                                    <Badge className="bg-green-600 font-bold gap-1 text-[10px] uppercase">
                                      <CheckCircle2 size={12} /> AI Tools Extended
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <Badge className="bg-yellow-600 font-bold gap-1 text-[10px] uppercase animate-pulse">
                                      <ShieldAlert size={12} /> Pending ₹{(storeConfig?.monthlyFirstRankerReward ?? 1000).toLocaleString()}
                                    </Badge>
                                    <Badge className="bg-yellow-600 font-bold gap-1 text-[10px] uppercase animate-pulse">
                                      <ShieldAlert size={12} /> Qualifies for AI Tools
                                    </Badge>
                                  </>
                                )}
                              </div>
                            ) : (
                              isMonthlyFinalized ? (
                                <Badge className="bg-green-600 font-bold gap-1 text-[10px] uppercase">
                                  <CheckCircle2 size={12} /> AI Tools Extended
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-600 font-bold gap-1 text-[10px] uppercase animate-pulse">
                                  <ShieldAlert size={12} /> Qualifies for AI Tools
                                </Badge>
                              )
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
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/5">
          <CalendarDays size={14} className="mr-1.5" /> Distribution grants access extensions and credits wallets dynamically
        </CardFooter>
      </Card>
    </div>
  );
}
