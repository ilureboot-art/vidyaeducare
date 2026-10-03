import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin-init';
import { verifyRequester, RequestAuthError } from '@/lib/server-auth';
import { z } from 'zod';
const instruction = z.object({ title: z.string().trim().min(1).max(150), details: z.string().trim().min(1).max(12000), imageUrl: z.string().max(400000).refine(v => !v || /^https:\/\//i.test(v) || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v), 'Use an HTTPS image or PNG/JPEG/WebP upload.'), imageAlt: z.string().trim().max(250) }).refine(v => !v.imageUrl || !!v.imageAlt, 'Please provide an image description.');
export async function POST(request: NextRequest) {
 try { const admin = await verifyRequester(request, true); const parsed = z.object({ registration: instruction, wallet: instruction }).safeParse(await request.json());
 if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
 await adminDb.collection('configs').doc('pageInstructions').set({ ...parsed.data, updatedAt: new Date().toISOString(), updatedBy: admin.uid });
 return NextResponse.json({ success: true });
 } catch (error) { return NextResponse.json({ error: error instanceof RequestAuthError ? error.message : 'Unable to save instructions.' }, { status: error instanceof RequestAuthError ? error.status : 500 }); }
}
