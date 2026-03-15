import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { title } = await req.json().catch(() => ({ title: 'New Chat' }));
  const convo = await prisma.conversation.create({ data: { userId, title: title || 'New Chat' }, include: { messages: true } });
  return NextResponse.json(convo);
}
