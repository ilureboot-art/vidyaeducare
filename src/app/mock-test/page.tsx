
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Clock, CheckCircle, XCircle, FileQuestion, ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { studentData, type StudentProfile } from "@/lib/student-data";
import { allTestSets, type Question } from "@/lib/question-bank";
import { getScheduledTestById, type ScheduledTest } from "@/lib/test-schedule";

const MOCK_TEST_DURATION = 30 * 60; // 30 minutes in seconds

type TestState = "loading" | "in_progress" | "completed" | "review";

export default function MockTestPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [testState, setTestState] = useState<TestState>("loading");
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [scheduledTest, setScheduledTest] = useState<ScheduledTest | null>(null);

    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(MOCK_TEST_DURATION);
    const [answers, setAnswers] = useState<{ [key: string]: { en: string; mr: string; } }>({});
    const [score, setScore] = useState(0);
    const [isLiveTest, setIsLiveTest] = useState(false);
    const [isPrizeEligible, setIsPrizeEligible] = useState(false);

    useEffect(() => {
        const studentId = searchParams.get('studentId');
        const testId = searchParams.get('testId');
        
        if (!studentId || !testId) {
            toast({ variant: "destructive", title: "Error", description: "Missing student or test information."});
            router.push('/profile');
            return;
        }
        
        const schedTest = getScheduledTestById(testId);
        if (!schedTest) {
             toast({ variant: "destructive", title: "Error", description: "Scheduled test not found."});
            router.push('/profile');
            return;
        }

        const now = new Date();
        const testDate = new Date(schedTest.dateTime);
        const liveStatus = testDate <= now;

        const student = studentData.find(s => s.id === studentId);
        if (!student) {
             toast({ variant: "destructive", title: "Error", description: "Student profile not found."});
            router.push('/profile');
            return;
        }
        
        const testSet = allTestSets.find(ts => ts.id === schedTest.testSetId);
        if (!testSet || testSet.questions.length === 0) {
            toast({
                variant: "destructive",
                title: "No Questions Available",
                description: `We couldn't find any questions for the test "${schedTest.testSetName}".`,
                duration: 7000
            });
            router.push('/profile');
            return;
        }

        setStudentProfile(student);
        setScheduledTest(schedTest);
        setActiveQuestions(testSet.questions);
        setIsLiveTest(liveStatus);

        // Reset state for new test
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


    const handleAnswerSelect = (questionId: string, answerEn: string, answerMr: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: { en: answerEn, mr: answerMr } }));
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
        if (!scheduledTest || !studentProfile) return;

        let correctAnswers = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id]?.en === q.correctAnswer.en) {
                correctAnswers++;
            }
        });
        
        const finalScore = (correctAnswers / activeQuestions.length) * 100;
        setScore(finalScore);
        
        // Update student stats
        const student = studentData.find(s => s.id === studentProfile.id);
        if (student) {
            const newPerformanceEntry = { name: scheduledTest.subject, score: finalScore };
            const existingEntryIndex = student.stats.performance.findIndex(p => p.name === newPerformanceEntry.name);

            if (existingEntryIndex > -1) {
                student.stats.performance[existingEntryIndex] = newPerformanceEntry;
            } else {
                student.stats.performance.push(newPerformanceEntry);
            }

            student.stats.testsTaken = student.stats.performance.length;
            const totalScore = student.stats.performance.reduce((acc, p) => acc + p.score, 0);
            student.stats.avgScore = totalScore / student.stats.testsTaken;
            
            // Check for overall prize eligibility only if this was a live test
            const allScoresAreHigh = student.stats.performance.every(p => p.score > 80);
            if (isLiveTest && allScoresAreHigh) {
                 setIsPrizeEligible(true);
            } else {
                 setIsPrizeEligible(false);
            }
        }

        setTestState("completed");
        toast({
            title: "Test Submitted!",
            description: `You scored ${correctAnswers} out of ${activeQuestions.length}.`
        });
    };
    
    if (testState === "loading" || !studentProfile || !scheduledTest) {
        return (
             <Card className="w-full max-w-3xl text-center p-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                <CardTitle>Loading Test...</CardTitle>
                <CardDescription>Preparing your questions. Please wait.</CardDescription>
            </Card>
        )
    }
    
    if (testState === "review") {
        return (
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileQuestion className="text-primary"/> Test Review: {scheduledTest.testSetName}
                    </CardTitle>
                    <CardDescription>Reviewing answers for {studentProfile?.name}. Correct answers are marked in green.</CardDescription>
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
                                        <p className="font-semibold">{index + 1}. {q.text.mr}</p>
                                        {isCorrect ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
                                    </div>
                                    <p className="font-semibold text-muted-foreground">{q.text.en}</p>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {q.options.mr.map((optionMr, optionIndex) => {
                                            const optionEn = q.options.en[optionIndex];
                                            const isUserAnswer = userAnswer?.mr === optionMr;
                                            const isCorrectAnswer = q.correctAnswer.mr === optionMr;
                                            return (
                                                <div key={optionMr} className={cn(
                                                    "p-2 rounded-md",
                                                    isCorrectAnswer && "bg-green-100 dark:bg-green-900/50 font-semibold",
                                                    isUserAnswer && !isCorrectAnswer && "bg-red-100 dark:bg-red-900/50 line-through"
                                                )}>
                                                    <p>{optionMr}</p>
                                                    <p className="text-muted-foreground">{optionEn}</p>
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
                    <CardTitle className="text-3xl text-primary">Test Results: {scheduledTest.testSetName}</CardTitle>
                    <CardDescription>For {studentProfile?.name}</CardDescription>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500 my-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">You have completed the test.</p>
                    <p className="text-4xl font-bold">Your Score: {score.toFixed(0)}%</p>
                    
                    {!isLiveTest && (
                         <Alert variant="default" className="bg-blue-100 dark:bg-blue-900 border-blue-500 text-left">
                             <Info className="h-4 w-4 text-blue-700" />
                            <AlertTitle className="text-blue-800">Practice Test Completed</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                This was a completed test taken for practice. No prizes are awarded for non-live tests. Keep practicing to win next time!
                            </AlertDescription>
                        </Alert>
                    )}

                    {isLiveTest && isPrizeEligible && (
                        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 text-left">
                             <CheckCircle className="h-4 w-4 text-green-700" />
                            <AlertTitle className="text-green-800">Congratulations! Prize Eligible!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                This student has maintained a score of over 80% in all subject tests, including this one. Rewards will be credited to your wallet shortly.
                            </AlertDescription>
                        </Alert>
                    )}

                     {isLiveTest && !isPrizeEligible && (
                         <Alert variant="destructive" className="text-left">
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
    const solvedCount = Object.keys(answers).length;
    const unsolvedCount = activeQuestions.length - solvedCount;


    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl text-primary">{scheduledTest.testSetName}</CardTitle>
                        <CardDescription>For {studentProfile?.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                         <Badge variant={isLiveTest ? "default" : "secondary"}>
                            {isLiveTest ? "Live Test" : "Practice"}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                        </Badge>
                         <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-500">
                            <CheckCircle className="w-4 h-4" />
                            Solved: {solvedCount}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-2 text-muted-foreground">
                            <FileQuestion className="w-4 h-4" />
                            Unsolved: {unsolvedCount}
                        </Badge>
                    </div>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {activeQuestions.length}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-lg font-semibold">{currentQuestion.text.mr}</p>
                    <p className="text-lg font-semibold text-muted-foreground">{currentQuestion.text.en}</p>
                </div>
                <RadioGroup 
                    value={answers[currentQuestion.id]?.mr || ""} 
                    onValueChange={(value) => {
                        const optionIndex = currentQuestion.options.mr.indexOf(value);
                        handleAnswerSelect(currentQuestion.id, currentQuestion.options.en[optionIndex], value);
                    }}
                    className="space-y-2"
                >
                    {currentQuestion.options.mr.map((optionMr, index) => {
                        const optionEn = currentQuestion.options.en[index];
                        return (
                            <Label key={index} className="flex items-start gap-4 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value={optionMr} id={`q${currentQuestion.id}-o${index}`} className="mt-1" />
                                <div>
                                    <span>{optionMr}</span>
                                    <br/>
                                    <span className="text-muted-foreground">{optionEn}</span>
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
