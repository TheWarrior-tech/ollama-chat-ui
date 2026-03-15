import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role, content, thinking, sources } = await req.json();

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      role,
      content,
      thinking:  thinking  ?? undefined,
      // sources is String? in schema — store as JSON string if provided
      sources:   sources ? JSON.stringify(sources) : undefined,
    },
  });

  await prisma.conversation.update({
    where: { id: params.id },
    data:  { updatedAt: new Date() },
  });

  return NextResponse.json(message);
}
