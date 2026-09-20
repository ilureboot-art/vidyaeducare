"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Props = {
  title: string;
  description: string;
  path: string;
};

export function PromotionShare({ title, description, path }: Props) {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  const message = `${title}\n${description}\n${url}`;

  async function copyForInstagram() {
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: "Instagram caption copied", description: "Paste it into your Instagram story, bio or post." });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Please allow clipboard access and try again." });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Promotion link copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Please allow clipboard access and try again." });
    }
  }

  if (!url) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label={`Promote ${title}`}>
      <Button size="sm" variant="outline" asChild>
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" aria-label={`Share ${title} on WhatsApp`}>
          WhatsApp
        </a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label={`Share ${title} on Facebook`}>
          Facebook
        </a>
      </Button>
      <Button size="sm" variant="outline" onClick={copyForInstagram} aria-label={`Copy ${title} caption for Instagram`}>
        Copy for Instagram
      </Button>
      <Button size="sm" variant="outline" onClick={copyLink} aria-label={`Copy ${title} link`}>
        Copy link
      </Button>
    </div>
  );
}
