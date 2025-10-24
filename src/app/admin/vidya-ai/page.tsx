
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BrainCircuit, Sparkles, Wand2 } from "lucide-react";
import type { AcademicConfig } from "@/lib/academic-config";
import { defaultAcademicConfig } from "@/lib/academic-config";
import { generateMcqs, type McqGeneratorInput, type McqGeneratorOutput } from "@/ai/flows/mcq-generator-flow";

export default function VidyaAIPage() {
    const { toast } = useToast();

    const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<McqGeneratorOutput | null>(null);

    const [board, setBoard] = useState('');
    const [standard, setStandard] = useState('');
    const [subject, setSubject] = useState('');
    const [chapterName, setChapterName] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);

    useEffect(() => {
        setAcademicConfig(defaultAcademicConfig);
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!board || !standard || !subject || !chapterName || !numQuestions) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields."});
            return;
        }

        setIsGenerating(true);
        setGeneratedQuestions(null);
        try {
            const input: McqGeneratorInput = { board, standard, subject, chapterName, numQuestions };
            const result = await generateMcqs(input);
            if (!result || result.length === 0) {
                toast({ variant: 'destructive', title: "Generation Failed", description: "The AI could not generate questions. Please try again." });
            } else {
                setGeneratedQuestions(result);
                toast({ title: "Generation Complete!", description: `${result.length} MCQs have been created.` });
            }
        } catch (error) {
            console.error("MCQ generation error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: "Generation Error", description: errorMessage });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!generatedQuestions) return;

        const jsonString = JSON.stringify(generatedQuestions, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            toast({ title: "Copied to Clipboard", description: "Generated questions copied as JSON." });
        }).catch(err => {
            console.error("Copy failed:", err);
            toast({ variant: 'destructive', title: "Copy Failed", description: "Could not copy questions to clipboard." });
        });
    };

    if (!academicConfig) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><BrainCircuit /> Vidya EduCare AI</h1>
            <Card>
                <CardHeader>
                    <CardTitle>MCQ Generator</CardTitle>
                    <CardDescription>
                        Generate Multiple Choice Questions by providing the academic details. The AI will create questions and answers in both English and Marathi.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="board">Board</Label>
                                <Select value={board} onValueChange={setBoard} required>
                                    <SelectTrigger id="board"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.boards.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="standard">Standard</Label>
                                <Select value={standard} onValueChange={setStandard} required>
                                    <SelectTrigger id="standard"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.standards.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select value={subject} onValueChange={setSubject} required>
                                    <SelectTrigger id="subject"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="chapterName">Chapter Name / Topic</Label>
                                <Input id="chapterName" value={chapterName} onChange={(e) => setChapterName(e.target.value)} placeholder="e.g., Gravitation, The Indian Constitution" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                <Input id="numQuestions" type="number" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} min={1} max={20} required />
                            </div>
                        </div>
                         <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Generate MCQs
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>

            {(isGenerating || generatedQuestions) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-primary"/>
                                Generated Output
                            </div>
                            {generatedQuestions && (
                                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>Copy JSON</Button>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {isGenerating ? "The AI is thinking... Please wait a moment." : "Review the generated questions below."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGenerating && (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-4 h-64">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p>Generating {numQuestions} questions for '{chapterName}'...</p>
                             </div>
                        )}
                        {generatedQuestions && (
                            <Textarea 
                                readOnly
                                value={JSON.stringify(generatedQuestions, null, 2)}
                                className="min-h-[400px] text-xs font-mono bg-muted/50"
                            />
                        )}
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
