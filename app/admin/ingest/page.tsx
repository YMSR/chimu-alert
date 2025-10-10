import { redirect } from "next/navigation";

import { AdminIngestClient } from "./ingest-client";

import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth-helpers";

export default async function AdminIngestPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (!email || !isAdminEmail(email)) {
    redirect("/app/dashboard");
  }

  return <AdminIngestClient sampleUrl="/sample_obituaries.csv" />;
}
