import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().max(191).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        issues: result.error.format(),
      },
      { status: 400 },
    );
  }

  const email = result.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(result.data.password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: result.data.name,
      role: Role.USER,
    },
  });

  return NextResponse.json({ success: true });
}
