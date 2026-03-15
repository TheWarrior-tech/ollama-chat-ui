import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
  const memCount = await prisma.memory.count({ where: { userId } });
  const convoCount = await prisma.conversation.count({ where: { userId } });
  const msgCount = await prisma.message.count({ where: { conversation: { userId } } });
  return NextResponse.json({ ...user, memCount, convoCount, msgCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { name, email, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined && email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    updates.email = email;
  }
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: updates, select: { id: true, email: true, name: true } });
  return NextResponse.json(updated);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
