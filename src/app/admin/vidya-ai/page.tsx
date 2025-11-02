
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BrainCircuit, Wand2 } from "lucide-react";
import type { AcademicConfig } from "@/lib/academic-config";
import { defaultAcademicConfig } from "@/lib/academic-config";

export default function VidyaAIPage() {
    const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);

    useEffect(() => {
        setAcademicConfig(defaultAcademicConfig);
    }, []);

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
                        This AI-powered feature is temporarily disabled.
                    </CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="board">Board</Label>
                                <Select required disabled>
                                    <SelectTrigger id="board"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.boards.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="standard">Standard</Label>
                                <Select required disabled>
                                    <SelectTrigger id="standard"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.standards.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select required disabled>
                                    <SelectTrigger id="subject"><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{academicConfig.subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="chapterName">Chapter Name / Topic</Label>
                                <Input id="chapterName" placeholder="e.g., Gravitation, The Indian Constitution" required disabled/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                <Input id="numQuestions" type="number" min={1} max={20} required disabled/>
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
        </div>
    );
}
