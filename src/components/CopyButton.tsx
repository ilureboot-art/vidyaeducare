
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CopyButtonProps {
    valueToCopy: string;
}

export function CopyButton({ valueToCopy }: CopyButtonProps) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(valueToCopy);
        setHasCopied(true);
        toast({ title: "Copied!", description: `${valueToCopy} copied to clipboard.` });
        setTimeout(() => {
            setHasCopied(false);
        }, 2000);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{valueToCopy}</span>
            <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={copyToClipboard}
            >
                {hasCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                )}
                 <span className="sr-only">Copy</span>
            </Button>
        </div>
    );
}
