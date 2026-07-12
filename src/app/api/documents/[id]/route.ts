// src/app/api/documents/[id]/route.ts
// GET / PATCH / DELETE for individual documents

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redisDel } from '@/lib/redis';

const DEMO_USER_ID = 'demo-user-local';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const doc = await prisma.document.findFirst({
      where: { id, userId: DEMO_USER_ID },
    });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, content } = body;

    const doc = await prisma.document.updateMany({
      where: { id, userId: DEMO_USER_ID },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });

    if (doc.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Invalidate caches
    await redisDel(`docs:${DEMO_USER_ID}:1:20`);
    await redisDel(`doc:${id}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.document.deleteMany({
      where: { id, userId: DEMO_USER_ID },
    });

    await redisDel(`docs:${DEMO_USER_ID}:1:20`);
    await redisDel(`doc:${id}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
