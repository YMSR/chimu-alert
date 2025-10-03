import Link from "next/link";

import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl bg-white p-6 shadow">
          <div>
            <p className="text-sm text-slate-500">サインイン中</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {session?.user?.name ?? session?.user?.email}
            </h1>
            <p className="text-sm text-slate-500">{session?.user?.email}</p>
          </div>
          <SignOutButton />
        </header>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">ダッシュボード</h2>
          <p className="mt-2 text-sm text-slate-600">
            訃報候補の登録や通知履歴は今後ここに表示されます。
          </p>
          <div className="mt-4">
            <Link
              href="/app/names"
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              登録名を管理する
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
