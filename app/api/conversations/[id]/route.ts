import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(convo);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const updates: any = {};
  if (body.title !== undefined) {
    updates.title = body.title;
    // Regenerate slug when title changes
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.conversation.findFirst({ where: { userId, slug, NOT: { id: params.id } } })) {
      slug = `${baseSlug}-${i++}`;
    }
    updates.slug = slug;
  }
  if (body.shared !== undefined) updates.shared = body.shared;
  if (body.pinned !== undefined) updates.pinned = body.pinned;
  if (body.folderId !== undefined) updates.folderId = body.folderId;
  const convo = await prisma.conversation.update({ where: { id: params.id }, data: updates });
  return NextResponse.json(convo);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.conversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
