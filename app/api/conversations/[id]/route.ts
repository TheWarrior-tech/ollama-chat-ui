import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(convo);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const convo = await prisma.conversation.update({ where: { id: params.id }, data: body, include: { messages: true } });
  return NextResponse.json(convo);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.conversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
