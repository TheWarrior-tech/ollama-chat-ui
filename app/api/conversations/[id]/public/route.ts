import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy:{ createdAt:'asc' } }, user: { select:{ name:true, email:true } } },
  });
  if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = userId && convo.userId === userId;
  if (!convo.shared && !isOwner) return NextResponse.json({ error: 'Private' }, { status: 403 });
  return NextResponse.json({
    id: convo.id, title: convo.title, shared: convo.shared,
    isOwner: !!isOwner,
    ownerName: convo.user?.name || convo.user?.email || 'Anonymous',
    messages: convo.messages.map(m => ({ role: m.role, content: m.content })),
  });
}
