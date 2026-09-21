import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studio--vidyaeducare.us-central1.hosted.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "StoryTeller AI | Vidya Educare",
  description: "Turn a story into a voice reel in Marathi, Hindi or English with narration, subtitles and animated visuals.",
  openGraph: {
    title: "Vidya Educare StoryTeller AI",
    description: "Story → Voice → Reel in Marathi, Hindi and English.",
    images: [{ url: "/promotions/storyteller-ai.webp", width: 1200, height: 630, alt: "Vidya Educare StoryTeller AI" }],
  },
  twitter: { card: "summary_large_image", images: ["/promotions/storyteller-ai.webp"] },
};

export default function StorytellerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
