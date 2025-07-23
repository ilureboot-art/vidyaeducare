
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        outputs: {
            notes: true,
            mcqs: true,
            questionPaper: false,
            animationScript: false,
            studyPlan: false,
        },
    });
    const [studyMaterial, setStudyMaterial] = useState('');
    const [textMaterial, setTextMaterial] = useState('');
    const [fileName, setFileName] = useState('');
    const [activeTab, setActiveTab] = useState('text');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUri = loadEvent.target?.result as string;
                setStudyMaterial(dataUri);
                setFileName(file.name);
                toast({ title: "File Ready", description: `${file.name} has been selected.`});
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const materialToSubmit = activeTab === 'file' ? studyMaterial : textMaterial;

        if (!formState.topic.trim() || !materialToSubmit.trim()) {
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
            studyMaterial: materialToSubmit,
        };

        try {
            const result = await generateEducationalContent(input);
            setOutput(result);
        } catch (error) {
            console.error("Error generating content:", error);
            toast({
                variant: 'destructive',
                title: "An error occurred",
                description: "Failed to generate educational content. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!output) return;

        let contentString = `Generated Content for: ${output.chapterName || formState.topic}\n\n`;
        contentString += "========================================\n\n";

        if (output.summaryNotes) {
            contentString += "📝 Summary Notes\n";
            contentString += "----------------------------------------\n";
            contentString += output.summaryNotes + "\n\n";
        }
        if (output.mcqs) {
            contentString += "📚 MCQs\n";
            contentString += "----------------------------------------\n";
            contentString += output.mcqs + "\n\n";
        }
        if (output.questionPaper) {
            contentString += "📄 Question Paper\n";
            contentString += "----------------------------------------\n";
            contentString += output.questionPaper + "\n\n";
        }
        if (output.animationScript) {
            contentString += "🎬 Animation Script\n";
            contentString += "----------------------------------------\n";
            contentString += output.animationScript + "\n\n";
        }
        if (output.studyPlan) {
            contentString += "📆 Study Plan\n";
            contentString += "----------------------------------------\n";
            contentString += output.studyPlan + "\n\n";
        }

        const blob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${(output.chapterName || formState.topic).replace(/\s+/g, '_') || 'ai-content'}.txt`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                    {output.mcqs && (
                        <div>
                            <h3 className="text-xl font-semibold">📚 MCQs</h3>
                            <div className="whitespace-pre-wrap">{output.mcqs}</div>
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
                    <Button onClick={handleDownload} variant="secondary">
                        <Download className="mr-2" />
                        Download Content
                    </Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Study Material</Label>
                             <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                                    <TabsTrigger value="file">Upload File</TabsTrigger>
                                </TabsList>
                                <TabsContent value="text" className="pt-2">
                                    <Textarea
                                        placeholder="Paste textbook paragraph, chapter summary, or key points here..."
                                        className="min-h-[150px]"
                                        value={textMaterial}
                                        onChange={(e) => setTextMaterial(e.target.value)}
                                    />
                                </TabsContent>
                                <TabsContent value="file" className="pt-2">
                                    <div className="relative border-dashed border-2 border-muted-foreground/50 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Click to browse or drag & drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, PNG, or JPG</p>
                                        <Input 
                                            id="fileUpload" 
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                    </div>
                                    {fileName && activeTab === 'file' && <p className="text-sm text-center mt-2 text-muted-foreground">Selected file: <span className="font-semibold">{fileName}</span></p>}
                                </TabsContent>
                            </Tabs>
                        </div>


                        <Separator />

                        <div className="space-y-2">
                             <Label>Expected Outputs</Label>
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {(Object.keys(formState.outputs) as (keyof VidyaEdurankInput['outputs'])[]).map((key) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={formState.outputs[key]}
                                            onCheckedChange={() => handleCheckboxChange(key)}
                                        />
                                        <Label htmlFor={key} className="capitalize">{key.replace('mcqs', 'MCQs').replace('questionPaper', 'Question Paper').replace('animationScript', 'Animation Script').replace('studyPlan', 'Study Plan').replace('notes', 'Notes')}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                            Generate Content
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="text-center p-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                    <p className="text-muted-foreground">The AI agent is thinking... please wait.</p>
                </div>
            )}

            {renderOutput()}
        </div>
    );
}
