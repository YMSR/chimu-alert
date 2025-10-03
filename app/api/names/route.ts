import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const nameInputSchema = z.object({
  label: z.string().trim().min(1).max(191),
  kana: z
    .string()
    .trim()
    .max(191)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const names = await prisma.name.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ names: names.map(toPayload) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = nameInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const label = parsed.data.label.trim();
  const kana = parsed.data.kana?.trim();

  const name = await prisma.name.create({
    data: {
      userId: session.user.id,
      label,
      kana: kana ?? null,
      normalizedLabel: normalize(label) ?? null,
      normalizedKana: normalize(kana) ?? null,
    },
  });

  return NextResponse.json({ name: toPayload(name) }, { status: 201 });
}
