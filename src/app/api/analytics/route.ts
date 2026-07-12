// src/app/api/analytics/route.ts
// POST — log tokensSaved entries after local inference completes

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ActionType } from '@/types';

const DEMO_USER_ID = 'demo-user-local';

const VALID_ACTION_TYPES: ActionType[] = ['rewrite', 'summarize', 'expand', 'generate'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionType, tokensSaved } = body;

    if (!VALID_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
    }

    if (typeof tokensSaved !== 'number' || tokensSaved < 0) {
      return NextResponse.json({ error: 'Invalid tokensSaved' }, { status: 400 });
    }

    const log = await prisma.analyticsLog.create({
      data: {
        userId: DEMO_USER_ID,
        actionType,
        tokensSaved: Math.round(tokensSaved),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch {
    // DB unavailable — non-fatal, client continues
    return NextResponse.json({ logged: false, offline: true });
  }
}

export async function GET() {
  try {
    const [logs, totals] = await Promise.all([
      prisma.analyticsLog.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { processedAt: 'desc' },
        take: 50,
      }),
      prisma.analyticsLog.aggregate({
        where: { userId: DEMO_USER_ID },
        _sum: { tokensSaved: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      logs,
      totalTokensSaved: totals._sum.tokensSaved ?? 0,
      totalActions: totals._count,
    });
  } catch {
    return NextResponse.json({ logs: [], totalTokensSaved: 0, totalActions: 0, offline: true });
  }
}
