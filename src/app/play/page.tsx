
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import {
  Award,
  CircleHelp,
  Gamepad2,
  HeartCrack,
  Lightbulb,
  Loader2,
  RefreshCw,
  Share2,
  Star,
  Ticket,
  Trophy,
  ArrowLeft,
  BarChart2,
  Percent,
  IndianRupee,
  Sprout,
  Clock,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { walletData, addTransaction } from "@/lib/user-data";
import { storeConfig } from "@/lib/store-config";
import { addNotification } from "@/lib/notifications";


const GAMES_PER_TICKET = 2;
const GAME_DURATION = 60; // 60 seconds

type GameState = "idle" | "playing" | "won" | "lost";
type GameMode = "real" | "demo";

// In a real app, this would be fetched and persisted
const initialPlayerStats = {
    winRate: 0,
    totalEarnings: 0,
    gamesPlayed: 0,
    wins: 0,
    earningsHistory: [] as {name: string, earnings: number}[],
};


const Confetti = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
            <div
                key={i}
                className="absolute bg-yellow-400 rounded-full"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${-20 - Math.random() * 100}%`,
                    width: `${Math.random() * 8 + 4}px`,
                    height: `${Math.random() * 8 + 4}px`,
                    animation: `confetti-fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`,
                }}
            />
        ))}
        <style jsx>{`
            @keyframes confetti-fall {
                from {
                    transform: translateY(0) rotate(0deg);
                }
                to {
                    transform: translateY(120vh) rotate(720deg);
                }
            }
        `}</style>
    </div>
);

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secretNumber, setSecretNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState<{ guess: number; hint: string }[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(storeConfig.gameSettings.maxAttempts);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [gameMode, setGameMode] = useState<GameMode>("real");
  const [feedback, setFeedback] = useState("Start a new game to play!");
  const [isChecking, setIsChecking] = useState(false);
  const [reward, setReward] = useState(0);
  const [shake, setShake] = useState(false);
  
  const [playerStats, setPlayerStats] = useState(initialPlayerStats);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);


  const { toast } = useToast();

  const goBackToMenu = () => {
    setGameState('idle');
    setFeedback("Start a new game to play!");
    router.push('/play');
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, []);

  const endGame = useCallback((endState: "won" | "lost", message: string, earnedReward: number = 0) => {
    stopTimer();
    setGameState(endState);
    setFeedback(message);

    // No real money involved, but we can track stats
    const newGamesPlayed = playerStats.gamesPlayed + 1;
    const newWins = playerStats.wins + (endState === 'won' ? 1 : 0);
    const newTotalEarnings = playerStats.totalEarnings + earnedReward;
    
    const newEarningsHistory = [...playerStats.earningsHistory, { name: `G${newGamesPlayed}`, earnings: earnedReward }];
    if (newEarningsHistory.length > 7) newEarningsHistory.shift();

    setPlayerStats({
        gamesPlayed: newGamesPlayed,
        wins: newWins,
        winRate: Math.round((newWins / newGamesPlayed) * 100),
        totalEarnings: newTotalEarnings,
        earningsHistory: newEarningsHistory,
    });

    if (endState === 'won' && earnedReward > 0) {
        walletData.coins += earnedReward;
        addNotification({
            type: "deposit_received",
            message: `You won ${earnedReward} coins in GuessMaster!`,
            userId: 'user-alex-doe',
        });
        toast({
          title: "You Won!",
          description: `${earnedReward} coins have been added to your balance.`,
        });
    }

  }, [playerStats, stopTimer, toast]);

  const resetGame = useCallback(() => {
    setSecretNumber(Math.floor(Math.random() * 100) + 1);
    setAttemptsLeft(storeConfig.gameSettings.maxAttempts);
    setCurrentGuess("");
    setGuessHistory([]);
    setReward(0);
    setFeedback("Guess a number between 1 and 100.");
    setGameState("playing");
    endTimeRef.current = Date.now() + GAME_DURATION * 1000;
  }, []);
  
  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);
  
  useEffect(() => {
    const startMode = searchParams.get('mode');
    if (startMode === 'demo' && gameState === 'idle') {
      startGame();
    }
  }, [searchParams, startGame, gameState]);
  
  const handleTimerTick = useCallback(() => {
    if (endTimeRef.current) {
        const now = Date.now();
        const newTimeLeft = Math.round((endTimeRef.current! - now) / 1000);
        if (newTimeLeft <= 0) {
            setTimeLeft(0);
            endGame("lost", `Time's Up! The correct number was ${secretNumber}.`);
        } else {
            setTimeLeft(newTimeLeft);
        }
    }
  }, [endGame, secretNumber]);
  
  useEffect(() => {
      if (gameState === "playing") {
          timerRef.current = setInterval(handleTimerTick, 1000);
      } else {
          stopTimer();
      }
      return () => stopTimer();
  }, [gameState, stopTimer, handleTimerTick]);


  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  const handleGuessSubmit = async () => {
    const guessNum = parseInt(currentGuess);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      toast({
        variant: "destructive",
        title: "Invalid Guess",
        description: "Please enter a number between 1 and 100.",
      });
      return;
    }

    setIsChecking(true);
    const newAttemptsLeft = attemptsLeft - 1;
    setAttemptsLeft(newAttemptsLeft);

    if (guessNum === secretNumber) {
      const attemptsUsed = storeConfig.gameSettings.maxAttempts - newAttemptsLeft;
      const earnedReward = storeConfig.gameSettings.rewards[attemptsUsed - 1] || 0;
      setReward(earnedReward);
      setGuessHistory([...guessHistory, { guess: guessNum, hint: 'Correct!' }]);
      endGame("won", `Congratulations! You guessed the number in ${attemptsUsed} ${attemptsUsed > 1 ? 'attempts' : 'attempt'}.`, earnedReward);

    } else {
      triggerShake();
      const direction = guessNum < secretNumber ? "higher" : "lower";
      const hint = `The secret number is ${direction}.`;
      setFeedback(hint);
      setGuessHistory([...guessHistory, { guess: guessNum, hint: `Try ${direction}` }]);
      
      if (newAttemptsLeft === 0) {
        endGame("lost", `Game Over! The correct number was ${secretNumber}.`);
      }
    }
    
    setCurrentGuess("");
    setIsChecking(false);
  };

  const handleShare = async () => {
    const referralCode = walletData.referralCode;
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const rewardsList = storeConfig.gameSettings.rewards.map((r, i) => `${i+1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Attempt: ${r} coins`).join('\n');
    const message = `🎮 Join me on GuessMaster on the Vidya EduCare platform! 🎮

🚀 Use my referral code: ${referralCode}
💰 Get a ₹${storeConfig.referralBonus} instant cash bonus on signup!

🎯 Play a fun skill-based number guessing game and win coins.
💰 **Prize structure for correct guesses:**
${rewardsList}

💸 Test your logic and have fun!
Join now: ${shareUrl}

#GuessMaster #SkillGaming #VidyaEduCare #ReferralBonus`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "Promotional message copied to clipboard.",
        });
    };

    try {
        const newWindow = window.open(whatsappUrl, '_blank');
        if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
            fallbackCopy();
        }
    } catch(e) {
        fallbackCopy();
    }
  };

  const renderGameInfo = () => (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
    </div>
  );

  const renderIdleState = () => (
    <div className="text-center space-y-6">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold text-primary">GuessMaster</h1>
            <p className="text-muted-foreground mt-2">Guess the secret number between 1 and 100 in {storeConfig.gameSettings.maxAttempts} tries!</p>
        </div>
        <div>
            <Button size="lg" onClick={startGame} className="w-full md:w-auto"><Star className="mr-2 h-5 w-5"/> Play Game</Button>
        </div>
        <Button variant="ghost" onClick={handleShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4"/>
            Share & Promote GuessMaster
        </Button>
    </div>
  );
  
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  const renderPlayingState = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">GuessMaster</h2>
             <Badge variant="secondary" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
            </Badge>
            <Badge variant="secondary">Attempt {storeConfig.gameSettings.maxAttempts - attemptsLeft + 1} of {storeConfig.gameSettings.maxAttempts}</Badge>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center font-medium flex items-center justify-center gap-2 min-h-[64px]">
            <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0"/>
            <span>{feedback}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleGuessSubmit(); }} className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter your guess..."
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              disabled={isChecking}
              min={1}
              max={100}
              className="text-lg text-center h-12"
            />
            <Button type="submit" disabled={isChecking} className="w-28 h-12">
              {isChecking ? <Loader2 className="animate-spin" /> : "Guess"}
            </Button>
        </form>
        {guessHistory.length > 0 && (
          <div className="space-y-2 pt-4">
            <h3 className="font-semibold text-sm">Previous Guesses:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
                {guessHistory.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <span>Guess #{index + 1}: <span className="font-bold text-foreground">{item.guess}</span></span>
                        <Badge variant={item.hint === 'Correct!' ? 'default' : 'outline'} className="text-right">{item.hint}</Badge>
                    </li>
                ))}
            </ul>
          </div>
        )}
         <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={goBackToMenu}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
            </Button>
        </div>
    </div>
  );

  const renderEndState = () => (
    <div className="text-center space-y-4 flex flex-col items-center relative">
        {gameState === 'won' && <Confetti />}
        {gameState === 'won' ? <Trophy className="w-16 h-16 text-yellow-500" /> : <HeartCrack className="w-16 h-16 text-destructive" />}
        <h2 className="text-2xl font-bold">{gameState === 'won' ? "You Won!" : "Game Over"}</h2>
        <p className="text-muted-foreground">{feedback}</p>
        {gameState === 'won' && reward > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400"/>
                <span className="font-semibold text-green-700 dark:text-green-300">You earned {reward} coins!</span>
            </div>
        )}
        <div className="flex gap-4 pt-4">
            <Button onClick={() => startGame()}><RefreshCw className="mr-2 h-4 w-4"/> Play Again</Button>
            <Button variant="outline" onClick={goBackToMenu}>Exit to Home</Button>
        </div>
    </div>
  );

  const renderCardContent = () => {
    switch (gameState) {
      case 'idle':
        return renderIdleState();
      case 'playing':
        return renderPlayingState();
      case 'won':
      case 'lost':
        return renderEndState();
      default:
        return null;
    }
  };

  const renderRewardTiers = () => (
    <div className="w-full space-y-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2"><CircleHelp className="w-4 h-4"/>Reward Tiers</h3>
        <ul className="grid grid-cols-3 md:grid-cols-5 gap-2 text-center">
            {storeConfig.gameSettings.rewards.map((r, i) => (
                <li key={i} className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Attempt {i + 1}</p>
                    <p className="font-bold text-primary flex items-center justify-center gap-1">{r} <Coins size={12}/></p>
                </li>
            ))}
        </ul>
    </div>
  );
  
  const winRateData = [
    { name: 'Win Rate', value: playerStats.winRate, fill: 'hsl(var(--primary))' },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className={cn(
        "shadow-2xl shadow-primary/10 transition-all",
        shake && "animate-shake",
        gameState === 'won' && "bg-gradient-to-br from-background via-green-50 to-background dark:from-background dark:via-green-950/50 dark:to-background",
        gameState === 'lost' && "bg-gradient-to-br from-background via-red-50 to-background dark:from-background dark:via-red-950/50 dark:to-background"
        )}>
        <CardHeader>
          {gameState !== 'idle' ? renderGameInfo() : <CardTitle className="text-center">Welcome!</CardTitle>}
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          {renderCardContent()}
        </CardContent>
        <CardFooter>
          { (gameState === 'idle' || gameState === 'playing') && renderRewardTiers() }
        </CardFooter>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary"/>
                <span className="font-semibold">Your Performance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lifetime Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Percent className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400 mb-1"/>
                        <p className="text-xl font-bold">{playerStats.winRate}%</p>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                     <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <Coins className="w-5 h-5 mx-auto text-green-600 dark:text-green-400 mb-1"/>
                        <p className="text-xl font-bold">{playerStats.totalEarnings.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Coins Won</p>
                    </div>
                     <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                        <Gamepad2 className="w-5 h-5 mx-auto text-pink-600 dark:text-pink-400 mb-1"/>
                        <p className="text-xl font-bold">{playerStats.gamesPlayed}</p>
                        <p className="text-xs text-muted-foreground">Games Played</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Win Rate</CardTitle>
                        <CardDescription>Your winning performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        {playerStats.gamesPlayed > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart 
                                    innerRadius="70%" 
                                    outerRadius="100%" 
                                    data={winRateData} 
                                    startAngle={90} 
                                    endAngle={-270}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar background dataKey='value' angleAxisId={0} data={[{ value: 100 }]} fill="hsl(var(--muted))" cornerRadius={10} />
                                    <RadialBar dataKey='value' cornerRadius={10} />
                                    <Tooltip 
                                        contentStyle={{
                                            border: 'none',
                                            background: 'transparent',
                                            padding: 0,
                                        }}
                                        cursor={false}
                                        formatter={(value) => `${value}%`}
                                    />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                                        {`${playerStats.winRate}%`}
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data yet.</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Winnings</CardTitle>
                        <CardDescription>Coins from last 7 games.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {playerStats.earningsHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={playerStats.earningsHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tick={false}/>
                                    <YAxis fontSize={12} />
                                    <Tooltip formatter={(value) => `${value} Coins`} />
                                    <Line type="monotone" dataKey="earnings" name="Coins" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data yet.</div>
                         )}
                    </CardContent>
                </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
       <style jsx global>{`
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
            .animate-shake {
                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            }
        `}</style>
    </div>
  );
}
