
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

export default function VidyaAIPage() {
    const { toast } = useToast();

    const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);

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
        toast({ variant: 'destructive', title: "Feature Disabled", description: "AI generation is temporarily disabled while we resolve an issue." });
    };
    
    const handleCopyToClipboard = () => {
        if (!generatedOutput) return;

        navigator.clipboard.writeText(generatedOutput).then(() => {
            toast({ title: "Copied to Clipboard", description: "Generated output copied as JSON." });
        }).catch(err => {
            console.error("Copy failed:", err);
            toast({ variant: 'destructive', title: "Copy Failed", description: "Could not copy output to clipboard." });
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
                    <CardTitle>Content Generator</CardTitle>
                    <CardDescription>
                        This feature is temporarily disabled.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="board">Board</Label>
                                <Select value={board} onValueChange={setBoard} required disabled>
                                    <SelectTrigger id="board"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.boards.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="standard">Standard</Label>
                                <Select value={standard} onValueChange={setStandard} required disabled>
                                    <SelectTrigger id="standard"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.standards.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select value={subject} onValueChange={setSubject} required disabled>
                                    <SelectTrigger id="subject"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="chapterName">Chapter Name / Topic</Label>
                                <Input id="chapterName" value={chapterName} onChange={(e) => setChapterName(e.target.value)} placeholder="e.g., Gravitation, The Indian Constitution" required disabled/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                <Input id="numQuestions" type="number" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} min={1} max={20} required disabled/>
                            </div>
                        </div>
                         <div className="flex justify-end pt-4">
                            <Button type="submit" disabled>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Content
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>

            {(isGenerating || generatedOutput) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="text-primary"/>
                                Generated Output
                            </div>
                            {generatedOutput && (
                                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>Copy JSON</Button>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {isGenerating ? "The AI is thinking... Please wait a moment." : "Review the generated output below."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGenerating && (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground gap-4 h-64">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p>Generating content for '{chapterName}'...</p>
                             </div>
                        )}
                        {generatedOutput && (
                            <Textarea 
                                readOnly
                                value={generatedOutput}
                                className="min-h-[400px] text-xs font-mono bg-muted/50"
                            />
                        )}
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
