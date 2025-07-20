
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Clock, CheckCircle, XCircle, FileQuestion, ArrowLeft, BrainCircuit, Book, Atom, Sigma, Pilcrow } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { studentData } from "@/lib/student-data";
import { allQuestions, type Question } from "@/lib/question-bank";

const MOCK_TEST_DURATION = 30 * 60; // 30 minutes in seconds

type TestState = "not_started" | "in_progress" | "completed" | "review";

const getIconForSubject = (subject: string) => {
    switch (subject.toLowerCase()) {
        case "maths":
        case "mathematics":
            return Sigma;
        case "science":
            return Atom;
        case "english":
            return Pilcrow;
        default:
            return Book;
    }
};

export default function MockTestPage() {
    const { toast } = useToast();
    const [testState, setTestState] = useState<TestState>("not_started");
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(MOCK_TEST_DURATION);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [score, setScore] = useState(0);

    const studentProfile = studentData[0];
    const studentSubjects = studentProfile?.academic.subjects || [];

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

    const handleStartTest = (subject: string) => {
        const studentStandard = studentProfile.academic.standard;
        const filteredQuestions = allQuestions.filter(q => 
            q.subject.toLowerCase() === subject.toLowerCase() && 
            q.standard === studentStandard
        ).slice(0, 50); // Limit to 50 questions for the test

        if (filteredQuestions.length === 0) {
            toast({
                variant: "destructive",
                title: "No Questions Available",
                description: `We couldn't find any questions for ${subject} at the ${studentStandard} level.`,
            });
            return;
        }

        setActiveQuestions(filteredQuestions);
        setTimeLeft(MOCK_TEST_DURATION);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
        setTestState("in_progress");
        setSelectedSubject(subject);
    };

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activeQuestions.length - 1) {
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
        activeQuestions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                finalScore++;
            }
        });
        setScore(finalScore);
        setTestState("completed");
        toast({
            title: "Test Submitted!",
            description: `You scored ${finalScore} out of ${activeQuestions.length}.`
        });
    };

    if (testState === "not_started") {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6">
                 <Card className="w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl text-primary">Select a Subject</CardTitle>
                        <CardDescription>Choose from your registered subjects to start a mock test.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentSubjects.length > 0 ? studentSubjects.map(subject => {
                            const Icon = getIconForSubject(subject);
                            return (
                                <Card key={subject} className="p-4 flex flex-col items-center justify-center text-center">
                                    <Icon className="w-12 h-12 text-primary mb-2" />
                                    <h3 className="text-lg font-semibold">{subject}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Up to 50 Questions - 30 Mins</p>
                                    <Button className="mt-4" onClick={() => handleStartTest(subject)}>Start Test</Button>
                                </Card>
                            )
                        }) : (
                            <div className="md:col-span-2 text-muted-foreground">
                                <p>No subjects found in your profile.</p>
                                <Button asChild variant="link"><Link href="/profile">Add Subjects to Your Profile</Link></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (testState === "review") {
        return (
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="text-primary"/> Test Review: {selectedSubject}
                    </CardTitle>
                    <CardDescription>Review your answers. Correct answers are marked in green.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {activeQuestions.map((q, index) => {
                                const userAnswer = answers[q.id];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                <div key={q.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{index + 1}. {q.text}</p>
                                        {isCorrect ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
                                    </div>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {q.options.map(option => {
                                            const isUserAnswer = userAnswer === option;
                                            const isCorrectAnswer = q.correctAnswer === option;
                                            return (
                                                <p key={option} className={cn(
                                                    "p-2 rounded-md",
                                                    isCorrectAnswer && "bg-green-100 dark:bg-green-900/50 font-semibold",
                                                    isUserAnswer && !isCorrectAnswer && "bg-red-100 dark:bg-red-900/50 line-through"
                                                )}>
                                                    {option}
                                                </p>
                                            )
                                        })}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardContent>
                     <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="outline" onClick={() => setTestState("completed")}>
                            <ArrowLeft className="mr-2"/> Back to Results
                        </Button>
                        <Button onClick={() => setTestState("not_started")}>Take Another Test</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (testState === "completed") {
        const percentage = (score / activeQuestions.length) * 100;
        const prizeEligible = percentage >= 80;

        return (
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">Test Results: {selectedSubject}</CardTitle>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 my-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">You have completed the test.</p>
                    <p className="text-4xl font-bold">Your Score: {score} / {activeQuestions.length}</p>
                    
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

                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                        <Button onClick={() => setTestState('review')}>Review Answers</Button>
                        <Button onClick={() => setTestState("not_started")}>Take Another Test</Button>
                        <Button asChild variant="outline">
                            <Link href="/leaderboard">View Leaderboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (activeQuestions.length === 0) {
        return (
            <Card className="w-full max-w-3xl text-center p-8">
                <CardTitle>Loading Test...</CardTitle>
                <CardDescription>Preparing your questions.</CardDescription>
            </Card>
        )
    }
    
    const currentQuestion = activeQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;
    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-primary">{selectedSubject} Test in Progress</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                    </Badge>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {activeQuestions.length}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg font-semibold">{currentQuestion.text}</p>
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
                     {currentQuestionIndex === activeQuestions.length - 1 ? (
                         <Button onClick={handleSubmitTest} className="bg-accent text-accent-foreground hover:bg-accent/90">Submit Test</Button>
                     ) : (
                        <Button onClick={handleNextQuestion}>
                            Next
                        </Button>
                     )}
                </div>
                 <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                        Previous
                    </Button>
                     {currentQuestionIndex === activeQuestions.length - 1 ? (
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

    