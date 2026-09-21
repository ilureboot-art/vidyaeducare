"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Props = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
};

export function PromotionShare({ title, description, path, imagePath }: Props) {
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).toString());
    setImageUrl(imagePath ? new URL(imagePath, window.location.origin).toString() : "");
  }, [imagePath, path]);

  const message = `${title}\n${description}\n${url}${imageUrl ? `\nPromotional image: ${imageUrl}` : ""}`;

  async function getImageFile() {
    if (!imageUrl) return null;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Promotional image is unavailable.");
    const blob = await response.blob();
    return new File([blob], `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.webp`, { type: blob.type || "image/webp" });
  }

  async function shareImageAndLink() {
    try {
      const file = await getImageFile();
      if (file && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, text: `${title}\n${description}`, url, files: [file] });
        return;
      }
      await navigator.clipboard.writeText(message);
      if (imageUrl) window.open(imageUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Caption and link copied", description: "Download the opened image and attach it to WhatsApp, Facebook or Instagram." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ variant: "destructive", title: "Sharing failed", description: error instanceof Error ? error.message : "Please try again." });
    }
  }

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
    <div className="space-y-3" aria-label={`Promote ${title}`}>
      {imagePath && (
        <img
          src={imagePath}
          alt={`${title} promotional image`}
          className="w-full max-w-2xl rounded-xl border bg-muted object-cover shadow-sm"
          loading="lazy"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {imagePath && <Button size="sm" onClick={shareImageAndLink}>Share image + link</Button>}
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
    </div>
  );
}
