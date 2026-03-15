import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, password: hashed, name } });
  return NextResponse.json({ ok: true });
}
