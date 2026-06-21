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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Trophy, Award, Loader2, Star, Coins, AlertCircle, Info, Calendar, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDb } from "@/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import UserLayout from "@/components/UserLayout";
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type UserEntry = {
  id: string;
  studentId: string;
  testId: string;
  name: string;
  avatar: string;
  score: number; // Raw correct answers count
  accuracy: number; // Accuracy percentage (80% qualification)
  totalQuestions: number;
  time: string;
  createdAt: string;
};

type ScheduledTestSummary = {
  id: string;
  name: string;
  dateTime: string;
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
  const [allEntries, setAllEntries] = useState<UserEntry[] | null>(null);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTestSummary[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"mockTest" | "monthly">("mockTest");
  const [isLoading, setIsLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    const fetchStoreConfig = async () => {
      if (!db) return;
      try {
        const storeRef = doc(db, "configs", "store");
        const docSnap = await getDoc(storeRef);
        if (docSnap.exists()) {
          setStoreConfig(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching store config:", error);
      }
    };
    fetchStoreConfig();
  }, [db]);

  // Fetch both leaderboard data and scheduled test sets
  useEffect(() => {
    const fetchData = async () => {
        if (!db) return;
        setIsLoading(true);

        try {
            // 1. Fetch scheduled tests
            const schedulesRef = collection(db, "scheduledTests");
            const schedulesSnap = await getDocs(schedulesRef);
            const testsList = schedulesSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.testSetName || "Unnamed Test",
                    dateTime: data.dateTime || ""
                };
            }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
            
            setScheduledTests(testsList);
            if (testsList.length > 0) {
                setSelectedTestId(testsList[0].id);
            }

            // 2. Fetch leaderboard entries
            const leaderboardRef = collection(db, "leaderboard");
            const leaderboardSnap = await getDocs(leaderboardRef).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: leaderboardRef.path,
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw serverError;
            });

            const parsedEntries: UserEntry[] = leaderboardSnap.docs.map(doc => {
                const data = doc.data();
                const parts = doc.id.split("-");
                const studentId = data.studentId || parts[0] || "";
                const testId = data.testId || parts[1] || "";
                
                // Fallback score and accuracy
                const rawScore = data.score || 0;
                const totalQuestions = data.totalQuestions || 30;
                const accuracy = data.accuracy !== undefined ? data.accuracy : (rawScore / totalQuestions) * 100;

                return {
                    id: doc.id,
                    studentId,
                    testId,
                    name: data.name || "Unknown Student",
                    avatar: data.avatar || (data.name ? data.name.charAt(0) : "S"),
                    score: rawScore,
                    accuracy,
                    totalQuestions,
                    time: data.time || "00:00",
                    createdAt: data.createdAt || data.date || new Date().toISOString()
                };
            });

            setAllEntries(parsedEntries);
        } catch (error) {
            console.error("Leaderboard fetch error:", error);
            setAllEntries([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (db) {
        fetchData();
    }
  }, [db]);

  // Process data for Mock Test Rankings
  const mockTestRankings = (() => {
    if (!allEntries || selectedTestId === "all") return [];
    
    return allEntries
      .filter(entry => entry.testId === selectedTestId)
      .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.time.localeCompare(b.time); // faster time is better
      })
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  })();

  // Process data for Monthly Standings (group by student, take their best attempt of the month)
  const monthlyRankings = (() => {
      if (!allEntries) return [];

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Filter to current month
      const currentMonthEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.createdAt);
          return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
      });

      // Group by studentId and choose best score
      const studentBestMap: Record<string, UserEntry> = {};
      currentMonthEntries.forEach(entry => {
          const existing = studentBestMap[entry.studentId];
          if (!existing) {
              studentBestMap[entry.studentId] = entry;
          } else {
              // Compare score, then time
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

  if (isLoading || !allEntries) {
    return (
      <UserLayout>
        <div className="w-full max-w-4xl mx-auto flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </UserLayout>
    )
  }

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <UserLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        {/* Toggle Tabs */}
        <div className="flex justify-center">
          <div className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setActiveTab("mockTest")}
              className={cn(
                "py-2.5 text-sm font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === "mockTest"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-4 h-4" /> Mock Test Ranks
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={cn(
                "py-2.5 text-sm font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === "monthly"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="w-4 h-4" /> Monthly Standings
            </button>
          </div>
        </div>

        <Card className="shadow-2xl border-none ring-1 ring-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 text-center pb-8 border-b">
            <CardTitle className="text-4xl font-black text-primary flex items-center justify-center gap-3 tracking-tighter uppercase italic">
              <Trophy className="w-10 h-10 text-yellow-500" />
              Achievement Board
            </CardTitle>
            <CardDescription className="text-center font-bold uppercase tracking-widest text-xs mt-2 text-primary">
              {activeTab === "mockTest" 
                ? "Mock Test Rankings • 80%+ Accuracy Required for Cash Rewards"
                : `Monthly Rankings for ${currentMonthName} • Top 5 gets AI Tools Access`}
            </CardDescription>
            
            {/* Mock Test Selector Dropdown */}
            {activeTab === "mockTest" && scheduledTests.length > 0 && (
                <div className="max-w-md mx-auto mt-4">
                    <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                        <SelectTrigger className="bg-white border-primary/20 font-semibold text-primary">
                            <SelectValue placeholder="Select a Mock Test" />
                        </SelectTrigger>
                        <SelectContent>
                            {scheduledTests.map(test => (
                                <SelectItem key={test.id} value={test.id} className="font-medium">
                                    {test.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px] text-center font-black uppercase text-[10px] tracking-widest">Standing</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Excellence Candidate</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Duration</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Score Accuracy</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">
                      {activeTab === "mockTest" ? "Cash Rewards" : "AI Access Reward"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === "mockTest" ? (
                  mockTestRankings.length > 0 ? mockTestRankings.map((player) => {
                    const rankPrize = getPrizeForRank(player.rank, player.accuracy);
                    const meetsCriteria = player.accuracy >= 80;

                    return (
                      <TableRow key={player.id} className={cn("transition-colors group", getRankStyles(player.rank))}>
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
                                    {player.accuracy.toFixed(0)}%
                                </span>
                                <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                    <div className={cn("h-full", meetsCriteria ? "bg-primary" : "bg-amber-500")} style={{ width: `${Math.min(player.accuracy, 100)}%` }} />
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
                    );
                  }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                              <Trophy className="w-12 h-12 opacity-10 mb-2" />
                              <p className="font-bold">No Submissions Found</p>
                              <p className="text-xs">No records recorded for this Mock Test yet.</p>
                          </div>
                        </TableCell>
                    </TableRow>
                  )
                ) : (
                  monthlyRankings.length > 0 ? monthlyRankings.map((player) => {
                    const isTop5 = player.rank <= 5;

                    return (
                      <TableRow key={player.id} className={cn("transition-colors group", getRankStyles(player.rank))}>
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
                                  {player.rank <= 5 && <p className="text-[9px] font-black text-primary uppercase mt-1 tracking-widest">Monthly Elite</p>}
                              </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-muted-foreground">{player.time}</TableCell>
                        <TableCell className="text-center">
                            <div className="inline-flex flex-col items-center">
                                <span className="text-xl font-black text-primary">
                                    {player.accuracy.toFixed(0)}%
                                </span>
                                <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min(player.accuracy, 100)}%` }} />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          {player.rank === 1 ? (
                              <div className="flex flex-col items-end gap-1">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full font-black text-sm shadow-sm border border-green-500/20">
                                      <Coins className="w-4 h-4" />
                                      ₹{(storeConfig?.monthlyFirstRankerReward ?? 1000).toLocaleString()} Cash
                                  </div>
                                  <Badge className="bg-accent text-accent-foreground font-black gap-1.5 text-[10px] py-1 shadow-sm">
                                      <Sparkles size={10}/> Both AI Tools Access
                                  </Badge>
                              </div>
                          ) : isTop5 ? (
                              <Badge className="bg-accent text-accent-foreground font-black gap-1.5 text-xs py-1.5 shadow-sm">
                                  <Sparkles size={12}/> Both AI Tools Access
                              </Badge>
                          ) : (
                              <span className="text-muted-foreground/30 font-black">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                              <Trophy className="w-12 h-12 opacity-10 mb-2" />
                              <p className="font-bold">No Monthly Submissions Found</p>
                              <p className="text-xs">No records recorded for this calendar month yet.</p>
                          </div>
                        </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 border-t justify-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                  <Info size={14} className="text-primary"/>
                  {activeTab === "mockTest" 
                    ? "Cash prize rewards require top 5 rank AND 80% accuracy for each test"
                    : `Rank 1 receives ₹${(storeConfig?.monthlyFirstRankerReward ?? 1000).toLocaleString()} Cash + 30 days of free AI Tools access. Ranks 2-5 receive 30 days of free AI Tools access.`}
              </div>
          </CardFooter>
        </Card>
      </div>
    </UserLayout>
  );
}
