import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const userId = (session.user as any).id;
  const convos = await prisma.conversation.findMany({
    where: { userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json(convos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { title = 'New Chat' } = await req.json();
  const baseSlug = slugify(title);
  // Ensure slug uniqueness per user
  let slug = baseSlug;
  let i = 1;
  while (await prisma.conversation.findFirst({ where: { userId, slug } })) {
    slug = `${baseSlug}-${i++}`;
  }
  const convo = await prisma.conversation.create({
    data: { userId, title, slug },
    include: { messages: true },
  });
  return NextResponse.json(convo);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  await prisma.conversation.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
