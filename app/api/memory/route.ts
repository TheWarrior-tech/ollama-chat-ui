import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ memories: [] });
  const userId = (session.user as any).id;
  const memories = await prisma.memory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 });
  return NextResponse.json({ memories: memories.map(m => ({ id: m.id, content: m.content, createdAt: m.createdAt })) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { content } = await req.json();
  const mem = await prisma.memory.create({ data: { userId, content } });
  return NextResponse.json(mem);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { id, all } = await req.json();
  if (all) {
    await prisma.memory.deleteMany({ where: { userId } });
  } else if (id) {
    await prisma.memory.delete({ where: { id, userId } });
  }
  return NextResponse.json({ ok: true });
}
