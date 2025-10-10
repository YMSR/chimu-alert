"use client";

import { useState } from "react";

type Failure = {
  line: number;
  error: string;
};

type Summary = {
  total: number;
  imported: number;
  failed: number;
  failures: Failure[];
};

type AdminIngestClientProps = {
  sampleUrl: string;
};

export function AdminIngestClient({ sampleUrl }: AdminIngestClientProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSummary(null);

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;

    if (!fileInput?.files?.[0]) {
      setError("CSVファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/ingest", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | Summary
        | { error?: string };

      if (!response.ok || !payload || "error" in payload) {
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "取り込みに失敗しました");
      }

      setSummary(payload as Summary);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "予期せぬエラーが発生しました");
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold text-slate-900">CSVインポート（訃報データ）</h1>
          <p className="mt-2 text-sm text-slate-600">
            ヘッダー列 <code className="rounded bg-slate-100 px-1 py-0.5">date</code>, <code className="rounded bg-slate-100 px-1 py-0.5">deceased_name</code>, <code className="rounded bg-slate-100 px-1 py-0.5">related_names</code>, <code className="rounded bg-slate-100 px-1 py-0.5">region</code>, <code className="rounded bg-slate-100 px-1 py-0.5">age</code>, <code className="rounded bg-slate-100 px-1 py-0.5">source_url</code> を含む UTF-8 CSV をアップロードしてください。
          </p>
          <p className="mt-2 text-sm text-slate-600">
            サンプル: <a className="text-blue-600 underline" href={sampleUrl} download>sample_obituaries.csv</a>
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">CSVファイルをアップロード</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="file" className="text-sm font-medium text-slate-700">
                CSVファイル
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={isSubmitting}
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "取り込み中..." : "取り込む"}
            </button>
          </form>
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>

        {summary && (
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">結果</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">総件数</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</dd>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">取り込み成功</dt>
                <dd className="mt-1 text-2xl font-semibold text-emerald-700">{summary.imported}</dd>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">スキップ / 失敗</dt>
                <dd className="mt-1 text-2xl font-semibold text-amber-700">{summary.failed}</dd>
              </div>
            </dl>

            {summary.failures.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">失敗した行</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {summary.failures.map((failure) => (
                    <li key={failure.line} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="font-semibold">{failure.line} 行目:</span> {failure.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
