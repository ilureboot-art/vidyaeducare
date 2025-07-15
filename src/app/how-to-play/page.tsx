"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, CheckCircle, Award } from "lucide-react";

export default function HowToPlayPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">How to Play NumberAce</CardTitle>
          <CardDescription className="text-center">
            Your guide to becoming a master guesser!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-lg">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <List className="text-accent" />
              The Basics
            </h2>
            <p>
              NumberAce is a simple number guessing game. The goal is to guess a secret number between <Badge>1</Badge> and <Badge>100</Badge>.
            </p>
            <p>
              You have a limited number of attempts to guess the correct number.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <CheckCircle className="text-accent" />
              Gameplay
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>You start with <Badge variant="secondary">5</Badge> attempts per game.</li>
              <li>Enter your guess in the input box and click "Guess".</li>
              <li>After each guess, you'll get a hint: <Badge variant="outline">higher</Badge> or <Badge variant="outline">lower</Badge>.</li>
              <li>Use the hints to narrow down the possible numbers.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Award className="text-accent" />
              Winning & Rewards
            </h2>
            <p>
              You win the game by guessing the secret number within your 5 attempts. The faster you guess, the higher your reward!
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><span className="font-bold">1st Attempt:</span> ₹100</li>
              <li><span className="font-bold">2nd Attempt:</span> ₹75</li>
              <li><span className="font-bold">3rd Attempt:</span> ₹50</li>
              <li><span className="font-bold">4th Attempt:</span> ₹25</li>
              <li><span className="font-bold">5th Attempt:</span> ₹15</li>
            </ul>
            <p>
              You can play a <Badge>Demo Game</Badge> anytime to practice without using your tickets or earning rewards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
