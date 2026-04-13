import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueMonth: z.number().int().min(1).max(12).nullable().optional(),
  recurring: z.boolean().optional(),
  done: z.boolean().optional(),
  priority: z.enum(['niedrig', 'normal', 'hoch']).optional(),
  category: z.string().optional(),
  plantId: z.string().nullable().optional(),
  elementId: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.done === true) {
    data.doneAt = new Date();
  } else if (parsed.data.done === false) {
    data.doneAt = null;
  }
  const todo = await prisma.gardenTodo.update({ where: { id }, data });
  return NextResponse.json({
    ...todo,
    doneAt: todo.doneAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.gardenTodo.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
