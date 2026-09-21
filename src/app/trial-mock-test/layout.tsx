import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studio--vidyaeducare.us-central1.hosted.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MockArena Free MCQ Demo | Vidya Educare",
  description: "Try a timed MCQ mock test with an instant score. No signup is needed for the demo.",
  openGraph: {
    title: "Vidya Educare MockArena",
    description: "Practice MCQ mock tests and receive an instant demo score.",
    images: [{ url: "/promotions/mockarena.webp", width: 1200, height: 630, alt: "Vidya Educare MockArena" }],
  },
  twitter: { card: "summary_large_image", images: ["/promotions/mockarena.webp"] },
};

export default function MockArenaTrialLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
