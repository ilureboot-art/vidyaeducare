
"use client";

import { useState, useEffect, Suspense } from "react";
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
import type { StudentProfile } from "@/lib/student-data";
import type { Question, TestSet } from "@/lib/question-bank";
import type { ScheduledTest } from "@/lib/test-schedule";
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useDbService } from "@/firebase";

const MOCK_TEST_DURATION = 30 * 60; // 30 minutes in seconds

type TestState = "loading" | "in_progress" | "completed" | "review";

function MockTestContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const db = useDbService();

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
        if (!db) return;

        const studentId = searchParams.get('studentId');
        const testId = searchParams.get('testId');
        const live = searchParams.get('isLive') === 'true';
        setIsLiveTest(live);
        
        if (!studentId || !testId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Missing student or test ID.' });
            router.push('/profile');
            return;
        }
        
        const fetchData = async () => {
            try {
                // Fetch student profile
                const studentDoc = await getDoc(doc(db, 'students', studentId));
                if (studentDoc.exists()) {
                    setStudentProfile(studentDoc.data() as StudentProfile);
                } else {
                    throw new Error("Student profile not found");
                }

                // Fetch scheduled test details
                const scheduledTestDoc = await getDoc(doc(db, 'scheduledTests', testId));
                if (scheduledTestDoc.exists()) {
                    const scheduledTestData = scheduledTestDoc.data() as ScheduledTest;
                    setScheduledTest(scheduledTestData);

                    // Fetch the actual questions from the test set
                    const testSetDoc = await getDoc(doc(db, 'testSets', scheduledTestData.testSetId));
                    if (testSetDoc.exists()) {
                        const testSetData = testSetDoc.data() as TestSet;
                        setActiveQuestions(testSetData.questions);
                        setTestState("in_progress");
                    } else {
                        throw new Error("Test set not found");
                    }
                } else {
                    throw new Error("Scheduled test not found");
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to load test', description: error.message });
                router.push('/profile');
            }
        };

        fetchData();
    }, [searchParams, router, toast, db]);

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

    const handleSubmitTest = async () => {
        if (!scheduledTest || !studentProfile || !db) return;

        let correctAnswers = 0;
        activeQuestions.forEach(q => {
            if (answers[q.id]?.en === q.correctAnswer.en) {
                correctAnswers++;
            }
        });
        
        const finalScore = (correctAnswers / activeQuestions.length) * 100;
        setScore(finalScore);
        
        const timeTaken = MOCK_TEST_DURATION - timeLeft;
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        try {
            const resultId = `${studentProfile.id}-${scheduledTest.id}`;
            await setDoc(doc(db, "testResults", resultId), {
                studentId: studentProfile.id,
                studentName: studentProfile.name,
                testId: scheduledTest.id,
                testName: scheduledTest.testSetName,
                score: finalScore,
                answers: answers,
                timeTaken: timeString,
                date: new Date().toISOString(),
            });

            if (isLiveTest) {
                await setDoc(doc(db, "leaderboard", resultId), {
                    name: studentProfile.name,
                    avatar: studentProfile.name.charAt(0),
                    score: correctAnswers,
                    time: timeString
                });
            }

            setTestState("completed");
            toast({
                title: "Test Submitted!",
                description: `You scored ${correctAnswers} out of ${activeQuestions.length}.`
            });
        } catch (error) {
            console.error("Failed to save test results:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not save your test results." });
        }
    };
    
    if (testState === "loading" || !studentProfile || !scheduledTest || activeQuestions.length === 0) {
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

                    {isLiveTest && score > 80 && (
                        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 text-left">
                             <CheckCircle className="h-4 w-4 text-green-700" />
                            <AlertTitle className="text-green-800">Congratulations! Prize Eligible!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Rewards will be credited to your wallet shortly based on your rank. Check the leaderboard!
                            </AlertDescription>
                        </Alert>
                    )}

                     {isLiveTest && score <= 80 && (
                         <Alert variant="destructive" className="text-left">
                             <XCircle className="h-4 w-4" />
                            <AlertTitle>Keep Practicing!</AlertTitle>
                            <AlertDescription>
                                You need a score above 80% to be eligible for prizes in a live test.
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


export default function MockTestPage() {
    return (
        <Suspense fallback={
            <Card className="w-full max-w-3xl text-center p-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                <CardTitle>Loading Test...</CardTitle>
                <CardDescription>Preparing your questions. Please wait.</CardDescription>
            </Card>
        }>
            <ProtectedRoute>
                <MockTestContent />
            </ProtectedRoute>
        </Suspense>
    )
}
