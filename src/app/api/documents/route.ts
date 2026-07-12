// src/app/api/documents/route.ts
// GET (list) / POST (create) — no-auth mode, uses a static demo userId

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redisGet, redisSet, redisDel } from '@/lib/redis';

// No-auth mode: fixed demo user ID
const DEMO_USER_ID = 'demo-user-local';

// Ensure demo user exists
async function ensureDemoUser() {
  try {
    await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      create: { id: DEMO_USER_ID, email: 'local@incognito.ai', name: 'Local User' },
      update: {},
    });
  } catch {
    // DB may not be connected — silently continue
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
  const skip = (page - 1) * limit;

  const cacheKey = `docs:${DEMO_USER_ID}:${page}:${limit}`;

  // Redis cache hit
  const cached = await redisGet(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached), {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  try {
    await ensureDemoUser();
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip,
        select: { id: true, title: true, content: true, userId: true, createdAt: true, updatedAt: true },
      }),
      prisma.document.count({ where: { userId: DEMO_USER_ID } }),
    ]);

    const result = { documents, total, page, limit };
    await redisSet(cacheKey, JSON.stringify(result), 120);
    return NextResponse.json(result);
  } catch (err) {
    // DB unavailable — return empty list
    return NextResponse.json({ documents: [], total: 0, page, limit, offline: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = 'Untitled', content = '' } = body;

    await ensureDemoUser();
    const document = await prisma.document.create({
      data: { title, content, userId: DEMO_USER_ID },
    });

    // Invalidate list caches
    await redisDel(`docs:${DEMO_USER_ID}:1:20`);

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
