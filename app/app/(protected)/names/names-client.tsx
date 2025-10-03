"use client";

import { useMemo, useState } from "react";

import type { FormEvent, ChangeEvent } from "react";

type NameItem = {
  id: string;
  label: string;
  kana: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type NamesClientProps = {
  initialNames: NameItem[];
};

const emptyCreateForm = {
  label: "",
  kana: "",
};

export function NamesClient({ initialNames }: NamesClientProps) {
  const [names, setNames] = useState<NameItem[]>(initialNames);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyCreateForm);

  const sortedNames = useMemo(
    () =>
      [...names].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [names],
  );

  const handleCreateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: createForm.label,
          kana: createForm.kana,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { name?: NameItem; error?: string }
        | null;

      if (!response.ok || !payload?.name) {
        throw new Error(payload?.error ?? "登録に失敗しました");
      }

      setNames((prev) => [...prev, payload.name as NameItem]);
      setCreateForm(emptyCreateForm);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (item: NameItem) => {
    setEditingId(item.id);
    setEditForm({ label: item.label, kana: item.kana ?? "" });
    setActionError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyCreateForm);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    setActionError(null);
    setPendingId(editingId);

    try {
      const response = await fetch(`/api/names/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: editForm.label,
          kana: editForm.kana,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { name?: NameItem; error?: string }
        | null;

      if (!response.ok || !payload?.name) {
        throw new Error(payload?.error ?? "更新に失敗しました");
      }

      setNames((prev) =>
        prev.map((name) => (name.id === editingId ? { ...name, ...payload.name } : name)),
      );
      setEditingId(null);
      setEditForm(emptyCreateForm);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setPendingId(null);
    }
  };

  const handleToggle = async (item: NameItem) => {
    setActionError(null);
    setPendingId(item.id);

    try {
      const response = await fetch(`/api/names/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { name?: NameItem; error?: string }
        | null;

      if (!response.ok || !payload?.name) {
        throw new Error(payload?.error ?? "更新に失敗しました");
      }

      setNames((prev) =>
        prev.map((name) => (name.id === item.id ? { ...name, ...payload.name } : name)),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (item: NameItem) => {
    if (!window.confirm(`「${item.label}」を削除しますか？`)) {
      return;
    }

    setActionError(null);
    setPendingId(item.id);

    try {
      const response = await fetch(`/api/names/${item.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "削除に失敗しました");
      }

      setNames((prev) => prev.filter((name) => name.id !== item.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-semibold text-slate-900">登録名の管理</h1>
          <p className="mt-2 text-sm text-slate-600">
            訃報候補通知の対象となる漢字・かなの組み合わせを登録します。必要に応じてON/OFFを切り替えてください。
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">新しく追加</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateSubmit}>
            <div className="space-y-1">
              <label htmlFor="create-label" className="text-sm font-medium text-slate-700">
                漢字（必須）
              </label>
              <input
                id="create-label"
                name="label"
                type="text"
                value={createForm.label}
                onChange={handleCreateChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="例：山城 太郎"
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="create-kana" className="text-sm font-medium text-slate-700">
                かな（任意）
              </label>
              <input
                id="create-kana"
                name="kana"
                type="text"
                value={createForm.kana}
                onChange={handleCreateChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="やましろ たろう"
                disabled={isCreating}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                disabled={isCreating}
              >
                {isCreating ? "追加中..." : "追加"}
              </button>
            </div>
          </form>
          {createError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {createError}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">登録済みの名前</h2>
          {actionError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {actionError}
            </p>
          )}

          {sortedNames.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">まだ名前が登録されていません。</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">漢字</th>
                    <th className="px-4 py-3">かな</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sortedNames.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {editingId === item.id ? (
                          <input
                            name="label"
                            value={editForm.label}
                            onChange={handleEditChange}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            required
                            disabled={pendingId === item.id}
                          />
                        ) : (
                          item.label
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {editingId === item.id ? (
                          <input
                            name="kana"
                            value={editForm.kana}
                            onChange={handleEditChange}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            disabled={pendingId === item.id}
                          />
                        ) : item.kana ? (
                          item.kana
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.isActive ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === item.id ? (
                          <form className="inline-flex gap-2" onSubmit={handleEditSubmit}>
                            <button
                              type="submit"
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                              disabled={pendingId === item.id}
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              disabled={pendingId === item.id}
                            >
                              キャンセル
                            </button>
                          </form>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              disabled={pendingId === item.id}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(item)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              disabled={pendingId === item.id}
                            >
                              {item.isActive ? "OFFにする" : "ONにする"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                              disabled={pendingId === item.id}
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
