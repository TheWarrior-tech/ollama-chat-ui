import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ memories: [] });
  const userId = (session.user as any).id;
  const memories = await prisma.memory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({ memories: memories.map(m => m.content) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { content } = await req.json();
  await prisma.memory.create({ data: { userId, content } });
  return NextResponse.json({ ok: true });
}
