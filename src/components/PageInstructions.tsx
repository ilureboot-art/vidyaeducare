"use client";
import { useEffect, useState } from 'react';
import { defaultPageInstructions, type PageInstruction } from '@/lib/page-instructions';
export function PageInstructions({ kind }: { kind: 'registration' | 'wallet' }) {
 const [content, setContent] = useState<PageInstruction>(defaultPageInstructions[kind]);
 useEffect(() => { let active = true; fetch('/api/page-instructions').then(r => r.ok ? r.json() : null).then(data => { if (active && data?.[kind]) setContent(data[kind]); }).catch(() => {}); return () => { active = false; }; }, [kind]);
 return <section className="rounded-xl border bg-muted/30 p-4 space-y-3" aria-label={content.title}><h2 className="font-semibold">{content.title}</h2><p className="whitespace-pre-wrap text-sm leading-relaxed">{content.details}</p>{content.imageUrl && <img src={content.imageUrl} alt={content.imageAlt || content.title} className="max-h-96 w-full rounded-lg object-contain" loading="lazy" referrerPolicy="no-referrer" />}</section>;
}
