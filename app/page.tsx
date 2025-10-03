import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-12 px-6 py-20 text-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            訃報候補通知アプリ
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            大切なご縁を守るための気づきを、いち早く。
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            登録した名前に一致する可能性がある訃報を候補としてお知らせします。
            喪主名や地域も添えて、確かめやすく。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/login"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            ログイン / 登録
          </Link>
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            コンセプトを見る
          </a>
        </div>
      </div>
    </main>
  );
}
