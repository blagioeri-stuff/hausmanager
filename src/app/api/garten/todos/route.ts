import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  dueMonth: z.number().int().min(1).max(12).nullable().optional(),
  recurring: z.boolean().optional(),
  priority: z.enum(['niedrig', 'normal', 'hoch']).optional(),
  category: z.string().optional(),
  plantId: z.string().nullable().optional(),
  elementId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const plantId = searchParams.get('plantId');
  const done = searchParams.get('done');

  const todos = await prisma.gardenTodo.findMany({
    where: {
      ...(month ? { dueMonth: parseInt(month) } : {}),
      ...(plantId ? { plantId } : {}),
      ...(done !== null ? { done: done === 'true' } : {}),
    },
    orderBy: [{ done: 'asc' }, { dueMonth: 'asc' }, { createdAt: 'desc' }],
    include: {
      plant: { select: { id: true, name: true, typeKey: true } },
      element: { select: { id: true, name: true, typeKey: true } },
    },
  });
  return NextResponse.json(
    todos.map((t) => ({
      ...t,
      doneAt: t.doneAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const todo = await prisma.gardenTodo.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueMonth: parsed.data.dueMonth ?? null,
      recurring: parsed.data.recurring ?? false,
      priority: parsed.data.priority ?? 'normal',
      category: parsed.data.category ?? 'pflege',
      plantId: parsed.data.plantId ?? null,
      elementId: parsed.data.elementId ?? null,
    },
  });
  return NextResponse.json(
    { ...todo, doneAt: todo.doneAt?.toISOString() ?? null, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() },
    { status: 201 }
  );
}
