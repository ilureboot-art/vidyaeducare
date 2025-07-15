
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAiHint } from "@/ai/flows/numberace-ai-hint";
import {
  Award,
  CircleHelp,
  Gamepad2,
  HeartCrack,
  Lightbulb,
  Loader2,
  RefreshCw,
  Share2,
  Sprout,
  Star,
  Ticket,
  Trophy,
} from "lucide-react";

const MAX_ATTEMPTS = 5;
const REWARDS = [100, 75, 50, 25, 15];
const GAMES_PER_TICKET = 2;

type GameState = "idle" | "playing" | "demo" | "won" | "lost";

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secretNumber, setSecretNumber] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState<{ guess: number; hint: string }[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [feedback, setFeedback] = useState("Start a new game to play!");
  const [isChecking, setIsChecking] = useState(false);
  const [reward, setReward] = useState(0);
  const [tickets, setTickets] = useState(2);
  const [gamesLeft, setGamesLeft] = useState(tickets * GAMES_PER_TICKET);
  
  const { toast } = useToast();

  const resetGame = useCallback((isDemo = false) => {
    setSecretNumber(Math.floor(Math.random() * 100) + 1);
    setAttemptsLeft(MAX_ATTEMPTS);
    setCurrentGuess("");
    setGuessHistory([]);
    setReward(0);
    setFeedback("Guess a number between 1 and 100.");
    setGameState(isDemo ? "demo" : "playing");
  }, []);

  const startGame = useCallback((isDemo = false) => {
    if (!isDemo && gamesLeft <= 0) {
      toast({
        variant: "destructive",
        title: "No Games Left",
        description: "You need to buy more tickets to play.",
      });
      return;
    }

    if (!isDemo) {
      setGamesLeft((prev) => prev - 1);
    }
    resetGame(isDemo);
  }, [gamesLeft, resetGame, toast]);
  
  useEffect(() => {
    const isDemo = searchParams.get('demo') === 'true';
    const start = searchParams.get('start') === 'true';

    if (isDemo || start) {
      startGame(isDemo);
    }
  }, [searchParams, startGame]);


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
      const attemptsUsed = MAX_ATTEMPTS - newAttemptsLeft;
      const earnedReward = gameState === 'demo' ? 0 : REWARDS[attemptsUsed - 1] || 0;
      setReward(earnedReward);
      setGameState("won");
      setFeedback(`Congratulations! You guessed the number in ${attemptsUsed} ${attemptsUsed > 1 ? 'attempts' : 'attempt'}.`);
      setGuessHistory([...guessHistory, { guess: guessNum, hint: 'Correct!' }]);
    } else {
      const direction = guessNum < secretNumber ? "higher" : "lower";
      
      try {
        const aiHint = await getAiHint({ guess: guessNum, direction });
        setFeedback(aiHint);
        setGuessHistory([...guessHistory, { guess: guessNum, hint: `AI: "${aiHint}"` }]);
      } catch (error) {
        console.error("AI hint failed, falling back to simple hint", error);
        const hint = `Hint: Try a ${direction} number!`;
        setFeedback(hint);
        setGuessHistory([...guessHistory, { guess: guessNum, hint: `Try ${direction}` }]);
      }
      
      if (newAttemptsLeft === 0) {
        setGameState("lost");
        setFeedback(`Game Over! The correct number was ${secretNumber}.`);
      }
    }
    
    setCurrentGuess("");
    setIsChecking(false);
  };

  const handleShare = async () => {
    const shareUrl = `https://guessmaster.app/`;
    const message = `Think you can guess the secret number? I'm playing GuessMaster and you can win up to ₹100 on your first try! Come play and see if you can beat my score.`;
    const fullMessage = `${message}\n${shareUrl}`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(fullMessage);
        toast({
            title: "Link Copied!",
            description: "Promotional message copied to clipboard.",
        });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on GuessMaster!',
          text: message,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error("Share failed:", error);
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const renderGameInfo = () => (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span>Tickets: {tickets}</span>
        </div>
        <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <span>Games Left: {gamesLeft}</span>
        </div>
    </div>
  );

  const renderIdleState = () => (
    <div className="text-center space-y-6">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold font-headline text-primary">GuessMaster</h1>
            <p className="text-muted-foreground mt-2">Guess the secret number between 1 and 100 in 5 tries!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button size="lg" onClick={() => startGame(false)}><Star className="mr-2 h-5 w-5"/> Play Real Game</Button>
            <Button size="lg" variant="secondary" onClick={() => startGame(true)}><Sprout className="mr-2 h-5 w-5"/> Play Demo</Button>
        </div>
        <Button variant="ghost" onClick={handleShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4"/>
            Share & Promote GuessMaster
        </Button>
    </div>
  );

  const renderPlayingState = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{gameState === 'demo' ? 'Demo Game' : 'Real Game'}</h2>
            <Badge variant="secondary">Attempt {MAX_ATTEMPTS - attemptsLeft + 1} of {MAX_ATTEMPTS}</Badge>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center font-medium flex items-center justify-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent"/>
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
              className="text-lg text-center"
            />
            <Button type="submit" disabled={isChecking} className="w-28">
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
    </div>
  );

  const renderEndState = () => (
    <div className="text-center space-y-4 flex flex-col items-center">
        {gameState === 'won' ? <Trophy className="w-16 h-16 text-yellow-500" /> : <HeartCrack className="w-16 h-16 text-destructive" />}
        <h2 className="text-2xl font-bold font-headline">{gameState === 'won' ? "You Won!" : "Game Over"}</h2>
        <p className="text-muted-foreground">{feedback}</p>
        {gameState === 'won' && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400"/>
                <span className="font-semibold text-green-700 dark:text-green-300">You earned ₹{reward}!</span>
            </div>
        )}
        <div className="flex gap-4 pt-4">
            <Button onClick={() => startGame(gameState !== 'won')}><RefreshCw className="mr-2 h-4 w-4"/> Play Again</Button>
            <Button variant="outline" onClick={() => { setGameState('idle'); router.push('/'); }}>Exit to Home</Button>
        </div>
    </div>
  );

  const renderCardContent = () => {
    switch (gameState) {
      case 'idle':
        return renderIdleState();
      case 'playing':
      case 'demo':
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
            {REWARDS.map((r, i) => (
                <li key={i} className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Attempt {i + 1}</p>
                    <p className="font-bold text-primary">₹{r}</p>
                </li>
            ))}
        </ul>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-2xl shadow-primary/10">
        <CardHeader>
          {gameState !== 'idle' ? renderGameInfo() : <CardTitle className="text-center">Welcome!</CardTitle>}
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          {renderCardContent()}
        </CardContent>
        <CardFooter>
          { (gameState === 'idle' || gameState === 'playing' || gameState === 'demo') && renderRewardTiers() }
        </CardFooter>
      </Card>
    </div>
  );
}

    