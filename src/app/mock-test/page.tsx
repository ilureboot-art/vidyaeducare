
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { studentData, type StudentProfile } from "@/lib/student-data";
import { allQuestions, type Question } from "@/lib/question-bank";
import { Separator } from "@/components/ui/separator";

const MOCK_TEST_DURATION = 30 * 60; // 30 minutes in seconds

type TestState = "loading" | "in_progress" | "completed" | "review";

export default function MockTestPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [testState, setTestState] = useState<TestState>("loading");
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [subject, setSubject] = useState<string | null>(null);

    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(MOCK_TEST_DURATION);
    const [answers, setAnswers] = useState<{ [key: string]: { en: string; hi: string; } }>({});
    const [score, setScore] = useState(0);
    const [prizeEligible, setPrizeEligible] = useState(false);

    useEffect(() => {
        const studentId = searchParams.get('studentId');
        const subjectParam = searchParams.get('subject');

        if (!studentId || !subjectParam) {
            toast({ variant: "destructive", title: "Error", description: "Missing student or subject information."});
            router.push('/profile');
            return;
        }

        const student = studentData.find(s => s.id === studentId);
        if (!student) {
             toast({ variant: "destructive", title: "Error", description: "Student profile not found."});
            router.push('/profile');
            return;
        }

        setStudentProfile(student);
        setSubject(subjectParam);

        const studentStandard = student.academic.standard;
        const filteredQuestions = allQuestions.filter(q => 
            q.subject.toLowerCase() === subjectParam.toLowerCase() && 
            q.standard === studentStandard
        ).slice(0, 50); // Limit to 50 questions

        if (filteredQuestions.length === 0) {
            toast({
                variant: "destructive",
                title: "No Questions Available",
                description: `We couldn't find any questions for ${subjectParam} at the ${studentStandard} level.`,
            });
            router.push('/profile');
            return;
        }

        setActiveQuestions(filteredQuestions);
        setTimeLeft(MOCK_TEST_DURATION);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
        setTestState("in_progress");

    }, [searchParams, router, toast]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testState, timeLeft]);


    const handleAnswerSelect = (questionId: string, answerEn: string, answerHi: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: { en: answerEn, hi: answerHi } }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activeQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSubmitTest = () => {
        let correctAnswers = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id]?.en === q.correctAnswer.en) {
                correctAnswers++;
            }
        });
        
        const finalScore = (correctAnswers / activeQuestions.length) * 100;
        setScore(finalScore);

        if (studentProfile) {
            const student = studentData.find(s => s.id === studentProfile.id);
            if (student) {
                const newPerformanceEntry = { name: subject || "Test", score: finalScore };
                const existingEntryIndex = student.stats.performance.findIndex(p => p.name === newPerformanceEntry.name);

                if (existingEntryIndex > -1) {
                    student.stats.performance[existingEntryIndex] = newPerformanceEntry;
                } else {
                    student.stats.performance.push(newPerformanceEntry);
                }

                student.stats.testsTaken = student.stats.performance.length;
                const totalScore = student.stats.performance.reduce((acc, p) => acc + p.score, 0);
                student.stats.avgScore = totalScore / student.stats.testsTaken;
                
                const allScoresAreHigh = student.stats.performance.every(p => p.score > 80);
                setPrizeEligible(allScoresAreHigh);
            }
        }

        setTestState("completed");
        toast({
            title: "Test Submitted!",
            description: `You scored ${correctAnswers} out of ${activeQuestions.length}.`
        });
    };
    
    if (testState === "loading" || !studentProfile) {
        return (
             <Card className="w-full max-w-3xl text-center p-8">
                <CardTitle>Loading Test...</CardTitle>
                <CardDescription>Preparing your questions.</CardDescription>
            </Card>
        )
    }
    
    if (testState === "review") {
        return (
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="text-primary"/> Test Review: {subject}
                    </CardTitle>
                    <CardDescription>Review your answers for {studentProfile?.name}. Correct answers are marked in green.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {activeQuestions.map((q, index) => {
                                const userAnswer = answers[q.id];
                                const isCorrect = userAnswer?.en === q.correctAnswer.en;
                                return (
                                <div key={q.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{index + 1}. {q.text.en}</p>
                                        {isCorrect ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
                                    </div>
                                    <p className="font-semibold text-muted-foreground">{q.text.hi}</p>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {q.options.en.map((optionEn, optionIndex) => {
                                            const optionHi = q.options.hi[optionIndex];
                                            const isUserAnswer = userAnswer?.en === optionEn;
                                            const isCorrectAnswer = q.correctAnswer.en === optionEn;
                                            return (
                                                <div key={optionEn} className={cn(
                                                    "p-2 rounded-md",
                                                    isCorrectAnswer && "bg-green-100 dark:bg-green-900/50 font-semibold",
                                                    isUserAnswer && !isCorrectAnswer && "bg-red-100 dark:bg-red-900/50 line-through"
                                                )}>
                                                    <p>{optionEn}</p>
                                                    <p className="text-muted-foreground">{optionHi}</p>
                                                </div>
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
                        <Button asChild><Link href="/profile">Back to My Students</Link></Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (testState === "completed") {
        return (
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">Test Results: {subject}</CardTitle>
                    <CardDescription>For {studentProfile?.name}</CardDescription>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 my-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">You have completed the test.</p>
                    <p className="text-4xl font-bold">Your Score: {score.toFixed(0)}%</p>
                    
                    {prizeEligible ? (
                        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500">
                             <CheckCircle className="h-4 w-4 text-green-700" />
                            <AlertTitle className="text-green-800">Congratulations! Prize Eligible!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                This student has maintained a score of over 80% in all subject tests, including this one. Rewards will be credited to your wallet shortly.
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Alert variant="destructive">
                             <XCircle className="h-4 w-4" />
                            <AlertTitle>Keep Practicing!</AlertTitle>
                            <AlertDescription>
                                To be eligible for a prize, the student must score above 80% in this test and all other subject tests they have taken. If the score for any subject test drops below 80%, eligibility is lost.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                        <Button onClick={() => setTestState('review')}>Review Answers</Button>
                         <Button asChild variant="outline">
                            <Link href="/profile">Back to My Students</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/leaderboard">View Leaderboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const currentQuestion = activeQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;
    const minutesLeft = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl text-primary">{subject} Test</CardTitle>
                        <CardDescription>For {studentProfile?.name}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                    </Badge>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {activeQuestions.length}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-lg font-semibold">{currentQuestion.text.en}</p>
                    <p className="text-lg font-semibold text-muted-foreground">{currentQuestion.text.hi}</p>
                </div>
                <RadioGroup 
                    value={answers[currentQuestion.id]?.en || ""} 
                    onValueChange={(value) => {
                        const optionIndex = currentQuestion.options.en.indexOf(value);
                        handleAnswerSelect(currentQuestion.id, value, currentQuestion.options.hi[optionIndex]);
                    }}
                    className="space-y-2"
                >
                    {currentQuestion.options.en.map((optionEn, index) => {
                        const optionHi = currentQuestion.options.hi[index];
                        return (
                            <Label key={index} className="flex items-start gap-4 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value={optionEn} id={`q${currentQuestion.id}-o${index}`} className="mt-1" />
                                <div>
                                    <span>{optionEn}</span>
                                    <br/>
                                    <span className="text-muted-foreground">{optionHi}</span>
                                </div>
                            </Label>
                        )
                    })}
                </RadioGroup>

                 <div className="flex justify-between items-center pt-4 border-t mt-4">
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
