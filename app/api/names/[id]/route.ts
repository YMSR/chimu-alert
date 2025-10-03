import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const nameInputSchema = z.object({
  label: z.string().trim().min(1).max(191),
  kana: z
    .string()
    .trim()
    .max(191)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const toggleSchema = z.object({ isActive: z.boolean() });

function normalize(value: string | undefined) {
  return value ? value.replace(/\s+/g, "").toLowerCase() : undefined;
}

function toPayload(name: {
  id: string;
  label: string;
  kana: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: name.id,
    label: name.label,
    kana: name.kana,
    isActive: name.isActive,
    createdAt: name.createdAt.toISOString(),
    updatedAt: name.updatedAt.toISOString(),
  };
}

async function ensureOwner(userId: string, id: string) {
  const existing = await prisma.name.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    return false;
  }

  return true;
}

export async function PUT(request: Request, context: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = idParamSchema.parse(context);
  const body = await request.json().catch(() => null);
  const parsed = nameInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const owns = await ensureOwner(session.user.id, params.id);
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const label = parsed.data.label.trim();
  const kana = parsed.data.kana?.trim();

  const updated = await prisma.name.update({
    where: { id: params.id },
    data: {
      label,
      kana: kana ?? null,
      normalizedLabel: normalize(label) ?? null,
      normalizedKana: normalize(kana) ?? null,
    },
  });

  return NextResponse.json({ name: toPayload(updated) });
}

export async function PATCH(request: Request, context: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = idParamSchema.parse(context);
  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const owns = await ensureOwner(session.user.id, params.id);
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.name.update({
    where: { id: params.id },
    data: {
      isActive: parsed.data.isActive,
    },
  });

  return NextResponse.json({ name: toPayload(updated) });
}

export async function DELETE(_request: Request, context: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = idParamSchema.parse(context);

  const owns = await ensureOwner(session.user.id, params.id);
  if (!owns) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notification.deleteMany({ where: { nameId: params.id } });
  await prisma.name.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
