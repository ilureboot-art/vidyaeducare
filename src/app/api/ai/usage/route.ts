import { NextRequest, NextResponse } from 'next/server';
import { AiUsageError, readAiUsage } from '@/lib/ai-usage';
export async function POST(request: NextRequest) {
 try {const body=await request.json();if(!['doubt','notes'].includes(body.feature))return NextResponse.json({error:'Invalid AI tool.'},{status:400});const header=request.headers.get('authorization');const token=header?.startsWith('Bearer ')?header.slice(7):undefined;const state=await readAiUsage(body.feature,{token,studentId:body.studentId});return NextResponse.json(state,{headers:{'Cache-Control':'no-store'}});}
 catch(e){return NextResponse.json({error:e instanceof AiUsageError?e.message:'Unable to check AI access.'},{status:e instanceof AiUsageError?403:500});}
}
