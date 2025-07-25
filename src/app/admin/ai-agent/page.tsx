
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2, Sparkles, Upload, Download } from "lucide-react";
import { generateEducationalContent, type VidyaEdurankInput, type VidyaEdurankOutput } from '@/ai/flows/vidya-edurank-flow';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default function AiAgentPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<VidyaEdurankOutput | null>(null);
    const [formState, setFormState] = useState<Omit<VidyaEdurankInput, 'studyMaterial'>>({
        language: 'Marathi',
        grade: '10th',
        subject: 'Science',
        topic: '',
        curriculum: 'SSC',
        mcqCount: 10,
        outputs: {
            notes: true,
            mcqs: true,
            questionPaper: false,
            animationScript: false,
            studyPlan: false,
            eli5: false,
            glossary: false,
        },
    });
    // UNIFIED STATE for study material
    const [studyMaterial, setStudyMaterial] = useState('');
    const [fileName, setFileName] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleCheckboxChange = (name: keyof VidyaEdurankInput['outputs']) => {
        setFormState(prevState => ({
            ...prevState,
            outputs: {
                ...prevState.outputs,
                [name]: !prevState.outputs[name],
            }
        }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsLoading(true); // Show loader while processing file
        
        const reader = new FileReader();

        reader.onload = (loadEvent) => {
            const dataUri = loadEvent.target?.result as string;
            setStudyMaterial(dataUri); // Always set the data URI for any file type
            toast({ title: "File Ready", description: `${file.name} is ready to be processed.` });
            setIsLoading(false);
        };
        
        reader.onerror = () => {
             toast({ variant: "destructive", title: "Error", description: "Could not read the selected file." });
             setIsLoading(false);
        };
        
        // Read the file as a Data URL for all supported types
        reader.readAsDataURL(file);
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formState.topic.trim() || !studyMaterial.trim()) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please provide the Topic/Chapter and the study material (either text or a file)."
            });
            return;
        }

        setIsLoading(true);
        setOutput(null);

        const input: VidyaEdurankInput = {
            ...formState,
            studyMaterial: studyMaterial,
        };

        try {
            const result = await generateEducationalContent(input);
            if (result) {
                setOutput(result);
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Content Generation Failed",
                    description: "The AI was unable to generate content from the provided material. Please try again with a clearer prompt or different material.",
                    duration: 7000,
                });
            }
        } catch (error) {
            console.error("Error generating content:", error);
            toast({
                variant: 'destructive',
                title: "An unexpected error occurred",
                description: "Failed to generate educational content. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const generateContentString = (isJson = false) => {
        if (!output) return "";
        let contentString = `Generated Content for: ${output.chapterName || formState.topic}\n\n`;
        contentString += "========================================\n\n";
        
        if (output.summaryNotes) {
            contentString += "📝 Summary Notes\n----------------------------------------\n" + output.summaryNotes + "\n\n";
        }
        if (output.eli5) {
            contentString += "🧒 Explain Like I'm 5\n----------------------------------------\n" + output.eli5 + "\n\n";
        }
        if (output.glossary) {
            contentString += "📖 Glossary / Keywords\n----------------------------------------\n" + output.glossary + "\n\n";
        }
        if (output.mcqs) {
            contentString += "📚 MCQs\n----------------------------------------\n" + output.mcqs + "\n\n";
        }
        if (output.questionPaper) {
            contentString += "📄 Question Paper\n----------------------------------------\n" + output.questionPaper + "\n\n";
        }
        if (output.animationScript) {
            contentString += "🎬 Animation Script\n----------------------------------------\n" + output.animationScript + "\n\n";
        }
        if (output.studyPlan) {
            contentString += "📆 Study Plan\n----------------------------------------\n" + output.studyPlan + "\n\n";
        }
        return contentString;
    }

    const downloadTxt = () => {
        const contentString = generateContentString(true); // Pass true to get JSON string for MCQs
        const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${(output?.chapterName || formState.topic).replace(/\s+/g, '_') || 'ai-content'}.txt`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadPdf = () => {
        if (!output) return;
        const doc = new jsPDF();
        const contentString = generateContentString(false); // Pass false for user-friendly PDF
        // The default font in jsPDF doesn't support all characters.
        // For broad compatibility, splitting text and handling manually is safer.
        const splitText = doc.splitTextToSize(contentString, 180);
        doc.text(splitText, 10, 10);
        const fileName = `${(output.chapterName || formState.topic).replace(/\s+/g, '_') || 'ai-content'}.pdf`;
        doc.save(fileName);
    };

    const downloadDocx = async () => {
        if (!output) return;
        const contentString = generateContentString(false); // Pass false for user-friendly DOCX
        const paragraphs = contentString.split('\n').map(line => new Paragraph({
            children: [new TextRun(line)],
        }));
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${(output.chapterName || formState.topic).replace(/\s+/g, '_') || 'ai-content'}.docx`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    const downloadJson = () => {
        if (!output) return;
        const jsonString = JSON.stringify(output, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${(output.chapterName || formState.topic).replace(/\s+/g, '_') || 'ai-content'}.json`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }


    const renderOutput = () => {
        if (!output) return null;

        return (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary"/>
                        Generated Content for: {output.chapterName || formState.topic}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 prose dark:prose-invert max-w-none">
                    {output.summaryNotes && (
                        <div>
                            <h3 className="text-xl font-semibold">📝 Summary Notes</h3>
                            <div className="whitespace-pre-wrap">{output.summaryNotes}</div>
                        </div>
                    )}
                    {output.eli5 && (
                        <div>
                            <h3 className="text-xl font-semibold">🧒 Explain Like I'm 5</h3>
                            <div className="whitespace-pre-wrap">{output.eli5}</div>
                        </div>
                    )}
                    {output.glossary && (
                        <div>
                            <h3 className="text-xl font-semibold">📖 Glossary / Keywords</h3>
                            <div className="whitespace-pre-wrap">{output.glossary}</div>
                        </div>
                    )}
                    {output.mcqs && (
                        <div>
                            <h3 className="text-xl font-semibold">📚 MCQs</h3>
                            <div className="whitespace-pre-wrap p-4 bg-muted text-sm rounded-md overflow-x-auto">
                                {output.mcqs}
                            </div>
                        </div>
                    )}
                    {output.questionPaper && (
                        <div>
                            <h3 className="text-xl font-semibold">📄 Question Paper</h3>
                            <div className="whitespace-pre-wrap">{output.questionPaper}</div>
                        </div>
                    )}
                    {output.animationScript && (
                        <div>
                            <h3 className="text-xl font-semibold">🎬 Animation Script</h3>
                            <div className="whitespace-pre-wrap">{output.animationScript}</div>
                        </div>
                    )}
                    {output.studyPlan && (
                        <div>
                            <h3 className="text-xl font-semibold">📆 Study Plan</h3>
                            <div className="whitespace-pre-wrap">{output.studyPlan}</div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary">
                                <Download className="mr-2" />
                                Download Content
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={downloadTxt}>Text (.txt)</DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadPdf}>PDF (.pdf)</DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadDocx}>Word (.docx)</DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadJson}>JSON (.json)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                        <BrainCircuit /> Vidya EduCare AI Agent
                    </CardTitle>
                    <CardDescription>
                        Generate educational materials for the platform from any text or file.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grade">Target Grade</Label>
                                <Input id="grade" name="grade" value={formState.grade} onChange={handleInputChange} placeholder="e.g., 10th" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" value={formState.subject} onChange={handleInputChange} placeholder="e.g., Science" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic / Chapter</Label>
                                <Input id="topic" name="topic" value={formState.topic} onChange={handleInputChange} placeholder="Name of the topic or chapter" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
                                <Input id="language" name="language" value={formState.language} onChange={handleInputChange} placeholder="e.g., Marathi, English" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="curriculum">Curriculum</Label>
                                <Input id="curriculum" name="curriculum" value={formState.curriculum} onChange={handleInputChange} placeholder="e.g., SSC, CBSE, ICSE" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Study Material</Label>
                             <div className="grid grid-cols-1 gap-4">
                                <Textarea
                                    placeholder="Paste textbook paragraph, chapter summary, or key points here... OR upload a file below."
                                    className="min-h-[150px]"
                                    value={studyMaterial.startsWith('data:') ? '' : studyMaterial} // Show text only if it's not a data URI
                                    onChange={(e) => {
                                        setStudyMaterial(e.target.value);
                                        setFileName(''); // Clear filename if user types
                                    }}
                                />
                                <div className="relative border-dashed border-2 border-muted-foreground/50 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">Click to browse or drag & drop a file</p>
                                    <p className="text-xs text-muted-foreground">DOCX, PDF, PNG, or JPG</p>
                                    <Input 
                                        id="fileUpload" 
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                                    />
                                </div>
                                {fileName && <p className="text-sm text-center mt-2 text-muted-foreground">Selected file: <span className="font-semibold">{fileName}</span></p>}
                             </div>
                        </div>


                        <Separator />

                        <div className="space-y-4">
                             <Label>Expected Outputs</Label>
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(Object.keys(formState.outputs) as (keyof VidyaEdurankInput['outputs'])[]).map((key) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={formState.outputs[key]}
                                            onCheckedChange={() => handleCheckboxChange(key)}
                                        />
                                        <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').replace('mcqs', 'MCQs').replace('eli5', 'ELI5').trim()}</Label>
                                    </div>
                                ))}
                            </div>
                            {formState.outputs.mcqs && (
                                <div className="space-y-2 pt-4 max-w-xs">
                                    <Label htmlFor="mcqCount">Number of MCQs</Label>
                                    <Input 
                                        id="mcqCount"
                                        name="mcqCount"
                                        type="number"
                                        value={formState.mcqCount}
                                        onChange={(e) => setFormState(prevState => ({...prevState, mcqCount: parseInt(e.target.value, 10) || 10 }))}
                                        min="1"
                                        max="100"
                                    />
                                </div>
                            )}
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                            Generate Content
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && !output && (
                 <div className="text-center p-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                    <p className="text-muted-foreground">The AI agent is thinking... please wait.</p>
                </div>
            )}

            {renderOutput()}
        </div>
    );
}
