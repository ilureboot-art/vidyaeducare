"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, CheckCircle, XCircle, ArrowLeft, BrainCircuit, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import UserLayout from "@/components/UserLayout";

const TRIAL_QUESTIONS = [
    {
        id: "trial-1",
        text: { mr: "पृथ्वीचा एकमेव नैसर्गिक उपग्रह कोणता आहे?", en: "Which is the only natural satellite of Earth?" },
        options: {
            mr: ["मंगळ", "शुक्र", "चंद्र", "गुरु"],
            en: ["Mars", "Venus", "Moon", "Jupiter"]
        },
        correctAnswer: { mr: "चंद्र", en: "Moon" }
    },
    {
        id: "trial-2",
        text: { mr: "भारताचे पहिले पंतप्रधान कोण होते?", en: "Who was the first Prime Minister of India?" },
        options: {
            mr: ["महात्मा गांधी", "जवाहरलाल नेहरू", "सरदार पटेल", "बी.आर. आंबेडकर"],
            en: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "B.R. Ambedkar"]
        },
        correctAnswer: { mr: "जवाहरलाल नेहरू", en: "Jawaharlal Nehru" }
    },
    {
        id: "trial-3",
        text: { mr: "पाण्याचे रासायनिक सूत्र काय आहे?", en: "What is the chemical formula for water?" },
        options: {
            mr: ["CO2", "H2O", "O2", "NaCl"],
            en: ["CO2", "H2O", "O2", "NaCl"]
        },
        correctAnswer: { mr: "H2O", en: "H2O" }
    },
    {
        id: "trial-4",
        text: { mr: "महाराष्ट्र राज्याची राजधानी कोणती आहे?", en: "What is the capital city of Maharashtra?" },
        options: {
            mr: ["पुणे", "नागपूर", "नाशिक", "मुंबई"],
            en: ["Pune", "Nagpur", "Nashik", "Mumbai"]
        },
        correctAnswer: { mr: "मुंबई", en: "Mumbai" }
    },
    {
        id: "trial-5",
        text: { mr: "कोणता वायू जळण्यासाठी मदत करतो?", en: "Which gas is required for burning?" },
        options: {
            mr: ["नत्र", "प्राणवायू (ऑक्सिजन)", "कार्बन डायऑक्साइड", "हायड्रोजन"],
            en: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Hydrogen"]
        },
        correctAnswer: { mr: "प्राणवायू (ऑक्सिजन)", en: "Oxygen" }
    }
];

export default function TrialMockTestPage() {
    const [testState, setTestState] = useState<"in_progress" | "completed">("in_progress");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useEffect(() => {
        if (testState !== "in_progress") return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [testState, timeLeft]);

    const handleAnswer = (val: string) => {
        setAnswers(prev => ({ ...prev, [TRIAL_QUESTIONS[currentIdx].id]: val }));
    };

    const handleSubmit = () => {
        let correct = 0;
        TRIAL_QUESTIONS.forEach(q => {
            if (answers[q.id] === q.correctAnswer.mr) correct++;
        });
        setScore(correct);
        setTestState("completed");
    };

    if (testState === "completed") {
        return (
            <UserLayout>
                <div className="w-full max-w-2xl mx-auto py-8">
                    <Card className="text-center shadow-2xl border-primary/20">
                        <CardHeader className="bg-primary/5 pb-8">
                            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
                            <CardTitle className="text-4xl font-black text-primary uppercase">Trial Results</CardTitle>
                            <CardDescription className="text-lg font-bold">You scored {score} out of 5</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="p-6 bg-muted/30 rounded-2xl border-2 border-dashed">
                                <p className="text-lg font-medium leading-relaxed">
                                    This was a <b>Free Trial Test</b>. For real exam environments, live leaderboards, and cash prizes, join Vidya EduCare today!
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <Button asChild size="lg" className="py-8 text-xl font-black shadow-xl">
                                    <Link href="/signup">JOIN FOR FULL ACCESS <ArrowRight className="ml-2"/></Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/">Back to Home</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </UserLayout>
        );
    }

    const currentQ = TRIAL_QUESTIONS[currentIdx];
    const progress = ((currentIdx + 1) / TRIAL_QUESTIONS.length) * 100;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
        <UserLayout>
            <div className="w-full max-w-3xl mx-auto space-y-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black text-primary flex items-center gap-2">
                        <BookOpen className="text-accent" /> TRIAL PRACTICE TEST
                    </h1>
                    <Badge variant="secondary" className="text-lg font-mono px-4 py-1">
                        <Clock className="w-4 h-4 mr-2" /> {mins}:{String(secs).padStart(2, '0')}
                    </Badge>
                </div>

                <Progress value={progress} className="h-3" />

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Question {currentIdx + 1} of 5</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-foreground">{currentQ.text.mr}</p>
                            <p className="text-lg font-medium text-muted-foreground italic">{currentQ.text.en}</p>
                        </div>

                        <RadioGroup 
                            value={answers[currentQ.id] || ""} 
                            onValueChange={handleAnswer}
                            className="grid gap-3"
                        >
                            {currentQ.options.mr.map((optMr, i) => (
                                <Label key={i} className="flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value={optMr} className="mt-1" />
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold">{optMr}</p>
                                        <p className="text-sm text-muted-foreground uppercase font-black opacity-60">{currentQ.options.en[i]}</p>
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 bg-muted/20 border-t">
                        <Button 
                            variant="ghost" 
                            disabled={currentIdx === 0} 
                            onClick={() => setCurrentIdx(prev => prev - 1)}
                        >
                            Previous
                        </Button>
                        {currentIdx === TRIAL_QUESTIONS.length - 1 ? (
                            <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 px-12 font-black">SUBMIT TEST</Button>
                        ) : (
                            <Button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-12 font-black">NEXT</Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </UserLayout>
    );
}
