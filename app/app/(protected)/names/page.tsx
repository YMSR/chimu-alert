import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { NamesClient } from "./names-client";

export default async function NamesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/app/login?callbackUrl=/app/names");
  }

  const names = await prisma.name.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <NamesClient
      initialNames={names.map((name) => ({
        id: name.id,
        label: name.label,
        kana: name.kana,
        isActive: name.isActive,
        createdAt: name.createdAt.toISOString(),
        updatedAt: name.updatedAt.toISOString(),
      }))}
    />
  );
}
