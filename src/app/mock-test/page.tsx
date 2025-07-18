
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const MOCK_TEST_DURATION = 30 * 60; // 30 minutes in seconds

const mockQuestions = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    question: `This is sample question number ${i + 1}. What is the correct option?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "Option C",
}));

type TestState = "not_started" | "in_progress" | "completed";

export default function MockTestPage() {
    const { toast } = useToast();
    const [testState, setTestState] = useState<TestState>("not_started");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(MOCK_TEST_DURATION);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (testState !== "in_progress") return;

        if (timeLeft <= 0) {
            handleSubmitTest();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [testState, timeLeft]);

    const handleStartTest = () => {
        setTimeLeft(MOCK_TEST_DURATION);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
        setTestState("in_progress");
    };

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < mockQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitTest = () => {
        let finalScore = 0;
        mockQuestions.forEach(q => {
            if (answers[q.id] === q.answer) {
                finalScore++;
            }
        });
        setScore(finalScore);
        setTestState("completed");
        toast({
            title: "Test Submitted!",
            description: `You scored ${finalScore} out of ${mockQuestions.length}.`
        });
    };

    if (testState === "not_started") {
        return (
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">MCQ Mock Test</CardTitle>
                    <CardDescription>Prepare for your exams with our live mock tests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Test Rules</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside">
                                <li>50 Multiple Choice Questions</li>
                                <li>30 Minutes Time Limit</li>
                                <li>Auto-evaluation and result display</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                    <Button size="lg" onClick={handleStartTest}>Start Test Now</Button>
                </CardContent>
            </Card>
        );
    }

    if (testState === "completed") {
        const percentage = (score / mockQuestions.length) * 100;
        const prizeEligible = percentage >= 80;

        return (
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">Test Results</CardTitle>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 my-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">You have completed the test.</p>
                    <p className="text-4xl font-bold">Your Score: {score} / {mockQuestions.length}</p>
                    
                    {prizeEligible ? (
                        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500">
                             <CheckCircle className="h-4 w-4 text-green-700" />
                            <AlertTitle className="text-green-800">Congratulations!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                You scored above 80% and are eligible for a cash prize! Rewards will be credited to your wallet shortly.
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Alert variant="destructive">
                             <XCircle className="h-4 w-4" />
                            <AlertTitle>Keep Practicing!</AlertTitle>
                            <AlertDescription>
                                You did not meet the 80% threshold for a prize this time. Keep trying!
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-4 justify-center pt-4">
                        <Button onClick={handleStartTest}>Take Another Test</Button>
                        <Button asChild variant="outline">
                            <Link href="/leaderboard">View Leaderboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;
    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-primary">Mock Test in Progress</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                    </Badge>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {mockQuestions.length}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg font-semibold">{currentQuestion.question}</p>
                <RadioGroup 
                    value={answers[currentQuestion.id] || ""} 
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                    className="space-y-2"
                >
                    {currentQuestion.options.map((option, index) => (
                        <Label key={index} className="flex items-center gap-4 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                            <RadioGroupItem value={option} id={`q${currentQuestion.id}-o${index}`} />
                            <span>{option}</span>
                        </Label>
                    ))}
                </RadioGroup>

                 <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                        Previous
                    </Button>
                     {currentQuestionIndex === mockQuestions.length - 1 ? (
                         <Button onClick={handleSubmitTest} className="bg-accent text-accent-foreground hover:bg-accent/90">Submit Test</Button>
                     ) : (
                        <Button onClick={handleNextQuestion}>
                            Next
                        </Button>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}
